#!/usr/bin/env tsx
import { runSmokeChecks } from "../server/diagnostics/smokeChecks";

async function main() {
  console.log("Running smoke checks...\n");
  
  const report = await runSmokeChecks("system-smoke-check");
  
  console.log("=".repeat(60));
  console.log("SMOKE CHECK REPORT");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall: ${report.ok ? "PASS" : "FAIL"}\n`);
  
  for (const check of report.checks) {
    const status = check.ok ? "PASS" : (check.blocking ? "FAIL" : "WARN");
    const icon = check.ok ? "[OK]" : (check.blocking ? "[X]" : "[!]");
    console.log(`${icon} ${check.name.padEnd(20)} ${status}`);
    if (check.detail) {
      console.log(`    ${check.detail}`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  
  const blocking = report.checks.filter(c => !c.ok && c.blocking);
  const warnings = report.checks.filter(c => !c.ok && !c.blocking);
  
  if (blocking.length > 0) {
    console.log(`BLOCKING FAILURES: ${blocking.length}`);
    for (const b of blocking) {
      console.log(`  - ${b.name}: ${b.detail}`);
    }
  }
  
  if (warnings.length > 0) {
    console.log(`WARNINGS: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`  - ${w.name}: ${w.detail}`);
    }
  }
  
  if (report.ok) {
    console.log("All checks passed!");
  }
  
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke check runner failed:", err);
  process.exit(1);
});
