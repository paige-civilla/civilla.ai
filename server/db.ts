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

export async function initTimelineTable(): Promise<{ created: boolean; error?: string }> {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'timeline_events'
      ) as exists
    `);
    
    if (tableCheck.rows[0]?.exists) {
      console.log("timeline_events table already exists");
      return { created: false };
    }

    console.log("Creating timeline_events table...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(255) NOT NULL,
        case_id VARCHAR(255) NOT NULL,
        event_date TIMESTAMP NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        notes TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_timeline_events_case_id ON timeline_events(case_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_timeline_events_user_id ON timeline_events(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date)`);

    console.log("timeline_events table created successfully");
    return { created: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to init timeline_events table:", message);
    return { created: false, error: message };
  }
}
