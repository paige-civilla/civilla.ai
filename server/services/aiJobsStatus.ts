import { storage } from "../storage";

export interface RecentFailure {
  id: string;
  evidenceId: string;
  evidenceName: string;
  error: string;
  updatedAt: string;
}

export interface ExtractionStatus {
  total: number;
  queued: number;
  processing: number;
  complete: number;
  failed: number;
  recentFailures: RecentFailure[];
}

export interface AnalysisStatus {
  total: number;
  pending: number;
  complete: number;
  failed: number;
  recentFailures: RecentFailure[];
}

export interface ClaimsStatus {
  suggestedTotal: number;
  pending: boolean;
  lastRunAt: string | null;
  lastError: string | null;
}

export interface AiJobsStatusResponse {
  ok: boolean;
  caseId: string;
  extraction: ExtractionStatus;
  analyses: AnalysisStatus;
  claims: ClaimsStatus;
  updatedAt: string;
}

export function humanizeError(error: string | null | undefined): string {
  if (!error) return "Unknown error";
  
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes("invalid_api_key") || errorLower.includes("401") || errorLower.includes("incorrect api key")) {
    return "OpenAI key invalid or missing.";
  }
  if (errorLower.includes("rate_limit") || errorLower.includes("429") || errorLower.includes("rate limit")) {
    return "Rate-limited. Try again in a minute.";
  }
  if (errorLower.includes("vision") && (errorLower.includes("403") || errorLower.includes("401"))) {
    return "OCR not configured or not authorized.";
  }
  if (errorLower.includes("vision") && errorLower.includes("not configured")) {
    return "OCR not configured or not authorized.";
  }
  if (errorLower.includes("timeout") || errorLower.includes("timed out")) {
    return "Request timed out. Try again.";
  }
  if (errorLower.includes("network") || errorLower.includes("econnrefused") || errorLower.includes("fetch failed")) {
    return "Network error. Check connection.";
  }
  
  const sanitized = error.replace(/sk-[a-zA-Z0-9]+/g, "[REDACTED]");
  return sanitized.slice(0, 120) + (sanitized.length > 120 ? "..." : "");
}

export async function getAiJobsStatus(userId: string, caseId: string): Promise<AiJobsStatusResponse> {
  const [extractionCounts, analysisCounts, recentFailedExtractions, recentFailedAnalyses, claimsLogs] = await Promise.all([
    storage.countExtractionsByStatus(userId, caseId),
    storage.countAnalysesByStatus(userId, caseId),
    storage.getRecentFailedExtractions(userId, caseId, 5),
    storage.getRecentFailedAnalyses(userId, caseId, 5),
    storage.getRecentClaimsActivityLogs(userId, caseId, 10),
  ]);

  const extractionFailures: RecentFailure[] = recentFailedExtractions.map(e => ({
    id: e.id,
    evidenceId: e.evidenceId,
    evidenceName: e.evidenceName || "Unknown file",
    error: humanizeError(e.error),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const analysisFailures: RecentFailure[] = recentFailedAnalyses.map(a => ({
    id: a.id,
    evidenceId: a.evidenceId,
    evidenceName: a.evidenceName || "Unknown file",
    error: humanizeError(a.error),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const claimsSuggestingLog = claimsLogs.find(l => l.type === "claims_suggesting");
  const claimsSuggestedLog = claimsLogs.find(l => l.type === "claims_suggested");
  const claimsFailedLog = claimsLogs.find(l => l.type === "claims_suggest_failed");

  const isPending = !!claimsSuggestingLog && (!claimsSuggestedLog || new Date(claimsSuggestingLog.createdAt) > new Date(claimsSuggestedLog.createdAt));
  const lastRunAt = claimsSuggestedLog ? claimsSuggestedLog.createdAt.toISOString() : null;
  const lastError = claimsFailedLog ? humanizeError((claimsFailedLog.metadataJson as any)?.error || null) : null;

  const suggestedClaims = await storage.countSuggestedClaims(userId, caseId);

  return {
    ok: true,
    caseId,
    extraction: {
      total: extractionCounts.total,
      queued: extractionCounts.queued,
      processing: extractionCounts.processing,
      complete: extractionCounts.complete,
      failed: extractionCounts.failed,
      recentFailures: extractionFailures,
    },
    analyses: {
      total: analysisCounts.total,
      pending: analysisCounts.queued + analysisCounts.processing,
      complete: analysisCounts.complete,
      failed: analysisCounts.failed,
      recentFailures: analysisFailures,
    },
    claims: {
      suggestedTotal: suggestedClaims,
      pending: isPending,
      lastRunAt,
      lastError,
    },
    updatedAt: new Date().toISOString(),
  };
}
