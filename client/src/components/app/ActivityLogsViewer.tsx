import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Clock, FileText, Upload, MessageSquare, CheckCircle, Loader2, ChevronDown, Lock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  userId: string;
  caseId: string | null;
  type: string;
  summary: string;
  moduleKey: string | null;
  entityType: string | null;
  entityId: string | null;
  metadataJson: Record<string, unknown>;
  createdAt: string;
}

interface ActivityLogsResponse {
  items: ActivityLog[];
  nextCursor?: string;
}

const EVENT_ICONS: Record<string, typeof FileText> = {
  evidence_upload: Upload,
  evidence_uploaded: Upload,
  extraction_queued: Search,
  extraction_complete: CheckCircle,
  extraction_failed: AlertTriangle,
  claims_suggested: CheckCircle,
  claims_suggesting: Search,
  claim_accepted: CheckCircle,
  claim_rejected: AlertTriangle,
  claim_locked: Lock,
  claim_unlocked: Lock,
  document_compiled: FileText,
  document_compiled_template: FileText,
  document_exported: FileText,
  lexi_chat: MessageSquare,
  lexi_thread_created: MessageSquare,
  lexi_message_sent: MessageSquare,
  lexi_response_received: MessageSquare,
  memory_rebuild: Search,
  module_view: Clock,
};

const EVENT_LABELS: Record<string, string> = {
  evidence_upload: "Evidence Uploaded",
  evidence_uploaded: "Evidence Uploaded",
  extraction_queued: "Extraction Started",
  extraction_complete: "Extraction Complete",
  extraction_failed: "Extraction Failed",
  ai_analysis: "AI Analysis",
  ai_analysis_started: "AI Analysis Started",
  ai_analysis_complete: "AI Analysis Complete",
  ai_analysis_failed: "AI Analysis Failed",
  claims_suggested: "Claims Suggested",
  claims_suggesting: "Generating Claims",
  claim_accepted: "Claim Accepted",
  claim_rejected: "Claim Rejected",
  claim_locked: "Claim Locked",
  claim_unlocked: "Claim Unlocked",
  citations_auto_attached: "Citations Attached",
  document_compiled: "Document Compiled",
  document_compiled_template: "Template Compiled",
  document_compiled_claims: "Claims Compiled",
  document_exported: "Document Exported",
  trial_prep_export: "Trial Prep Exported",
  pattern_exported: "Pattern Exported",
  binder_exported: "Binder Exported",
  issue_created: "Issue Created",
  claim_added_to_issue: "Claim Added to Issue",
  memory_rebuild: "Memory Rebuilt",
  lexi_chat: "Lexi Chat",
  lexi_thread_created: "Thread Created",
  lexi_message_sent: "Message Sent",
  lexi_response_received: "Response Received",
  module_view: "Module Viewed",
  admin_metrics_viewed: "Admin Metrics Viewed",
  grant_metrics_viewed: "Grant Metrics Viewed",
  facts_suggested: "Facts Suggested",
  facts_suggesting: "Suggesting Facts",
};

export default function ActivityLogsViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);

  const { data, isLoading, isFetching } = useQuery<ActivityLogsResponse>({
    queryKey: ["/api/activity-logs", { range: dateRange, q: searchQuery, cursor }],
    queryFn: async () => {
      const params = new URLSearchParams({
        range: dateRange,
        limit: "50",
      });
      if (searchQuery) params.set("q", searchQuery);
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/activity-logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const displayLogs = cursor ? allLogs : (data?.items || []);

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setAllLogs([...displayLogs, ...(data?.items || [])]);
      setCursor(data.nextCursor);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCursor(undefined);
    setAllLogs([]);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setCursor(undefined);
    setAllLogs([]);
  };

  const getEventIcon = (type: string) => {
    const Icon = EVENT_ICONS[type] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getEventLabel = (type: string) => {
    return EVENT_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity Logs
        </CardTitle>
        <CardDescription>
          View your account activity history. These logs are kept for security and audit purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-muted bg-muted/50">
          <Lock className="w-4 h-4" />
          <AlertDescription className="text-sm">
            These logs cannot be deleted to protect integrity and security.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by event type or summary..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              data-testid="input-activity-search"
            />
          </div>
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[140px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px] border rounded-lg">
          {isLoading && !cursor ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {displayLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-md bg-muted">
                      {getEventIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getEventLabel(log.type)}
                        </Badge>
                        {log.caseId && (
                          <Badge variant="outline" className="text-xs">
                            Case
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1 line-clamp-2">
                        {log.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        {log.moduleKey && <span>in {log.moduleKey}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {data?.nextCursor && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isFetching}
              data-testid="button-load-more"
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-2" />
              )}
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
