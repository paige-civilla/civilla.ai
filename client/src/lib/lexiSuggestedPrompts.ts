export const lexiSuggestedPrompts: Record<string, string[]> = {
  "start-here": [
    "What happens after you're served papers in my state?",
    "What is a petition vs a response?",
    "What is a motion and what does it usually contain?",
    "What is a motion to compel?",
    "What is a motion to amend (and when is it used)?",
    "What is a counter-petition/counterclaim?",
    "What is a motion for sanctions?",
    "What are disclosures vs discovery in my state and what are they called?",
    "Are disclosures/discovery filed with the court or exchanged?",
    "What is an affidavit vs a declaration?",
    "What is a proposed order?",
    "What is proof of service?",
    "What is a motion in limine (generally)?"
  ],
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
  "parenting-plan": [
    "What does my state require in a parenting plan?",
    "What topics are usually included in parenting plans?",
    "How do courts typically structure holiday schedules?",
    "What is the difference between legal and physical custody?"
  ],
};

export type LexiModuleKey = keyof typeof lexiSuggestedPrompts;

export function getDefaultModeForModule(moduleKey: string): "help" | "chat" | "research" {
  if (moduleKey === "start-here" || moduleKey === "disclosures_discovery" || moduleKey === "deadlines") {
    return "research";
  }
  return "help";
}
