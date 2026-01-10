import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function cleanConnectionString(str: string | undefined): string | undefined {
  if (!str) return undefined;
  const match = str.match(/postgresql:\/\/.+/);
  return match ? match[0].trim() : str.trim();
}

const rawConnectionString = process.env.DATABASE_URL;
const connectionString = cleanConnectionString(rawConnectionString);

if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is required");
  throw new Error("DATABASE_URL environment variable is required");
}

function parseDbHost(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return url.hostname || "unknown";
  } catch {
    return "unparseable";
  }
}

const dbHost = parseDbHost(connectionString);
console.log(`DB env var used: DATABASE_URL`);
console.log(`DB host: ${dbHost}`);

const knownInternalHosts = ["helium", "localhost", "127.0.0.1"];
if (knownInternalHosts.some(h => dbHost.includes(h)) && process.env.NODE_ENV === "production") {
  console.warn(`WARNING: DATABASE_URL points to internal host '${dbHost}'; deployment needs externally reachable Postgres`);
}

export const pool = new Pool({
  connectionString: connectionString,
});

export const db = drizzle(pool, { schema });

export async function testDbConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await pool.query("SELECT 1 as test");
    if (result.rows[0]?.test === 1) {
      return { ok: true };
    }
    return { ok: false, error: "Unexpected query result" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const sanitized = message.replace(/password=\S+/gi, "password=***");
    return { ok: false, error: sanitized };
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    ) as exists
  `, [tableName]);
  return result.rows[0]?.exists ?? false;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2
  `, [tableName, columnName]);
  return result.rows.length > 0;
}

async function addColumnIfMissing(tableName: string, columnName: string, sqlTypeAndConstraints: string): Promise<boolean> {
  try {
    if (await columnExists(tableName, columnName)) {
      return false;
    }
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlTypeAndConstraints}`);
    console.log(`[DB MIGRATION] Added column ${tableName}.${columnName}`);
    return true;
  } catch (err) {
    console.log(`[DB MIGRATION] ${tableName}.${columnName} skipped:`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function addIndexIfMissing(indexName: string, createIndexSql: string): Promise<boolean> {
  try {
    await pool.query(createIndexSql);
    return true;
  } catch (err) {
    return false;
  }
}

async function ensureCasesColumns(): Promise<void> {
  await addColumnIfMissing("cases", "nickname", "TEXT");
  await addColumnIfMissing("cases", "case_number", "TEXT");
  await addColumnIfMissing("cases", "starting_point", "TEXT NOT NULL DEFAULT 'not_sure'");
  await addColumnIfMissing("cases", "has_children", "BOOLEAN NOT NULL DEFAULT false");
}

async function ensureExhibitListColumns(): Promise<void> {
  await addColumnIfMissing("exhibit_lists", "is_used_for_filing", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("exhibit_lists", "filing_label", "TEXT");
  await addColumnIfMissing("exhibit_lists", "cover_page_enabled", "BOOLEAN NOT NULL DEFAULT true");
  await addColumnIfMissing("exhibit_lists", "cover_page_title", "TEXT");
  await addColumnIfMissing("exhibit_lists", "cover_page_subtitle", "TEXT");
  await addColumnIfMissing("exhibit_lists", "notes", "TEXT");
  await addColumnIfMissing("exhibit_lists", "used_for_filing", "TEXT");
  await addColumnIfMissing("exhibit_lists", "used_for_filing_date", "TIMESTAMP");
  await addColumnIfMissing("exhibit_lists", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
}

async function ensureEvidenceAiAnalysesColumns(): Promise<void> {
  await addColumnIfMissing("evidence_ai_analyses", "status", "TEXT NOT NULL DEFAULT 'complete'");
  await addColumnIfMissing("evidence_ai_analyses", "model", "TEXT");
  await addColumnIfMissing("evidence_ai_analyses", "summary", "TEXT");
  await addColumnIfMissing("evidence_ai_analyses", "findings", "JSONB");
  await addColumnIfMissing("evidence_ai_analyses", "error", "TEXT");
  await addColumnIfMissing("evidence_ai_analyses", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
}

async function ensureTimelineCategoryColumns(): Promise<void> {
  await addColumnIfMissing("timeline_categories", "case_id", "VARCHAR(255)");
  await addColumnIfMissing("timeline_categories", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
  await addIndexIfMissing("timeline_categories_case_idx", 
    "CREATE INDEX IF NOT EXISTS timeline_categories_case_idx ON timeline_categories(case_id)");
}

async function ensureEvidenceExtractionsColumns(): Promise<void> {
  await addColumnIfMissing("evidence_extractions", "status", "TEXT NOT NULL DEFAULT 'queued'");
  await addColumnIfMissing("evidence_extractions", "provider", "TEXT NOT NULL DEFAULT 'internal'");
  await addColumnIfMissing("evidence_extractions", "mime_type", "TEXT");
  await addColumnIfMissing("evidence_extractions", "page_count", "INTEGER");
  await addColumnIfMissing("evidence_extractions", "error", "TEXT");
  await addColumnIfMissing("evidence_extractions", "queued_at", "TIMESTAMP");
  await addColumnIfMissing("evidence_extractions", "started_at", "TIMESTAMP");
  await addColumnIfMissing("evidence_extractions", "completed_at", "TIMESTAMP");
}

async function ensureEvidenceNotesColumns(): Promise<void> {
  await addColumnIfMissing("evidence_notes", "is_resolved", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("evidence_notes", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
}

async function ensureExhibitSnippetsColumns(): Promise<void> {
  await addColumnIfMissing("exhibit_snippets", "note_id", "VARCHAR(255)");
  await addColumnIfMissing("exhibit_snippets", "timestamp_hint", "TEXT");
  await addColumnIfMissing("exhibit_snippets", "sort_order", "INTEGER NOT NULL DEFAULT 0");
}

async function ensureTrialPrepShortlistColumns(): Promise<void> {
  await addColumnIfMissing("trial_prep_shortlist", "color", "TEXT");
  await addColumnIfMissing("trial_prep_shortlist", "is_pinned", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("trial_prep_shortlist", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
}

async function ensureUserProfileColumns(): Promise<void> {
  await addColumnIfMissing("user_profiles", "auto_fill_choice_made", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("user_profiles", "default_role", "TEXT NOT NULL DEFAULT 'self_represented'");
  await addColumnIfMissing("user_profiles", "bar_number", "TEXT");
  await addColumnIfMissing("user_profiles", "firm_name", "TEXT");
  await addColumnIfMissing("user_profiles", "petitioner_name", "TEXT");
  await addColumnIfMissing("user_profiles", "respondent_name", "TEXT");
  await addColumnIfMissing("user_profiles", "onboarding_completed", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("user_profiles", "onboarding_completed_at", "TIMESTAMP");
  await addColumnIfMissing("user_profiles", "tos_accepted_at", "TIMESTAMP");
  await addColumnIfMissing("user_profiles", "privacy_accepted_at", "TIMESTAMP");
  await addColumnIfMissing("user_profiles", "disclaimers_accepted_at", "TIMESTAMP");
  await addColumnIfMissing("user_profiles", "tos_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfMissing("user_profiles", "privacy_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfMissing("user_profiles", "disclaimers_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfMissing("user_profiles", "calendar_task_color", "TEXT NOT NULL DEFAULT '#2E7D32'");
  await addColumnIfMissing("user_profiles", "calendar_deadline_color", "TEXT NOT NULL DEFAULT '#C62828'");
  await addColumnIfMissing("user_profiles", "calendar_timeline_color", "TEXT NOT NULL DEFAULT '#1565C0'");
  await addColumnIfMissing("user_profiles", "onboarding_deferred", "JSONB NOT NULL DEFAULT '{}'");
  await addColumnIfMissing("user_profiles", "onboarding_status", "TEXT NOT NULL DEFAULT 'incomplete'");
  await addColumnIfMissing("user_profiles", "start_here_seen", "BOOLEAN NOT NULL DEFAULT false");
}

async function ensureEvidenceFilesColumns(): Promise<void> {
  await addColumnIfMissing("evidence_files", "category", "TEXT");
  await addColumnIfMissing("evidence_files", "description", "TEXT");
  await addColumnIfMissing("evidence_files", "tags", "TEXT");
}

async function ensureTimelineEventsColumns(): Promise<void> {
  await addColumnIfMissing("timeline_events", "category_id", "VARCHAR(255)");
  await addIndexIfMissing("idx_timeline_events_category", 
    "CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(category_id)");
}

async function ensureCaseEvidenceNotesColumns(): Promise<void> {
  await addColumnIfMissing("case_evidence_notes", "timestamp_seconds", "INTEGER");
  await addColumnIfMissing("case_evidence_notes", "is_key", "BOOLEAN NOT NULL DEFAULT false");
}

async function ensureExhibitEvidenceColumns(): Promise<void> {
  await addColumnIfMissing("exhibit_evidence", "exhibit_list_id", "VARCHAR(255)");
  await addColumnIfMissing("exhibit_evidence", "evidence_file_id", "VARCHAR(255)");
  await addColumnIfMissing("exhibit_evidence", "sort_order", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("exhibit_evidence", "label", "TEXT");
  await addColumnIfMissing("exhibit_evidence", "notes", "TEXT");
  await addIndexIfMissing("idx_exhibit_evidence_list", 
    "CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_list ON exhibit_evidence(exhibit_list_id)");
  await addIndexIfMissing("idx_exhibit_evidence_file", 
    "CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_file ON exhibit_evidence(evidence_file_id)");
  await addIndexIfMissing("idx_exhibit_evidence_sort", 
    "CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_sort ON exhibit_evidence(exhibit_list_id, sort_order)");
}

async function ensureLexiThreadsColumns(): Promise<void> {
  await addColumnIfMissing("lexi_threads", "disclaimer_shown", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfMissing("lexi_threads", "mode", "TEXT");
  await addColumnIfMissing("lexi_threads", "module_key", "TEXT");
  await addColumnIfMissing("lexi_threads", "updated_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
}

async function ensureLexiThreadsCaseIdNullable(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'lexi_threads' AND column_name = 'case_id'
    `);
    
    if (result.rows.length > 0 && result.rows[0].is_nullable === 'NO') {
      console.log("[DB MIGRATION] Making lexi_threads.case_id nullable...");
      await pool.query(`ALTER TABLE lexi_threads ALTER COLUMN case_id DROP NOT NULL`);
      await pool.query(`ALTER TABLE lexi_threads ALTER COLUMN case_id DROP DEFAULT`);
      console.log("[DB MIGRATION] lexi_threads.case_id is now nullable");
    }
  } catch (error) {
    console.log("[DB MIGRATION] ensureLexiThreadsCaseIdNullable skipped or already done:", error instanceof Error ? error.message : "Unknown error");
  }
}

async function ensureLexiMessagesColumns(): Promise<void> {
  await addColumnIfMissing("lexi_messages", "role", "TEXT NOT NULL DEFAULT 'user'");
  await addColumnIfMissing("lexi_messages", "content", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("lexi_messages", "safety_flags", "JSONB");
  await addColumnIfMissing("lexi_messages", "metadata", "JSONB");
  await addColumnIfMissing("lexi_messages", "model", "TEXT");
  await addColumnIfMissing("lexi_messages", "created_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
  await addIndexIfMissing("idx_lexi_messages_thread_created",
    "CREATE INDEX IF NOT EXISTS idx_lexi_messages_thread_created ON lexi_messages(thread_id, created_at)");
}

async function ensureCaseRuleTermsColumns(): Promise<void> {
  await addColumnIfMissing("case_rule_terms", "module_key", "TEXT NOT NULL DEFAULT 'general'");
  await addColumnIfMissing("case_rule_terms", "term_key", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("case_rule_terms", "jurisdiction_state", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("case_rule_terms", "jurisdiction_county", "TEXT");
  await addColumnIfMissing("case_rule_terms", "official_label", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("case_rule_terms", "also_known_as", "TEXT");
  await addColumnIfMissing("case_rule_terms", "summary", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("case_rule_terms", "sources_json", "JSONB NOT NULL DEFAULT '[]'::jsonb");
  await addColumnIfMissing("case_rule_terms", "last_checked_at", "TIMESTAMP NOT NULL DEFAULT NOW()");
  await addIndexIfMissing("idx_case_rule_terms_user_case",
    "CREATE INDEX IF NOT EXISTS idx_case_rule_terms_user_case ON case_rule_terms(user_id, case_id)");
  await addIndexIfMissing("idx_case_rule_terms_term",
    "CREATE INDEX IF NOT EXISTS idx_case_rule_terms_term ON case_rule_terms(case_id, module_key, term_key)");
}

export async function ensureSchemaMigrations(): Promise<void> {
  console.log("[DB MIGRATION] Running schema migrations...");
  
  await ensureCasesColumns();
  await ensureExhibitListColumns();
  await ensureEvidenceAiAnalysesColumns();
  await ensureTimelineCategoryColumns();
  await ensureEvidenceExtractionsColumns();
  await ensureEvidenceNotesColumns();
  await ensureExhibitSnippetsColumns();
  await ensureTrialPrepShortlistColumns();
  await ensureUserProfileColumns();
  await ensureEvidenceFilesColumns();
  await ensureTimelineEventsColumns();
  await ensureCaseEvidenceNotesColumns();
  await ensureExhibitEvidenceColumns();
  await ensureLexiThreadsColumns();
  await ensureLexiThreadsCaseIdNullable();
  await ensureLexiMessagesColumns();
  await ensureCaseRuleTermsColumns();
  
  const casesStartingPoint = await columnExists("cases", "starting_point");
  const timelineCategoriesCaseId = await columnExists("timeline_categories", "case_id");
  const evidenceAiStatus = await columnExists("evidence_ai_analyses", "status");
  const lexiThreadsDisclaimerShown = await columnExists("lexi_threads", "disclaimer_shown");
  const evidenceExtractionsStatus = await columnExists("evidence_extractions", "status");
  const caseRuleTermsModuleKey = await columnExists("case_rule_terms", "module_key");
  
  console.log(`[DB MIGRATION] Verification: cases.starting_point present: ${casesStartingPoint}`);
  console.log(`[DB MIGRATION] Verification: timeline_categories.case_id present: ${timelineCategoriesCaseId}`);
  console.log(`[DB MIGRATION] Verification: evidence_ai_analyses.status present: ${evidenceAiStatus}`);
  const lexiThreadsCaseIdNullableResult = await pool.query(`
    SELECT is_nullable FROM information_schema.columns 
    WHERE table_name = 'lexi_threads' AND column_name = 'case_id'
  `);
  const lexiThreadsCaseIdNullable = lexiThreadsCaseIdNullableResult.rows.length > 0 && lexiThreadsCaseIdNullableResult.rows[0].is_nullable === 'YES';
  
  console.log(`[DB MIGRATION] Verification: lexi_threads.disclaimer_shown present: ${lexiThreadsDisclaimerShown}`);
  console.log(`[DB MIGRATION] Verification: lexi_threads.case_id nullable: ${lexiThreadsCaseIdNullable}`);
  console.log(`[DB MIGRATION] Verification: evidence_extractions.status present: ${evidenceExtractionsStatus}`);
  console.log(`[DB MIGRATION] Verification: case_rule_terms.module_key present: ${caseRuleTermsModuleKey}`);
  console.log("[DB MIGRATION] Schema migrations complete");
}

export async function checkAiTableColumns(): Promise<{ ok: boolean; checks: Record<string, boolean> }> {
  const checks: Record<string, boolean> = {
    "lexi_threads.disclaimer_shown": await columnExists("lexi_threads", "disclaimer_shown"),
    "evidence_ai_analyses.status": await columnExists("evidence_ai_analyses", "status"),
    "evidence_extractions.status": await columnExists("evidence_extractions", "status"),
    "case_rule_terms.module_key": await columnExists("case_rule_terms", "module_key"),
  };
  const ok = Object.values(checks).every(v => v === true);
  return { ok, checks };
}

async function initTable(tableName: string, createSQL: string, indexSQL: string[] = []): Promise<boolean> {
  try {
    if (await tableExists(tableName)) {
      console.log(`${tableName} table already exists`);
      return false;
    }

    console.log(`Creating ${tableName} table...`);
    await pool.query(createSQL);
    
    for (const idx of indexSQL) {
      await pool.query(idx);
    }

    console.log(`${tableName} table created successfully`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to init ${tableName} table:`, message);
    return false;
  }
}

export async function initDbTables(): Promise<void> {
  console.log("Initializing database tables...");

  await initTable("users", `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      cases_allowed INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await initTable("cases", `
    CREATE TABLE IF NOT EXISTS cases (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      nickname TEXT,
      state TEXT,
      county TEXT,
      case_number TEXT,
      case_type TEXT,
      has_children BOOLEAN NOT NULL DEFAULT false,
      starting_point TEXT NOT NULL DEFAULT 'not_sure',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id)`
  ]);

  await initTable("user_profiles", `
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
      full_name TEXT,
      email TEXT,
      address_line_1 TEXT,
      address_line_2 TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      phone TEXT,
      party_role TEXT,
      is_self_represented BOOLEAN NOT NULL DEFAULT true,
      auto_fill_enabled BOOLEAN NOT NULL DEFAULT true,
      auto_fill_choice_made BOOLEAN NOT NULL DEFAULT false,
      default_role TEXT NOT NULL DEFAULT 'self_represented',
      bar_number TEXT,
      firm_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await initTable("timeline_events", `
    CREATE TABLE IF NOT EXISTS timeline_events (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      event_date TIMESTAMP NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      notes TEXT,
      source TEXT DEFAULT 'user_manual',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_timeline_events_case_id ON timeline_events(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date)`
  ]);

  await initTable("evidence_files", `
    CREATE TABLE IF NOT EXISTS evidence_files (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      original_name TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      sha256 TEXT,
      notes TEXT,
      category TEXT,
      description TEXT,
      tags TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_files_case_id ON evidence_files(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_files_user_id ON evidence_files(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_files_case_created_at ON evidence_files(case_id, created_at)`
  ]);

  await initTable("documents", `
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      template_key TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)`
  ]);

  await initTable("generated_documents", `
    CREATE TABLE IF NOT EXISTS generated_documents (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      template_type TEXT NOT NULL,
      title TEXT NOT NULL,
      payload_json JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_gen_docs_user_case_created_at ON generated_documents(user_id, case_id, created_at DESC)`
  ]);

  await initTable("case_children", `
    CREATE TABLE IF NOT EXISTS case_children (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      first_name TEXT NOT NULL,
      first_name_status TEXT,
      last_name TEXT,
      last_name_status TEXT,
      date_of_birth TEXT,
      date_of_birth_status TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_case_children_user_case ON case_children(user_id, case_id)`,
    `ALTER TABLE case_children ADD COLUMN IF NOT EXISTS first_name_status TEXT`,
    `ALTER TABLE case_children ADD COLUMN IF NOT EXISTS last_name_status TEXT`,
    `ALTER TABLE case_children ADD COLUMN IF NOT EXISTS date_of_birth_status TEXT`,
    `ALTER TABLE case_children ALTER COLUMN date_of_birth DROP NOT NULL`
  ]);

  await initTable("tasks", `
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      due_date TIMESTAMP,
      priority INTEGER NOT NULL DEFAULT 2,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_case_due ON tasks(case_id, due_date)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_case_status ON tasks(case_id, status)`
  ]);

  await initTable("deadlines", `
    CREATE TABLE IF NOT EXISTS deadlines (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming',
      due_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_deadlines_case_id ON deadlines(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON deadlines(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deadlines_case_due ON deadlines(case_id, due_date)`,
    `CREATE INDEX IF NOT EXISTS idx_deadlines_case_status ON deadlines(case_id, status)`
  ]);

  await initTable("calendar_categories", `
    CREATE TABLE IF NOT EXISTS calendar_categories (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#7BA3A8',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_calendar_categories_user_case ON calendar_categories(user_id, case_id)`
  ]);

  await initTable("case_calendar_items", `
    CREATE TABLE IF NOT EXISTS case_calendar_items (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      start_date TIMESTAMP NOT NULL,
      is_done BOOLEAN NOT NULL DEFAULT false,
      category_id VARCHAR(255),
      color_override TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_calendar_items_user_case_date ON case_calendar_items(user_id, case_id, start_date)`
  ]);

  await initTable("case_contacts", `
    CREATE TABLE IF NOT EXISTS case_contacts (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'other',
      contact_group TEXT NOT NULL DEFAULT 'case',
      organization_or_firm TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_contacts_case_id ON case_contacts(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON case_contacts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_case_role ON case_contacts(case_id, role)`,
    `ALTER TABLE case_contacts ADD COLUMN IF NOT EXISTS contact_group TEXT NOT NULL DEFAULT 'case'`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_case_group ON case_contacts(user_id, case_id, contact_group)`
  ]);

  await initTable("case_communications", `
    CREATE TABLE IF NOT EXISTS case_communications (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      contact_id VARCHAR(255),
      direction TEXT NOT NULL DEFAULT 'outgoing',
      channel TEXT NOT NULL DEFAULT 'email',
      status TEXT NOT NULL DEFAULT 'draft',
      occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
      subject TEXT,
      summary TEXT NOT NULL,
      follow_up_at TIMESTAMP,
      needs_follow_up BOOLEAN NOT NULL DEFAULT false,
      pinned BOOLEAN NOT NULL DEFAULT false,
      evidence_ids TEXT,
      timeline_event_id VARCHAR(255),
      calendar_item_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_communications_case_id ON case_communications(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_communications_user_id ON case_communications(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_communications_case_occurred ON case_communications(case_id, occurred_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_communications_case_followup ON case_communications(case_id, follow_up_at)`,
    `CREATE INDEX IF NOT EXISTS idx_communications_status ON case_communications(status)`,
    `CREATE INDEX IF NOT EXISTS idx_communications_needs_followup ON case_communications(needs_follow_up)`
  ]);

  await initTable("exhibit_lists", `
    CREATE TABLE IF NOT EXISTS exhibit_lists (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_lists_case_id ON exhibit_lists(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_lists_user_id ON exhibit_lists(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_lists_case_created ON exhibit_lists(case_id, created_at)`
  ]);

  await initTable("exhibits", `
    CREATE TABLE IF NOT EXISTS exhibits (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      exhibit_list_id VARCHAR(255) NOT NULL,
      label TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      included BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibits_list_id ON exhibits(exhibit_list_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibits_case_id ON exhibits(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibits_user_id ON exhibits(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibits_list_sort ON exhibits(exhibit_list_id, sort_order)`
  ]);

  await initTable("exhibit_evidence", `
    CREATE TABLE IF NOT EXISTS exhibit_evidence (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      exhibit_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(exhibit_id, evidence_id)
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_exhibit_id ON exhibit_evidence(exhibit_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_evidence_id ON exhibit_evidence(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_evidence_case_id ON exhibit_evidence(case_id)`
  ]);

  await initTable("lexi_threads", `
    CREATE TABLE IF NOT EXISTS lexi_threads (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255),
      title TEXT NOT NULL,
      disclaimer_shown BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_lexi_threads_user_case_updated ON lexi_threads(user_id, case_id, updated_at DESC)`,
    `ALTER TABLE lexi_threads ADD COLUMN IF NOT EXISTS disclaimer_shown BOOLEAN NOT NULL DEFAULT false`
  ]);

  try {
    await pool.query(`ALTER TABLE lexi_threads ALTER COLUMN case_id DROP NOT NULL`);
  } catch (e) {
  }

  await initTable("lexi_messages", `
    CREATE TABLE IF NOT EXISTS lexi_messages (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255),
      thread_id VARCHAR(255) NOT NULL REFERENCES lexi_threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      safety_flags JSONB,
      metadata JSONB,
      model TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_lexi_messages_thread_created ON lexi_messages(thread_id, created_at)`,
    `ALTER TABLE lexi_messages ADD COLUMN IF NOT EXISTS metadata JSONB`
  ]);

  try {
    await pool.query(`ALTER TABLE lexi_messages ALTER COLUMN case_id DROP NOT NULL`);
  } catch (e) {
  }

  await initTable("case_rule_terms", `
    CREATE TABLE IF NOT EXISTS case_rule_terms (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      module_key TEXT NOT NULL,
      jurisdiction_state TEXT NOT NULL,
      jurisdiction_county TEXT,
      term_key TEXT NOT NULL,
      official_label TEXT NOT NULL,
      also_known_as TEXT,
      summary TEXT NOT NULL,
      sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_case_rule_terms_user_case ON case_rule_terms(user_id, case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_case_rule_terms_term ON case_rule_terms(case_id, module_key, term_key)`
  ]);

  await initTable("trial_binder_sections", `
    CREATE TABLE IF NOT EXISTS trial_binder_sections (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_trial_binder_sections_user_case ON trial_binder_sections(user_id, case_id)`
  ]);

  await initTable("trial_binder_items", `
    CREATE TABLE IF NOT EXISTS trial_binder_items (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      section_key TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      pinned_rank INTEGER,
      note TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_trial_binder_items_user_case_section ON trial_binder_items(user_id, case_id, section_key)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_binder_items_user_case_section_pinned ON trial_binder_items(user_id, case_id, section_key, pinned_rank)`
  ]);

  await initTable("exhibit_packets", `
    CREATE TABLE IF NOT EXISTS exhibit_packets (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      filing_type TEXT,
      filing_date TIMESTAMP,
      cover_page_text TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packets_user_case ON exhibit_packets(user_id, case_id)`
  ]);

  await initTable("exhibit_packet_items", `
    CREATE TABLE IF NOT EXISTS exhibit_packet_items (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      packet_id VARCHAR(255) NOT NULL,
      exhibit_label TEXT NOT NULL,
      exhibit_title TEXT NOT NULL,
      exhibit_notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packet_items_packet ON exhibit_packet_items(packet_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packet_items_user_case ON exhibit_packet_items(user_id, case_id)`
  ]);

  await initTable("exhibit_packet_evidence", `
    CREATE TABLE IF NOT EXISTS exhibit_packet_evidence (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      packet_item_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packet_evidence_packet_item ON exhibit_packet_evidence(packet_item_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packet_evidence_evidence ON exhibit_packet_evidence(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_packet_evidence_user_case ON exhibit_packet_evidence(user_id, case_id)`
  ]);

  await initTable("generated_exhibit_packets", `
    CREATE TABLE IF NOT EXISTS generated_exhibit_packets (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      packet_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      file_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_generated_exhibit_packets_packet ON generated_exhibit_packets(packet_id)`,
    `CREATE INDEX IF NOT EXISTS idx_generated_exhibit_packets_user_case ON generated_exhibit_packets(user_id, case_id)`
  ]);

  await initTable("case_evidence_notes", `
    CREATE TABLE IF NOT EXISTS case_evidence_notes (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_file_id VARCHAR(255) NOT NULL,
      page_number INTEGER,
      label TEXT,
      note TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_notes_case ON case_evidence_notes(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_notes_file ON case_evidence_notes(evidence_file_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_notes_user ON case_evidence_notes(user_id)`
  ]);

  await initTable("case_exhibit_note_links", `
    CREATE TABLE IF NOT EXISTS case_exhibit_note_links (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      exhibit_list_id VARCHAR(255) NOT NULL,
      evidence_note_id VARCHAR(255) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      label TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_note_links_note ON case_exhibit_note_links(evidence_note_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_note_links_list ON case_exhibit_note_links(exhibit_list_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_note_links_case ON case_exhibit_note_links(case_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_exhibit_note_links_unique ON case_exhibit_note_links(exhibit_list_id, evidence_note_id)`
  ]);

  await initTable("timeline_categories", `
    CREATE TABLE IF NOT EXISTS timeline_categories (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#628286',
      is_system BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_timeline_categories_user ON timeline_categories(user_id)`
  ]);

  await initTable("parenting_plans", `
    CREATE TABLE IF NOT EXISTS parenting_plans (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_parenting_plans_user_case ON parenting_plans(user_id, case_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_parenting_plans_case_unique ON parenting_plans(case_id)`
  ]);

  await initTable("parenting_plan_sections", `
    CREATE TABLE IF NOT EXISTS parenting_plan_sections (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      parenting_plan_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      section_key TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_parenting_plan_sections_plan ON parenting_plan_sections(parenting_plan_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_parenting_plan_sections_key ON parenting_plan_sections(parenting_plan_id, section_key)`
  ]);

  await initTable("evidence_processing_jobs", `
    CREATE TABLE IF NOT EXISTS evidence_processing_jobs (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      progress INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_processing_jobs_evidence ON evidence_processing_jobs(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_processing_jobs_user_case ON evidence_processing_jobs(user_id, case_id)`
  ]);

  await initTable("evidence_ocr_pages", `
    CREATE TABLE IF NOT EXISTS evidence_ocr_pages (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      page_number INTEGER,
      provider_primary TEXT NOT NULL,
      provider_secondary TEXT,
      text_primary TEXT NOT NULL,
      text_secondary TEXT,
      confidence_primary INTEGER,
      confidence_secondary INTEGER,
      diff_score INTEGER,
      needs_review BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_ocr_pages_evidence ON evidence_ocr_pages(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_ocr_pages_user_case ON evidence_ocr_pages(user_id, case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_ocr_pages_page ON evidence_ocr_pages(evidence_id, page_number)`
  ]);

  await initTable("evidence_anchors", `
    CREATE TABLE IF NOT EXISTS evidence_anchors (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      page_number INTEGER,
      start_char INTEGER,
      end_char INTEGER,
      excerpt TEXT NOT NULL,
      note TEXT,
      tags JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_anchors_evidence ON evidence_anchors(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_anchors_user_case ON evidence_anchors(user_id, case_id)`
  ]);

  await initTable("evidence_extractions", `
    CREATE TABLE IF NOT EXISTS evidence_extractions (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      provider TEXT NOT NULL DEFAULT 'internal',
      mime_type TEXT,
      page_count INTEGER,
      extracted_text TEXT,
      metadata JSONB,
      error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_extractions_evidence ON evidence_extractions(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_extractions_user_case ON evidence_extractions(user_id, case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_extractions_status ON evidence_extractions(status)`
  ]);

  await initTable("evidence_ai_analyses", `
    CREATE TABLE IF NOT EXISTS evidence_ai_analyses (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      analysis_type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_ai_analyses_evidence ON evidence_ai_analyses(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_ai_analyses_user_case ON evidence_ai_analyses(user_id, case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_ai_analyses_type ON evidence_ai_analyses(analysis_type)`
  ]);

  await initTable("evidence_notes", `
    CREATE TABLE IF NOT EXISTS evidence_notes (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      note_title TEXT,
      note_text TEXT NOT NULL,
      anchor_type TEXT NOT NULL DEFAULT 'page',
      page_number INTEGER,
      timestamp INTEGER,
      selection_text TEXT,
      tags JSONB,
      color TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_evidence_notes_evidence ON evidence_notes(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_evidence_notes_user_case ON evidence_notes(user_id, case_id)`
  ]);

  // Drop old trial_prep_shortlist if it has old schema (evidence_id column)
  try {
    const checkOldSchema = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'trial_prep_shortlist' AND column_name = 'evidence_id'
    `);
    if (checkOldSchema.rows.length > 0) {
      console.log("Migrating trial_prep_shortlist to new schema...");
      await pool.query(`DROP TABLE IF EXISTS trial_prep_shortlist CASCADE`);
    }
  } catch (e) {
    // Table doesn't exist, continue
  }

  // C3: Add exhibit_snippets table for snippet-based exhibits
  await initTable("exhibit_snippets", `
    CREATE TABLE IF NOT EXISTS exhibit_snippets (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      exhibit_list_id VARCHAR(255) NOT NULL,
      evidence_id VARCHAR(255) NOT NULL,
      note_id VARCHAR(255),
      title TEXT NOT NULL,
      snippet_text TEXT NOT NULL,
      page_number INTEGER,
      timestamp_hint TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_exhibit_snippets_list ON exhibit_snippets(exhibit_list_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_snippets_evidence ON exhibit_snippets(evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_snippets_note ON exhibit_snippets(note_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exhibit_snippets_user_case ON exhibit_snippets(user_id, case_id)`
  ]);

  await initTable("trial_prep_shortlist", `
    CREATE TABLE IF NOT EXISTS trial_prep_shortlist (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      source_type TEXT NOT NULL,
      source_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      binder_section TEXT NOT NULL DEFAULT 'General',
      importance INTEGER NOT NULL DEFAULT 3,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      color TEXT,
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_trial_prep_shortlist_case ON trial_prep_shortlist(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_prep_shortlist_user_case ON trial_prep_shortlist(user_id, case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_prep_shortlist_section ON trial_prep_shortlist(case_id, binder_section)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_prep_shortlist_unique_source ON trial_prep_shortlist(user_id, case_id, source_type, source_id)`
  ]);

  await initTable("citation_pointers", `
    CREATE TABLE IF NOT EXISTS citation_pointers (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      evidence_file_id VARCHAR(255) NOT NULL,
      page_number INTEGER,
      timestamp_seconds INTEGER,
      message_range TEXT,
      quote TEXT NOT NULL,
      excerpt TEXT,
      start_offset INTEGER,
      end_offset INTEGER,
      confidence INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_citation_pointers_case ON citation_pointers(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_citation_pointers_evidence ON citation_pointers(evidence_file_id)`
  ]);

  await initTable("case_claims", `
    CREATE TABLE IF NOT EXISTS case_claims (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      claim_text TEXT NOT NULL,
      claim_type TEXT NOT NULL DEFAULT 'fact',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      color TEXT,
      missing_info_flag BOOLEAN NOT NULL DEFAULT FALSE,
      created_from TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'suggested',
      source_note_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_case_claims_case ON case_claims(case_id)`,
    `CREATE INDEX IF NOT EXISTS idx_case_claims_case_status ON case_claims(case_id, status)`
  ]);

  await initTable("claim_citations", `
    CREATE TABLE IF NOT EXISTS claim_citations (
      claim_id VARCHAR(255) NOT NULL,
      citation_id VARCHAR(255) NOT NULL,
      PRIMARY KEY (claim_id, citation_id)
    )
  `, []);

  await initTable("issue_groupings", `
    CREATE TABLE IF NOT EXISTS issue_groupings (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL,
      case_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_issue_groupings_case ON issue_groupings(case_id)`
  ]);

  await initTable("issue_claims", `
    CREATE TABLE IF NOT EXISTS issue_claims (
      issue_id VARCHAR(255) NOT NULL,
      claim_id VARCHAR(255) NOT NULL,
      PRIMARY KEY (issue_id, claim_id)
    )
  `, []);

  await initTable("lexi_user_prefs", `
    CREATE TABLE IF NOT EXISTS lexi_user_prefs (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) UNIQUE,
      response_style TEXT NOT NULL DEFAULT 'bullets',
      verbosity INTEGER NOT NULL DEFAULT 3,
      citation_strictness TEXT NOT NULL DEFAULT 'when_available',
      default_mode TEXT NOT NULL DEFAULT 'organize',
      streaming_enabled BOOLEAN NOT NULL DEFAULT true,
      faster_mode BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `ALTER TABLE lexi_user_prefs ADD COLUMN IF NOT EXISTS streaming_enabled BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE lexi_user_prefs ADD COLUMN IF NOT EXISTS faster_mode BOOLEAN NOT NULL DEFAULT false`
  ]);

  await initTable("lexi_case_memory", `
    CREATE TABLE IF NOT EXISTS lexi_case_memory (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      memory_markdown TEXT,
      preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE UNIQUE INDEX IF NOT EXISTS lexi_case_memory_user_case_idx ON lexi_case_memory(user_id, case_id)`,
    `ALTER TABLE lexi_case_memory ADD COLUMN IF NOT EXISTS memory_markdown TEXT`,
    `ALTER TABLE lexi_case_memory ADD COLUMN IF NOT EXISTS preferences_json JSONB NOT NULL DEFAULT '{}'::jsonb`
  ]);

  await initTable("lexi_feedback_events", `
    CREATE TABLE IF NOT EXISTS lexi_feedback_events (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255),
      event_type TEXT NOT NULL,
      payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS lexi_feedback_user_case_event_idx ON lexi_feedback_events(user_id, case_id, event_type, created_at)`
  ]);

  await initTable("activity_logs", `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255),
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      module_key TEXT,
      entity_type TEXT,
      entity_id VARCHAR(255),
      metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx ON activity_logs(user_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS activity_logs_case_created_idx ON activity_logs(case_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS activity_logs_type_created_idx ON activity_logs(type, created_at)`,
    `CREATE INDEX IF NOT EXISTS activity_logs_module_created_idx ON activity_logs(module_key, created_at)`,
    `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS module_key TEXT`,
    `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS entity_type TEXT`,
    `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255)`
  ]);

  await initTable("case_facts", `
    CREATE TABLE IF NOT EXISTS case_facts (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      key TEXT NOT NULL,
      value TEXT,
      value_type TEXT NOT NULL DEFAULT 'text',
      status TEXT NOT NULL DEFAULT 'suggested',
      missing_info_flag BOOLEAN NOT NULL DEFAULT FALSE,
      source_type TEXT NOT NULL DEFAULT 'manual',
      source_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS case_facts_case_key_idx ON case_facts(case_id, key)`,
    `CREATE INDEX IF NOT EXISTS case_facts_case_status_idx ON case_facts(case_id, status)`
  ]);

  await initTable("fact_citations", `
    CREATE TABLE IF NOT EXISTS fact_citations (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      fact_id VARCHAR(255) NOT NULL REFERENCES case_facts(id),
      citation_id VARCHAR(255) NOT NULL REFERENCES citation_pointers(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE UNIQUE INDEX IF NOT EXISTS fact_citations_fact_citation_idx ON fact_citations(fact_id, citation_id)`
  ]);

  // Phase 3A: Cross-Module Link Tables
  await initTable("timeline_event_links", `
    CREATE TABLE IF NOT EXISTS timeline_event_links (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      event_id VARCHAR(255) NOT NULL REFERENCES timeline_events(id),
      link_type TEXT NOT NULL,
      evidence_id VARCHAR(255),
      claim_id VARCHAR(255),
      snippet_id VARCHAR(255),
      note TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS timeline_event_links_case_idx ON timeline_event_links(case_id)`,
    `CREATE INDEX IF NOT EXISTS timeline_event_links_event_idx ON timeline_event_links(event_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS timeline_event_links_unique_idx ON timeline_event_links(event_id, link_type, COALESCE(evidence_id, ''), COALESCE(claim_id, ''), COALESCE(snippet_id, ''))`
  ]);

  await initTable("claim_links", `
    CREATE TABLE IF NOT EXISTS claim_links (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      claim_id VARCHAR(255) NOT NULL REFERENCES case_claims(id),
      link_type TEXT NOT NULL,
      event_id VARCHAR(255),
      trial_prep_id VARCHAR(255),
      snippet_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS claim_links_case_idx ON claim_links(case_id)`,
    `CREATE INDEX IF NOT EXISTS claim_links_claim_idx ON claim_links(claim_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS claim_links_unique_idx ON claim_links(claim_id, link_type, COALESCE(event_id, ''), COALESCE(trial_prep_id, ''), COALESCE(snippet_id, ''))`
  ]);

  await ensureSchemaMigrations();
  
  console.log("Database table initialization complete");
}
