import { db, pool } from "../db";
import { evidenceExtractions, evidenceAiAnalyses, claimSuggestionRuns } from "@shared/schema";
import { eq, and, lt, inArray, sql } from "drizzle-orm";
import { sendAlert } from "../alerts/alerting";

const GLOBAL_CONCURRENCY = 2;
const STALE_THRESHOLD_MINUTES = 15;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

let activeJobs = 0;
const jobQueue: Array<() => Promise<void>> = [];
const evidenceLocks = new Map<string, boolean>();

function jitterDelay(baseMs: number, attempt: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return exponential + jitter;
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; name?: string } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const baseDelay = options.baseDelay ?? BASE_DELAY_MS;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = 
        error?.status === 429 ||
        error?.status === 503 ||
        error?.status === 500 ||
        error?.code === "ECONNRESET" ||
        error?.message?.includes("rate limit");
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delay = jitterDelay(baseDelay, attempt);
      console.log(`[JobRunner] ${options.name || "Job"} retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

function enqueueJob(fn: () => Promise<void>): void {
  jobQueue.push(fn);
  processQueue();
}

async function processQueue(): Promise<void> {
  while (activeJobs < GLOBAL_CONCURRENCY && jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (job) {
      activeJobs++;
      job()
        .catch(err => console.error("[JobRunner] Job failed:", err))
        .finally(() => {
          activeJobs--;
          processQueue();
        });
    }
  }
}

export function acquireEvidenceLock(evidenceId: string): boolean {
  if (evidenceLocks.get(evidenceId)) {
    return false;
  }
  evidenceLocks.set(evidenceId, true);
  return true;
}

export function releaseEvidenceLock(evidenceId: string): void {
  evidenceLocks.delete(evidenceId);
}

export async function requeueStaleExtractions(): Promise<number> {
  const staleTime = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);
  
  const result = await db
    .update(evidenceExtractions)
    .set({ status: "queued", updatedAt: new Date() })
    .where(
      and(
        eq(evidenceExtractions.status, "processing"),
        lt(evidenceExtractions.updatedAt, staleTime)
      )
    )
    .returning({ id: evidenceExtractions.id });
  
  if (result.length > 0) {
    console.log(`[JobRunner] Requeued ${result.length} stale extractions`);
  }
  
  return result.length;
}

export async function requeueStaleAiAnalyses(): Promise<number> {
  const staleTime = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);
  
  const result = await db
    .update(evidenceAiAnalyses)
    .set({ status: "queued", updatedAt: new Date() })
    .where(
      and(
        eq(evidenceAiAnalyses.status, "processing"),
        lt(evidenceAiAnalyses.updatedAt, staleTime)
      )
    )
    .returning({ id: evidenceAiAnalyses.id });
  
  if (result.length > 0) {
    console.log(`[JobRunner] Requeued ${result.length} stale AI analyses`);
  }
  
  return result.length;
}

export async function requeueStaleClaimSuggestions(): Promise<number> {
  const staleTime = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);
  
  const result = await db
    .update(claimSuggestionRuns)
    .set({ status: "queued", updatedAt: new Date() })
    .where(
      and(
        eq(claimSuggestionRuns.status, "processing"),
        lt(claimSuggestionRuns.updatedAt, staleTime)
      )
    )
    .returning({ id: claimSuggestionRuns.id });
  
  if (result.length > 0) {
    console.log(`[JobRunner] Requeued ${result.length} stale claim suggestion runs`);
  }
  
  return result.length;
}

export async function requeueAllStaleJobs(): Promise<{ extractions: number; aiAnalyses: number; claimSuggestions: number }> {
  const [extractions, aiAnalyses, claimSuggestions] = await Promise.all([
    requeueStaleExtractions(),
    requeueStaleAiAnalyses(),
    requeueStaleClaimSuggestions(),
  ]);
  
  return { extractions, aiAnalyses, claimSuggestions };
}

export interface JobStats {
  activeJobs: number;
  queueLength: number;
  globalConcurrency: number;
  lockedEvidenceIds: string[];
}

export function getJobStats(): JobStats {
  return {
    activeJobs,
    queueLength: jobQueue.length,
    globalConcurrency: GLOBAL_CONCURRENCY,
    lockedEvidenceIds: Array.from(evidenceLocks.keys()),
  };
}

export interface AiJobCounts {
  queued: number;
  processing: number;
  complete: number;
  failed: number;
}

export async function getExtractionJobCounts(caseId: string): Promise<AiJobCounts> {
  const result = await db
    .select({
      status: evidenceExtractions.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(evidenceExtractions)
    .where(eq(evidenceExtractions.caseId, caseId))
    .groupBy(evidenceExtractions.status);
  
  const counts: AiJobCounts = { queued: 0, processing: 0, complete: 0, failed: 0 };
  for (const r of result) {
    if (r.status === "queued") counts.queued = r.count;
    else if (r.status === "processing") counts.processing = r.count;
    else if (r.status === "complete") counts.complete = r.count;
    else if (r.status === "failed") counts.failed = r.count;
  }
  return counts;
}

export async function getAiAnalysisJobCounts(caseId: string): Promise<AiJobCounts> {
  const result = await db
    .select({
      status: evidenceAiAnalyses.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(evidenceAiAnalyses)
    .where(eq(evidenceAiAnalyses.caseId, caseId))
    .groupBy(evidenceAiAnalyses.status);
  
  const counts: AiJobCounts = { queued: 0, processing: 0, complete: 0, failed: 0 };
  for (const r of result) {
    if (r.status === "queued") counts.queued = r.count;
    else if (r.status === "processing") counts.processing = r.count;
    else if (r.status === "complete") counts.complete = r.count;
    else if (r.status === "failed") counts.failed = r.count;
  }
  return counts;
}

export async function getClaimSuggestionJobCounts(caseId: string): Promise<AiJobCounts> {
  const result = await db
    .select({
      status: claimSuggestionRuns.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(claimSuggestionRuns)
    .where(eq(claimSuggestionRuns.caseId, caseId))
    .groupBy(claimSuggestionRuns.status);
  
  const counts: AiJobCounts = { queued: 0, processing: 0, complete: 0, failed: 0 };
  for (const r of result) {
    if (r.status === "queued") counts.queued = r.count;
    else if (r.status === "processing") counts.processing = r.count;
    else if (r.status === "complete") counts.complete = r.count;
    else if (r.status === "failed" || r.status === "rate_limited") counts.failed = r.count;
  }
  return counts;
}

export interface RecentFailure {
  id: string;
  type: "extraction" | "ai_analysis" | "claim_suggestion";
  error: string;
  createdAt: Date;
}

export async function getRecentFailures(caseId: string, limit: number = 10): Promise<RecentFailure[]> {
  const failures: RecentFailure[] = [];
  
  const [extractionFails, analysisFails, claimFails] = await Promise.all([
    db
      .select({
        id: evidenceExtractions.id,
        error: evidenceExtractions.error,
        createdAt: evidenceExtractions.createdAt,
      })
      .from(evidenceExtractions)
      .where(and(eq(evidenceExtractions.caseId, caseId), eq(evidenceExtractions.status, "failed")))
      .orderBy(sql`${evidenceExtractions.createdAt} DESC`)
      .limit(limit),
    db
      .select({
        id: evidenceAiAnalyses.id,
        error: evidenceAiAnalyses.error,
        createdAt: evidenceAiAnalyses.createdAt,
      })
      .from(evidenceAiAnalyses)
      .where(and(eq(evidenceAiAnalyses.caseId, caseId), eq(evidenceAiAnalyses.status, "failed")))
      .orderBy(sql`${evidenceAiAnalyses.createdAt} DESC`)
      .limit(limit),
    db
      .select({
        id: claimSuggestionRuns.id,
        error: claimSuggestionRuns.error,
        createdAt: claimSuggestionRuns.createdAt,
      })
      .from(claimSuggestionRuns)
      .where(and(eq(claimSuggestionRuns.caseId, caseId), inArray(claimSuggestionRuns.status, ["failed", "rate_limited"])))
      .orderBy(sql`${claimSuggestionRuns.createdAt} DESC`)
      .limit(limit),
  ]);
  
  for (const f of extractionFails) {
    failures.push({ id: f.id, type: "extraction", error: humanizeError(f.error), createdAt: f.createdAt });
  }
  for (const f of analysisFails) {
    failures.push({ id: f.id, type: "ai_analysis", error: humanizeError(f.error), createdAt: f.createdAt });
  }
  for (const f of claimFails) {
    failures.push({ id: f.id, type: "claim_suggestion", error: humanizeError(f.error), createdAt: f.createdAt });
  }
  
  failures.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return failures.slice(0, limit);
}

function humanizeError(error: string | null): string {
  if (!error) return "Unknown error";
  
  const redacted = error
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
    .replace(/key\s*[:=]\s*["']?[a-zA-Z0-9_-]{20,}["']?/gi, "key=***")
    .replace(/Bearer\s+[a-zA-Z0-9_-]{20,}/gi, "Bearer ***");
  
  if (redacted.includes("rate limit") || redacted.includes("429")) {
    return "Rate limited - too many requests";
  }
  if (redacted.includes("401") || redacted.includes("Unauthorized")) {
    return "Authentication error";
  }
  if (redacted.includes("timeout") || redacted.includes("ETIMEDOUT")) {
    return "Request timed out";
  }
  if (redacted.includes("ECONNRESET") || redacted.includes("network")) {
    return "Network error";
  }
  
  return redacted.length > 200 ? redacted.slice(0, 200) + "..." : redacted;
}

export { enqueueJob, runWithRetry, humanizeError, GLOBAL_CONCURRENCY, STALE_THRESHOLD_MINUTES };
