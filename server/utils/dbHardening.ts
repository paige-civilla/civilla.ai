/**
 * Database Hardening Utilities
 * 
 * Provides:
 * - Idempotent write helpers (upsert patterns)
 * - AI job status tracking
 * - Retry-safe operations
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Execute an operation idempotently using a unique key.
 * Prevents duplicate operations by checking if already processed.
 */
export async function idempotentOperation<T>(
  operationKey: string,
  ttlMs: number = 3600000, // 1 hour default
  fn: () => Promise<T>
): Promise<{ result: T; wasNew: boolean } | { result: null; wasNew: false }> {
  const cacheKey = `idem:${operationKey}`;
  
  // Check if operation was already performed (in-memory cache)
  const cached = idempotencyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return { result: cached.result, wasNew: false };
  }
  
  try {
    const result = await fn();
    
    // Cache the result
    idempotencyCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
    
    // Cleanup old entries periodically
    if (idempotencyCache.size > 1000) {
      cleanupIdempotencyCache(ttlMs);
    }
    
    return { result, wasNew: true };
  } catch (error) {
    throw error;
  }
}

const idempotencyCache = new Map<string, { result: any; timestamp: number }>();

function cleanupIdempotencyCache(ttlMs: number): void {
  const now = Date.now();
  const entries = Array.from(idempotencyCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > ttlMs) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * AI Job Status Tracker
 * Tracks long-running AI operations for monitoring and recovery
 */
export interface AiJobStatus {
  jobId: string;
  type: string;
  userId: string;
  status: "pending" | "running" | "complete" | "failed" | "cancelled";
  progress: number;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

const activeJobs = new Map<string, AiJobStatus>();

export function createAiJob(
  jobId: string,
  type: string,
  userId: string,
  metadata?: Record<string, unknown>
): AiJobStatus {
  const job: AiJobStatus = {
    jobId,
    type,
    userId,
    status: "pending",
    progress: 0,
    startedAt: new Date(),
    updatedAt: new Date(),
    metadata,
  };
  
  activeJobs.set(jobId, job);
  console.log(`[AI Job] Created: ${jobId} (${type})`);
  
  return job;
}

export function updateAiJobProgress(
  jobId: string,
  progress: number,
  status?: AiJobStatus["status"]
): void {
  const job = activeJobs.get(jobId);
  if (!job) return;
  
  job.progress = Math.min(100, Math.max(0, progress));
  job.updatedAt = new Date();
  
  if (status) {
    job.status = status;
    if (status === "running" && job.status === "pending") {
      job.startedAt = new Date();
    }
  }
}

export function completeAiJob(jobId: string, error?: string): void {
  const job = activeJobs.get(jobId);
  if (!job) return;
  
  job.status = error ? "failed" : "complete";
  job.progress = error ? job.progress : 100;
  job.completedAt = new Date();
  job.updatedAt = new Date();
  job.error = error;
  
  console.log(`[AI Job] ${error ? "Failed" : "Completed"}: ${jobId}`);
  
  // Keep completed jobs for 1 hour for status queries
  setTimeout(() => {
    activeJobs.delete(jobId);
  }, 3600000);
}

export function cancelAiJob(jobId: string): boolean {
  const job = activeJobs.get(jobId);
  if (!job) return false;
  
  if (job.status === "complete" || job.status === "failed") {
    return false;
  }
  
  job.status = "cancelled";
  job.updatedAt = new Date();
  console.log(`[AI Job] Cancelled: ${jobId}`);
  
  return true;
}

export function getAiJob(jobId: string): AiJobStatus | undefined {
  return activeJobs.get(jobId);
}

export function getActiveAiJobs(userId?: string): AiJobStatus[] {
  const jobs = Array.from(activeJobs.values());
  
  if (userId) {
    return jobs.filter(j => j.userId === userId);
  }
  
  return jobs;
}

export function getAiJobStats(): {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
} {
  const jobs = Array.from(activeJobs.values());
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    byType[job.type] = (byType[job.type] || 0) + 1;
  }
  
  return {
    total: jobs.length,
    byStatus,
    byType,
  };
}

/**
 * Resumable upload tracking
 * Tracks partial uploads for resumption after failures
 */
export interface UploadSession {
  sessionId: string;
  userId: string;
  caseId: string;
  fileName: string;
  totalBytes: number;
  uploadedBytes: number;
  chunks: number[];
  createdAt: Date;
  expiresAt: Date;
}

const uploadSessions = new Map<string, UploadSession>();

export function createUploadSession(
  sessionId: string,
  userId: string,
  caseId: string,
  fileName: string,
  totalBytes: number
): UploadSession {
  const session: UploadSession = {
    sessionId,
    userId,
    caseId,
    fileName,
    totalBytes,
    uploadedBytes: 0,
    chunks: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
  
  uploadSessions.set(sessionId, session);
  return session;
}

export function updateUploadProgress(
  sessionId: string,
  chunkIndex: number,
  chunkBytes: number
): UploadSession | undefined {
  const session = uploadSessions.get(sessionId);
  if (!session) return undefined;
  
  if (!session.chunks.includes(chunkIndex)) {
    session.chunks.push(chunkIndex);
    session.uploadedBytes += chunkBytes;
  }
  
  return session;
}

export function completeUploadSession(sessionId: string): boolean {
  return uploadSessions.delete(sessionId);
}

export function getUploadSession(sessionId: string): UploadSession | undefined {
  const session = uploadSessions.get(sessionId);
  
  // Check expiration
  if (session && session.expiresAt < new Date()) {
    uploadSessions.delete(sessionId);
    return undefined;
  }
  
  return session;
}

export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;
  
  const entries = Array.from(uploadSessions.entries());
  for (const [id, session] of entries) {
    if (session.expiresAt < now) {
      uploadSessions.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Safe upsert helper using ON CONFLICT
 */
export async function safeUpsert<T extends Record<string, unknown>>(
  tableName: string,
  data: T,
  conflictColumns: string[],
  updateColumns?: string[]
): Promise<void> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  
  const conflictClause = conflictColumns.join(", ");
  
  let updateClause = "";
  if (updateColumns && updateColumns.length > 0) {
    updateClause = updateColumns
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(", ");
  } else {
    // Update all non-conflict columns
    const updateCols = columns.filter(c => !conflictColumns.includes(c));
    updateClause = updateCols
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(", ");
  }
  
  const query = `
    INSERT INTO ${tableName} (${columns.join(", ")})
    VALUES (${placeholders})
    ON CONFLICT (${conflictClause})
    DO UPDATE SET ${updateClause}
  `;
  
  await db.execute(sql.raw(query));
}
