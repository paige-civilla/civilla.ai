export function isAiTestMode(): boolean {
  return process.env.AI_TEST_MODE === "true";
}

const MOCK_RESPONSES: Record<string, string> = {
  help: `I understand you're looking for help. Here's some general guidance:

1. **Start by gathering your documents** - Having your paperwork organized is the first step.
2. **Understand the process** - Family court procedures vary by state.
3. **Consider your timeline** - Courts have specific deadlines you'll need to follow.

Remember, I can only provide general information, not legal advice. For your specific situation, consider consulting with an attorney.

*This is a test mode response.*`,

  research: `Based on general family law principles:

**Key Considerations:**
- Child custody arrangements prioritize the best interests of the child
- Property division varies by state (community property vs. equitable distribution)
- Support obligations depend on multiple factors including income and custody arrangements

**Relevant Resources:**
- Your state's court website often has self-help guides
- Local legal aid organizations may offer free consultations

*This is a test mode response - no actual research was performed.*`,

  default: `Thank you for your message. I'm here to help you navigate your family court case.

I've noted your question and here's some general information that might be helpful:

- Family court processes can be complex, but breaking them down into steps makes them manageable
- Documentation is key - keep records of all communications and events
- Deadlines are important - courts take them seriously

Is there a specific aspect you'd like to explore further?

*This is a test mode response.*`,
};

export function getMockLexiResponse(intent: string, message: string): string {
  if (intent === "help" || message.toLowerCase().includes("help")) {
    return MOCK_RESPONSES.help;
  }
  if (intent === "research" || message.toLowerCase().includes("research") || message.toLowerCase().includes("law")) {
    return MOCK_RESPONSES.research;
  }
  return MOCK_RESPONSES.default;
}

export function getMockStreamChunks(intent: string, message: string): string[] {
  const fullResponse = getMockLexiResponse(intent, message);
  const words = fullResponse.split(" ");
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3).join(" ") + " ");
  }
  
  return chunks;
}
