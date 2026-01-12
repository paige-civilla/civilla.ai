/**
 * AI Execution Guard
 * 
 * Unified wrapper for all AI operations that enforces:
 * - Timeouts (prevents hanging)
 * - Concurrency limits (prevents overload)
 * - Retries with exponential backoff (handles transient failures)
 * - Structured failure responses (consistent error handling)
 * - Failure logging (debugging and monitoring)
 * 
 * USAGE:
 * ```typescript
 * import { aiExecutionGuard, AiGuardResult } from "./ai/executionGuard";
 * 
 * const result = await aiExecutionGuard({
 *   name: "ocr_extraction",
 *   userId: "user123",
 *   caseId: "case456",
 *   fn: async () => { ... },
 *   timeoutMs: 60000,
 *   concurrencyKey: "ocr",
 * });
 * 
 * if (result.status === "error") {
 *   // Handle gracefully - never blocks UI
 * }
 * ```
 */

import { createLimiter, retry, AbortError } from "../utils/concurrency";
import { normalizeError, formatErrorForClient } from "../utils/humanizeError";

export interface AiGuardOptions<T> {
  name: string;
  userId?: string;
  caseId?: string;
  entityId?: string;
  fn: () => Promise<T>;
  timeoutMs?: number;
  retries?: number;
  concurrencyKey?: ConcurrencyKey;
  shouldRetry?: (error: unknown) => boolean;
  onProgress?: (message: string) => void;
}

export interface AiGuardResult<T> {
  status: "success" | "error" | "timeout" | "queued";
  data?: T;
  human_readable_message: string;
  retry_allowed: boolean;
  error_code?: string;
  duration_ms?: number;
}

export type ConcurrencyKey = 
  | "ocr"
  | "ocr_page"
  | "ai_analysis"
  | "claims_suggest"
  | "pattern_analysis"
  | "document_compile"
  | "lexi_chat"
  | "default";

const CONCURRENCY_LIMITS: Record<ConcurrencyKey, number> = {
  ocr: 2,
  ocr_page: 3,
  ai_analysis: 2,
  claims_suggest: 2,
  pattern_analysis: 1,
  document_compile: 3,
  lexi_chat: 10,
  default: 5,
};

const limiters: Map<string, ReturnType<typeof createLimiter>> = new Map();

function getLimiter(key: ConcurrencyKey, userId?: string): ReturnType<typeof createLimiter> {
  const fullKey = userId ? `${key}:${userId}` : key;
  if (!limiters.has(fullKey)) {
    limiters.set(fullKey, createLimiter(CONCURRENCY_LIMITS[key]));
  }
  return limiters.get(fullKey)!;
}

const failureLog: Array<{
  timestamp: string;
  name: string;
  userId?: string;
  caseId?: string;
  error_code: string;
  message: string;
}> = [];

const MAX_FAILURE_LOG = 100;

export function getRecentFailures(limit = 20): typeof failureLog {
  return failureLog.slice(-limit);
}

function logFailure(
  name: string,
  userId: string | undefined,
  caseId: string | undefined,
  errorCode: string,
  message: string
) {
  failureLog.push({
    timestamp: new Date().toISOString(),
    name,
    userId,
    caseId,
    error_code: errorCode,
    message,
  });
  
  if (failureLog.length > MAX_FAILURE_LOG) {
    failureLog.shift();
  }
  
  console.error(`[AI Guard Failure] ${name}:`, { userId, caseId, errorCode, message });
}

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("429") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("quota")
  );
}

function isAuthError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.toLowerCase().includes("invalid_api_key") ||
    msg.toLowerCase().includes("incorrect api key")
  );
}

function classifyError(error: unknown): { code: string; message: string; retryAllowed: boolean } {
  if (isAuthError(error)) {
    return {
      code: "AUTH_ERROR",
      message: "API authentication failed. Please check your configuration.",
      retryAllowed: false,
    };
  }
  
  if (isRateLimitError(error)) {
    return {
      code: "RATE_LIMIT",
      message: "Service is busy. Your request has been queued.",
      retryAllowed: true,
    };
  }
  
  const normalized = normalizeError(error);
  
  if (normalized.message.toLowerCase().includes("timeout")) {
    return {
      code: "TIMEOUT",
      message: "The operation took too long. Please try again.",
      retryAllowed: true,
    };
  }
  
  if (normalized.message.toLowerCase().includes("network") || 
      normalized.message.toLowerCase().includes("econnrefused")) {
    return {
      code: "NETWORK_ERROR",
      message: "Network issue. Please check your connection and try again.",
      retryAllowed: true,
    };
  }
  
  return {
    code: normalized.code || "UNKNOWN_ERROR",
    message: formatErrorForClient(error).error,
    retryAllowed: true,
  };
}

export async function aiExecutionGuard<T>(
  options: AiGuardOptions<T>
): Promise<AiGuardResult<T>> {
  const {
    name,
    userId,
    caseId,
    fn,
    timeoutMs = 60000,
    retries = 3,
    concurrencyKey = "default",
    shouldRetry,
    onProgress,
  } = options;
  
  const startTime = Date.now();
  const limiter = getLimiter(concurrencyKey, userId);
  
  const defaultShouldRetry = (error: unknown): boolean => {
    if (isAuthError(error)) return false;
    if (isRateLimitError(error)) return true;
    return true;
  };
  
  const retryCheck = shouldRetry || defaultShouldRetry;
  
  try {
    const result = await limiter(async () => {
      onProgress?.("Starting...");
      
      return retry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
            });
            
            const resultPromise = fn();
            const result = await Promise.race([resultPromise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
          } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError" || err.message === "TIMEOUT") {
              throw new Error("TIMEOUT: Operation exceeded time limit");
            }
            throw err;
          }
        },
        {
          retries,
          minTimeout: 1000,
          maxTimeout: 30000,
          factor: 2,
          shouldRetry: retryCheck,
          onFailedAttempt: (error, attempt) => {
            onProgress?.(`Retry attempt ${attempt}...`);
            console.log(`[AI Guard] ${name} retry ${attempt}:`, error instanceof Error ? error.message : error);
          },
        }
      );
    });
    
    const duration = Date.now() - startTime;
    
    return {
      status: "success",
      data: result,
      human_readable_message: "Completed successfully",
      retry_allowed: false,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const classified = classifyError(error);
    
    logFailure(name, userId, caseId, classified.code, classified.message);
    
    if (classified.code === "TIMEOUT") {
      return {
        status: "timeout",
        human_readable_message: "This is taking longer than expected. Please try again.",
        retry_allowed: true,
        error_code: "TIMEOUT",
        duration_ms: duration,
      };
    }
    
    return {
      status: "error",
      human_readable_message: classified.message,
      retry_allowed: classified.retryAllowed,
      error_code: classified.code,
      duration_ms: duration,
    };
  }
}

export interface QueueStats {
  key: ConcurrencyKey;
  userId?: string;
  active: number;
  queued: number;
  limit: number;
}

export function getQueueStats(): QueueStats[] {
  const stats: QueueStats[] = [];
  
  const entries = Array.from(limiters.entries());
  for (const [fullKey] of entries) {
    const [key, userId] = fullKey.includes(":") 
      ? fullKey.split(":") as [ConcurrencyKey, string]
      : [fullKey as ConcurrencyKey, undefined];
    
    stats.push({
      key,
      userId,
      active: 0,
      queued: 0,
      limit: CONCURRENCY_LIMITS[key] || CONCURRENCY_LIMITS.default,
    });
  }
  
  return stats;
}

export { isRateLimitError, isAuthError, classifyError };
