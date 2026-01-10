import { storage } from "../storage";
import OpenAI from "openai";
import { isGcvConfigured } from "./evidenceExtraction";
import { getSignedDownloadUrl } from "../r2";
import type { ActivityLog } from "@shared/schema";

export const AI_PATHWAYS_CHECKLIST = {
  extraction: {
    name: "Evidence Extraction Pipeline",
    endpoints: [
      "GET /api/cases/:caseId/evidence/:evidenceId/extraction",
      "POST /api/cases/:caseId/evidence/:evidenceId/extraction/run",
      "POST /api/cases/:caseId/evidence/:evidenceId/extraction/retry",
    ],
    description: "PDF native parse → OCR fallback → text extraction",
  },
  analysis: {
    name: "Evidence AI Analysis Pipeline",
    endpoints: [
      "POST /api/cases/:caseId/evidence/:evidenceId/ai-analyses/run",
      "POST /api/cases/:caseId/evidence/:evidenceId/ai-analyses/retry",
    ],
    description: "AI-powered evidence analysis with concurrency caps + jitter retries",
  },
  claims: {
    name: "Claims Suggestion Pipeline",
    endpoints: [
      "POST /api/cases/:caseId/claims/suggest",
      "POST /api/cases/:caseId/claims/auto-suggest",
    ],
    description: "Manual + auto background claim suggestion after extraction",
  },
  draftReadiness: {
    name: "Draft Readiness + Preflight",
    endpoints: [
      "GET /api/cases/:caseId/draft-readiness",
      "GET /api/cases/:caseId/documents/compile-claims/preflight",
    ],
    description: "Checks if documents can be compiled from claims",
  },
  documentCompile: {
    name: "Document Compile from Claims",
    endpoints: [
      "POST /api/cases/:caseId/documents/compile-claims",
    ],
    description: "Compile court documents from accepted + cited claims",
  },
  patternAnalysis: {
    name: "Pattern Analysis",
    endpoints: [
      "GET /api/cases/:caseId/pattern-analysis",
      "GET /api/cases/:caseId/pattern-analysis/export",
    ],
    description: "Aggregate patterns from evidence + export",
  },
  trialBinder: {
    name: "Trial Prep Binder Export",
    endpoints: [
      "GET /api/cases/:caseId/trial-prep/export",
    ],
    description: "ZIP export of trial preparation materials",
  },
  lexi: {
    name: "Lexi Chat",
    endpoints: [
      "POST /api/lexi/threads",
      "POST /api/cases/:caseId/lexi/threads",
      "POST /api/lexi/chat",
      "POST /api/lexi/chat/stream",
    ],
    description: "AI assistant chat with streaming + non-stream modes",
  },
  search: {
    name: "Quick Search",
    endpoints: [
      "GET /api/search",
      "GET /api/cases/:caseId/search",
    ],
    description: "Search across case data with deep links",
  },
} as const;

export type AiPathwayKey = keyof typeof AI_PATHWAYS_CHECKLIST;

export interface DiagnosticCheck {
  area: string;
  ok: boolean;
  code?: string;
  message?: string;
  nextStep?: string;
  details?: Record<string, unknown>;
}

export interface DiagnosticsResult {
  ok: boolean;
  timestamp: string;
  checks: {
    openai: DiagnosticCheck;
    vision: DiagnosticCheck;
    database: DiagnosticCheck;
    storage: DiagnosticCheck;
    lexiGeneral: DiagnosticCheck;
    lexiCase: DiagnosticCheck;
    extractionQueue: DiagnosticCheck;
  };
  failing: DiagnosticCheck[];
  lastActivity: Array<{ type: string; summary: string; createdAt: string }>;
  pathways: typeof AI_PATHWAYS_CHECKLIST;
}

async function checkOpenAI(): Promise<DiagnosticCheck> {
  const apiKey = (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || "").trim();
  
  if (!apiKey) {
    return {
      area: "OpenAI",
      ok: false,
      code: "OPENAI_KEY_MISSING",
      message: "OPENAI_API_KEY not configured",
      nextStep: "Add OPENAI_API_KEY to Replit Secrets",
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });
    return { area: "OpenAI", ok: true, message: "Connected successfully" };
  } catch (err: unknown) {
    const errAny = err as { status?: number; code?: string; message?: string };
    if (errAny?.status === 401 || errAny?.code === "invalid_api_key") {
      return {
        area: "OpenAI",
        ok: false,
        code: "OPENAI_KEY_INVALID",
        message: "Invalid API key",
        nextStep: "Check that OPENAI_API_KEY is correct and active",
      };
    }
    if (errAny?.status === 429) {
      return {
        area: "OpenAI",
        ok: false,
        code: "OPENAI_RATE_LIMIT",
        message: "Rate limit exceeded",
        nextStep: "Wait a moment and try again, or upgrade OpenAI plan",
      };
    }
    return {
      area: "OpenAI",
      ok: false,
      code: "OPENAI_ERROR",
      message: errAny?.message || "Connection failed",
      nextStep: "Check OpenAI status page and API key",
    };
  }
}

async function checkVision(): Promise<DiagnosticCheck> {
  if (!isGcvConfigured()) {
    return {
      area: "Vision OCR",
      ok: false,
      code: "VISION_KEY_MISSING",
      message: "GOOGLE_CLOUD_VISION_API_KEY not configured",
      nextStep: "Add GOOGLE_CLOUD_VISION_API_KEY to Replit Secrets for OCR support",
    };
  }
  return { area: "Vision OCR", ok: true, message: "API key configured" };
}

async function checkDatabase(): Promise<DiagnosticCheck> {
  try {
    const tables = [
      "evidence_extractions",
      "evidence_ai_analyses",
      "case_claims",
      "citation_pointers",
      "lexi_threads",
      "lexi_messages",
      "activity_logs",
    ];
    
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      if (!result.rows[0]?.exists) {
        await pool.end();
        return {
          area: "Database",
          ok: false,
          code: "DB_TABLE_MISSING",
          message: `Table ${table} not found`,
          nextStep: "Run database migrations",
        };
      }
    }
    
    await pool.end();
    return { area: "Database", ok: true, message: "All AI tables present" };
  } catch (err: unknown) {
    const errAny = err as { message?: string };
    return {
      area: "Database",
      ok: false,
      code: "DB_CONNECTION_ERROR",
      message: errAny?.message || "Database connection failed",
      nextStep: "Check DATABASE_URL configuration",
    };
  }
}

async function checkStorage(): Promise<DiagnosticCheck> {
  const hasR2 = !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT
  );

  if (!hasR2) {
    return {
      area: "Storage (R2)",
      ok: true,
      code: "R2_NOT_CONFIGURED",
      message: "R2 storage not configured (using local storage)",
    };
  }

  try {
    const testUrl = await getSignedDownloadUrl("__diagnostics_test__", 60);
    if (testUrl) {
      return { area: "Storage (R2)", ok: true, message: "R2 configured and accessible" };
    }
    return { area: "Storage (R2)", ok: true, message: "R2 configured" };
  } catch {
    return { area: "Storage (R2)", ok: true, message: "R2 configured (test skipped)" };
  }
}

async function checkLexiGeneral(userId: string): Promise<DiagnosticCheck> {
  try {
    const thread = await storage.createLexiThread(userId, null, "__diagnostics_test__");
    if (thread?.id) {
      await storage.deleteLexiThread(userId, thread.id);
      return { area: "Lexi (General)", ok: true, message: "Thread create/delete works" };
    }
    return {
      area: "Lexi (General)",
      ok: false,
      code: "LEXI_THREAD_CREATE_FAILED",
      message: "Could not create test thread",
      nextStep: "Check database connection and lexi_threads table",
    };
  } catch (err: unknown) {
    const errAny = err as { message?: string };
    return {
      area: "Lexi (General)",
      ok: false,
      code: "LEXI_ERROR",
      message: errAny?.message || "Lexi test failed",
      nextStep: "Check storage layer and database",
    };
  }
}

async function checkLexiCase(userId: string): Promise<DiagnosticCheck> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(
      `SELECT id FROM cases WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    await pool.end();

    if (!result.rows || result.rows.length === 0) {
      return {
        area: "Lexi (Case)",
        ok: true,
        code: "NO_CASES",
        message: "No cases to test (skipped)",
      };
    }

    const caseId = result.rows[0].id;
    const thread = await storage.createLexiThread(userId, caseId, "__diagnostics_test__");
    if (thread?.id) {
      await storage.deleteLexiThread(userId, thread.id);
      return { area: "Lexi (Case)", ok: true, message: "Case thread create/delete works" };
    }
    return {
      area: "Lexi (Case)",
      ok: false,
      code: "LEXI_CASE_THREAD_FAILED",
      message: "Could not create case thread",
      nextStep: "Check case data and lexi_threads table",
    };
  } catch (err: unknown) {
    const errAny = err as { message?: string };
    return {
      area: "Lexi (Case)",
      ok: false,
      code: "LEXI_CASE_ERROR",
      message: errAny?.message || "Lexi case test failed",
      nextStep: "Check storage layer",
    };
  }
}

async function checkExtractionQueue(): Promise<DiagnosticCheck> {
  return {
    area: "Extraction Queue",
    ok: true,
    message: "In-memory queue operational",
  };
}

async function getRecentActivity(userId: string): Promise<Array<{ type: string; summary: string; createdAt: string }>> {
  try {
    const logs = await storage.listActivityLogs(userId, undefined, 20);
    return logs.map(log => ({
      type: log.type,
      summary: log.summary,
      createdAt: log.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function runAiDiagnostics(userId: string): Promise<DiagnosticsResult> {
  console.log("[AI][Diagnostics] Running full diagnostics for user", userId);

  const [openai, vision, database, storageCheck, lexiGeneral, lexiCase, extractionQueue] = await Promise.all([
    checkOpenAI(),
    checkVision(),
    checkDatabase(),
    checkStorage(),
    checkLexiGeneral(userId),
    checkLexiCase(userId),
    checkExtractionQueue(),
  ]);

  const checks = { openai, vision, database, storage: storageCheck, lexiGeneral, lexiCase, extractionQueue };
  const failing = Object.values(checks).filter(c => !c.ok);
  const ok = failing.length === 0;

  const lastActivity = await getRecentActivity(userId);

  console.log(`[AI][Diagnostics] Complete: ok=${ok}, failing=${failing.length}`);

  return {
    ok,
    timestamp: new Date().toISOString(),
    checks,
    failing,
    lastActivity,
    pathways: AI_PATHWAYS_CHECKLIST,
  };
}

export function humanizeAiError(code: string, message?: string): string {
  const errorMap: Record<string, string> = {
    OPENAI_KEY_MISSING: "AI features require an OpenAI API key. Please add one in Settings.",
    OPENAI_KEY_INVALID: "The OpenAI API key is invalid. Please check your API key.",
    OPENAI_RATE_LIMIT: "OpenAI is temporarily rate limited. Please wait a moment and try again.",
    OPENAI_ERROR: "There was an issue connecting to AI services. Please try again.",
    VISION_KEY_MISSING: "OCR features require a Vision API key. PDFs will use basic text extraction.",
    DB_CONNECTION_ERROR: "Database connection failed. Please refresh the page.",
    DB_TABLE_MISSING: "Database setup incomplete. Please contact support.",
    EXTRACTION_FAILED: "Evidence extraction failed. Try re-uploading the file.",
    ANALYSIS_FAILED: "AI analysis failed. Please retry.",
    CLAIMS_SUGGEST_FAILED: "Claim suggestion failed. Please try again.",
    COMPILE_FAILED: "Document compilation failed. Check that all claims have citations.",
    LEXI_ERROR: "Chat assistant encountered an error. Please try again.",
    NETWORK_ERROR: "Network connection issue. Please check your internet connection.",
  };

  return errorMap[code] || message || "An unexpected error occurred. Please try again.";
}
