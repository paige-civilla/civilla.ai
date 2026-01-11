import { storage } from "../storage";
import OpenAI from "openai";

export interface SmokeCheckResult {
  name: string;
  ok: boolean;
  detail?: string;
  blocking?: boolean;
}

export interface SmokeCheckReport {
  ok: boolean;
  checks: SmokeCheckResult[];
  timestamp: string;
}

const REQUIRED_COLUMNS = [
  { table: "lexi_threads", column: "disclaimer_shown" },
  { table: "evidence_extractions", column: "status" },
  { table: "evidence_ai_analyses", column: "status" },
  { table: "case_rule_terms", column: "module_key" },
  { table: "activity_logs", column: "module_key" },
  { table: "evidence_files", column: "storage_key" },
];

async function checkDbSchema(): Promise<SmokeCheckResult> {
  try {
    const { db } = await import("../db");
    const { sql } = await import("drizzle-orm");
    
    const missing: string[] = [];
    
    for (const { table, column } of REQUIRED_COLUMNS) {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = ${table} AND column_name = ${column}
      `);
      if (!result.rows || result.rows.length === 0) {
        missing.push(`${table}.${column}`);
      }
    }
    
    if (missing.length > 0) {
      return {
        name: "db_schema",
        ok: false,
        detail: `Missing columns: ${missing.join(", ")}`,
        blocking: true,
      };
    }
    
    return { name: "db_schema", ok: true, detail: "All required columns present" };
  } catch (err: any) {
    return {
      name: "db_schema",
      ok: false,
      detail: `DB check failed: ${err.message}`,
      blocking: true,
    };
  }
}

async function checkOpenAI(): Promise<SmokeCheckResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      name: "openai",
      ok: false,
      detail: "OPENAI_KEY_MISSING",
      blocking: true,
    };
  }
  
  try {
    const openai = new OpenAI({ apiKey, timeout: 10000 });
    await openai.models.list();
    
    return { name: "openai", ok: true, detail: "OpenAI connectivity verified" };
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const code = err?.code || err?.error?.code;
    
    if (status === 401 || code === "invalid_api_key") {
      return { name: "openai", ok: false, detail: "OPENAI_KEY_INVALID", blocking: true };
    }
    if (status === 429) {
      return { name: "openai", ok: false, detail: "OPENAI_RATE_LIMIT", blocking: false };
    }
    
    return { name: "openai", ok: false, detail: `OPENAI_ERROR: ${err.message}`, blocking: true };
  }
}

async function checkVision(): Promise<SmokeCheckResult> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    return {
      name: "vision",
      ok: false,
      detail: "VISION_KEY_MISSING (OCR disabled)",
      blocking: false,
    };
  }
  
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [] }),
      }
    );
    
    if (response.status === 401 || response.status === 403) {
      return { name: "vision", ok: false, detail: "VISION_KEY_INVALID", blocking: false };
    }
    
    return { name: "vision", ok: true, detail: "Vision API connectivity verified" };
  } catch (err: any) {
    return { name: "vision", ok: false, detail: `VISION_ERROR: ${err.message}`, blocking: false };
  }
}

async function checkLexiThreadCreate(userId: string): Promise<SmokeCheckResult> {
  try {
    const testThread = await storage.createLexiThread(
      userId,
      null,
      "[SMOKE_TEST] Auto-cleanup"
    );
    
    if (testThread?.id) {
      await storage.deleteLexiThread(userId, testThread.id);
      return { name: "lexi_thread", ok: true, detail: "Thread create/delete verified" };
    }
    
    return { name: "lexi_thread", ok: false, detail: "Thread creation returned null", blocking: true };
  } catch (err: any) {
    return {
      name: "lexi_thread",
      ok: false,
      detail: `Thread create failed: ${err.message}`,
      blocking: true,
    };
  }
}

async function checkCaseCreateDryRun(userId: string): Promise<SmokeCheckResult> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { name: "case_create", ok: false, detail: "User not found", blocking: true };
    }
    
    const { db } = await import("../db");
    const { sql } = await import("drizzle-orm");
    
    const columnsResult = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cases' AND column_name IN ('id', 'user_id', 'title', 'state', 'type')
    `);
    
    if (!columnsResult.rows || columnsResult.rows.length < 5) {
      return { name: "case_create", ok: false, detail: "Missing required case columns", blocking: true };
    }
    
    return { name: "case_create", ok: true, detail: "Case create dependencies verified" };
  } catch (err: any) {
    return {
      name: "case_create",
      ok: false,
      detail: `Case validation failed: ${err.message}`,
      blocking: true,
    };
  }
}

async function checkR2Storage(): Promise<SmokeCheckResult> {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  
  if (!endpoint || !accessKey || !secretKey || !bucket) {
    return {
      name: "r2_storage",
      ok: false,
      detail: "R2 not fully configured (evidence uploads disabled)",
      blocking: false,
    };
  }
  
  return { name: "r2_storage", ok: true, detail: "R2 credentials present" };
}

export async function runSmokeChecks(userId: string, caseId?: string): Promise<SmokeCheckReport> {
  const checks: SmokeCheckResult[] = [];
  
  checks.push(await checkDbSchema());
  checks.push(await checkOpenAI());
  checks.push(await checkVision());
  checks.push(await checkR2Storage());
  
  if (userId) {
    checks.push(await checkLexiThreadCreate(userId));
    checks.push(await checkCaseCreateDryRun(userId));
  }
  
  const blockingFailures = checks.filter(c => !c.ok && c.blocking);
  const ok = blockingFailures.length === 0;
  
  return {
    ok,
    checks,
    timestamp: new Date().toISOString(),
  };
}

export async function runPredeployChecks(): Promise<{ ok: boolean; reason?: string }> {
  const checks: SmokeCheckResult[] = [];
  
  checks.push(await checkDbSchema());
  checks.push(await checkOpenAI());
  
  const blockingFailures = checks.filter(c => !c.ok && c.blocking);
  
  if (blockingFailures.length > 0) {
    return {
      ok: false,
      reason: blockingFailures.map(c => `${c.name}: ${c.detail}`).join("; "),
    };
  }
  
  return { ok: true };
}
