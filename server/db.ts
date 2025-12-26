import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use NEON_DATABASE_URL in production if available (for external Neon DB)
// Fall back to DATABASE_URL for development
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("FATAL: DATABASE_URL or NEON_DATABASE_URL environment variable is required");
  throw new Error("DATABASE_URL or NEON_DATABASE_URL environment variable is required");
}

if (process.env.NEON_DATABASE_URL) {
  console.log("Using NEON_DATABASE_URL for database connection");
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
console.log(`DATABASE host: ${dbHost}`);

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
