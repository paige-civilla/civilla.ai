import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

interface SearchResult {
  type: string;
  caseId: string;
  id: string;
  title: string;
  snippet: string;
  href: string;
  caseTitle?: string;
}

const TYPE_LABELS: Record<string, string> = {
  evidence: "Evidence",
  note: "Note",
  timeline: "Timeline",
  communication: "Communication",
  document: "Document",
  snippet: "Exhibit Snippet",
  trialprep: "Trial Prep",
};

function renderHighlighted(snippet: string) {
  const tokens: Array<{ text: string; highlight: boolean }> = [];
  const re = /\[\[H\]\]([\s\S]*?)\[\[\/H\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(snippet)) !== null) {
    if (m.index > last) tokens.push({ text: snippet.slice(last, m.index), highlight: false });
    tokens.push({ text: m[1], highlight: true });
    last = m.index + m[0].length;
  }
  if (last < snippet.length) tokens.push({ text: snippet.slice(last), highlight: false });

  return (
    <span className="text-sm text-neutral-darkest/70">
      {tokens.map((t, i) =>
        t.highlight ? (
          <mark key={i} className="px-0.5 rounded bg-[hsl(var(--module-tile-hover))] text-neutral-darkest font-medium">
            {t.text}
          </mark>
        ) : (
          <span key={i}>{t.text}</span>
        )
      )}
    </span>
  );
}

interface QuickSearchProps {
  caseId: string | null;
}

export default function QuickSearch({ caseId }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data, isLoading } = useQuery<{ ok: boolean; results: SearchResult[] }>({
    queryKey: ["/api/search", { q: debouncedQuery, caseId }],
    enabled: debouncedQuery.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedQuery });
      if (caseId) params.set("caseId", caseId);
      const res = await fetch(`/api/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = useCallback((href: string) => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setLocation(href);
  }, [setLocation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, []);

  const results = data?.results || [];
  const showDropdown = isOpen && debouncedQuery.length >= 2;

  const showCaseLabels = !caseId;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F2F2F2]/10 border border-[#F2F2F2]/30 focus-within:border-[#F2F2F2]/60 transition-colors">
        <Search className="w-3.5 h-3.5 text-[#F2F2F2]/70" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={caseId ? "Search case..." : "Search all cases..."}
          className="bg-transparent text-xs text-[#F2F2F2] placeholder:text-[#F2F2F2]/50 outline-none w-24 sm:w-32 md:w-40"
          data-testid="input-quick-search"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
            }}
            className="p-0.5 hover:bg-[#F2F2F2]/20 rounded"
            data-testid="button-clear-search"
          >
            <X className="w-3 h-3 text-[#F2F2F2]/70" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-72 sm:w-80 md:w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-neutral-500 text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500 text-center">No results found</div>
          ) : (
            <div className="py-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleResultClick(result.href)}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-100 transition-colors border-b border-neutral-100 last:border-b-0"
                  data-testid={`search-result-${result.type}-${result.id}`}
                >
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">
                      {TYPE_LABELS[result.type] || result.type}
                    </span>
                    {showCaseLabels && result.caseTitle && (
                      <span className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                        {result.caseTitle}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-neutral-900 truncate mb-0.5">
                    {result.title}
                  </div>
                  {result.snippet && (
                    <div className="line-clamp-2">
                      {renderHighlighted(result.snippet)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
