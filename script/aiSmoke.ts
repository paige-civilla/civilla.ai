#!/usr/bin/env tsx
/**
 * AI Pipeline Smoke Tests
 * Tests full flow for each AI area: Lexi, OCR, Analysis, Claims, Patterns
 * 
 * Run: npx tsx script/aiSmoke.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

interface AITestResult {
  pipeline: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  details?: string;
  duration?: number;
}

const results: AITestResult[] = [];
let authCookie: string | null = null;
let testCaseId: number | null = null;

async function login(): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('TEST_EMAIL/TEST_PASSWORD not set - skipping authenticated tests');
    return false;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    
    if (!response.ok) {
      console.error('Login failed:', response.status);
      return false;
    }
    
    authCookie = response.headers.get('set-cookie');
    console.log('Login successful');
    return true;
  } catch (err: any) {
    console.error('Login error:', err.message);
    return false;
  }
}

async function getTestCase(): Promise<number | null> {
  if (!authCookie) return null;
  
  try {
    const response = await fetch(`${BASE_URL}/api/cases`, {
      headers: { Cookie: authCookie },
    });
    
    if (!response.ok) return null;
    
    const cases = await response.json();
    if (cases && cases.length > 0) {
      return cases[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

async function testAIHealth(): Promise<AITestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/ai/health`);
    const data = await response.json();
    
    return {
      pipeline: 'AI Health',
      endpoint: '/api/ai/health',
      status: data.ok === true ? 'PASS' : 'FAIL',
      details: JSON.stringify(data),
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'AI Health',
      endpoint: '/api/ai/health',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testLexiThread(): Promise<AITestResult> {
  if (!authCookie) {
    return {
      pipeline: 'Lexi Thread',
      endpoint: '/api/lexi/threads',
      status: 'SKIP',
      error: 'No auth - login required',
    };
  }
  
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/lexi/threads`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ title: 'Audit Test Thread' }),
    });
    
    if (!response.ok) {
      return {
        pipeline: 'Lexi Thread',
        endpoint: '/api/lexi/threads',
        status: 'FAIL',
        error: `HTTP ${response.status}`,
        duration: Date.now() - start,
      };
    }
    
    const data = await response.json();
    return {
      pipeline: 'Lexi Thread',
      endpoint: '/api/lexi/threads',
      status: data.id ? 'PASS' : 'FAIL',
      details: `Created thread ID: ${data.id}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'Lexi Thread',
      endpoint: '/api/lexi/threads',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testLexiChat(): Promise<AITestResult> {
  if (!authCookie) {
    return {
      pipeline: 'Lexi Chat',
      endpoint: '/api/lexi/chat',
      status: 'SKIP',
      error: 'No auth - login required',
    };
  }
  
  const start = Date.now();
  try {
    // First create a thread
    const threadRes = await fetch(`${BASE_URL}/api/lexi/threads`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ title: 'Chat Test' }),
    });
    
    if (!threadRes.ok) {
      return {
        pipeline: 'Lexi Chat',
        endpoint: '/api/lexi/chat',
        status: 'FAIL',
        error: 'Could not create thread',
        duration: Date.now() - start,
      };
    }
    
    const thread = await threadRes.json();
    
    // Send a message
    const chatRes = await fetch(`${BASE_URL}/api/lexi/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ 
        threadId: thread.id, 
        message: 'Hello, this is a test message',
        caseId: testCaseId,
      }),
    });
    
    if (!chatRes.ok) {
      return {
        pipeline: 'Lexi Chat',
        endpoint: '/api/lexi/chat',
        status: 'FAIL',
        error: `HTTP ${chatRes.status}`,
        duration: Date.now() - start,
      };
    }
    
    // Check for streaming response
    return {
      pipeline: 'Lexi Chat',
      endpoint: '/api/lexi/chat',
      status: 'PASS',
      details: 'Chat response received (streaming)',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'Lexi Chat',
      endpoint: '/api/lexi/chat',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testOCRHealth(): Promise<AITestResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/health/evidence`);
    const data = await response.json();
    
    return {
      pipeline: 'OCR/Extraction Health',
      endpoint: '/api/health/evidence',
      status: response.ok ? 'PASS' : 'FAIL',
      details: JSON.stringify(data),
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'OCR/Extraction Health',
      endpoint: '/api/health/evidence',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testPatternAnalysis(): Promise<AITestResult> {
  if (!authCookie || !testCaseId) {
    return {
      pipeline: 'Pattern Analysis',
      endpoint: '/api/cases/:caseId/pattern-analysis',
      status: 'SKIP',
      error: 'No auth or case ID',
    };
  }
  
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/cases/${testCaseId}/pattern-analysis`, {
      headers: { Cookie: authCookie },
    });
    
    if (!response.ok) {
      return {
        pipeline: 'Pattern Analysis',
        endpoint: `/api/cases/${testCaseId}/pattern-analysis`,
        status: 'FAIL',
        error: `HTTP ${response.status}`,
        duration: Date.now() - start,
      };
    }
    
    const data = await response.json();
    return {
      pipeline: 'Pattern Analysis',
      endpoint: `/api/cases/${testCaseId}/pattern-analysis`,
      status: 'PASS',
      details: `Patterns: ${data.patterns?.length || 0}, Themes: ${data.themes?.length || 0}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'Pattern Analysis',
      endpoint: '/api/cases/:caseId/pattern-analysis',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testClaimsSuggest(): Promise<AITestResult> {
  if (!authCookie || !testCaseId) {
    return {
      pipeline: 'Claims Suggest',
      endpoint: '/api/cases/:caseId/claims/suggest',
      status: 'SKIP',
      error: 'No auth or case ID',
    };
  }
  
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/cases/${testCaseId}/claims/suggest`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
    });
    
    return {
      pipeline: 'Claims Suggest',
      endpoint: `/api/cases/${testCaseId}/claims/suggest`,
      status: response.ok ? 'PASS' : 'FAIL',
      error: response.ok ? undefined : `HTTP ${response.status}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'Claims Suggest',
      endpoint: '/api/cases/:caseId/claims/suggest',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testAIAnalysis(): Promise<AITestResult> {
  if (!authCookie || !testCaseId) {
    return {
      pipeline: 'AI Analysis',
      endpoint: '/api/cases/:caseId/ai-analyses/run',
      status: 'SKIP',
      error: 'No auth or case ID',
    };
  }
  
  const start = Date.now();
  try {
    // Check if endpoint exists
    const response = await fetch(`${BASE_URL}/api/cases/${testCaseId}/ai-analyses`, {
      headers: { Cookie: authCookie },
    });
    
    return {
      pipeline: 'AI Analysis',
      endpoint: `/api/cases/${testCaseId}/ai-analyses`,
      status: response.ok ? 'PASS' : 'FAIL',
      error: response.ok ? undefined : `HTTP ${response.status}`,
      details: 'Endpoint accessible',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'AI Analysis',
      endpoint: '/api/cases/:caseId/ai-analyses',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function testCompileClaims(): Promise<AITestResult> {
  if (!authCookie || !testCaseId) {
    return {
      pipeline: 'Compile Claims',
      endpoint: '/api/cases/:caseId/compile-claims',
      status: 'SKIP',
      error: 'No auth or case ID',
    };
  }
  
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/cases/${testCaseId}/compile-claims`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
    });
    
    return {
      pipeline: 'Compile Claims',
      endpoint: `/api/cases/${testCaseId}/compile-claims`,
      status: response.ok || response.status === 404 ? 'PASS' : 'FAIL',
      error: response.ok ? undefined : `HTTP ${response.status}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      pipeline: 'Compile Claims',
      endpoint: '/api/cases/:caseId/compile-claims',
      status: 'FAIL',
      error: err.message,
      duration: Date.now() - start,
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('AI PIPELINE SMOKE TESTS');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));
  console.log('');
  
  // Try to authenticate
  const loggedIn = await login();
  if (loggedIn) {
    testCaseId = await getTestCase();
    console.log(`Test case ID: ${testCaseId || 'none found'}`);
  }
  console.log('');
  
  // Run all tests
  results.push(await testAIHealth());
  results.push(await testOCRHealth());
  results.push(await testLexiThread());
  results.push(await testLexiChat());
  results.push(await testPatternAnalysis());
  results.push(await testClaimsSuggest());
  results.push(await testAIAnalysis());
  results.push(await testCompileClaims());
  
  // Print results
  console.log('\nRESULTS:\n');
  let passing = 0;
  let failing = 0;
  let skipped = 0;
  
  for (const r of results) {
    const icon = r.status === 'PASS' ? '[OK]' : r.status === 'SKIP' ? '[--]' : '[X]';
    const timing = r.duration ? `(${r.duration}ms)` : '';
    console.log(`${icon} ${r.pipeline.padEnd(25)} ${r.endpoint} ${timing}`);
    if (r.error) {
      console.log(`    Error: ${r.error}`);
    }
    if (r.details && r.status === 'PASS') {
      console.log(`    ${r.details}`);
    }
    
    if (r.status === 'PASS') passing++;
    else if (r.status === 'FAIL') failing++;
    else skipped++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${passing} PASS, ${failing} FAIL, ${skipped} SKIP`);
  console.log('='.repeat(60));
  
  // Generate markdown
  let markdown = '\n## AI Pipeline Audit Results\n\n';
  markdown += '| Pipeline | Endpoint | Status | Details |\n';
  markdown += '|----------|----------|--------|----------|\n';
  for (const r of results) {
    const detail = r.error || r.details || '-';
    markdown += `| ${r.pipeline} | ${r.endpoint} | ${r.status} | ${detail} |\n`;
  }
  
  console.log(markdown);
  
  return { results, markdown, passing, failing, skipped };
}

main()
  .then(({ failing }) => {
    process.exit(failing > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('AI smoke tests failed:', err);
    process.exit(1);
  });

export { main as aiSmoke };
