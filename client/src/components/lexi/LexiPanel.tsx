import { useEffect, useMemo, useRef, useState } from "react";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const STORAGE_KEY = "civilla_lexi_chat_v1";
const OPEN_KEY = "civilla_lexi_open_v1";

function localExplain(input: string) {
  const q = input.toLowerCase();

  if (q.includes("motion")) {
    return [
      "A Motion is a request you make to the court to do something (or to stop something).",
      "Examples include a Motion to Compel, Motion for Sanctions, Motion to Continue, Motion to Modify, etc.",
      "In Civilla, a Motion template is a general starting format — you'd fill in what you want the judge to order and why.",
      "If you tell me what you're trying to accomplish, I can suggest which kind of motion it usually fits.",
    ].join("\n\n");
  }

  if (q.includes("declaration") || q.includes("affidavit")) {
    return [
      "A Declaration/Affidavit is your written sworn statement of facts.",
      "It's where you explain what happened, with dates and details, and you sign under penalty of perjury (or notarize, depending on requirements).",
      "Declarations often support a Motion by providing the facts that justify what you're asking the court to do.",
    ].join("\n\n");
  }

  if (q.includes("proposed order") || q.includes("order")) {
    return [
      "A Proposed Order is a draft order you want the judge to sign.",
      "Courts often like these because it saves time — you're giving the judge a ready-to-sign version of what you requested.",
      "If the judge agrees, they may sign it as-is or edit it.",
    ].join("\n\n");
  }

  if (q.includes("certificate") || q.includes("service")) {
    return [
      "A Certificate of Service is proof you delivered (served) your document to the other party (or their attorney).",
      "It usually lists what you served, how you served it (mail/hand delivery/e-service), and the date.",
      "Courts often require it any time you file something that must be sent to the other side.",
    ].join("\n\n");
  }

  if (q.includes("docx") || q.includes("court format") || q.includes("court-ready")) {
    return [
      "Court-formatted DOCX is the printable version in the right font/spacing and caption format.",
      "In Civilla the general flow is:",
      "1) Draft (your working text)",
      "2) Review & Edit (confirm caption/signature/date/role)",
      "3) Download Court-Formatted DOCX (court-ready file)",
    ].join("\n");
  }

  return [
    "Tell me what you're filing and why (example: 'I want the court to order him to provide school records').",
    "Then I'll explain which document type fits (Motion vs Declaration vs Proposed Order) and how they usually work together.",
  ].join("\n\n");
}

export default function LexiPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ChatMsg[];
    } catch {
      // ignore
    }
    return [
      {
        id: uid(),
        role: "assistant",
        text:
          "Hi, I'm Lexi. I can explain the differences between Motions, Declarations, Proposed Orders, and Certificates of Service — and how they fit together. What are you trying to file?",
        createdAt: Date.now(),
      },
    ];
  });

  const endRef = useRef<HTMLDivElement | null>(null);
  const title = useMemo(() => "Lexi", []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      if (raw) setOpen(Boolean(JSON.parse(raw)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open));
    } catch {
      // ignore
    }
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMsg = { id: uid(), role: "user", text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const replyText = localExplain(text);

      const botMsg: ChatMsg = { id: uid(), role: "assistant", text: replyText, createdAt: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={open ? "Hide Lexi" : "Show Lexi"}
        data-testid="lexi-toggle"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        className={[
          "fixed right-0 top-1/2 -translate-y-1/2 z-50",
          "h-36 w-10 bg-bush text-white shadow-lg",
          "rounded-l-xl",
          "flex items-center justify-center",
          "cursor-pointer select-none",
          "hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-bush/40",
          open ? "hidden" : "",
        ].join(" ")}
      >
        <span
          className={[
            "font-heading font-semibold tracking-wide",
            "text-sm",
            "[writing-mode:vertical-rl]",
            "[text-orientation:mixed]",
            "rotate-180",
            "leading-none",
          ].join(" ")}
        >
          Lexi
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/0 z-40"
          onClick={() => setOpen(false)}
          data-testid="lexi-overlay"
          aria-hidden="true"
        />
      )}

      <div
        className={[
          "fixed top-0 right-0 h-screen z-50 bg-white border-l border-neutral-light shadow-xl",
          "w-[380px] max-w-[92vw]",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-label="Lexi chat panel"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-light">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-bush/10 flex items-center justify-center text-bush font-semibold">
                L
              </div>
              <div>
                <p className="font-heading font-semibold text-neutral-darkest leading-tight">{title}</p>
                <p className="font-sans text-xs text-neutral-darkest/60 leading-tight">
                  Explain document types • Help you choose
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2 py-1 rounded-md border border-neutral-light text-neutral-darkest/70 hover:text-neutral-darkest"
              data-testid="lexi-close"
              aria-label="Close Lexi"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "rounded-lg px-3 py-2 whitespace-pre-wrap text-sm",
                  m.role === "user"
                    ? "ml-8 bg-bush text-white"
                    : "mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light",
                ].join(" ")}
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-neutral-light p-3">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-neutral-light px-3 py-2 font-sans text-sm outline-none focus:ring-2 focus:ring-bush/30"
                placeholder="Ask Lexi: 'What's a Motion to Compel?'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                data-testid="lexi-input"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !input.trim()}
                className="rounded-md bg-bush text-white px-4 py-2 font-sans text-sm disabled:opacity-50"
                data-testid="lexi-send"
              >
                Send
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-sans text-neutral-darkest/60 hover:text-neutral-darkest"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setMessages([
                    {
                      id: uid(),
                      role: "assistant",
                      text:
                        "Cleared. What do you want to understand about Motions, Declarations, Proposed Orders, or Certificates of Service?",
                      createdAt: Date.now(),
                    },
                  ]);
                }}
                data-testid="lexi-clear"
              >
                Clear chat
              </button>

              <span className="text-xs font-sans text-neutral-darkest/50">
                Education only • Not legal advice
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
