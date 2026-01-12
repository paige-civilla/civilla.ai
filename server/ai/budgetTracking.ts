/**
 * Per-User AI Budget Tracking
 * 
 * Tracks AI usage per user for cost protection without blocking.
 * When budget exceeded:
 * - De-prioritize background jobs
 * - Continue allowing foreground requests
 * - NEVER block during beta
 */

export interface AiUsageRecord {
  userId: string;
  date: string;
  operations: {
    ocr_pages: number;
    ai_analysis: number;
    claims_suggest: number;
    lexi_chat: number;
    document_compile: number;
    pattern_analysis: number;
  };
  estimatedCostCents: number;
}

const COST_PER_OPERATION_CENTS: Record<string, number> = {
  ocr_pages: 0.15,
  ai_analysis: 0.5,
  claims_suggest: 0.3,
  lexi_chat: 0.1,
  document_compile: 0.5,
  pattern_analysis: 1.0,
};

const DAILY_BUDGET_CENTS = 500;

const usageByUser: Map<string, AiUsageRecord> = new Map();

function getDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getUserRecord(userId: string): AiUsageRecord {
  const dateKey = getDateKey();
  const key = `${userId}:${dateKey}`;
  
  if (!usageByUser.has(key)) {
    usageByUser.set(key, {
      userId,
      date: dateKey,
      operations: {
        ocr_pages: 0,
        ai_analysis: 0,
        claims_suggest: 0,
        lexi_chat: 0,
        document_compile: 0,
        pattern_analysis: 0,
      },
      estimatedCostCents: 0,
    });
  }
  
  return usageByUser.get(key)!;
}

export type AiOperationType = keyof AiUsageRecord["operations"];

export function recordAiUsage(
  userId: string,
  operation: AiOperationType,
  count: number = 1
): void {
  const record = getUserRecord(userId);
  record.operations[operation] += count;
  record.estimatedCostCents += (COST_PER_OPERATION_CENTS[operation] || 0) * count;
}

export function getUserDailyUsage(userId: string): AiUsageRecord {
  return getUserRecord(userId);
}

export function isUserOverBudget(userId: string): boolean {
  const record = getUserRecord(userId);
  return record.estimatedCostCents > DAILY_BUDGET_CENTS;
}

export function getUserBudgetStatus(userId: string): {
  used: number;
  limit: number;
  percentUsed: number;
  overBudget: boolean;
} {
  const record = getUserRecord(userId);
  const percentUsed = (record.estimatedCostCents / DAILY_BUDGET_CENTS) * 100;
  
  return {
    used: record.estimatedCostCents,
    limit: DAILY_BUDGET_CENTS,
    percentUsed: Math.round(percentUsed),
    overBudget: record.estimatedCostCents > DAILY_BUDGET_CENTS,
  };
}

export function getGlobalUsageSummary(): {
  totalUsers: number;
  totalOperations: number;
  totalCostCents: number;
  usersOverBudget: number;
} {
  const dateKey = getDateKey();
  let totalUsers = 0;
  let totalOperations = 0;
  let totalCostCents = 0;
  let usersOverBudget = 0;
  
  const entries = Array.from(usageByUser.entries());
  for (const [key, record] of entries) {
    if (key.endsWith(`:${dateKey}`)) {
      totalUsers++;
      totalCostCents += record.estimatedCostCents;
      usersOverBudget += record.estimatedCostCents > DAILY_BUDGET_CENTS ? 1 : 0;
      
      for (const count of Object.values(record.operations)) {
        totalOperations += count;
      }
    }
  }
  
  return {
    totalUsers,
    totalOperations,
    totalCostCents,
    usersOverBudget,
  };
}

export function cleanupOldRecords(daysToKeep: number = 7): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  
  let removed = 0;
  const keys = Array.from(usageByUser.keys());
  for (const key of keys) {
    const date = key.split(":")[1];
    if (date < cutoffStr) {
      usageByUser.delete(key);
      removed++;
    }
  }
  
  return removed;
}
