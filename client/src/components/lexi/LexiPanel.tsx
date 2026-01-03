import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { getLexiHelp, type LexiHelpContent } from "@/lib/lexiHelpContent";
import { HelpCircle, MessageSquare } from "lucide-react";

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

function getRouteKey(path: string): string {
  if (path.includes("/dashboard")) return "dashboard";
  if (path.includes("/library")) return "library";
  if (path.includes("/documents")) return "documents";
  if (path.includes("/timeline")) return "timeline";
  if (path.includes("/evidence")) return "evidence";
  if (path.includes("/exhibits")) return "exhibits";
  if (path.includes("/tasks")) return "tasks";
  if (path.includes("/deadlines")) return "deadlines";
  if (path.includes("/patterns")) return "patterns";
  if (path.includes("/contacts")) return "contacts";
  if (path.includes("/communications")) return "communications";
  if (path.includes("/children")) return "children";
  if (path.includes("/case-settings")) return "settings";
  if (path.includes("/account")) return "account";
  return "dashboard";
}

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
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"help" | "chat">("help");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedDocKey, setSelectedDocKey] = useState<string | undefined>();

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
  const routeKey = getRouteKey(location);

  const helpContent: LexiHelpContent = useMemo(() => {
    return getLexiHelp({ routeKey, selectedDocKey });
  }, [routeKey, selectedDocKey]);

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
    if (open && mode === "chat") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages.length, mode]);

  useEffect(() => {
    const handleOpenHelp = (e: CustomEvent<{ docKey?: string }>) => {
      setOpen(true);
      setMode("help");
      if (e.detail?.docKey) {
        setSelectedDocKey(e.detail.docKey);
      }
    };

    window.addEventListener("openLexiHelp" as any, handleOpenHelp);
    return () => {
      window.removeEventListener("openLexiHelp" as any, handleOpenHelp);
    };
  }, []);

  useEffect(() => {
    setSelectedDocKey(undefined);
  }, [location]);

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
        aria-label={open ? "Close Lexi" : "Open Lexi"}
        data-testid="lexi-toggle"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        className={[
          "fixed right-0 top-1/2 -translate-y-1/2 z-50",
          "h-[140px] w-[38px] shadow-lg",
          "rounded-l-md",
          "flex items-center justify-center",
          "cursor-pointer select-none",
          "transition-colors duration-150",
          "hover:bg-[#263233] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#628286] focus-visible:ring-offset-2",
          open ? "hidden" : "",
        ].join(" ")}
        style={{
          backgroundColor: "#314143",
        }}
      >
        <span
          className={[
            "font-mono font-bold tracking-wider",
            "text-base",
            "[writing-mode:vertical-rl]",
            "[text-orientation:mixed]",
            "rotate-180",
            "leading-none",
          ].join(" ")}
          style={{ color: "#FAF8F4" }}
        >
          &lt;/&gt;
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

      {open && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close Lexi"
          data-testid="lexi-toggle-close"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(false);
          }}
          className={[
            "fixed top-1/2 -translate-y-1/2 z-[51]",
            "h-[140px] w-[38px] shadow-lg",
            "rounded-l-md",
            "flex items-center justify-center",
            "cursor-pointer select-none",
            "transition-colors duration-150",
            "hover:bg-[#263233] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#628286] focus-visible:ring-offset-2",
          ].join(" ")}
          style={{
            backgroundColor: "#314143",
            right: "min(380px, 92vw)",
          }}
        >
          <span
            className={[
              "font-mono font-bold tracking-wider",
              "text-base",
              "[writing-mode:vertical-rl]",
              "[text-orientation:mixed]",
              "rotate-180",
              "leading-none",
            ].join(" ")}
            style={{ color: "#FAF8F4" }}
          >
            &lt;/&gt;
          </span>
        </div>
      )}

      <div
        className={[
          "fixed top-0 right-0 h-screen z-50 bg-white border-l border-neutral-light shadow-xl",
          "w-full sm:w-[380px] sm:max-w-[92vw]",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-label="Lexi panel"
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-light">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                L
              </div>
              <div>
                <p className="font-heading font-semibold text-neutral-darkest leading-tight">{title}</p>
                <p className="font-sans text-xs text-neutral-darkest/60 leading-tight">
                  {mode === "help" ? "Contextual help" : "Ask questions"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-neutral-light text-neutral-darkest/70 hover:text-neutral-darkest active:bg-neutral-light/20"
              data-testid="lexi-close"
              aria-label="Close Lexi"
            >
              ✕
            </button>
          </div>

          <div className="flex border-b border-neutral-light">
            <button
              type="button"
              onClick={() => setMode("help")}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                mode === "help"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-neutral-darkest/60 hover:text-neutral-darkest",
              ].join(" ")}
              data-testid="lexi-mode-help"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                mode === "chat"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-neutral-darkest/60 hover:text-neutral-darkest",
              ].join(" ")}
              data-testid="lexi-mode-chat"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>

          {mode === "help" ? (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-lg text-neutral-darkest">
                  {helpContent.title}
                </h3>
                {helpContent.paragraphs.map((p, idx) => (
                  <p key={idx} className="font-sans text-sm text-neutral-darkest/80 leading-relaxed">
                    {p}
                  </p>
                ))}
                {helpContent.bullets && helpContent.bullets.length > 0 && (
                  <ul className="space-y-2 mt-3">
                    {helpContent.bullets.map((b, idx) => (
                      <li key={idx} className="font-sans text-sm text-neutral-darkest/70 flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 pt-4 border-t border-neutral-light">
                  <p className="font-sans text-xs text-neutral-darkest/50 italic">
                    This information is for educational purposes only. Always consult your court's local rules and procedures.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      "rounded-lg px-3 py-2 whitespace-pre-wrap text-sm",
                      m.role === "user"
                        ? "ml-8 bg-primary text-primary-foreground"
                        : "mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light",
                    ].join(" ")}
                  >
                    {m.text}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="border-t border-neutral-light p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-neutral-light px-3 py-3 min-h-[44px] font-sans text-base sm:text-sm outline-none focus:ring-2 focus:ring-bush/30"
                    placeholder="Ask Lexi..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    data-testid="lexi-input"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="rounded-md bg-primary text-primary-foreground px-4 py-3 min-h-[44px] font-sans text-sm disabled:opacity-50 active:opacity-80"
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
