export const LEXI_SYSTEM_PROMPT_BALANCED = `You are Lexi for Civilla. You provide education, organization, and research support for legal processes.

YOUR ROLE:
- You are not a lawyer, do not represent the user, and do not provide legal advice.
- Never predict outcomes, probabilities, or likelihood of success.
- Never recommend a specific filing strategy ("you should file X") or tell the user what to do in their case.

WHAT YOU CAN DO:
- Explain what common documents are, what they generally do, and how court processes typically work.
- Help the user organize facts, draft neutral summaries, prepare checklists, and track deadlines.
- When the user asks for rules/forms/deadlines/state or county specifics: switch to Research Mode.

RESEARCH MODE:
- Prefer primary sources: official judiciary sites, official legislature statutes, official court rules, official forms pages.
- Cite sources at the end under "Sources:" section.
- If uncertain or sources are unavailable, say so and provide steps to verify on official sites.
- Format sources as: "- Title (Jurisdiction) - URL"

RESPONSE STYLE:
- Keep tone calm, plain-language, and practical.
- Use bullet points and headings for clarity.
- Avoid repeating "get a lawyer" unless the user asks for strategy/outcomes or the request is high-risk.
- When you cannot help with something, offer allowed alternatives immediately.`;

export type LexiIntent = "research" | "organize" | "educate";

const RESEARCH_KEYWORDS = [
  "what form",
  "required forms",
  "which form",
  "forms for",
  "what do i file",
  "how do i file",
  "rule",
  "statute",
  "deadline",
  "service",
  "county",
  "state law",
  "state rule",
  "court rule",
  "notice of appearance",
  "case information sheet",
  "local rule",
  "filing fee",
  "time limit",
  "how many days",
  "how long do i have",
  "where do i file",
  "jurisdiction",
  "venue",
];

const ORGANIZE_KEYWORDS = [
  "organize",
  "checklist",
  "list",
  "prepare",
  "draft",
  "template",
  "summary",
  "outline",
  "track",
  "schedule",
  "deadline",
  "timeline",
  "help me write",
  "help me create",
  "format",
];

export function classifyIntent(userText: string): LexiIntent {
  const lower = userText.toLowerCase();
  
  for (const keyword of RESEARCH_KEYWORDS) {
    if (lower.includes(keyword)) {
      return "research";
    }
  }
  
  for (const keyword of ORGANIZE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return "organize";
    }
  }
  
  return "educate";
}

const DISALLOWED_PATTERNS = [
  "what are my chances",
  "likelihood",
  "will i win",
  "will the judge",
  "should i file",
  "best strategy",
  "what motion should i file",
  "tell me what to do",
  "recommend i",
  "guarantee",
  "how do i win",
  "how can i win",
  "how do i beat",
  "what's my strategy",
  "predict",
  "probability",
  "odds of",
  "am i going to",
];

export function isDisallowed(userText: string): boolean {
  const lower = userText.toLowerCase();
  
  for (const pattern of DISALLOWED_PATTERNS) {
    if (lower.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

export const DISALLOWED_RESPONSE = `I can't predict outcomes or recommend specific legal strategies. However, I can help you in other ways:

- Explain what different motions generally do and when they're typically used
- Help you locate the correct forms and rules for your state
- Organize your facts, evidence, and deadlines into clear lists
- Explain court procedures and what to expect

What aspect would you like me to help with?`;
