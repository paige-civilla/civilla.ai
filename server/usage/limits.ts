import { db } from "../db";
import { usageEvents, userProfiles, users } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getEntitlements, isCompedEmail, SubscriptionTier, getAnalysisCredits, consumeAnalysisCredit } from "../billing";

export type UsageType = "ocr_page" | "ai_call" | "ai_tokens" | "upload_bytes";

export interface TierLimits {
  ocrPagesPerDay: number;
  ocrPagesPerMonth: number;
  aiCallsPerDay: number;
  aiCallsPerMonth: number;
  aiTokensPerMonth: number;
  uploadBytesPerMonth: number;
}

const TIER_QUOTAS: Record<SubscriptionTier, TierLimits> = {
  free: {
    ocrPagesPerDay: 0,
    ocrPagesPerMonth: 0,
    aiCallsPerDay: 0,
    aiCallsPerMonth: 0,
    aiTokensPerMonth: 0,
    uploadBytesPerMonth: 0,
  },
  trial: {
    ocrPagesPerDay: 20,
    ocrPagesPerMonth: 100,
    aiCallsPerDay: 10,
    aiCallsPerMonth: 50,
    aiTokensPerMonth: 100_000,
    uploadBytesPerMonth: 1 * 1024 * 1024 * 1024, // 1GB
  },
  core: {
    ocrPagesPerDay: 100,
    ocrPagesPerMonth: 1000,
    aiCallsPerDay: 50,
    aiCallsPerMonth: 500,
    aiTokensPerMonth: 1_000_000,
    uploadBytesPerMonth: 30 * 1024 * 1024 * 1024, // 30GB
  },
  pro: {
    ocrPagesPerDay: 200,
    ocrPagesPerMonth: 3000,
    aiCallsPerDay: 100,
    aiCallsPerMonth: 1500,
    aiTokensPerMonth: 3_000_000,
    uploadBytesPerMonth: 50 * 1024 * 1024 * 1024, // 50GB
  },
  premium: {
    ocrPagesPerDay: 500,
    ocrPagesPerMonth: 10000,
    aiCallsPerDay: 300,
    aiCallsPerMonth: 5000,
    aiTokensPerMonth: 10_000_000,
    uploadBytesPerMonth: 100 * 1024 * 1024 * 1024, // 100GB
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_QUOTAS[tier] || TIER_QUOTAS.free;
}

export async function getUserLimits(userId: string): Promise<{ limits: TierLimits; isComped: boolean; tier: SubscriptionTier }> {
  const entitlements = await getEntitlements(userId);
  
  if (entitlements.isComped || entitlements.isLifetime) {
    return {
      limits: TIER_QUOTAS.premium,
      isComped: true,
      tier: "premium",
    };
  }
  
  return {
    limits: getTierLimits(entitlements.tier),
    isComped: false,
    tier: entitlements.tier,
  };
}

export interface UsageSummary {
  ocrPagesToday: number;
  ocrPagesMonth: number;
  aiCallsToday: number;
  aiCallsMonth: number;
  aiTokensMonth: number;
  uploadBytesMonth: number;
}

export async function getUserUsage(userId: string): Promise<UsageSummary> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dayResults, monthResults] = await Promise.all([
    db
      .select({
        eventType: usageEvents.eventType,
        total: sql<number>`COALESCE(SUM(${usageEvents.quantity}), 0)::int`,
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.userId, userId),
          gte(usageEvents.createdAt, startOfDay)
        )
      )
      .groupBy(usageEvents.eventType),
    db
      .select({
        eventType: usageEvents.eventType,
        total: sql<number>`COALESCE(SUM(${usageEvents.quantity}), 0)::int`,
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.userId, userId),
          gte(usageEvents.createdAt, startOfMonth)
        )
      )
      .groupBy(usageEvents.eventType),
  ]);

  const dayTotals: Record<string, number> = {};
  for (const r of dayResults) {
    dayTotals[r.eventType] = r.total;
  }

  const monthTotals: Record<string, number> = {};
  for (const r of monthResults) {
    monthTotals[r.eventType] = r.total;
  }

  return {
    ocrPagesToday: dayTotals["ocr_page"] || 0,
    ocrPagesMonth: monthTotals["ocr_page"] || 0,
    aiCallsToday: dayTotals["ai_call"] || 0,
    aiCallsMonth: monthTotals["ai_call"] || 0,
    aiTokensMonth: monthTotals["ai_tokens"] || 0,
    uploadBytesMonth: monthTotals["upload_bytes"] || 0,
  };
}

export interface QuotaRemaining {
  ocrPagesRemainingToday: number;
  ocrPagesRemainingMonth: number;
  aiCallsRemainingToday: number;
  aiCallsRemainingMonth: number;
  aiTokensRemainingMonth: number;
  uploadBytesRemainingMonth: number;
}

export async function getQuotaRemaining(userId: string): Promise<QuotaRemaining & { isComped: boolean }> {
  const [{ limits, isComped }, usage] = await Promise.all([
    getUserLimits(userId),
    getUserUsage(userId),
  ]);

  if (isComped) {
    return {
      ocrPagesRemainingToday: Infinity,
      ocrPagesRemainingMonth: Infinity,
      aiCallsRemainingToday: Infinity,
      aiCallsRemainingMonth: Infinity,
      aiTokensRemainingMonth: Infinity,
      uploadBytesRemainingMonth: Infinity,
      isComped: true,
    };
  }

  return {
    ocrPagesRemainingToday: Math.max(0, limits.ocrPagesPerDay - usage.ocrPagesToday),
    ocrPagesRemainingMonth: Math.max(0, limits.ocrPagesPerMonth - usage.ocrPagesMonth),
    aiCallsRemainingToday: Math.max(0, limits.aiCallsPerDay - usage.aiCallsToday),
    aiCallsRemainingMonth: Math.max(0, limits.aiCallsPerMonth - usage.aiCallsMonth),
    aiTokensRemainingMonth: Math.max(0, limits.aiTokensPerMonth - usage.aiTokensMonth),
    uploadBytesRemainingMonth: Math.max(0, limits.uploadBytesPerMonth - usage.uploadBytesMonth),
    isComped: false,
  };
}

export type QuotaCheckType = "ocr_page" | "ai_call" | "upload_bytes";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  code?: "QUOTA_EXCEEDED" | "DAILY_LIMIT" | "MONTHLY_LIMIT" | "PLAN_REQUIRED" | "CREDITS_CONSUMED" | "NEEDS_PROCESSING_PACK";
  remaining?: number;
  usedCredit?: boolean;
  packSuggested?: "overlimit_200" | "plus_600";
}

function isAnalysisAction(quotaType: QuotaCheckType): boolean {
  return quotaType === "ocr_page" || quotaType === "ai_call";
}

export async function checkQuota(
  userId: string,
  type: QuotaCheckType,
  quantity: number = 1
): Promise<QuotaCheckResult> {
  const [{ limits, isComped, tier }, usage, analysisCredits] = await Promise.all([
    getUserLimits(userId),
    getUserUsage(userId),
    getAnalysisCredits(userId),
  ]);

  if (isComped) {
    return { allowed: true };
  }

  if (isAnalysisAction(type) && analysisCredits >= quantity) {
    const result = await consumeAnalysisCredit(userId, quantity);
    if (result.consumed) {
      console.log(`[QUOTA] User ${userId} consumed ${quantity} analysis credit(s), ${result.remaining} remaining`);
      return { allowed: true, remaining: result.remaining, usedCredit: true, code: "CREDITS_CONSUMED" };
    }
  }

  if (tier === "free") {
    return {
      allowed: false,
      reason: "A paid plan is required to use this feature",
      code: "PLAN_REQUIRED",
    };
  }

  switch (type) {
    case "ocr_page": {
      const remainingToday = limits.ocrPagesPerDay - usage.ocrPagesToday;
      const remainingMonth = limits.ocrPagesPerMonth - usage.ocrPagesMonth;
      
      if (quantity > remainingToday || quantity > remainingMonth) {
        return {
          allowed: false,
          reason: "Processing limit reached. Purchase a processing pack to continue.",
          code: "NEEDS_PROCESSING_PACK",
          remaining: Math.min(remainingToday, remainingMonth),
          packSuggested: "overlimit_200",
        };
      }
      return { allowed: true, remaining: Math.min(remainingToday, remainingMonth) };
    }
    
    case "ai_call": {
      const remainingToday = limits.aiCallsPerDay - usage.aiCallsToday;
      const remainingMonth = limits.aiCallsPerMonth - usage.aiCallsMonth;
      
      if (quantity > remainingToday || quantity > remainingMonth) {
        return {
          allowed: false,
          reason: "Processing limit reached. Purchase a processing pack to continue.",
          code: "NEEDS_PROCESSING_PACK",
          remaining: Math.min(remainingToday, remainingMonth),
          packSuggested: "overlimit_200",
        };
      }
      return { allowed: true, remaining: Math.min(remainingToday, remainingMonth) };
    }
    
    case "upload_bytes": {
      const remainingMonth = limits.uploadBytesPerMonth - usage.uploadBytesMonth;
      
      if (quantity > remainingMonth) {
        const limitGb = Math.round(limits.uploadBytesPerMonth / (1024 * 1024 * 1024));
        return {
          allowed: false,
          reason: `Monthly storage limit reached (${limitGb}GB/month). Upgrade for more.`,
          code: "MONTHLY_LIMIT",
          remaining: remainingMonth,
        };
      }
      return { allowed: true, remaining: remainingMonth };
    }
    
    default:
      return { allowed: true };
  }
}

export async function recordUsage(
  userId: string,
  type: UsageType,
  quantity: number,
  caseId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(usageEvents).values({
    userId,
    caseId: caseId || null,
    eventType: type,
    quantity,
    metadata: metadata || {},
  });
}

export { TIER_QUOTAS };
