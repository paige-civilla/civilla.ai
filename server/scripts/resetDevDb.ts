import pg from "pg";

const TABLES_TO_TRUNCATE = [
  "case_rule_terms",
  "lexi_messages",
  "lexi_threads",
  "exhibit_evidence",
  "exhibits",
  "exhibit_lists",
  "case_communications",
  "case_contacts",
  "case_calendar_items",
  "calendar_categories",
  "deadlines",
  "tasks",
  "case_children",
  "generated_documents",
  "documents",
  "evidence_files",
  "timeline_events",
  "cases",
  "user_profiles",
  "auth_magic_links",
  "auth_identities",
  "users",
];

async function resetDevDb() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: This script cannot run in production!");
    console.error("Set NODE_ENV to 'development' or unset it to proceed.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  let cleanUrl = databaseUrl;
  if (cleanUrl.startsWith(":\n\n")) {
    cleanUrl = cleanUrl.substring(3);
  }

  console.log("Connecting to development database...");
  const client = new pg.Client({ connectionString: cleanUrl });

  try {
    await client.connect();
    console.log("Connected successfully.");

    console.log("\nTruncating tables (order respects FK constraints):");
    for (const table of TABLES_TO_TRUNCATE) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        console.log(`  ✓ ${table}`);
      } catch (err: any) {
        if (err.code === "42P01") {
          console.log(`  - ${table} (table does not exist, skipping)`);
        } else {
          throw err;
        }
      }
    }

    console.log("\n========================================");
    console.log("DEV DATABASE RESET COMPLETE");
    console.log("All user data has been cleared.");
    console.log("========================================\n");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDevDb();
