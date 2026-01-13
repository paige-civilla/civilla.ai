export interface TourStep {
  id: string;
  anchorId: string;
  title: string;
  body: string;
  lexiPrompt: string;
}

export interface TourModule {
  moduleKey: string;
  steps: TourStep[];
}

export const TOUR_MODULES: Record<string, TourModule> = {
  dashboard: {
    moduleKey: "dashboard",
    steps: [
      {
        id: "dashboard-1",
        anchorId: "tour-dashboard-modules",
        title: "Your case modules",
        body: "Each tile opens a different part of your case. Start with Evidence to upload documents, then Claims to build your arguments.",
        lexiPrompt: "What order should I work through the case modules as a beginner?",
      },
    ],
  },
  "start-here": {
    moduleKey: "start-here",
    steps: [
      {
        id: "start-here-1",
        anchorId: "tour-start-here-next",
        title: "Your next steps",
        body: "This section shows what to do next based on where you are in your case. Follow the suggested actions to stay on track.",
        lexiPrompt: "What should I focus on first when starting my case?",
      },
    ],
  },
  evidence: {
    moduleKey: "evidence",
    steps: [
      {
        id: "evidence-1",
        anchorId: "tour-evidence-upload",
        title: "Upload evidence first",
        body: "Add files here. Civilla extracts text and turns evidence into usable facts.",
        lexiPrompt: "Explain what happens after I upload evidence, in simple steps.",
      },
      {
        id: "evidence-2",
        anchorId: "tour-evidence-analyze",
        title: "Analyze your documents",
        body: "After uploading, click Analyze to have AI review your documents and extract key information.",
        lexiPrompt: "How does AI analysis help with my evidence?",
      },
    ],
  },
  claims: {
    moduleKey: "claims",
    steps: [
      {
        id: "claims-1",
        anchorId: "tour-claims-accept",
        title: "Build your claims",
        body: "Claims are the arguments you'll make. Accept AI suggestions or create your own, then link them to evidence.",
        lexiPrompt: "What makes a strong claim in a family law case?",
      },
    ],
  },
  documents: {
    moduleKey: "documents",
    steps: [
      {
        id: "documents-1",
        anchorId: "tour-docs-compile",
        title: "Generate court documents",
        body: "Use your claims and evidence to automatically create professional court filings.",
        lexiPrompt: "How do I create a declaration using my claims?",
      },
    ],
  },
  "pattern-analysis": {
    moduleKey: "pattern-analysis",
    steps: [
      {
        id: "patterns-1",
        anchorId: "tour-patterns-themes",
        title: "Discover patterns",
        body: "Pattern analysis finds recurring themes across your evidence to strengthen your case narrative.",
        lexiPrompt: "How can pattern analysis help prove my case?",
      },
    ],
  },
  "trial-prep": {
    moduleKey: "trial-prep",
    steps: [
      {
        id: "trialprep-1",
        anchorId: "tour-trialprep-export",
        title: "Prepare for court",
        body: "Organize exhibits, create binders, and export everything you need for trial day.",
        lexiPrompt: "What documents should I prepare for my court hearing?",
      },
    ],
  },
};

export function getTourModule(moduleKey: string): TourModule | undefined {
  return TOUR_MODULES[moduleKey];
}

export function getAllModuleKeys(): string[] {
  return Object.keys(TOUR_MODULES);
}
