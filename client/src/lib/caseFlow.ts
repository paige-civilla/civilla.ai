export type ModuleKey =
  | "document-library"
  | "evidence"
  | "timeline"
  | "communications"
  | "pattern-analysis"
  | "disclosures"
  | "documents"
  | "exhibits"
  | "deadlines"
  | "case-to-do"
  | "contacts"
  | "children"
  | "child-support"
  | "trial-prep"
  | "parenting-plan";

export const CASE_FLOW: ModuleKey[] = [
  "document-library",
  "evidence",
  "timeline",
  "communications",
  "pattern-analysis",
  "disclosures",
  "documents",
  "parenting-plan",
  "exhibits",
  "deadlines",
  "case-to-do",
  "contacts",
  "children",
  "child-support",
  "trial-prep",
];

const MODULE_LABELS: Record<ModuleKey, string> = {
  "document-library": "Document Library",
  "evidence": "Evidence",
  "timeline": "Timeline",
  "communications": "Message & Call Log",
  "pattern-analysis": "Pattern Analysis",
  "disclosures": "Disclosures",
  "documents": "Document Creator",
  "parenting-plan": "Parenting Plan",
  "exhibits": "Exhibits",
  "deadlines": "Deadlines",
  "case-to-do": "Case To-Do",
  "contacts": "Contacts",
  "children": "Children",
  "child-support": "Child Support (Worksheet Helper)",
  "trial-prep": "Trial Prep",
};

const MODULE_DESCRIPTIONS: Record<ModuleKey, string> = {
  "document-library": "Browse educational templates and forms to help you understand court procedures.",
  "evidence": "Organize and categorize your evidence files for easy reference and court preparation.",
  "timeline": "Build a chronological record of important events to help tell your story clearly.",
  "communications": "Track your messages, calls, and communications for organized record-keeping.",
  "pattern-analysis": "Review communication patterns to identify trends and prepare your narrative.",
  "disclosures": "Manage required document exchanges and track what has been shared.",
  "documents": "Create and customize court documents using educational templates.",
  "parenting-plan": "Document parenting arrangements, schedules, and responsibilities.",
  "exhibits": "Organize evidence into numbered exhibits for court presentations.",
  "deadlines": "Track important dates and court deadlines to stay on schedule.",
  "case-to-do": "Manage your tasks and action items to keep your case organized.",
  "contacts": "Keep track of people involved in your case for easy reference.",
  "children": "Manage information about children involved in your case.",
  "child-support": "Find your state's official child support worksheet/calculator and get an educational estimate.",
  "trial-prep": "Organize your key materials into a structured binder for court hearings.",
};

const MODULE_ROUTES: Record<ModuleKey, string> = {
  "document-library": "library",
  "evidence": "evidence",
  "timeline": "timeline",
  "communications": "communications",
  "pattern-analysis": "patterns",
  "disclosures": "disclosures",
  "documents": "documents",
  "parenting-plan": "parenting-plan",
  "exhibits": "exhibits",
  "deadlines": "deadlines",
  "case-to-do": "tasks",
  "contacts": "contacts",
  "children": "children",
  "child-support": "child-support",
  "trial-prep": "trial-prep",
};

export function moduleLabel(key: ModuleKey): string {
  return MODULE_LABELS[key];
}

export function moduleDescription(key: ModuleKey): string {
  return MODULE_DESCRIPTIONS[key];
}

export function modulePath(key: ModuleKey, caseId?: string): string {
  const route = MODULE_ROUTES[key];
  if (caseId) {
    return `/app/${route}/${caseId}`;
  }
  return `/app/${route}`;
}

export function getNextModule(
  current: ModuleKey,
  opts: { hasChildren: boolean }
): ModuleKey | null {
  const currentIndex = CASE_FLOW.indexOf(current);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < CASE_FLOW.length; i++) {
    const nextKey = CASE_FLOW[i];
    if (!opts.hasChildren && (nextKey === "children" || nextKey === "child-support" || nextKey === "parenting-plan")) {
      continue;
    }
    return nextKey;
  }
  return null;
}

export function getPrevModule(
  current: ModuleKey,
  opts: { hasChildren: boolean }
): ModuleKey | null {
  const currentIndex = CASE_FLOW.indexOf(current);
  if (currentIndex === -1) return null;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevKey = CASE_FLOW[i];
    if (!opts.hasChildren && (prevKey === "children" || prevKey === "child-support" || prevKey === "parenting-plan")) {
      continue;
    }
    return prevKey;
  }
  return null;
}

export function getVisibleModules(opts: { hasChildren: boolean }): ModuleKey[] {
  return CASE_FLOW.filter((key) => {
    if (!opts.hasChildren && (key === "children" || key === "child-support" || key === "parenting-plan")) {
      return false;
    }
    return true;
  });
}
