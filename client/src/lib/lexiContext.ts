/**
 * Get Lexi module context from the current route pathname.
 * Used for auto-naming threads based on the current page.
 */
export interface LexiModuleContext {
  moduleKey: string;
  defaultTitle: string;
}

const ROUTE_TO_CONTEXT: Record<string, LexiModuleContext> = {
  "dashboard": { moduleKey: "dashboard", defaultTitle: "Dashboard" },
  "evidence": { moduleKey: "evidence", defaultTitle: "Evidence" },
  "timeline": { moduleKey: "timeline", defaultTitle: "Timeline" },
  "documents": { moduleKey: "documents", defaultTitle: "Documents" },
  "patterns": { moduleKey: "patterns", defaultTitle: "Patterns" },
  "trial-prep": { moduleKey: "trial-prep", defaultTitle: "Trial Prep" },
  "exhibits": { moduleKey: "exhibits", defaultTitle: "Exhibits" },
  "children": { moduleKey: "children", defaultTitle: "Children" },
  "child-support": { moduleKey: "child-support", defaultTitle: "Child Support" },
  "parenting-plan": { moduleKey: "parenting-plan", defaultTitle: "Parenting Plan" },
  "start-here": { moduleKey: "start-here", defaultTitle: "Start Here" },
  "deadlines": { moduleKey: "deadlines", defaultTitle: "Deadlines" },
  "tasks": { moduleKey: "tasks", defaultTitle: "Tasks" },
  "contacts": { moduleKey: "contacts", defaultTitle: "Contacts" },
  "communications": { moduleKey: "communications", defaultTitle: "Communications" },
  "library": { moduleKey: "library", defaultTitle: "Library" },
  "case-settings": { moduleKey: "case-settings", defaultTitle: "Case Settings" },
  "account": { moduleKey: "account", defaultTitle: "Account" },
};

const DEFAULT_CONTEXT: LexiModuleContext = {
  moduleKey: "general",
  defaultTitle: "Lexi",
};

export function getLexiContextFromRoute(pathname: string): LexiModuleContext {
  // Check for each route pattern
  for (const [key, context] of Object.entries(ROUTE_TO_CONTEXT)) {
    if (pathname.includes(`/${key}`)) {
      return context;
    }
  }
  return DEFAULT_CONTEXT;
}

export function extractCaseIdFromRoute(pathname: string): string | null {
  const match = pathname.match(/\/cases\/([^/]+)/);
  return match ? match[1] : null;
}
