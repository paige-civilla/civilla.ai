import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { getLexiHelp, type LexiHelpContent } from "@/lib/lexiHelpContent";
import { HelpCircle, MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LexiThread, LexiMessage } from "@shared/schema";

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

function extractCaseId(path: string): string | null {
  const match = path.match(/\/cases\/([^/]+)/);
  return match ? match[1] : null;
}

export default function LexiPanel() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"help" | "chat">("help");
  const [input, setInput] = useState("");
  const [selectedDocKey, setSelectedDocKey] = useState<string | undefined>();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const title = useMemo(() => "Lexi", []);
  const routeKey = getRouteKey(location);
  const caseId = extractCaseId(location);

  const helpContent: LexiHelpContent = useMemo(() => {
    return getLexiHelp({ routeKey, selectedDocKey });
  }, [routeKey, selectedDocKey]);

  const { data: disclaimerData } = useQuery<{ disclaimer: string; welcome: string }>({
    queryKey: ["/api/lexi/disclaimer"],
    enabled: open,
  });

  const { data: threadsData, isLoading: threadsLoading } = useQuery<{ threads: LexiThread[] }>({
    queryKey: ["/api/cases", caseId, "lexi", "threads"],
    enabled: open && mode === "chat" && !!caseId,
  });

  const threads = threadsData?.threads ?? [];

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: LexiMessage[] }>({
    queryKey: ["/api/lexi/threads", activeThreadId, "messages"],
    enabled: open && mode === "chat" && !!activeThreadId,
  });

  const messages = messagesData?.messages ?? [];

  const createThreadMutation = useMutation({
    mutationFn: async (threadTitle: string) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/lexi/threads`, { title: threadTitle });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "lexi", "threads"] });
      setActiveThreadId(data.thread.id);
      setShowThreadList(false);
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await apiRequest("DELETE", `/api/lexi/threads/${threadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "lexi", "threads"] });
      if (activeThreadId && threads.length <= 1) {
        setActiveThreadId(null);
      } else if (threads.length > 1) {
        const remaining = threads.filter(t => t.id !== activeThreadId);
        setActiveThreadId(remaining[0]?.id || null);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", "/api/lexi/chat", {
        caseId,
        threadId: activeThreadId,
        message: messageText,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lexi/threads", activeThreadId, "messages"] });
    },
  });

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

  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  async function send() {
    const text = input.trim();
    if (!text || sendMessageMutation.isPending || !activeThreadId) return;

    setInput("");
    sendMessageMutation.mutate(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  function startNewThread() {
    const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    createThreadMutation.mutate(`New conversation - ${timestamp}`);
  }

  const noCaseSelected = !caseId;

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

          {disclaimerData?.disclaimer && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
              <p className="font-sans text-xs text-amber-800">
                {disclaimerData.disclaimer}
              </p>
            </div>
          )}

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
          ) : noCaseSelected ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-neutral-darkest/30 mb-3" />
                <p className="font-sans text-sm text-neutral-darkest/60">
                  Open a case to chat with Lexi about your questions.
                </p>
              </div>
            </div>
          ) : showThreadList ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-neutral-light flex items-center justify-between gap-2">
                <p className="font-sans text-sm font-medium text-neutral-darkest">Conversations</p>
                <button
                  type="button"
                  onClick={startNewThread}
                  disabled={createThreadMutation.isPending}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                  data-testid="lexi-new-thread"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
              {threadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-darkest/40" />
                </div>
              ) : threads.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-sans text-sm text-neutral-darkest/60 mb-3">No conversations yet</p>
                  <button
                    type="button"
                    onClick={startNewThread}
                    disabled={createThreadMutation.isPending}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Start a conversation
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-light">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      className={[
                        "px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-lightest",
                        activeThreadId === thread.id ? "bg-primary/5" : "",
                      ].join(" ")}
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        setShowThreadList(false);
                      }}
                      data-testid={`lexi-thread-${thread.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-neutral-darkest truncate">{thread.title}</p>
                        <p className="font-sans text-xs text-neutral-darkest/50">
                          {new Date(thread.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThreadMutation.mutate(thread.id);
                        }}
                        className="p-1 text-neutral-darkest/40 hover:text-destructive"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-neutral-light flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowThreadList(true)}
                  className="text-xs text-primary hover:text-primary/80"
                  data-testid="lexi-show-threads"
                >
                  All conversations ({threads.length})
                </button>
                <button
                  type="button"
                  onClick={startNewThread}
                  disabled={createThreadMutation.isPending}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                  data-testid="lexi-new-thread-inline"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>

              {!activeThreadId ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <p className="font-sans text-sm text-neutral-darkest/60 mb-3">
                      {disclaimerData?.welcome || "Start a conversation with Lexi"}
                    </p>
                    <button
                      type="button"
                      onClick={startNewThread}
                      disabled={createThreadMutation.isPending}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Start a conversation
                    </button>
                  </div>
                </div>
              ) : messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-darkest/40" />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light rounded-lg px-3 py-2 text-sm">
                        {disclaimerData?.welcome || "Hi, I'm Lexi! How can I help you today?"}
                      </div>
                    )}
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
                        {m.content}
                      </div>
                    ))}
                    {sendMessageMutation.isPending && (
                      <div className="mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                      </div>
                    )}
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
                        disabled={sendMessageMutation.isPending}
                        data-testid="lexi-input"
                      />
                      <button
                        type="button"
                        onClick={send}
                        disabled={sendMessageMutation.isPending || !input.trim()}
                        className="rounded-md bg-primary text-primary-foreground px-4 py-3 min-h-[44px] font-sans text-sm disabled:opacity-50 active:opacity-80"
                        data-testid="lexi-send"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-end">
                      <span className="text-xs font-sans text-neutral-darkest/50">
                        Education only
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
