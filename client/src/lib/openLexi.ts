export function openLexiAndSend(message: string, moduleKey?: string) {
  const event = new CustomEvent("lexi:send", {
    detail: { message, moduleKey },
  });
  window.dispatchEvent(event);
}

export function openLexiPanel() {
  const event = new CustomEvent("lexi:open");
  window.dispatchEvent(event);
}
