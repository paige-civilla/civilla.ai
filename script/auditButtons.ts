import * as fs from 'fs';
import * as path from 'path';

interface ButtonInfo {
  page: string;
  route: string;
  element: string;
  action: string;
  destination: string;
  testId?: string;
}

const pagesDir = 'client/src/pages';
const componentsDir = 'client/src/components';

// Route mappings from App.tsx
const routeMap: Record<string, string> = {
  'Home.tsx': '/',
  'Login.tsx': '/login',
  'Register.tsx': '/register',
  'Plans.tsx': '/plans',
  'FAQ.tsx': '/faq',
  'Contact.tsx': '/contact',
  'HowCivillaWorks.tsx': '/how-civilla-works',
  'MeetTheFounders.tsx': '/meet-the-founders',
  'OurMission.tsx': '/our-mission',
  'LegalCompliance.tsx': '/legal-compliance',
  'PrivacyPolicy.tsx': '/privacy-policy',
  'SafetySupport.tsx': '/safety-support',
  'Accessibility.tsx': '/accessibility',
  'TermsOfService.tsx': '/terms',
  'Careers.tsx': '/careers',
  'WallOfWins.tsx': '/wall-of-wins',
  'OnboardingLite.tsx': '/app/onboarding',
  'LexiIntake.tsx': '/app/lexi-intake',
  'AppStartHere.tsx': '/app/start-here',
  'AppDashboard.tsx': '/app/dashboard',
  'AppEvidence.tsx': '/app/evidence',
  'AppDocuments.tsx': '/app/documents',
  'AppTimeline.tsx': '/app/timeline',
  'AppPatterns.tsx': '/app/patterns',
  'AppMessages.tsx': '/app/messages',
  'AppCase.tsx': '/app/case',
  'AppCases.tsx': '/app/cases',
  'AppChildren.tsx': '/app/children',
  'AppContacts.tsx': '/app/contacts',
  'AppDeadlines.tsx': '/app/deadlines',
  'AppTasks.tsx': '/app/tasks',
  'AppDisclosures.tsx': '/app/disclosures',
  'AppTrialPrep.tsx': '/app/trial-prep',
  'AppParentingPlan.tsx': '/app/parenting-plan',
  'AppCourtForms.tsx': '/app/court-forms',
  'AppChildSupport.tsx': '/app/child-support',
  'AppCommunications.tsx': '/app/communications',
  'AppAccountSettings.tsx': '/app/account-settings',
  'AppCaseSettings.tsx': '/app/case-settings',
  'AppExhibits.tsx': '/app/exhibits',
  'AppDocumentLibrary.tsx': '/app/document-library',
  'AppGrantDashboard.tsx': '/app/grant-dashboard',
  'AppAdminDashboard.tsx': '/admin',
  'AttorneyPortal.tsx': '/attorney',
};

function extractButtons(content: string, fileName: string): ButtonInfo[] {
  const buttons: ButtonInfo[] = [];
  const route = routeMap[fileName] || `/${fileName.replace('.tsx', '').toLowerCase()}`;
  
  // Match Button components with onClick or as Link
  const buttonRegex = /<Button[^>]*(?:onClick|asChild)[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/Button>/gs;
  const linkRegex = /<Link[^>]*to=["']([^"']+)["'][^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/Link>/gs;
  const aTagRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gs;
  const routerNavigateRegex = /(?:navigate|setLocation|useLocation\(\)\[1\])\(["']([^"']+)["']\)/g;
  const windowLocationRegex = /window\.location\.href\s*=\s*["']([^"']+)["']/g;
  
  // Find data-testid
  const testIdRegex = /data-testid=["']([^"']+)["']/g;
  
  // Extract Link components
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const destination = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim().substring(0, 50);
    buttons.push({
      page: fileName,
      route,
      element: 'Link',
      action: 'navigate',
      destination,
      testId: undefined
    });
  }
  
  // Extract <a> tags
  while ((match = aTagRegex.exec(content)) !== null) {
    const destination = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim().substring(0, 50);
    if (!destination.startsWith('#') && !destination.startsWith('mailto:') && !destination.startsWith('tel:')) {
      buttons.push({
        page: fileName,
        route,
        element: 'a',
        action: destination.startsWith('http') ? 'external' : 'navigate',
        destination,
      });
    }
  }
  
  // Extract programmatic navigation
  while ((match = routerNavigateRegex.exec(content)) !== null) {
    buttons.push({
      page: fileName,
      route,
      element: 'Button',
      action: 'navigate (programmatic)',
      destination: match[1],
    });
  }
  
  while ((match = windowLocationRegex.exec(content)) !== null) {
    buttons.push({
      page: fileName,
      route,
      element: 'Button',
      action: 'redirect',
      destination: match[1],
    });
  }
  
  // Find mutation calls (API actions)
  const mutationRegex = /useMutation[^}]*mutationFn:[^}]*(?:apiRequest|fetch)\(["']([^"']+)["']/gs;
  while ((match = mutationRegex.exec(content)) !== null) {
    buttons.push({
      page: fileName,
      route,
      element: 'Button',
      action: 'API call',
      destination: match[1],
    });
  }
  
  // Find form submissions
  if (content.includes('onSubmit') || content.includes('handleSubmit')) {
    buttons.push({
      page: fileName,
      route,
      element: 'Form',
      action: 'submit',
      destination: 'form handler',
    });
  }
  
  return buttons;
}

function scanDirectory(dir: string): ButtonInfo[] {
  const allButtons: ButtonInfo[] = [];
  
  if (!fs.existsSync(dir)) return allButtons;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      allButtons.push(...scanDirectory(filePath));
    } else if (file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      allButtons.push(...extractButtons(content, file));
    }
  }
  
  return allButtons;
}

// Scan pages
const pageButtons = scanDirectory(pagesDir);

// Group by page route
const byRoute: Record<string, ButtonInfo[]> = {};
for (const btn of pageButtons) {
  if (!byRoute[btn.route]) byRoute[btn.route] = [];
  byRoute[btn.route].push(btn);
}

// Output as markdown
console.log('# Button & Link Audit Report\n');
console.log(`Generated: ${new Date().toISOString()}\n`);
console.log(`Total interactive elements found: ${pageButtons.length}\n`);

// Marketing pages
console.log('## Marketing Pages\n');
const marketingRoutes = ['/', '/login', '/register', '/plans', '/faq', '/contact', '/how-civilla-works', '/meet-the-founders', '/our-mission', '/legal-compliance', '/privacy-policy', '/safety-support', '/accessibility', '/terms', '/careers', '/wall-of-wins'];

for (const route of marketingRoutes) {
  const items = byRoute[route] || [];
  console.log(`### ${route}\n`);
  if (items.length === 0) {
    console.log('No navigation elements detected in code scan.\n');
  } else {
    console.log('| Element | Action | Destination |');
    console.log('|---------|--------|-------------|');
    for (const item of items) {
      console.log(`| ${item.element} | ${item.action} | ${item.destination} |`);
    }
    console.log('');
  }
}

// App pages
console.log('## App Pages\n');
const appRoutes = Object.values(routeMap).filter(r => r.startsWith('/app') || r.startsWith('/admin') || r.startsWith('/attorney'));

for (const route of appRoutes.sort()) {
  const items = byRoute[route] || [];
  console.log(`### ${route}\n`);
  if (items.length === 0) {
    console.log('No navigation elements detected in code scan.\n');
  } else {
    console.log('| Element | Action | Destination |');
    console.log('|---------|--------|-------------|');
    for (const item of items) {
      console.log(`| ${item.element} | ${item.action} | ${item.destination} |`);
    }
    console.log('');
  }
}

// Write JSON for further processing
fs.mkdirSync('audit', { recursive: true });
fs.writeFileSync('audit/buttons_audit.json', JSON.stringify(pageButtons, null, 2));
console.log('\nJSON output written to audit/buttons_audit.json');
