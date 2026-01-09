import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, RefreshCw, Loader2, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecentFailure {
  id: string;
  evidenceId: string;
  evidenceName: string;
  error: string;
  updatedAt: string;
}

interface AiJobsStatus {
  ok: boolean;
  caseId: string;
  extraction: {
    total: number;
    queued: number;
    processing: number;
    complete: number;
    failed: number;
    recentFailures: RecentFailure[];
  };
  analyses: {
    total: number;
    pending: number;
    complete: number;
    failed: number;
    recentFailures: RecentFailure[];
  };
  claims: {
    suggestedTotal: number;
    pending: boolean;
    lastRunAt: string | null;
    lastError: string | null;
  };
  updatedAt: string;
}

function StatusDot({ status }: { status: "green" | "blue" | "red" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} flex-shrink-0`}
      data-testid={`status-dot-${status}`}
    />
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AiProcessingStatusCard({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [retryingExtractions, setRetryingExtractions] = useState<Set<string>>(new Set());
  const [retryingAnalyses, setRetryingAnalyses] = useState<Set<string>>(new Set());
  const [retryingAllExtractions, setRetryingAllExtractions] = useState(false);
  const [retryingAllAnalyses, setRetryingAllAnalyses] = useState(false);
  const [retryingClaims, setRetryingClaims] = useState(false);

  const { data: status, isLoading, refetch } = useQuery<AiJobsStatus>({
    queryKey: ["/api/cases", caseId, "ai-jobs", "status"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/ai-jobs/status`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch AI jobs status");
      return res.json();
    },
    enabled: !!caseId,
    refetchOnWindowFocus: false,
  });

  const shouldPoll = status && (
    status.extraction.queued > 0 ||
    status.extraction.processing > 0 ||
    status.extraction.failed > 0 ||
    status.analyses.pending > 0 ||
    status.analyses.failed > 0 ||
    status.claims.pending
  );

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => {
      refetch();
    }, 12000);
    return () => clearInterval(interval);
  }, [shouldPoll, refetch]);

  const retryExtraction = useCallback(async (evidenceId: string) => {
    setRetryingExtractions((prev) => new Set(prev).add(evidenceId));
    try {
      await apiRequest("POST", `/api/cases/${caseId}/evidence/${evidenceId}/extraction/retry`);
      await refetch();
      toast({ title: "Extraction retry queued" });
    } catch {
      toast({ title: "Failed to retry extraction", variant: "destructive" });
    } finally {
      setRetryingExtractions((prev) => {
        const next = new Set(prev);
        next.delete(evidenceId);
        return next;
      });
    }
  }, [caseId, refetch, toast]);

  const retryAnalysis = useCallback(async (evidenceId: string) => {
    setRetryingAnalyses((prev) => new Set(prev).add(evidenceId));
    try {
      await apiRequest("POST", `/api/cases/${caseId}/evidence/${evidenceId}/ai-analyses/retry`);
      await refetch();
      toast({ title: "Analysis retry started" });
    } catch {
      toast({ title: "Failed to retry analysis", variant: "destructive" });
    } finally {
      setRetryingAnalyses((prev) => {
        const next = new Set(prev);
        next.delete(evidenceId);
        return next;
      });
    }
  }, [caseId, refetch, toast]);

  const retryAllExtractions = useCallback(async () => {
    if (!status) return;
    setRetryingAllExtractions(true);
    try {
      for (const failure of status.extraction.recentFailures) {
        await apiRequest("POST", `/api/cases/${caseId}/evidence/${failure.evidenceId}/extraction/retry`);
      }
      await refetch();
      toast({ title: "All extraction retries queued" });
    } catch {
      toast({ title: "Failed to retry some extractions", variant: "destructive" });
    } finally {
      setRetryingAllExtractions(false);
    }
  }, [caseId, status, refetch, toast]);

  const retryAllAnalyses = useCallback(async () => {
    if (!status) return;
    setRetryingAllAnalyses(true);
    try {
      for (const failure of status.analyses.recentFailures) {
        await apiRequest("POST", `/api/cases/${caseId}/evidence/${failure.evidenceId}/ai-analyses/retry`);
      }
      await refetch();
      toast({ title: "All analysis retries started" });
    } catch {
      toast({ title: "Failed to retry some analyses", variant: "destructive" });
    } finally {
      setRetryingAllAnalyses(false);
    }
  }, [caseId, status, refetch, toast]);

  const retryClaims = useCallback(async () => {
    setRetryingClaims(true);
    try {
      await apiRequest("POST", `/api/cases/${caseId}/claims/retry`);
      await refetch();
      toast({ title: "Claims suggestion scheduled" });
    } catch {
      toast({ title: "Failed to retry claims", variant: "destructive" });
    } finally {
      setRetryingClaims(false);
    }
  }, [caseId, refetch, toast]);

  if (isLoading || !status) {
    return (
      <Card className="border-border/50" data-testid="card-ai-processing-status">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-muted-foreground" />
            AI & Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const extractionPending = status.extraction.queued + status.extraction.processing;
  const extractionStatus: "green" | "blue" | "red" =
    status.extraction.failed > 0 ? "red" : extractionPending > 0 ? "blue" : "green";

  const analysisStatus: "green" | "blue" | "red" =
    status.analyses.failed > 0 ? "red" : status.analyses.pending > 0 ? "blue" : "green";

  const claimsStatus: "green" | "blue" | "red" =
    status.claims.lastError ? "red" : status.claims.pending ? "blue" : "green";

  const hasFailures =
    status.extraction.recentFailures.length > 0 ||
    status.analyses.recentFailures.length > 0 ||
    status.claims.lastError;

  return (
    <Card className="border-border/50" data-testid="card-ai-processing-status">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          AI & Processing Status
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live status of evidence processing and AI tasks for this case
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 px-3 bg-muted/30 rounded-md">
            <span className="text-sm font-medium">Evidence Text Extraction</span>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>✓ {status.extraction.complete} complete</span>
              {extractionPending > 0 && <span>• {extractionPending} pending</span>}
              {status.extraction.failed > 0 && (
                <span className="text-red-600">✕ {status.extraction.failed} failed</span>
              )}
              <StatusDot status={extractionStatus} />
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5 px-3 bg-muted/30 rounded-md">
            <span className="text-sm font-medium">Evidence AI Analysis</span>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>✓ {status.analyses.complete} complete</span>
              {status.analyses.pending > 0 && <span>• {status.analyses.pending} pending</span>}
              {status.analyses.failed > 0 && (
                <span className="text-red-600">✕ {status.analyses.failed} failed</span>
              )}
              <StatusDot status={analysisStatus} />
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5 px-3 bg-muted/30 rounded-md">
            <span className="text-sm font-medium">Claim Suggestions</span>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {status.claims.pending ? (
                <span className="text-blue-600">Running…</span>
              ) : status.claims.lastError ? (
                <span className="text-red-600">Last error: {status.claims.lastError}</span>
              ) : status.claims.lastRunAt ? (
                <span>Last run: {formatTimestamp(status.claims.lastRunAt)}</span>
              ) : (
                <span>Not yet run</span>
              )}
              <StatusDot status={claimsStatus} />
            </div>
          </div>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="flex justify-end">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1" data-testid="button-toggle-details">
                {expanded ? (
                  <>
                    Hide details <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    View details <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-4 pt-2">
            {status.extraction.recentFailures.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Failed Extractions</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={retryAllExtractions}
                    disabled={retryingAllExtractions}
                    data-testid="button-retry-all-extractions"
                  >
                    {retryingAllExtractions ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Retry all failed extractions
                  </Button>
                </div>
                <div className="space-y-2">
                  {status.extraction.recentFailures.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start justify-between gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                      data-testid={`extraction-failure-${f.evidenceId}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{f.evidenceName}</p>
                        <p className="text-xs text-muted-foreground truncate">{f.error}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimestamp(f.updatedAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryExtraction(f.evidenceId)}
                        disabled={retryingExtractions.has(f.evidenceId)}
                        data-testid={`button-retry-extraction-${f.evidenceId}`}
                      >
                        {retryingExtractions.has(f.evidenceId) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Retry"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status.analyses.recentFailures.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Failed AI Analyses</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={retryAllAnalyses}
                    disabled={retryingAllAnalyses}
                    data-testid="button-retry-all-analyses"
                  >
                    {retryingAllAnalyses ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Retry all failed analyses
                  </Button>
                </div>
                <div className="space-y-2">
                  {status.analyses.recentFailures.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start justify-between gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                      data-testid={`analysis-failure-${f.evidenceId}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{f.evidenceName}</p>
                        <p className="text-xs text-muted-foreground truncate">{f.error}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimestamp(f.updatedAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryAnalysis(f.evidenceId)}
                        disabled={retryingAnalyses.has(f.evidenceId)}
                        data-testid={`button-retry-analysis-${f.evidenceId}`}
                      >
                        {retryingAnalyses.has(f.evidenceId) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Retry"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Claim Suggestions</h4>
              <div className="p-3 bg-muted/30 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p>
                      Status:{" "}
                      {status.claims.pending ? (
                        <span className="text-blue-600 font-medium">Pending</span>
                      ) : status.claims.lastError ? (
                        <span className="text-red-600 font-medium">Failed</span>
                      ) : (
                        <span className="text-green-600 font-medium">Completed</span>
                      )}
                    </p>
                    {status.claims.lastRunAt && (
                      <p className="text-muted-foreground">
                        Last run: {formatTimestamp(status.claims.lastRunAt)}
                      </p>
                    )}
                    {status.claims.lastError && (
                      <p className="text-red-600 text-xs mt-1">
                        Error: {status.claims.lastError}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryClaims}
                    disabled={retryingClaims || status.claims.pending}
                    title="Re-run claim analysis for this case"
                    data-testid="button-retry-claims"
                  >
                    {retryingClaims ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Retry claim suggestions
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatTimestamp(status.updatedAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
