import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Activity, Zap, Brain, Eye, Database, HardDrive, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DiagnosticCheck {
  area: string;
  ok: boolean;
  code?: string;
  message?: string;
  nextStep?: string;
}

interface DiagnosticsResult {
  ok: boolean;
  timestamp: string;
  checks: {
    openai: DiagnosticCheck;
    vision: DiagnosticCheck;
    database: DiagnosticCheck;
    storage: DiagnosticCheck;
    lexiGeneral: DiagnosticCheck;
    lexiCase: DiagnosticCheck;
    extractionQueue: DiagnosticCheck;
  };
  failing: DiagnosticCheck[];
  lastActivity: Array<{ type: string; summary: string; createdAt: string }>;
}

function getStatusIcon(ok: boolean) {
  return ok ? (
    <CheckCircle className="w-4 h-4 text-green-600" />
  ) : (
    <XCircle className="w-4 h-4 text-red-600" />
  );
}

function getAreaIcon(area: string) {
  if (area.includes("OpenAI")) return <Brain className="w-4 h-4" />;
  if (area.includes("Vision")) return <Eye className="w-4 h-4" />;
  if (area.includes("Database")) return <Database className="w-4 h-4" />;
  if (area.includes("Storage")) return <HardDrive className="w-4 h-4" />;
  if (area.includes("Lexi")) return <MessageSquare className="w-4 h-4" />;
  return <Zap className="w-4 h-4" />;
}

export default function AiStatusCard() {
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery<DiagnosticsResult>({
    queryKey: ["/api/ai/diagnostics"],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const overallStatus = data?.ok ? "healthy" : data?.failing && data.failing.length > 0 ? "issues" : "unknown";
  const statusColor = overallStatus === "healthy" ? "text-green-600" : overallStatus === "issues" ? "text-amber-600" : "text-neutral-500";
  const statusBg = overallStatus === "healthy" ? "bg-green-50 dark:bg-green-900/20" : overallStatus === "issues" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-neutral-50 dark:bg-neutral-800/50";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">AI System Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-run-diagnostics"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
        </div>
        <CardDescription>
          Real-time health checks for AI features including extraction, analysis, and chat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to run diagnostics. Please try again.
            </p>
          </div>
        ) : data ? (
          <>
            <div className={`p-4 rounded-lg ${statusBg}`}>
              <div className="flex items-center gap-3">
                {overallStatus === "healthy" ? (
                  <CheckCircle className={`w-6 h-6 ${statusColor}`} />
                ) : overallStatus === "issues" ? (
                  <AlertTriangle className={`w-6 h-6 ${statusColor}`} />
                ) : (
                  <Activity className={`w-6 h-6 ${statusColor}`} />
                )}
                <div>
                  <p className={`font-medium ${statusColor}`}>
                    {overallStatus === "healthy" ? "All Systems Operational" : 
                     overallStatus === "issues" ? `${data.failing.length} Issue${data.failing.length > 1 ? "s" : ""} Found` : 
                     "Status Unknown"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Last checked: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {data.failing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Issues to Address:</p>
                {data.failing.map((check, idx) => (
                  <div key={idx} className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      {getAreaIcon(check.area)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {check.area}: {check.message}
                        </p>
                        {check.nextStep && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Next step: {check.nextStep}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Accordion type="single" collapsible>
              <AccordionItem value="details" className="border-0">
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  View All Checks ({Object.keys(data.checks).length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {Object.entries(data.checks).map(([key, check]) => (
                      <div key={key} className="flex items-center gap-3 p-2 rounded-lg border">
                        {getStatusIcon(check.ok)}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getAreaIcon(check.area)}
                          <span className="text-sm font-medium">{check.area}</span>
                        </div>
                        <Badge variant={check.ok ? "secondary" : "destructive"} className="text-xs">
                          {check.ok ? "OK" : check.code || "Issue"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {data.lastActivity.length > 0 && (
                <AccordionItem value="activity" className="border-0">
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    Recent AI Activity ({data.lastActivity.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-2 max-h-48 overflow-y-auto">
                      {data.lastActivity.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs py-1 border-b last:border-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {log.type}
                          </Badge>
                          <span className="flex-1 text-neutral-600 dark:text-neutral-400 truncate">
                            {log.summary}
                          </span>
                          <span className="text-neutral-400 shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
