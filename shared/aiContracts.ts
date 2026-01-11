import { z } from "zod";

export const extractionStatusValues = ["pending", "processing", "completed", "failed", "skipped"] as const;
export type ExtractionStatus = typeof extractionStatusValues[number];

export const analysisStatusValues = ["pending", "processing", "completed", "failed", "skipped"] as const;
export type AnalysisStatus = typeof analysisStatusValues[number];

export const claimStatusValues = ["draft", "suggested", "approved", "rejected", "archived"] as const;
export type ClaimStatus = typeof claimStatusValues[number];

export const AiHealthResponseSchema = z.object({
  ok: z.boolean(),
  openai: z.object({
    configured: z.boolean(),
    status: z.enum(["ok", "error", "rate_limited", "unconfigured"]),
    detail: z.string().optional(),
  }),
  vision: z.object({
    configured: z.boolean(),
    status: z.enum(["ok", "error", "unconfigured"]),
    detail: z.string().optional(),
  }).optional(),
});
export type AiHealthResponse = z.infer<typeof AiHealthResponseSchema>;

export const EvidenceExtractionSchema = z.object({
  id: z.string(),
  evidenceFileId: z.string(),
  status: z.enum(extractionStatusValues),
  extractedText: z.string().nullable(),
  metadata: z.any().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});
export type EvidenceExtraction = z.infer<typeof EvidenceExtractionSchema>;

export const EvidenceAiAnalysisSchema = z.object({
  id: z.string(),
  evidenceFileId: z.string(),
  status: z.enum(analysisStatusValues),
  analysisType: z.string(),
  result: z.any().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});
export type EvidenceAiAnalysis = z.infer<typeof EvidenceAiAnalysisSchema>;

export const DraftReadinessSchema = z.object({
  ready: z.boolean(),
  blockers: z.array(z.object({
    type: z.string(),
    message: z.string(),
    actionable: z.boolean().optional(),
  })),
  score: z.number().min(0).max(100).optional(),
});
export type DraftReadiness = z.infer<typeof DraftReadinessSchema>;

export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  snippet: z.string().optional(),
  relevance: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const LexiMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  createdAt: z.coerce.date(),
  metadata: z.any().nullable(),
});
export type LexiMessage = z.infer<typeof LexiMessageSchema>;

export const SmokeCheckResultSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  detail: z.string().optional(),
  blocking: z.boolean().optional(),
});

export const SmokeCheckReportSchema = z.object({
  ok: z.boolean(),
  checks: z.array(SmokeCheckResultSchema),
  timestamp: z.string(),
});
export type SmokeCheckReport = z.infer<typeof SmokeCheckReportSchema>;

export const DiagnosticsResponseSchema = z.object({
  recentFailures: z.array(z.object({
    type: z.string(),
    createdAt: z.coerce.date(),
    normalizedError: z.string(),
    requestId: z.string().nullable(),
    moduleKey: z.string().nullable(),
  })),
  counts: z.object({
    extractions: z.record(z.number()),
    analyses: z.record(z.number()),
  }),
  lastChecks: z.object({
    openai: z.string().nullable(),
    vision: z.string().nullable(),
  }),
  deployment: z.object({
    nodeEnv: z.string(),
    uptimeSeconds: z.number(),
    commitHash: z.string().nullable(),
  }),
});
export type DiagnosticsResponse = z.infer<typeof DiagnosticsResponseSchema>;
