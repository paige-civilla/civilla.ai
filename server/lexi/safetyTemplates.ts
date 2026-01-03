export const SAFETY_TEMPLATES = {
  UPL_REQUEST: `I understand you're looking for guidance on what to do. While I can't tell you what you "should" do (that would be legal advice), I can:

- Explain your options and what each typically involves
- Describe the documents that might be relevant and what they contain
- Help you understand the procedural requirements
- Walk you through how courts generally handle similar situations

What specific aspect would you like me to explain?`,

  STRATEGY_REQUEST: `I can see you're thinking about strategy, which makes sense given what's at stake. Since I'm an educational assistant and not a lawyer, I can't recommend a specific legal strategy or predict outcomes.

What I CAN do:
- Explain the procedural options available in situations like yours
- Describe what each type of filing typically involves
- Help you organize your facts and evidence
- Explain how courts generally approach these matters

For strategy decisions, you may want to consult with a family law attorney who can review your specific situation. Would you like me to explain any of the procedural aspects?`,

  OUTCOME_PREDICTION: `I appreciate you asking, but I can't predict what a judge will decide or estimate your chances of success. Every case is unique, and outcomes depend on many factors that only a qualified attorney reviewing all the facts could properly assess.

What I can help with:
- Explaining how courts typically evaluate these matters
- What factors judges generally consider
- How to organize and present your information clearly
- What documents are typically involved

Would any of that be helpful?`,

  ILLEGAL_CONTENT: `I'm not able to help with that request. If you have questions about court procedures, filing requirements, or organizing your case materials, I'm happy to assist with those topics.`,

  SELF_HARM: `I'm concerned about what you've shared. If you're having thoughts of hurting yourself, please reach out to a crisis helpline:

National Suicide Prevention Lifeline: 988 (call or text)
Crisis Text Line: Text HOME to 741741

If you're in immediate danger, please call 911 or go to your nearest emergency room.

Once you're feeling safer, I'm here to help with any questions about your case.`,

  MODERATION_BLOCKED: `I wasn't able to process that message. Could you try rephrasing your question? I'm here to help with questions about court procedures, documents, and case organization.`,
} as const;

export type SafetyTemplateKey = keyof typeof SAFETY_TEMPLATES;

export function shouldBlockMessage(moderationResult: {
  flagged: boolean;
  categories: Record<string, boolean>;
}): { blocked: boolean; template?: SafetyTemplateKey } {
  if (!moderationResult.flagged) {
    return { blocked: false };
  }

  if (moderationResult.categories["self-harm"] || moderationResult.categories["self-harm/intent"]) {
    return { blocked: true, template: "SELF_HARM" };
  }

  if (moderationResult.categories["violence"] || moderationResult.categories["harassment"]) {
    return { blocked: true, template: "ILLEGAL_CONTENT" };
  }

  return { blocked: true, template: "MODERATION_BLOCKED" };
}

export function detectUPLRequest(message: string): SafetyTemplateKey | null {
  const lower = message.toLowerCase();
  
  if (
    lower.includes("should i file") ||
    lower.includes("what should i do") ||
    lower.includes("tell me what to file") ||
    lower.includes("what's my best option") ||
    lower.includes("recommend")
  ) {
    return "UPL_REQUEST";
  }

  if (
    lower.includes("what are my chances") ||
    lower.includes("will i win") ||
    lower.includes("will the judge") ||
    lower.includes("likelihood") ||
    lower.includes("odds of")
  ) {
    return "OUTCOME_PREDICTION";
  }

  if (
    lower.includes("what's my strategy") ||
    lower.includes("how do i beat") ||
    lower.includes("how can i win")
  ) {
    return "STRATEGY_REQUEST";
  }

  return null;
}
