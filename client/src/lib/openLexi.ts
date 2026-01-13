export function openLexiAndSend(message: string, moduleKey?: string) {
  const event = new CustomEvent("lexi:ask", {
    detail: { text: message, moduleKey },
  });
  window.dispatchEvent(event);
}

export function openLexiPanel() {
  const event = new CustomEvent("openLexiHelp");
  window.dispatchEvent(event);
}
