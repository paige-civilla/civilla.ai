import { runSmokeChecks } from "./smokeChecks";

async function main() {
  console.log("========================================");
  console.log("SMOKE TEST RUNNER");
  console.log("========================================");
  console.log("");
  
  try {
    const report = await runSmokeChecks("system", undefined);
    
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Overall: ${report.ok ? "PASS" : "FAIL"}`);
    console.log("");
    console.log("Individual checks:");
    
    for (const check of report.checks) {
      const status = check.ok ? "PASS" : "FAIL";
      const blocking = check.blocking ? " [BLOCKING]" : "";
      console.log(`  ${status}${blocking} ${check.name}: ${check.detail || ""}`);
    }
    
    console.log("");
    console.log("========================================");
    
    process.exit(report.ok ? 0 : 1);
  } catch (err: any) {
    console.error("Smoke test crashed:", err.message);
    console.error("========================================");
    process.exit(1);
  }
}

main();
