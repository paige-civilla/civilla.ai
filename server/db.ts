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

  console.log("Database table initialization complete");
}
