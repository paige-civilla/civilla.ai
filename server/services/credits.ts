import { db } from "../db";
import { processingCreditLedger, userProfiles, type CreditJobType, type CreditReason } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface ConsumeResult {
  consumed: boolean;
  ledgerId: string | null;
  remaining: number;
  alreadyConsumed: boolean;
}

export interface RefundResult {
  refunded: boolean;
  ledgerId: string | null;
  alreadyRefunded: boolean;
}

export async function consumeCreditOrThrow(params: {
  userId: string;
  caseId?: string;
  jobType: CreditJobType;
  jobKey: string;
  quantity?: number;
}): Promise<ConsumeResult> {
  const { userId, caseId, jobType, jobKey, quantity = 1 } = params;

  const existingConsume = await db
    .select({ id: processingCreditLedger.id })
    .from(processingCreditLedger)
    .where(
      and(
        eq(processingCreditLedger.jobKey, jobKey),
        eq(processingCreditLedger.reason, "consume")
      )
    )
    .limit(1);

  if (existingConsume.length > 0) {
    const remaining = await getCreditBalance(userId);
    return {
      consumed: true,
      ledgerId: existingConsume[0].id,
      remaining,
      alreadyConsumed: true,
    };
  }

  const currentBalance = await getCreditBalance(userId);
  if (currentBalance < quantity) {
    return {
      consumed: false,
      ledgerId: null,
      remaining: currentBalance,
      alreadyConsumed: false,
    };
  }

  try {
    const [ledgerEntry] = await db
      .insert(processingCreditLedger)
      .values({
        userId,
        caseId: caseId || null,
        jobType,
        jobKey,
        delta: -quantity,
        reason: "consume",
      })
      .returning({ id: processingCreditLedger.id });

    await db.execute(sql`
      UPDATE user_profiles 
      SET analysis_credits_remaining = GREATEST(0, COALESCE(analysis_credits_remaining, 0) - ${quantity}),
          updated_at = NOW()
      WHERE user_id = ${userId}
    `);

    const remaining = await getCreditBalance(userId);
    console.log(`[CREDITS] Consumed ${quantity} credit(s) for user ${userId}, jobKey=${jobKey}, remaining=${remaining}`);

    return {
      consumed: true,
      ledgerId: ledgerEntry.id,
      remaining,
      alreadyConsumed: false,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("processing_credit_ledger_job_key_reason_idx")) {
      const remaining = await getCreditBalance(userId);
      const existing = await db
        .select({ id: processingCreditLedger.id })
        .from(processingCreditLedger)
        .where(
          and(
            eq(processingCreditLedger.jobKey, jobKey),
            eq(processingCreditLedger.reason, "consume")
          )
        )
        .limit(1);
      return {
        consumed: true,
        ledgerId: existing[0]?.id || null,
        remaining,
        alreadyConsumed: true,
      };
    }
    throw error;
  }
}

export async function refundCreditIfNeeded(params: {
  userId: string;
  caseId?: string;
  jobType: CreditJobType;
  jobKey: string;
  error?: string;
  quantity?: number;
}): Promise<RefundResult> {
  const { userId, caseId, jobType, jobKey, error, quantity = 1 } = params;

  const existingConsume = await db
    .select({ id: processingCreditLedger.id })
    .from(processingCreditLedger)
    .where(
      and(
        eq(processingCreditLedger.jobKey, jobKey),
        eq(processingCreditLedger.reason, "consume")
      )
    )
    .limit(1);

  if (existingConsume.length === 0) {
    console.log(`[CREDITS] No consume found for jobKey=${jobKey}, skipping refund`);
    return { refunded: false, ledgerId: null, alreadyRefunded: false };
  }

  const existingRefund = await db
    .select({ id: processingCreditLedger.id })
    .from(processingCreditLedger)
    .where(
      and(
        eq(processingCreditLedger.jobKey, jobKey),
        eq(processingCreditLedger.reason, "refund_failure")
      )
    )
    .limit(1);

  if (existingRefund.length > 0) {
    console.log(`[CREDITS] Refund already exists for jobKey=${jobKey}`);
    return { refunded: true, ledgerId: existingRefund[0].id, alreadyRefunded: true };
  }

  try {
    const [ledgerEntry] = await db
      .insert(processingCreditLedger)
      .values({
        userId,
        caseId: caseId || null,
        jobType,
        jobKey,
        delta: quantity,
        reason: "refund_failure",
        error: error?.slice(0, 500),
      })
      .returning({ id: processingCreditLedger.id });

    await db.execute(sql`
      UPDATE user_profiles 
      SET analysis_credits_remaining = COALESCE(analysis_credits_remaining, 0) + ${quantity},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `);

    const remaining = await getCreditBalance(userId);
    console.log(`[CREDITS] Refunded ${quantity} credit(s) for user ${userId}, jobKey=${jobKey}, error=${error?.slice(0, 100)}, remaining=${remaining}`);

    return { refunded: true, ledgerId: ledgerEntry.id, alreadyRefunded: false };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("processing_credit_ledger_job_key_reason_idx")) {
      const existing = await db
        .select({ id: processingCreditLedger.id })
        .from(processingCreditLedger)
        .where(
          and(
            eq(processingCreditLedger.jobKey, jobKey),
            eq(processingCreditLedger.reason, "refund_failure")
          )
        )
        .limit(1);
      return { refunded: true, ledgerId: existing[0]?.id || null, alreadyRefunded: true };
    }
    console.error(`[CREDITS] Failed to refund for jobKey=${jobKey}:`, err);
    throw err;
  }
}

export async function getCreditBalance(userId: string): Promise<number> {
  const result = await db
    .select({ balance: userProfiles.analysisCreditsRemaining })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return result[0]?.balance ?? 0;
}

export async function addPackCredits(params: {
  userId: string;
  credits: number;
  jobKey: string;
  jobType?: CreditJobType;
}): Promise<{ ledgerId: string; newBalance: number }> {
  const { userId, credits, jobKey, jobType = "export" } = params;

  const existing = await db
    .select({ id: processingCreditLedger.id })
    .from(processingCreditLedger)
    .where(
      and(
        eq(processingCreditLedger.jobKey, jobKey),
        eq(processingCreditLedger.reason, "pack_purchase")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    console.log(`[CREDITS] Pack purchase already recorded for jobKey=${jobKey}`);
    const balance = await getCreditBalance(userId);
    return { ledgerId: existing[0].id, newBalance: balance };
  }

  const [ledgerEntry] = await db
    .insert(processingCreditLedger)
    .values({
      userId,
      caseId: null,
      jobType,
      jobKey,
      delta: credits,
      reason: "pack_purchase",
    })
    .returning({ id: processingCreditLedger.id });

  await db.execute(sql`
    UPDATE user_profiles 
    SET analysis_credits_remaining = COALESCE(analysis_credits_remaining, 0) + ${credits},
        last_processing_pack_purchase_at = NOW(),
        updated_at = NOW()
    WHERE user_id = ${userId}
  `);

  const newBalance = await getCreditBalance(userId);
  console.log(`[CREDITS] Added ${credits} pack credits for user ${userId}, jobKey=${jobKey}, newBalance=${newBalance}`);

  return { ledgerId: ledgerEntry.id, newBalance };
}

export async function getRecentCreditEvents(userId: string, limit: number = 10): Promise<{
  id: string;
  jobType: string;
  delta: number;
  reason: string;
  createdAt: Date;
}[]> {
  const result = await db
    .select({
      id: processingCreditLedger.id,
      jobType: processingCreditLedger.jobType,
      delta: processingCreditLedger.delta,
      reason: processingCreditLedger.reason,
      createdAt: processingCreditLedger.createdAt,
    })
    .from(processingCreditLedger)
    .where(eq(processingCreditLedger.userId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(limit);

  return result;
}
