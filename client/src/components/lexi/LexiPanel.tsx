import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Loader2, Search, Lightbulb, FileText, Clock, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LexiThread, LexiMessage } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const OPEN_KEY = "civilla_lexi_open_v1";
const STYLE_KEY = "civilla_lexi_style_v1";
const FAST_KEY = "civilla_lexi_fast_v1";

type StylePreset = "bullets" | "steps" | "short" | "detailed";

const STYLE_OPTIONS: { value: StylePreset; label: string }[] = [
  { value: "bullets", label: "Bullets" },
  { value: "steps", label: "Steps" },
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
];

const SUGGESTED_QUESTIONS = [
  "What are deadlines I should know about in family court?",
  "How do I organize evidence for my case?",
  "What is discovery and how does it work?",
  "How do I respond to a motion?",
  "What documents do I need for child custody?",
];

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

type LexiIntent = "research" | "organize" | "educate";

interface LexiSource {
  title: string;
  url: string;
  jurisdiction?: string;
  reachable?: boolean;
  accessedAt?: string;
  publisher?: string;
}

interface MessageMetadata {
  intent?: LexiIntent;
  refused?: boolean;
  hadSources?: boolean;
  sources?: LexiSource[];
}

function LexiSourcesList({ sources }: { sources: LexiSource[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-neutral-light">
      <p className="text-xs font-medium text-neutral-darkest/60 mb-2">Sources:</p>
      <ul className="space-y-1">
        {sources.map((source, idx) => (
          <li key={idx} className="text-xs flex items-start gap-1">
            <span className="text-neutral-darkest/40 shrink-0">{idx + 1}.</span>
            {source.reachable && source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[hsl(var(--module-tile-border))] hover:underline break-words"
              >
                {source.title || source.url}
              </a>
            ) : (
              <span className="text-neutral-darkest/70">
                {source.title || source.url}
                {!source.reachable && source.url && (
                  <span className="text-neutral-darkest/40 ml-1">(link unavailable)</span>
                )}
              </span>
            )}
            {source.jurisdiction && (
              <span className="text-neutral-darkest/40 shrink-0">({source.jurisdiction})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getIntentBadge(intent?: LexiIntent): { label: string; icon: typeof Search; color: string } | null {
  if (!intent) return null;
  switch (intent) {
    case "research":
      return { label: "Research", icon: Search, color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "organize":
      return { label: "Organize", icon: FileText, color: "bg-green-100 text-green-700 border-green-200" };
    case "educate":
      return { label: "Learn", icon: Lightbulb, color: "bg-amber-100 text-amber-700 border-amber-200" };
    default:
      return null;
  }
}

function normalizeHref(href?: string | null): string | null {
  if (!href) return null;
  const raw = href.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  if (/^[^\s\/]+\.[^\s]+$/i.test(raw) && raw.includes('.')) return `https://${raw}`;
  return null;
}

function LexiMessageBody({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-neutral-darkest prose-p:my-2 prose-li:my-1 prose-ul:my-2 prose-ol:my-2 prose-strong:text-neutral-darkest prose-a:text-[hsl(var(--module-tile-border))] prose-headings:font-heading prose-headings:text-neutral-darkest prose-headings:text-base prose-headings:mt-3 prose-headings:mb-1">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const normalized = normalizeHref(href);
            if (!normalized) {
              return <span className="underline decoration-dotted text-neutral-darkest/70">{children}</span>;
            }
            return (
              <a
                href={normalized}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[hsl(var(--module-tile-border))] underline hover:text-primary break-words"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function containsDeadlineInfo(content: string): boolean {
  const deadlinePatterns = [
    /\b\d+\s*days?\b/i,
    /\bwithin\s+\d+/i,
    /\bdeadline/i,
    /\bdue\s+date/i,
    /\bfiling\s+deadline/i,
    /\bresponse\s+deadline/i,
    /\bmust\s+(be\s+)?file[d]?\s+(within|by)/i,
    /\bserve[d]?\s+(within|by)/i,
    /\bcalendar\s+days?\b/i,
    /\bbusiness\s+days?\b/i,
    /\bcourt\s+days?\b/i,
  ];
  
  return deadlinePatterns.some(pattern => pattern.test(content));
}

export default function LexiPanel() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showThreadList, setShowThreadList] = useState(false);
  const [currentModuleKey, setCurrentModuleKey] = useState<string | undefined>();
  const [isRenamingThread, setIsRenamingThread] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [pendingAsk, setPendingAsk] = useState<{ text: string; mode?: "help" | "chat" | "research"; moduleKey?: string } | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [stylePreset, setStylePreset] = useState<StylePreset>(() => {
    try {
      const saved = localStorage.getItem(STYLE_KEY);
      if (saved && ["bullets", "steps", "short", "detailed"].includes(saved)) {
        return saved as StylePreset;
      }
    } catch {}
    return "bullets";
  });
  const [fastMode, setFastMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(FAST_KEY);
      if (saved !== null) return saved === "true";
    } catch {}
    return window.innerWidth < 768;
  });

  const endRef = useRef<HTMLDivElement | null>(null);
  const title = "Lexi";
  const caseId = extractCaseId(location);
  const { toast } = useToast();

  const { data: disclaimerData } = useQuery<{ disclaimer: string; welcome: string }>({
    queryKey: ["/api/lexi/disclaimer"],
    enabled: open,
  });

  const { data: threadsData, isLoading: threadsLoading } = useQuery<{ threads: LexiThread[] }>({
    queryKey: caseId ? ["/api/cases", caseId, "lexi", "threads"] : ["/api/lexi/threads"],
    enabled: open,
  });

  const threads = threadsData?.threads ?? [];

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{ messages: LexiMessage[] }>({
    queryKey: ["/api/lexi/threads", activeThreadId, "messages"],
    enabled: open && !!activeThreadId,
  });

  const messages = messagesData?.messages ?? [];

  const createThreadMutation = useMutation({
    mutationFn: async (threadTitle: string) => {
      setThreadError(null);
      const url = caseId ? `/api/cases/${caseId}/lexi/threads` : "/api/lexi/threads";
      const res = await apiRequest("POST", url, { title: threadTitle });
      if (!res.ok) {
        throw new Error("Failed to create thread");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const key = caseId ? ["/api/cases", caseId, "lexi", "threads"] : ["/api/lexi/threads"];
      queryClient.invalidateQueries({ queryKey: key });
      setActiveThreadId(data.thread.id);
      setShowThreadList(false);
      setThreadError(null);
    },
    onError: () => {
      setThreadError("Could not start Lexi chat. Please try again.");
      setPendingAsk(null);
      toast({
        title: "Error",
        description: "Could not start Lexi chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await apiRequest("DELETE", `/api/lexi/threads/${threadId}`);
    },
    onSuccess: () => {
      const key = caseId ? ["/api/cases", caseId, "lexi", "threads"] : ["/api/lexi/threads"];
      queryClient.invalidateQueries({ queryKey: key });
      if (activeThreadId && threads.length <= 1) {
        setActiveThreadId(null);
      } else if (threads.length > 1) {
        const remaining = threads.filter(t => t.id !== activeThreadId);
        setActiveThreadId(remaining[0]?.id || null);
      }
    },
  });

  const renameThreadMutation = useMutation({
    mutationFn: async ({ threadId, title }: { threadId: string; title: string }) => {
      const res = await apiRequest("PATCH", `/api/lexi/threads/${threadId}`, { title });
      return res.json();
    },
    onSuccess: () => {
      const key = caseId ? ["/api/cases", caseId, "lexi", "threads"] : ["/api/lexi/threads"];
      queryClient.invalidateQueries({ queryKey: key });
      setIsRenamingThread(false);
      setRenameValue("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not rename conversation.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { text: string; mode?: "help" | "chat" | "research"; moduleKey?: string }) => {
      const res = await apiRequest("POST", "/api/lexi/chat", {
        caseId,
        threadId: activeThreadId,
        message: payload.text,
        mode: payload.mode,
        moduleKey: payload.moduleKey,
        stylePreset,
        fastMode,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lexi/threads", activeThreadId, "messages"] });
      setCurrentModuleKey(undefined);
    },
  });

  const handleRenameStart = () => {
    const activeThread = threads.find(t => t.id === activeThreadId);
    setRenameValue(activeThread?.title || "");
    setIsRenamingThread(true);
  };

  const handleRenameSubmit = () => {
    if (activeThreadId && renameValue.trim()) {
      renameThreadMutation.mutate({ threadId: activeThreadId, title: renameValue.trim() });
    }
  };

  const handleRenameCancel = () => {
    setIsRenamingThread(false);
    setRenameValue("");
  };

  const handleStyleChange = (value: StylePreset) => {
    setStylePreset(value);
    try { localStorage.setItem(STYLE_KEY, value); } catch {}
  };

  const handleFastModeChange = (value: boolean) => {
    setFastMode(value);
    try { localStorage.setItem(FAST_KEY, String(value)); } catch {}
  };

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
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages.length]);

  useEffect(() => {
    const handleOpenHelp = () => {
      setOpen(true);
    };

    window.addEventListener("openLexiHelp" as any, handleOpenHelp);
    return () => {
      window.removeEventListener("openLexiHelp" as any, handleOpenHelp);
    };
  }, []);

  useEffect(() => {
    const handleLexiAsk = (e: CustomEvent<{ text: string; mode?: "research"; moduleKey?: string; caseId?: string }>) => {
      const { text, mode: requestedMode, moduleKey } = e.detail || {};
      if (!text) return;
      
      setOpen(true);
      setInput(text);
      setCurrentModuleKey(moduleKey);
      
      if (activeThreadId) {
        setPendingAsk({ text, mode: requestedMode, moduleKey });
      }
    };

    window.addEventListener("lexi:ask" as any, handleLexiAsk);
    return () => {
      window.removeEventListener("lexi:ask" as any, handleLexiAsk);
    };
  }, [activeThreadId]);

  useEffect(() => {
    if (pendingAsk && activeThreadId && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(pendingAsk);
      setInput("");
      setPendingAsk(null);
    }
  }, [pendingAsk, activeThreadId, sendMessageMutation]);

  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  async function send() {
    const text = input.trim();
    if (!text || sendMessageMutation.isPending) return;

    if (!activeThreadId) {
      const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      setPendingAsk({ text, moduleKey: currentModuleKey });
      createThreadMutation.mutate(`New conversation - ${timestamp}`);
      setInput("");
      return;
    }

    setInput("");
    sendMessageMutation.mutate({ text, moduleKey: currentModuleKey });
  }

  async function handleSuggestedQuestion(question: string) {
    if (sendMessageMutation.isPending || createThreadMutation.isPending) return;

    if (!activeThreadId) {
      const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      setPendingAsk({ text: question });
      createThreadMutation.mutate(`New conversation - ${timestamp}`);
      return;
    }

    sendMessageMutation.mutate({ text: question });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  function startNewThread() {
    const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    createThreadMutation.mutate(`New conversation - ${timestamp}`);
  }

  function handleAddToDeadlines(messageContent: string) {
    if (!caseId) return;
    
    localStorage.setItem("lexi_deadline_context", messageContent.slice(0, 500));
    
    toast({
      title: "Opening Deadlines",
      description: "Create a deadline based on this information.",
    });
    
    setOpen(false);
    setLocation(`/app/deadlines/${caseId}`);
  }


  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Open Lexi"
          data-testid="lexi-toggle"
          onClick={() => setOpen(true)}
          className="fixed z-[60] rounded-l-xl shadow-lg bg-[#314143] text-white border border-[hsl(var(--module-tile-border))] hover:bg-[#263233] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--module-tile-border))] flex items-center justify-center cursor-pointer"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            right: 0,
            width: 44,
            height: 128,
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              transform: "rotate(-90deg)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <span className="text-white text-lg leading-none">&lsaquo;</span>
            <span className="text-white font-semibold tracking-wide">Lexi</span>
          </div>
        </button>
      )}

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
        className="fixed z-50 w-full h-full sm:w-[clamp(320px,72vw,520px)] sm:h-auto sm:right-6 right-0 top-0"
        style={{
          top: "calc(var(--civilla-nav-h, 64px) + 12px)",
          bottom: "12px",
        }}
        role="dialog"
        aria-label="Lexi panel"
      >
        <div className="relative h-full w-full">
          {open && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Lexi"
              data-testid="lexi-toggle-close"
              className="hidden sm:flex absolute left-[-44px] top-1/2 -translate-y-1/2 h-32 w-11 rounded-l-xl bg-[#314143] text-white border border-[hsl(var(--module-tile-border))] items-center justify-center shadow cursor-pointer hover:bg-[#263233] transition-colors"
            >
              <div
                className="flex items-center gap-2"
                style={{
                  transform: "rotate(-90deg)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                <span className="text-white text-lg leading-none">&rsaquo;</span>
                <span className="text-white font-semibold tracking-wide">Lexi</span>
              </div>
            </button>
          )}

          <div className="h-full w-full bg-white border border-neutral-light shadow-2xl sm:rounded-2xl flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-light shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                L
              </div>
              <div>
                <p className="font-heading font-semibold text-neutral-darkest leading-tight">{title}</p>
                <p className="font-sans text-xs text-neutral-darkest/60 leading-tight">
                  Your AI Assistant
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
            <div className="px-4 py-2 bg-[hsl(var(--accent))] border-b border-[hsl(var(--accent-border))] shrink-0">
              <p className="font-sans text-xs text-[hsl(var(--accent-foreground))]">
                {disclaimerData.disclaimer}
              </p>
            </div>
          )}

          {showThreadList ? (
            <div className="flex-1 overflow-y-auto min-h-0">
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
              <div className="px-4 py-2 border-b border-neutral-light flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
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
                {activeThreadId && (
                  <div className="flex items-center gap-2">
                    {isRenamingThread ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSubmit();
                            if (e.key === "Escape") handleRenameCancel();
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-neutral-light rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          data-testid="input-rename-thread"
                        />
                        <button
                          type="button"
                          onClick={handleRenameSubmit}
                          disabled={renameThreadMutation.isPending || !renameValue.trim()}
                          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                          data-testid="button-rename-save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRenameCancel}
                          className="p-1 text-neutral-darkest/50 hover:text-neutral-darkest"
                          data-testid="button-rename-cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-neutral-darkest truncate flex-1" data-testid="text-thread-title">
                          {threads.find(t => t.id === activeThreadId)?.title || "Untitled"}
                        </span>
                        <button
                          type="button"
                          onClick={handleRenameStart}
                          className="p-1 text-neutral-darkest/40 hover:text-neutral-darkest"
                          title="Rename conversation"
                          data-testid="button-rename-thread"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!activeThreadId ? (
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                  <div className="text-center mb-6">
                    <p className="font-sans text-sm text-neutral-darkest/60 mb-3">
                      {disclaimerData?.welcome || "Start a conversation with Lexi"}
                    </p>
                    <button
                      type="button"
                      onClick={startNewThread}
                      disabled={createThreadMutation.isPending}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                      data-testid="button-start-conversation"
                    >
                      <Plus className="w-4 h-4" />
                      {createThreadMutation.isPending ? "Starting..." : "Start a conversation"}
                    </button>
                    {threadError && (
                      <p className="mt-2 text-xs text-destructive" data-testid="lexi-thread-error">
                        {threadError}
                      </p>
                    )}
                  </div>
                  <div className="w-full max-w-sm">
                    <p className="text-xs font-medium text-neutral-darkest/60 mb-2 text-center">Or ask a question:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestedQuestion(q)}
                          disabled={sendMessageMutation.isPending || createThreadMutation.isPending}
                          className="text-left text-xs px-3 py-2 rounded-lg border border-neutral-light bg-white hover:bg-neutral-lightest text-neutral-darkest/80 transition-colors disabled:opacity-50"
                          data-testid={`suggested-question-nothread-${idx}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : messagesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-darkest/40" />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                    {messages.length === 0 && (
                      <>
                        <div className="mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light rounded-lg px-3 py-2 text-sm">
                          {disclaimerData?.welcome || "Hi, I'm Lexi! How can I help you today?"}
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-medium text-neutral-darkest/60 mb-2">Suggested questions:</p>
                          <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSuggestedQuestion(q)}
                                disabled={sendMessageMutation.isPending || createThreadMutation.isPending}
                                className="text-left text-xs px-3 py-2 rounded-lg border border-neutral-light bg-white hover:bg-neutral-lightest text-neutral-darkest/80 transition-colors disabled:opacity-50"
                                data-testid={`suggested-question-${idx}`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {messages.map((m) => {
                      const meta = m.metadata as MessageMetadata | null;
                      const badge = m.role === "assistant" ? getIntentBadge(meta?.intent) : null;
                      const showDeadlineButton = m.role === "assistant" && containsDeadlineInfo(m.content) && caseId;
                      const metaSources = meta?.sources || [];
                      
                      return (
                        <div key={m.id} className="space-y-1">
                          {badge && (
                            <div className="flex items-center gap-1 mr-8">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${badge.color}`}>
                                <badge.icon className="w-3 h-3" />
                                {badge.label}
                              </span>
                              {meta?.hadSources && (
                                <span className="text-xs text-neutral-darkest/50">with sources</span>
                              )}
                            </div>
                          )}
                          <div
                            className={[
                              "rounded-lg px-3 py-2 text-sm",
                              m.role === "user"
                                ? "ml-8 bg-primary text-primary-foreground whitespace-pre-wrap"
                                : "mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light",
                            ].join(" ")}
                          >
                            {m.role === "assistant" ? (
                              <>
                                <LexiMessageBody content={m.content} />
                                {metaSources.length > 0 && <LexiSourcesList sources={metaSources} />}
                              </>
                            ) : (
                              m.content
                            )}
                          </div>
                          {showDeadlineButton && (
                            <div className="mr-8 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToDeadlines(m.content)}
                                className="text-xs"
                                data-testid={`button-add-deadline-${m.id}`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Add to Deadlines
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {sendMessageMutation.isPending && (
                      <div className="mr-8 bg-neutral-lightest text-neutral-darkest border border-neutral-light rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Thinking...
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  <div className="border-t border-neutral-light p-3 pb-[max(env(safe-area-inset-bottom),12px)] shrink-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {STYLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStyleChange(opt.value)}
                            className={`px-2 py-1 text-xs rounded-md font-sans transition-colors ${
                              stylePreset === opt.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-neutral-lightest text-neutral-darkest/70 hover:bg-neutral-light"
                            }`}
                            data-testid={`lexi-style-${opt.value}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer" title="Shorter, faster answers">
                        <span className="text-xs text-neutral-darkest/60 font-sans">Fast</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={fastMode}
                          onClick={() => handleFastModeChange(!fastMode)}
                          className={`relative w-8 h-5 rounded-full transition-colors ${
                            fastMode ? "bg-primary" : "bg-neutral-light"
                          }`}
                          data-testid="lexi-fast-toggle"
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              fastMode ? "translate-x-3" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </label>
                    </div>
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
                  </div>
                </>
              )}
            </>
          )}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
