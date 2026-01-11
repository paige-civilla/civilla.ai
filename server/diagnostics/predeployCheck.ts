import { runPredeployChecks } from "./smokeChecks";

async function main() {
  console.log("========================================");
  console.log("PREDEPLOY CHECK");
  console.log("========================================");
  console.log("");
  
  try {
    const result = await runPredeployChecks();
    
    if (result.ok) {
      console.log("All critical checks passed.");
      console.log("");
      console.log("========================================");
      process.exit(0);
    } else {
      console.error("CRITICAL FAILURE:");
      console.error(result.reason);
      console.error("");
      console.error("Deploy blocked. Fix the above issues.");
      console.error("========================================");
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Predeploy check crashed:", err.message);
    console.error("========================================");
    process.exit(1);
  }
}

main();
