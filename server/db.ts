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
      state TEXT,
      county TEXT,
      case_type TEXT,
      has_children BOOLEAN NOT NULL DEFAULT false,
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

  const addColumnIfNotExists = async (table: string, column: string, colType: string) => {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${colType}`);
    } catch (err) {
      console.log(`Column ${column} may already exist in ${table}`);
    }
  };
  await addColumnIfNotExists("evidence_files", "category", "TEXT");
  await addColumnIfNotExists("evidence_files", "description", "TEXT");
  await addColumnIfNotExists("evidence_files", "tags", "TEXT");
  
  await addColumnIfNotExists("user_profiles", "auto_fill_choice_made", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfNotExists("user_profiles", "default_role", "TEXT NOT NULL DEFAULT 'self_represented'");
  await addColumnIfNotExists("user_profiles", "bar_number", "TEXT");
  await addColumnIfNotExists("user_profiles", "firm_name", "TEXT");
  await addColumnIfNotExists("user_profiles", "petitioner_name", "TEXT");
  await addColumnIfNotExists("user_profiles", "respondent_name", "TEXT");
  await addColumnIfNotExists("user_profiles", "onboarding_completed", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfNotExists("user_profiles", "onboarding_completed_at", "TIMESTAMP");
  await addColumnIfNotExists("user_profiles", "tos_accepted_at", "TIMESTAMP");
  await addColumnIfNotExists("user_profiles", "privacy_accepted_at", "TIMESTAMP");
  await addColumnIfNotExists("user_profiles", "disclaimers_accepted_at", "TIMESTAMP");
  await addColumnIfNotExists("user_profiles", "tos_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfNotExists("user_profiles", "privacy_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfNotExists("user_profiles", "disclaimers_version", "TEXT NOT NULL DEFAULT 'v1'");
  await addColumnIfNotExists("cases", "has_children", "BOOLEAN NOT NULL DEFAULT false");
  await addColumnIfNotExists("cases", "case_number", "TEXT");
  await addColumnIfNotExists("cases", "nickname", "TEXT");
  await addColumnIfNotExists("user_profiles", "calendar_task_color", "TEXT NOT NULL DEFAULT '#2E7D32'");
  await addColumnIfNotExists("user_profiles", "calendar_deadline_color", "TEXT NOT NULL DEFAULT '#C62828'");
  await addColumnIfNotExists("user_profiles", "calendar_timeline_color", "TEXT NOT NULL DEFAULT '#1565C0'");
  await addColumnIfNotExists("user_profiles", "onboarding_deferred", "JSONB NOT NULL DEFAULT '{}'");
  await addColumnIfNotExists("user_profiles", "onboarding_status", "TEXT NOT NULL DEFAULT 'incomplete'");

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
      last_name TEXT,
      date_of_birth TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_case_children_user_case ON case_children(user_id, case_id)`
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
    `CREATE INDEX IF NOT EXISTS idx_contacts_case_role ON case_contacts(case_id, role)`
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
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
      title TEXT NOT NULL,
      disclaimer_shown BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [
    `CREATE INDEX IF NOT EXISTS idx_lexi_threads_user_case_updated ON lexi_threads(user_id, case_id, updated_at DESC)`,
    `ALTER TABLE lexi_threads ADD COLUMN IF NOT EXISTS disclaimer_shown BOOLEAN NOT NULL DEFAULT false`
  ]);

  await initTable("lexi_messages", `
    CREATE TABLE IF NOT EXISTS lexi_messages (
      id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id),
      case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
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

  console.log("Database table initialization complete");
}
