import { 
  FolderOpen, 
  MessageSquare, 
  History, 
  Users, 
  FileSearch, 
  BarChart3, 
  BookOpen, 
  FileEdit, 
  Calendar, 
  CheckSquare, 
  Contact, 
  FileStack,
  Calculator,
  Scale,
  Heart,
  type LucideIcon
} from "lucide-react";

export type ModuleKey = 
  | "evidence"
  | "communications"
  | "timeline"
  | "children"
  | "disclosures"
  | "patterns"
  | "library"
  | "documents"
  | "deadlines"
  | "tasks"
  | "contacts"
  | "exhibits"
  | "child-support"
  | "trial-prep"
  | "parenting-plan";

export type StartingPoint = "served_papers" | "starting_case" | "modifying_enforcing" | "not_sure";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  description: string;
  href: (caseId: string) => string;
  icon: LucideIcon;
  gatedByChildren?: boolean;
  group?: "core" | "planning" | "analysis" | "extras";
}

export const MODULES_REGISTRY: ModuleDef[] = [
  {
    key: "evidence",
    label: "Evidence",
    description: "Upload and organize your documents and files",
    href: (caseId) => `/app/evidence/${caseId}`,
    icon: FolderOpen,
    group: "core",
  },
  {
    key: "communications",
    label: "Message and Call Log",
    description: "Track messages, calls, and interactions",
    href: (caseId) => `/app/communications/${caseId}`,
    icon: MessageSquare,
    group: "core",
  },
  {
    key: "timeline",
    label: "Timeline",
    description: "Build a chronological record of events",
    href: (caseId) => `/app/timeline/${caseId}`,
    icon: History,
    group: "core",
  },
  {
    key: "children",
    label: "Children",
    description: "Manage information about children involved",
    href: (caseId) => `/app/children/${caseId}`,
    icon: Users,
    gatedByChildren: true,
    group: "core",
  },
  {
    key: "disclosures",
    label: "Disclosures and Discovery",
    description: "Track disclosure requests and responses",
    href: (caseId) => `/app/disclosures/${caseId}`,
    icon: FileSearch,
    group: "core",
  },
  {
    key: "patterns",
    label: "Pattern Analysis",
    description: "Identify patterns in communications",
    href: (caseId) => `/app/patterns/${caseId}`,
    icon: BarChart3,
    group: "analysis",
  },
  {
    key: "library",
    label: "Document Library",
    description: "Reference court forms and templates",
    href: (caseId) => `/app/library/${caseId}`,
    icon: BookOpen,
    group: "planning",
  },
  {
    key: "documents",
    label: "Document Creator",
    description: "Create and edit court documents",
    href: (caseId) => `/app/documents/${caseId}`,
    icon: FileEdit,
    group: "planning",
  },
  {
    key: "deadlines",
    label: "Deadlines",
    description: "Track important dates and deadlines",
    href: (caseId) => `/app/deadlines/${caseId}`,
    icon: Calendar,
    group: "planning",
  },
  {
    key: "tasks",
    label: "Case To-Do",
    description: "Manage your case tasks and checklist",
    href: (caseId) => `/app/tasks/${caseId}`,
    icon: CheckSquare,
    group: "planning",
  },
  {
    key: "contacts",
    label: "Contacts",
    description: "Manage contacts related to your case",
    href: (caseId) => `/app/contacts/${caseId}`,
    icon: Contact,
    group: "extras",
  },
  {
    key: "exhibits",
    label: "Exhibits",
    description: "Organize exhibits for court submissions",
    href: (caseId) => `/app/exhibits/${caseId}`,
    icon: FileStack,
    group: "extras",
  },
  {
    key: "child-support",
    label: "Child Support Estimator",
    description: "Estimate child support calculations",
    href: (caseId) => `/app/child-support/${caseId}`,
    icon: Calculator,
    gatedByChildren: true,
    group: "extras",
  },
  {
    key: "trial-prep",
    label: "Trial Prep",
    description: "Organize your binder for court",
    href: (caseId) => `/app/trial-prep/${caseId}`,
    icon: Scale,
    group: "extras",
  },
  {
    key: "parenting-plan",
    label: "Parenting Plan",
    description: "Document parenting arrangements and schedules",
    href: (caseId) => `/app/parenting-plan/${caseId}`,
    icon: Heart,
    gatedByChildren: true,
    group: "planning",
  },
];

const BASE_ORDER: ModuleKey[] = [
  "evidence",
  "communications",
  "timeline",
  "children",
  "disclosures",
  "patterns",
  "library",
  "documents",
  "parenting-plan",
  "deadlines",
  "tasks",
  "contacts",
  "exhibits",
  "child-support",
  "trial-prep",
];

const SERVED_PAPERS_ORDER: ModuleKey[] = [
  "evidence",
  "communications",
  "timeline",
  "children",
  "disclosures",
  "patterns",
  "library",
  "documents",
  "parenting-plan",
  "deadlines",
  "tasks",
  "contacts",
  "exhibits",
  "child-support",
  "trial-prep",
];

const STARTING_CASE_ORDER: ModuleKey[] = [
  "library",
  "documents",
  "parenting-plan",
  "evidence",
  "communications",
  "timeline",
  "children",
  "disclosures",
  "patterns",
  "deadlines",
  "tasks",
  "contacts",
  "exhibits",
  "child-support",
  "trial-prep",
];

const MODIFYING_ENFORCING_ORDER: ModuleKey[] = [
  "timeline",
  "communications",
  "evidence",
  "children",
  "disclosures",
  "patterns",
  "library",
  "documents",
  "parenting-plan",
  "deadlines",
  "tasks",
  "contacts",
  "exhibits",
  "child-support",
  "trial-prep",
];

function getOrderForStartingPoint(startingPoint: StartingPoint): ModuleKey[] {
  switch (startingPoint) {
    case "served_papers":
      return SERVED_PAPERS_ORDER;
    case "starting_case":
      return STARTING_CASE_ORDER;
    case "modifying_enforcing":
      return MODIFYING_ENFORCING_ORDER;
    case "not_sure":
    default:
      return BASE_ORDER;
  }
}

export interface GetOrderedModulesArgs {
  startingPoint: StartingPoint;
  hasChildren: boolean;
}

export function getOrderedModules(args: GetOrderedModulesArgs): ModuleDef[] {
  const { startingPoint, hasChildren } = args;
  const orderedKeys = getOrderForStartingPoint(startingPoint);
  
  const modulesMap = new Map(MODULES_REGISTRY.map(m => [m.key, m]));
  
  return orderedKeys
    .map(key => modulesMap.get(key))
    .filter((m): m is ModuleDef => {
      if (!m) return false;
      if (m.gatedByChildren && !hasChildren) return false;
      return true;
    });
}

export function getNextModule(currentKey: ModuleKey, modules: ModuleDef[]): ModuleDef | null {
  const currentIndex = modules.findIndex(m => m.key === currentKey);
  if (currentIndex === -1 || currentIndex >= modules.length - 1) return null;
  return modules[currentIndex + 1];
}

export function getPrevModule(currentKey: ModuleKey, modules: ModuleDef[]): ModuleDef | null {
  const currentIndex = modules.findIndex(m => m.key === currentKey);
  if (currentIndex <= 0) return null;
  return modules[currentIndex - 1];
}
