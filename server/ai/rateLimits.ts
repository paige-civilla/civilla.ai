/**
 * AI Rate Limits (Soft, Non-Punitive)
 * 
 * Implements SOFT rate limits that queue rather than block.
 * During beta, users should NEVER see "limit exceeded" messages.
 * 
 * Limits are per-user and designed to prevent abuse while
 * maintaining a positive user experience.
 */

export interface RateLimitConfig {
  maxConcurrent: number;
  maxPerPeriod?: number;
  periodMs?: number;
  cooldownMs?: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  ocr_documents: {
    maxConcurrent: 2,
    maxPerPeriod: 50,
    periodMs: 3600000,
  },
  ocr_pages_per_document: {
    maxConcurrent: 3,
  },
  ai_analysis: {
    maxConcurrent: 2,
    maxPerPeriod: 100,
    periodMs: 3600000,
  },
  claims_suggestion: {
    maxConcurrent: 1,
    maxPerPeriod: 20,
    periodMs: 600000,
  },
  pattern_analysis: {
    maxConcurrent: 1,
    cooldownMs: 600000,
  },
  document_compile: {
    maxConcurrent: 1,
    maxPerPeriod: 3,
    periodMs: 3600000,
  },
  lexi_chat: {
    maxConcurrent: 5,
  },
};

interface UserUsage {
  concurrent: number;
  history: number[];
  lastAction?: number;
}

const userUsage: Map<string, Map<string, UserUsage>> = new Map();

function getUserUsage(userId: string, action: string): UserUsage {
  if (!userUsage.has(userId)) {
    userUsage.set(userId, new Map());
  }
  
  const userMap = userUsage.get(userId)!;
  if (!userMap.has(action)) {
    userMap.set(action, { concurrent: 0, history: [] });
  }
  
  return userMap.get(action)!;
}

function cleanupOldHistory(usage: UserUsage, periodMs: number): void {
  const cutoff = Date.now() - periodMs;
  usage.history = usage.history.filter(ts => ts > cutoff);
}

export interface RateLimitCheck {
  allowed: boolean;
  queued: boolean;
  message: string;
  waitMs?: number;
}

export function checkRateLimit(userId: string, action: string): RateLimitCheck {
  const config = RATE_LIMITS[action];
  if (!config) {
    return { allowed: true, queued: false, message: "OK" };
  }
  
  const usage = getUserUsage(userId, action);
  
  if (config.cooldownMs && usage.lastAction) {
    const elapsed = Date.now() - usage.lastAction;
    if (elapsed < config.cooldownMs) {
      const waitMs = config.cooldownMs - elapsed;
      return {
        allowed: true,
        queued: true,
        message: "Processing queued — this may take longer",
        waitMs,
      };
    }
  }
  
  if (config.maxPerPeriod && config.periodMs) {
    cleanupOldHistory(usage, config.periodMs);
    
    if (usage.history.length >= config.maxPerPeriod) {
      return {
        allowed: true,
        queued: true,
        message: "Processing queued — this may take longer",
      };
    }
  }
  
  if (usage.concurrent >= config.maxConcurrent) {
    return {
      allowed: true,
      queued: true,
      message: "Processing queued — this may take longer",
    };
  }
  
  return { allowed: true, queued: false, message: "OK" };
}

export function recordActionStart(userId: string, action: string): void {
  const usage = getUserUsage(userId, action);
  usage.concurrent++;
  usage.history.push(Date.now());
  usage.lastAction = Date.now();
}

export function recordActionEnd(userId: string, action: string): void {
  const usage = getUserUsage(userId, action);
  usage.concurrent = Math.max(0, usage.concurrent - 1);
}

export interface RateLimitStats {
  action: string;
  concurrent: number;
  maxConcurrent: number;
  periodUsage?: number;
  maxPerPeriod?: number;
}

export function getUserRateLimitStats(userId: string): RateLimitStats[] {
  const stats: RateLimitStats[] = [];
  
  for (const [action, config] of Object.entries(RATE_LIMITS)) {
    const usage = getUserUsage(userId, action);
    
    if (config.maxPerPeriod && config.periodMs) {
      cleanupOldHistory(usage, config.periodMs);
    }
    
    stats.push({
      action,
      concurrent: usage.concurrent,
      maxConcurrent: config.maxConcurrent,
      periodUsage: usage.history.length,
      maxPerPeriod: config.maxPerPeriod,
    });
  }
  
  return stats;
}

export function getGlobalUsageStats(): { totalActive: number; totalQueued: number } {
  let totalActive = 0;
  let totalQueued = 0;
  
  const allUsers = Array.from(userUsage.entries());
  for (const [, actionMap] of allUsers) {
    const allActions = Array.from(actionMap.entries());
    for (const [action, usage] of allActions) {
      totalActive += usage.concurrent;
      const config = RATE_LIMITS[action];
      if (config && usage.concurrent > config.maxConcurrent) {
        totalQueued += usage.concurrent - config.maxConcurrent;
      }
    }
  }
  
  return { totalActive, totalQueued };
}
