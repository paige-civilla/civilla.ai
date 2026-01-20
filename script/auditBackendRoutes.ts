#!/usr/bin/env tsx
/**
 * Backend Routes Audit Script
 * Enumerates all registered Express routes
 * 
 * Run: npx tsx script/auditBackendRoutes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  method: string;
  path: string;
  middleware?: string[];
}

const routes: RouteInfo[] = [];

// Parse routes.ts to extract route definitions
async function parseRoutesFile(): Promise<RouteInfo[]> {
  const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
  const content = fs.readFileSync(routesPath, 'utf-8');
  
  // Match patterns like app.get("/api/...", ...) or router.post("/api/...", ...)
  const routePatterns = [
    /app\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /router\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
  ];
  
  const foundRoutes: RouteInfo[] = [];
  
  for (const pattern of routePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      foundRoutes.push({
        method: match[1].toUpperCase(),
        path: match[2],
      });
    }
  }
  
  return foundRoutes;
}

// Also try to discover routes via HTTP probing common patterns
async function probeCommonRoutes(): Promise<RouteInfo[]> {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
  const commonPaths = [
    '/api/health',
    '/api/health/db',
    '/api/health/session',
    '/api/health/timeline',
    '/api/health/evidence',
    '/api/health/documents',
    '/api/health/docx',
    '/api/ai/health',
    '/api/auth/me',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/turnstile-status',
    '/api/profile',
    '/api/cases',
    '/api/turnstile/site-key',
  ];
  
  const discovered: RouteInfo[] = [];
  
  for (const p of commonPaths) {
    try {
      const response = await fetch(`${BASE_URL}${p}`, { method: 'GET' });
      if (response.status !== 404) {
        discovered.push({ method: 'GET', path: p });
      }
    } catch {
      // Ignore network errors
    }
  }
  
  return discovered;
}

async function main() {
  console.log('='.repeat(60));
  console.log('BACKEND ROUTES AUDIT');
  console.log('='.repeat(60));
  console.log('');
  
  // Parse from source
  const parsedRoutes = await parseRoutesFile();
  console.log(`Parsed ${parsedRoutes.length} routes from routes.ts`);
  
  // Probe live routes
  const probed = await probeCommonRoutes();
  console.log(`Probed ${probed.length} common routes`);
  
  // Combine and dedupe
  const allRoutes = [...parsedRoutes];
  const seen = new Set(parsedRoutes.map(r => `${r.method}:${r.path}`));
  
  for (const r of probed) {
    const key = `${r.method}:${r.path}`;
    if (!seen.has(key)) {
      allRoutes.push(r);
      seen.add(key);
    }
  }
  
  // Sort by path
  allRoutes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  
  // Output JSON
  const jsonPath = path.join(process.cwd(), 'audit', 'backend_routes.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allRoutes, null, 2));
  console.log(`\nWrote ${allRoutes.length} routes to ${jsonPath}`);
  
  // Generate markdown table
  let markdown = '\n## Backend Routes (Express API)\n\n';
  markdown += '| Method | Path |\n';
  markdown += '|--------|------|\n';
  for (const r of allRoutes) {
    markdown += `| ${r.method} | ${r.path} |\n`;
  }
  
  console.log('\n' + markdown);
  
  // Return for report generation
  return { routes: allRoutes, markdown };
}

main()
  .then(({ routes }) => {
    console.log(`\nTotal: ${routes.length} backend routes`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Backend routes audit failed:', err);
    process.exit(1);
  });

export { main as auditBackendRoutes };
