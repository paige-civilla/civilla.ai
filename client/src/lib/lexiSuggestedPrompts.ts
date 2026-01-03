export const lexiSuggestedPrompts: Record<string, string[]> = {
  timeline: [
    "What belongs on a court timeline?",
    "How should I phrase events so they stay factual?",
    "What timeline categories are common in family cases?",
    "What should I add first if I'm starting late?"
  ],
  disclosures_discovery: [
    "What is the difference between disclosures and discovery?",
    "What does my state call mandatory disclosures?",
    "When are disclosures due in my state?",
    "What discovery tools exist (interrogatories, requests for production, subpoenas)?"
  ],
  deadlines: [
    "What deadlines usually matter early in a family case?",
    "How do I calculate deadlines from a service date?",
    "What is the difference between 'filed by' and 'served by'?"
  ],
  evidence: [
    "What makes evidence useful in court (without over-sharing)?",
    "How should I name and tag files so they're easy to find later?"
  ],
  documents: [
    "What is the difference between a motion, declaration, affidavit, and proposed order?",
    "What details usually go in a certificate of service?"
  ],
  communications: [
    "What should I log after a call or email?",
    "How do I track follow-ups so nothing gets missed?"
  ],
};

export type LexiModuleKey = keyof typeof lexiSuggestedPrompts;

export function getDefaultModeForModule(moduleKey: string): "help" | "chat" | "research" {
  if (moduleKey === "disclosures_discovery" || moduleKey === "deadlines") {
    return "research";
  }
  return "help";
}
