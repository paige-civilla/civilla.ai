#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_ROUTES = [
  // Health
  { method: "GET", path: "/api/health" },
  { method: "GET", path: "/api/health/db" },
  { method: "GET", path: "/api/health/session" },
  { method: "GET", path: "/api/vision/health" },
  
  // Auth
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/logout" },
  { method: "GET", path: "/api/auth/me" },
  
  // Onboarding
  { method: "POST", path: "/api/onboarding/lite" },
  { method: "POST", path: "/api/intake/start" },
  
  // Profile
  { method: "GET", path: "/api/profile" },
  { method: "PATCH", path: "/api/profile" },
  
  // Cases
  { method: "GET", path: "/api/cases" },
  { method: "POST", path: "/api/cases" },
  { method: "GET", path: "/api/cases/:caseId" },
  { method: "PATCH", path: "/api/cases/:caseId" },
  
  // Evidence
  { method: "GET", path: "/api/cases/:caseId/evidence" },
  { method: "POST", path: "/api/cases/:caseId/evidence" },
  { method: "GET", path: "/api/cases/:caseId/evidence/:evidenceId/extraction" },
  { method: "POST", path: "/api/cases/:caseId/evidence/:evidenceId/extraction/run" },
  
  // AI Analysis
  { method: "GET", path: "/api/cases/:caseId/evidence/:evidenceId/ai-analyses" },
  { method: "POST", path: "/api/cases/:caseId/evidence/:evidenceId/ai-analyses" },
  { method: "POST", path: "/api/cases/:caseId/evidence/:evidenceId/claims/suggest" },
  
  // Documents
  { method: "GET", path: "/api/cases/:caseId/documents" },
  { method: "POST", path: "/api/cases/:caseId/documents" },
  { method: "POST", path: "/api/cases/:caseId/documents/compile-claims" },
  
  // Lexi
  { method: "GET", path: "/api/lexi/threads" },
  { method: "POST", path: "/api/lexi/threads" },
  { method: "GET", path: "/api/lexi/threads/:threadId" },
  { method: "POST", path: "/api/lexi/threads/:threadId/messages" },
  
  // Pattern Analysis
  { method: "POST", path: "/api/cases/:caseId/pattern-analysis" },
  { method: "POST", path: "/api/cases/:caseId/pattern-analysis/export" },
  
  // Billing
  { method: "POST", path: "/api/billing/checkout" },
  { method: "POST", path: "/api/billing/portal" },
  { method: "GET", path: "/api/billing/credits" },
  { method: "GET", path: "/api/billing/status" },
  
  // Timeline
  { method: "GET", path: "/api/cases/:caseId/timeline" },
  { method: "POST", path: "/api/cases/:caseId/timeline" },
  
  // Exhibits
  { method: "GET", path: "/api/cases/:caseId/exhibit-lists" },
  { method: "POST", path: "/api/cases/:caseId/exhibit-lists" },
  
  // Trial Prep
  { method: "GET", path: "/api/cases/:caseId/trial-prep" },
  { method: "POST", path: "/api/cases/:caseId/trial-prep" },
];

async function main() {
  const routesFile = path.resolve(__dirname, "../server/routes.ts");
  const content = fs.readFileSync(routesFile, "utf8");
  
  console.log("=".repeat(60));
  console.log("ROUTE AUDIT");
  console.log("=".repeat(60));
  
  const registeredRoutes: { method: string; path: string }[] = [];
  const routeRegex = /app\.(get|post|patch|put|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    registeredRoutes.push({
      method: match[1].toUpperCase(),
      path: match[2],
    });
  }
  
  console.log(`Found ${registeredRoutes.length} registered routes\n`);
  
  let passing = 0;
  let failing = 0;
  const results: { expected: string; status: string }[] = [];
  
  for (const expected of EXPECTED_ROUTES) {
    const found = registeredRoutes.some(
      (r) => r.method === expected.method && r.path === expected.path
    );
    if (found) {
      passing++;
      results.push({ expected: `${expected.method} ${expected.path}`, status: "PASS" });
    } else {
      failing++;
      results.push({ expected: `${expected.method} ${expected.path}`, status: "FAIL" });
    }
  }
  
  console.log("EXPECTED ROUTES:\n");
  for (const r of results) {
    const icon = r.status === "PASS" ? "[OK]" : "[X]";
    console.log(`${icon} ${r.expected}`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`SUMMARY: ${passing} PASS, ${failing} FAIL`);
  console.log("=".repeat(60));
  
  if (failing > 0) {
    console.log("\nMissing routes that need attention:");
    for (const r of results.filter(r => r.status === "FAIL")) {
      console.log(`  - ${r.expected}`);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Route audit failed:", err);
  process.exit(1);
});
