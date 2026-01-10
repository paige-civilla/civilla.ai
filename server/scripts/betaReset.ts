import { Pool } from "pg";
import { isR2Configured, listAllR2Keys, bulkDeleteFromR2 } from "../r2";

function cleanConnectionString(str: string | undefined): string | undefined {
  if (!str) return undefined;
  const match = str.match(/postgresql:\/\/.+/);
  return match ? match[0].trim() : str.trim();
}

const USER_GENERATED_TABLES = [
  "admin_audit_logs",
  "analytics_events",
  "activity_logs",
  "lexi_feedback_events",
  "lexi_user_prefs",
  "lexi_case_memory",
  "lexi_messages",
  "lexi_threads",
  "draft_outline_claims",
  "draft_outlines",
  "resource_field_maps",
  "case_resources",
  "claim_links",
  "timeline_event_links",
  "fact_citations",
  "case_facts",
  "issue_claims",
  "issue_groupings",
  "claim_citations",
  "citation_pointers",
  "case_claims",
  "trial_prep_shortlist",
  "exhibit_snippets",
  "evidence_notes",
  "evidence_ai_analyses",
  "evidence_extractions",
  "evidence_anchors",
  "evidence_ocr_pages",
  "evidence_processing_jobs",
  "parenting_plan_sections",
  "parenting_plans",
  "timeline_categories",
  "case_exhibit_note_links",
  "case_evidence_notes",
  "generated_exhibit_packets",
  "exhibit_packet_evidence",
  "exhibit_packet_items",
  "exhibit_packets",
  "trial_binder_items",
  "trial_binder_sections",
  "case_rule_terms",
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
  "auth_magic_links",
  "user_profiles",
  "users",
];

interface TableCount {
  table: string;
  before: number;
  after: number;
}

async function getTableCount(pool: Pool, table: string): Promise<number> {
  try {
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return result.rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
    [table]
  );
  return result.rows[0]?.exists ?? false;
}

export async function runBetaReset(options: { dryRun?: boolean; skipR2?: boolean } = {}): Promise<{
  ok: boolean;
  dryRun: boolean;
  tableCounts: TableCount[];
  r2KeysDeleted: number;
  errors: string[];
}> {
  const { dryRun = false, skipR2 = false } = options;
  const errors: string[] = [];
  const tableCounts: TableCount[] = [];
  let r2KeysDeleted = 0;

  console.log("=".repeat(60));
  console.log("BETA RESET SCRIPT");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE EXECUTION"}`);
  console.log(`R2 cleanup: ${skipR2 ? "SKIPPED" : "ENABLED"}`);
  console.log("");

  if (!dryRun) {
    console.log("⚠️  WARNING: IRREVERSIBLE WITHOUT BACKUP ⚠️");
    console.log("This will DELETE all user data and uploaded files.");
    console.log("");
  }

  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = cleanConnectionString(rawDatabaseUrl);
  if (!databaseUrl) {
    errors.push("DATABASE_URL not configured");
    return { ok: false, dryRun, tableCounts, r2KeysDeleted, errors };
  }

  const dbHost = databaseUrl.match(/@([^:\/]+)/)?.[1] || "unknown";
  console.log(`Database host: ${dbHost}`);
  console.log("");

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Step 1: Counting existing records...");
    console.log("-".repeat(40));

    for (const table of USER_GENERATED_TABLES) {
      const exists = await tableExists(pool, table);
      if (exists) {
        const count = await getTableCount(pool, table);
        tableCounts.push({ table, before: count, after: dryRun ? count : 0 });
        if (count > 0) {
          console.log(`  ${table}: ${count} rows`);
        }
      }
    }

    const totalBefore = tableCounts.reduce((sum, t) => sum + t.before, 0);
    console.log(`\nTotal records to delete: ${totalBefore}`);
    console.log("");

    if (!skipR2 && isR2Configured()) {
      console.log("Step 2: Collecting R2 storage keys...");
      console.log("-".repeat(40));

      try {
        const r2Keys = await listAllR2Keys();
        console.log(`  Found ${r2Keys.length} objects in R2 bucket`);

        if (!dryRun && r2Keys.length > 0) {
          console.log("  Deleting R2 objects...");
          r2KeysDeleted = await bulkDeleteFromR2(r2Keys);
          console.log(`  Deleted ${r2KeysDeleted} objects from R2`);
        } else if (dryRun) {
          r2KeysDeleted = r2Keys.length;
          console.log(`  [DRY RUN] Would delete ${r2Keys.length} objects`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown R2 error";
        errors.push(`R2 cleanup failed: ${errMsg}`);
        console.error(`  R2 error: ${errMsg}`);
      }
    } else if (!skipR2) {
      console.log("Step 2: R2 not configured, skipping...");
    } else {
      console.log("Step 2: R2 cleanup skipped by option");
    }

    console.log("");
    console.log("Step 3: Truncating database tables...");
    console.log("-".repeat(40));

    if (dryRun) {
      console.log("  [DRY RUN] Would truncate all user-generated tables");
    } else {
      const existingTables: string[] = [];
      for (const table of USER_GENERATED_TABLES) {
        const exists = await tableExists(pool, table);
        if (exists) {
          existingTables.push(`"${table}"`);
        }
      }

      if (existingTables.length > 0) {
        const truncateSQL = `TRUNCATE TABLE ${existingTables.join(", ")} RESTART IDENTITY CASCADE`;
        console.log(`  Executing TRUNCATE on ${existingTables.length} tables...`);
        await pool.query(truncateSQL);
        console.log("  TRUNCATE complete");

        for (const tc of tableCounts) {
          tc.after = 0;
        }
      }
    }

    console.log("");
    console.log("Step 4: Verification...");
    console.log("-".repeat(40));

    if (!dryRun) {
      let totalAfter = 0;
      for (const tc of tableCounts) {
        tc.after = await getTableCount(pool, tc.table);
        totalAfter += tc.after;
      }
      console.log(`  Total records remaining: ${totalAfter}`);
      if (totalAfter > 0) {
        errors.push(`${totalAfter} records still remain after truncate`);
      }
    } else {
      console.log("  [DRY RUN] Verification skipped");
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("RESET COMPLETE");
    console.log("=".repeat(60));
    console.log("");

    console.log("NEXT STEPS FOR ADMIN/GRANT SETUP:");
    console.log("-".repeat(40));
    console.log("1. Sign up normally in the app for two accounts:");
    console.log("   - admin@yourdomain.com (for Admin access)");
    console.log("   - grants@yourdomain.com (for Grant Viewer access)");
    console.log("");
    console.log("2. In Neon SQL editor, find the user IDs:");
    console.log("   SELECT id, email FROM users;");
    console.log("");
    console.log("3. Promote the admin user:");
    console.log("   UPDATE user_profiles SET is_admin = true");
    console.log("   WHERE user_id = '<ADMIN_USER_UUID>';");
    console.log("");
    console.log("4. Promote the grant viewer:");
    console.log("   UPDATE user_profiles SET is_grant_viewer = true");
    console.log("   WHERE user_id = '<GRANT_USER_UUID>';");
    console.log("");
    console.log("5. Verify access:");
    console.log("   - Admin: Log in and visit /app/admin");
    console.log("   - Grant: Log in and visit /app/grants");
    console.log("");

    await pool.end();

    return {
      ok: errors.length === 0,
      dryRun,
      tableCounts: tableCounts.filter((t) => t.before > 0),
      r2KeysDeleted,
      errors,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    errors.push(errMsg);
    await pool.end();
    return { ok: false, dryRun, tableCounts, r2KeysDeleted, errors };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipR2 = args.includes("--skip-r2");
  const force = args.includes("--force");

  if (!dryRun && !force) {
    console.log("ERROR: This script will DELETE ALL USER DATA.");
    console.log("");
    console.log("To preview what would be deleted, run:");
    console.log("  npx tsx server/scripts/betaReset.ts --dry-run");
    console.log("");
    console.log("To execute the reset, run:");
    console.log("  npx tsx server/scripts/betaReset.ts --force");
    console.log("");
    console.log("Options:");
    console.log("  --dry-run   Preview without making changes");
    console.log("  --force     Execute the reset");
    console.log("  --skip-r2   Skip R2 storage cleanup");
    process.exit(1);
  }

  const result = await runBetaReset({ dryRun, skipR2 });

  if (result.ok) {
    console.log("✓ Beta reset completed successfully");
    process.exit(0);
  } else {
    console.error("✗ Beta reset completed with errors:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
