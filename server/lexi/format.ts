import type { DatabaseStorage } from "../storage";

const SOFT_DISCLAIMER = "Lexi provides education, organization, and research support. It does not provide legal advice or represent you.";

export async function addSoftDisclaimerOncePerThread(
  storage: DatabaseStorage,
  userId: string,
  threadId: string,
  assistantContent: string
): Promise<string> {
  const thread = await storage.getLexiThread(userId, threadId);
  
  if (!thread) {
    return assistantContent;
  }
  
  if (thread.disclaimerShown) {
    return assistantContent;
  }
  
  await storage.markLexiThreadDisclaimerShown(userId, threadId);
  
  return `${SOFT_DISCLAIMER}\n\n${assistantContent}`;
}

export function prependDisclaimerIfNeeded(
  disclaimerShown: boolean,
  content: string
): { content: string; wasAdded: boolean } {
  if (disclaimerShown) {
    return { content, wasAdded: false };
  }
  
  return {
    content: `${SOFT_DISCLAIMER}\n\n${content}`,
    wasAdded: true,
  };
}
