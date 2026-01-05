import { FileText, StickyNote, Calendar, MessageSquare, File, Scissors, Briefcase, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchResult {
  type: "evidence" | "note" | "timeline" | "communication" | "document" | "snippet" | "trialprep";
  caseId: string;
  id: string;
  title: string;
  snippet: string;
  href: string;
  caseTitle?: string;
}

interface QuickSearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  onSelect: (result: SearchResult) => void;
  showCaseLabel: boolean;
  query: string;
}

const typeIcons: Record<SearchResult["type"], typeof FileText> = {
  evidence: FileText,
  note: StickyNote,
  timeline: Calendar,
  communication: MessageSquare,
  document: File,
  snippet: Scissors,
  trialprep: Briefcase,
};

const typeLabels: Record<SearchResult["type"], string> = {
  evidence: "Evidence",
  note: "Note",
  timeline: "Timeline",
  communication: "Communication",
  document: "Document",
  snippet: "Exhibit Snippet",
  trialprep: "Trial Prep",
};

export function QuickSearchDropdown({
  results,
  loading,
  onSelect,
  showCaseLabel,
  query,
}: QuickSearchDropdownProps) {
  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 p-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Search className="h-4 w-4" />
          <span>No results found for "{query}"</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
      {results.map((result) => {
        const Icon = typeIcons[result.type];
        return (
          <button
            key={`${result.type}-${result.id}`}
            data-testid={`search-result-${result.type}-${result.id}`}
            className="w-full flex items-start gap-3 p-3 text-left hover-elevate active-elevate-2 border-b last:border-b-0"
            onClick={() => onSelect(result)}
          >
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{result.title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {typeLabels[result.type]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {result.snippet}
              </p>
              {showCaseLabel && result.caseTitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Case: {result.caseTitle}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
