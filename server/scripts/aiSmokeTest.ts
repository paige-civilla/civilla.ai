import { storage } from "../storage";
import OpenAI from "openai";
import { isGcvConfigured } from "../services/evidenceExtraction";
import { AI_PATHWAYS_CHECKLIST } from "../services/aiDiagnostics";

interface SmokeTestResult {
  area: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: SmokeTestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function logResult(area: string, passed: boolean, message: string, duration?: number) {
  results.push({ area, passed, message, duration });
  const emoji = passed ? "✅" : "❌";
  const durStr = duration ? ` (${duration}ms)` : "";
  log(emoji, `${area}: ${message}${durStr}`);
}

async function testOpenAIConnection(): Promise<boolean> {
  const start = Date.now();
  const apiKey = (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || "").trim();
  
  if (!apiKey) {
    logResult("OpenAI", false, "OPENAI_API_KEY not configured");
    return false;
  }

  try {
    const client = new OpenAI({ apiKey });
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });
    logResult("OpenAI", true, "Connected successfully", Date.now() - start);
    return true;
  } catch (err: any) {
    logResult("OpenAI", false, err?.message || "Connection failed", Date.now() - start);
    return false;
  }
}

async function testVisionOCR(): Promise<boolean> {
  const configured = isGcvConfigured();
  if (configured) {
    logResult("Vision OCR", true, "API key configured");
    return true;
  } else {
    logResult("Vision OCR", false, "GOOGLE_CLOUD_VISION_API_KEY not configured (OCR disabled)");
    return false;
  }
}

async function testDatabaseTables(): Promise<boolean> {
  const start = Date.now();
  const requiredTables = [
    "evidence_extractions",
    "evidence_ai_analyses", 
    "case_claims",
    "citation_pointers",
    "lexi_threads",
    "lexi_messages",
    "activity_logs",
  ];

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    for (const table of requiredTables) {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      if (!result.rows[0]?.exists) {
        await pool.end();
        logResult("Database", false, `Table ${table} missing`, Date.now() - start);
        return false;
      }
    }
    
    await pool.end();
    logResult("Database", true, `All ${requiredTables.length} AI tables present`, Date.now() - start);
    return true;
  } catch (err: any) {
    logResult("Database", false, err?.message || "Connection failed", Date.now() - start);
    return false;
  }
}

async function findTestUser(): Promise<string | null> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(`SELECT id FROM users ORDER BY created_at DESC LIMIT 1`);
    await pool.end();
    return result.rows[0]?.id || null;
  } catch {
    return null;
  }
}

async function findTestCase(userId: string): Promise<string | null> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(
      `SELECT id FROM cases WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    await pool.end();
    return result.rows[0]?.id || null;
  } catch {
    return null;
  }
}

async function findExtractedEvidence(userId: string, caseId: string): Promise<{ id: string; text: string } | null> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(
      `SELECT ee.evidence_file_id, SUBSTRING(ee.extracted_text, 1, 500) as text_preview
       FROM evidence_extractions ee
       JOIN evidence_files ef ON ef.id = ee.evidence_file_id
       WHERE ef.case_id = $1 AND ef.user_id = $2 AND ee.status = 'complete'
       ORDER BY ee.updated_at DESC LIMIT 1`,
      [caseId, userId]
    );
    await pool.end();
    
    if (result.rows[0]) {
      return { id: result.rows[0].evidence_file_id, text: result.rows[0].text_preview || "" };
    }
    return null;
  } catch {
    return null;
  }
}

async function testLexiThreadCreation(userId: string): Promise<boolean> {
  const start = Date.now();
  try {
    const thread = await storage.createLexiThread(userId, null, "__smoke_test__");
    if (thread?.id) {
      await storage.deleteLexiThread(userId, thread.id);
      logResult("Lexi Thread", true, "Create/delete works", Date.now() - start);
      return true;
    }
    logResult("Lexi Thread", false, "Thread creation returned null", Date.now() - start);
    return false;
  } catch (err: any) {
    logResult("Lexi Thread", false, err?.message || "Failed", Date.now() - start);
    return false;
  }
}

async function testDraftReadiness(userId: string, caseId: string): Promise<boolean> {
  const start = Date.now();
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const evidenceResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE extraction_status = 'completed') as extracted 
       FROM evidence_files WHERE case_id = $1 AND user_id = $2`,
      [caseId, userId]
    );
    
    const claimsResult = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'accepted') as accepted
       FROM case_claims WHERE case_id = $1 AND user_id = $2`,
      [caseId, userId]
    );
    
    await pool.end();
    
    const stats = {
      evidence: { total: parseInt(evidenceResult.rows[0].total), extracted: parseInt(evidenceResult.rows[0].extracted) },
      claims: { total: parseInt(claimsResult.rows[0].total), accepted: parseInt(claimsResult.rows[0].accepted) },
    };
    
    logResult("Draft Readiness", true, `Evidence: ${stats.evidence.extracted}/${stats.evidence.total}, Claims: ${stats.claims.accepted}/${stats.claims.total}`, Date.now() - start);
    return true;
  } catch (err: any) {
    logResult("Draft Readiness", false, err?.message || "Failed", Date.now() - start);
    return false;
  }
}

async function runSmokeTest() {
  console.log("\n" + "═".repeat(60));
  console.log("🧪 AI SMOKE TEST - Civilla.ai");
  console.log("═".repeat(60) + "\n");

  if (process.env.NODE_ENV === "production") {
    console.log("❌ Smoke test disabled in production environment");
    process.exit(1);
  }

  console.log("📋 AI Pathways Inventory:");
  Object.entries(AI_PATHWAYS_CHECKLIST).forEach(([key, value]) => {
    console.log(`   • ${value.name}: ${value.endpoints.length} endpoints`);
  });
  console.log("");

  console.log("🔍 Running Connectivity Checks...\n");
  
  const openaiOk = await testOpenAIConnection();
  const visionOk = await testVisionOCR();
  const dbOk = await testDatabaseTables();

  console.log("\n🔍 Running Functional Tests...\n");

  const testUserId = await findTestUser();
  if (!testUserId) {
    log("⚠️", "No test user found - skipping user-specific tests");
  } else {
    log("👤", `Using test user: ${testUserId.slice(0, 8)}...`);
    
    const lexiOk = await testLexiThreadCreation(testUserId);
    
    const testCaseId = await findTestCase(testUserId);
    if (!testCaseId) {
      log("⚠️", "No test case found - skipping case-specific tests");
    } else {
      log("📁", `Using test case: ${testCaseId.slice(0, 8)}...`);
      
      await testDraftReadiness(testUserId, testCaseId);
      
      const evidence = await findExtractedEvidence(testUserId, testCaseId);
      if (evidence) {
        logResult("Evidence Extraction", true, `Found extracted evidence: ${evidence.id.slice(0, 8)}...`);
      } else {
        log("⚠️", "No extracted evidence found - upload and process evidence first");
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("📊 SMOKE TEST RESULTS");
  console.log("═".repeat(60) + "\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Failed: ${failed}/${total}`);
  console.log("");

  if (failed > 0) {
    console.log("❌ Failed Checks:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.area}: ${r.message}`);
    });
    console.log("");
  }

  const overallOk = failed === 0 && openaiOk && dbOk;
  console.log(overallOk ? "✅ SMOKE TEST PASSED" : "❌ SMOKE TEST FAILED");
  console.log("");

  console.log("🔐 Privacy: No user content was logged during this test");
  console.log("");

  process.exit(overallOk ? 0 : 1);
}

runSmokeTest().catch(err => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
