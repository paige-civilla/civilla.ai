#!/usr/bin/env tsx
/**
 * API Smoke Test Script
 * 
 * Tests critical API endpoints to verify they respond correctly.
 * Run: npx tsx script/apiSmoke.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword123";

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL" | "SKIP";
  statusCode?: number;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: string,
  endpoint: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    expectedStatus?: number | number[];
    requiresAuth?: boolean;
  } = {}
): Promise<TestResult> {
  const start = Date.now();
  const { body, headers = {}, expectedStatus = [200, 201], requiresAuth = false } = options;
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (requiresAuth) {
    return {
      name,
      endpoint,
      method,
      status: "SKIP",
      error: "Requires authentication (run with valid TEST_EMAIL/TEST_PASSWORD)",
    };
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - start;
    const passed = expected.includes(response.status);

    return {
      name,
      endpoint,
      method,
      status: passed ? "PASS" : "FAIL",
      statusCode: response.status,
      duration,
      error: passed ? undefined : `Expected ${expected.join(" or ")}, got ${response.status}`,
    };
  } catch (error: any) {
    return {
      name,
      endpoint,
      method,
      status: "FAIL",
      error: error.message,
      duration: Date.now() - start,
    };
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("API SMOKE TESTS");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("=".repeat(60));
  console.log("");

  // Health checks (no auth required)
  results.push(await testEndpoint("Health check", "GET", "/api/health"));
  results.push(await testEndpoint("DB health", "GET", "/api/health/db"));
  results.push(await testEndpoint("Session health", "GET", "/api/health/session"));
  results.push(await testEndpoint("Timeline health", "GET", "/api/health/timeline"));
  results.push(await testEndpoint("Evidence health", "GET", "/api/health/evidence"));
  results.push(await testEndpoint("Documents health", "GET", "/api/health/documents"));
  results.push(await testEndpoint("DOCX health", "GET", "/api/health/docx"));

  // Auth endpoints (testing unauthenticated responses)
  results.push(await testEndpoint("Get current user (unauth)", "GET", "/api/auth/me", { expectedStatus: 401 }));
  results.push(await testEndpoint("Get profile (unauth)", "GET", "/api/profile", { expectedStatus: 401 }));
  results.push(await testEndpoint("Get cases (unauth)", "GET", "/api/cases", { expectedStatus: 401 }));

  // Turnstile endpoint
  results.push(await testEndpoint("Turnstile site key", "GET", "/api/turnstile/site-key"));
  results.push(await testEndpoint("Turnstile status", "GET", "/api/auth/turnstile-status"));

  // Invalid login
  results.push(
    await testEndpoint("Login (invalid)", "POST", "/api/auth/login", {
      body: { email: "invalid@test.com", password: "wrongpassword" },
      expectedStatus: [401, 400],
    })
  );

  // Print results
  console.log("RESULTS:\n");
  let passing = 0;
  let failing = 0;
  let skipped = 0;

  for (const r of results) {
    const icon = r.status === "PASS" ? "[OK]" : r.status === "SKIP" ? "[--]" : "[X]";
    const timing = r.duration ? `(${r.duration}ms)` : "";
    console.log(`${icon} ${r.name.padEnd(35)} ${r.method} ${r.endpoint} ${timing}`);
    if (r.error && r.status === "FAIL") {
      console.log(`    Error: ${r.error}`);
    }

    if (r.status === "PASS") passing++;
    else if (r.status === "FAIL") failing++;
    else skipped++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`SUMMARY: ${passing} PASS, ${failing} FAIL, ${skipped} SKIP`);
  console.log("=".repeat(60));

  // Authenticated tests info
  console.log("\nNote: To run authenticated tests, set:");
  console.log("  TEST_EMAIL=<your-test-email>");
  console.log("  TEST_PASSWORD=<your-test-password>");
  console.log("");

  return failing === 0;
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("API smoke tests failed:", err);
    process.exit(1);
  });
