#!/usr/bin/env tsx
/**
 * Frontend Routes Audit Script
 * Parses client/src/App.tsx to extract React Router routes
 * 
 * Run: npx tsx script/auditFrontendRoutes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FrontendRoute {
  path: string;
  component: string;
  type: 'page' | 'redirect' | 'case-redirect';
}

async function parseFrontendRoutes(): Promise<FrontendRoute[]> {
  const appPath = path.join(process.cwd(), 'client', 'src', 'App.tsx');
  const content = fs.readFileSync(appPath, 'utf-8');
  
  const routes: FrontendRoute[] = [];
  
  // Match <Route path="..." component={...} />
  const componentPattern = /<Route\s+path=["']([^"']+)["']\s+component=\{([^}]+)\}/g;
  let match;
  while ((match = componentPattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      component: match[2],
      type: 'page',
    });
  }
  
  // Match <Route path="...">{() => <Redirect to="..." />}</Route>
  const redirectPattern = /<Route\s+path=["']([^"']+)["'][^>]*>\{\(\)\s*=>\s*<Redirect\s+to=["']([^"']+)["']/g;
  while ((match = redirectPattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      component: `Redirect → ${match[2]}`,
      type: 'redirect',
    });
  }
  
  // Match <Route path="...">{() => <CaseRedirect targetPath="..." />}</Route>
  const caseRedirectPattern = /<Route\s+path=["']([^"']+)["'][^>]*>\{\(\)\s*=>\s*<CaseRedirect\s+targetPath=["']([^"']+)["']/g;
  while ((match = caseRedirectPattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      component: `CaseRedirect → ${match[2]}`,
      type: 'case-redirect',
    });
  }
  
  // Match <Route path="...">{({ caseId }) => <Redirect to={`/app/${match}/${caseId}`} />}</Route>
  const paramRedirectPattern = /<Route\s+path=["']([^"']+)["'][^>]*>\{\(\{[^}]+\}\)\s*=>\s*<Redirect\s+to=\{[^}]+\}/g;
  while ((match = paramRedirectPattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      component: 'Dynamic Redirect',
      type: 'redirect',
    });
  }
  
  return routes;
}

async function main() {
  console.log('='.repeat(60));
  console.log('FRONTEND ROUTES AUDIT');
  console.log('='.repeat(60));
  console.log('');
  
  const routes = await parseFrontendRoutes();
  console.log(`Found ${routes.length} frontend routes`);
  
  // Categorize routes
  const marketing = routes.filter(r => !r.path.startsWith('/app') && !r.path.startsWith('/admin'));
  const app = routes.filter(r => r.path.startsWith('/app'));
  const auth = routes.filter(r => ['/login', '/register', '/admin-login'].includes(r.path));
  
  // Output JSON
  const jsonPath = path.join(process.cwd(), 'audit', 'frontend_routes.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ routes, marketing, app, auth }, null, 2));
  console.log(`Wrote to ${jsonPath}`);
  
  // Generate markdown
  let markdown = '\n## Frontend Routes (React/Wouter)\n\n';
  
  markdown += '### Marketing Pages\n\n';
  markdown += '| Path | Component |\n';
  markdown += '|------|----------|\n';
  for (const r of marketing) {
    markdown += `| ${r.path} | ${r.component} |\n`;
  }
  
  markdown += '\n### App Pages (Authenticated)\n\n';
  markdown += '| Path | Component | Type |\n';
  markdown += '|------|----------|------|\n';
  for (const r of app) {
    markdown += `| ${r.path} | ${r.component} | ${r.type} |\n`;
  }
  
  console.log(markdown);
  
  return { routes, markdown };
}

main()
  .then(({ routes }) => {
    console.log(`\nTotal: ${routes.length} frontend routes`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Frontend routes audit failed:', err);
    process.exit(1);
  });

export { main as auditFrontendRoutes };
