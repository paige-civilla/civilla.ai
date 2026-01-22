import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, Briefcase, AlertCircle, Clock, CheckSquare, Calendar, Activity, MessageSquare, FileText, Tag, FolderOpen, Brain, Sparkles, Check, Loader2, AlertTriangle, Scale, Users, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, Task, Deadline, CaseCalendarItem, CalendarCategory, CaseCommunication } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";

type ExampleItem = {
  sourceType: string;
  sourceId: string;
  title: string;
  excerpt: string;
  occurredAt?: string;
  evidenceId?: string;
  fileName?: string;
  pageNumber?: number;
  tags?: string[];
  importance?: number;
};

type ThemeEntry = {
  label: string;
  count: number;
  examples: ExampleItem[];
};

type PatternEntry = {
  label: string;
  count: number;
  examples: ExampleItem[];
};

type KeyDateEntry = {
  date: string;
  label: string;
  sources: ExampleItem[];
};

type KeyNameEntry = {
  name: string;
  count: number;
  examples: ExampleItem[];
};

type PatternAnalysisResponse = {
  ok: boolean;
  status: {
    evidenceTotal: number;
    extractedComplete: number;
    extractedProcessing: number;
    extractedFailed: number;
    analysesComplete: number;
    analysesProcessing: number;
    analysesFailed: number;
    notesTotal: number;
    timelineTotal: number;
    communicationsTotal: number;
  };
  themes: ThemeEntry[];
  patterns: PatternEntry[];
  keyDates: KeyDateEntry[];
  conflictsAndGaps: ExampleItem[];
  keyNames: KeyNameEntry[];
  topExamples: {
    themes: ExampleItem[];
    patterns: ExampleItem[];
    dates: ExampleItem[];
  };
};

export default function AppPatterns() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData, isLoading: caseLoading, isError, error: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: patternData, isLoading: patternLoading } = useQuery<PatternAnalysisResponse>({
    queryKey: ["/api/cases", caseId, "pattern-analysis"],
    enabled: !!caseId,
  });

  const { data: deadlinesData } = useQuery<{ deadlines: Deadline[] }>({
    queryKey: ["/api/cases", caseId, "deadlines"],
    enabled: !!caseId,
  });

  const { data: tasksData } = useQuery<{ tasks: Task[] }>({
    queryKey: ["/api/cases", caseId, "tasks"],
    enabled: !!caseId,
  });

  const { data: calendarItemsData } = useQuery<{ items: CaseCalendarItem[] }>({
    queryKey: ["/api/cases", caseId, "calendar", "items"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/calendar/items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calendar items");
      return res.json();
    },
    enabled: !!caseId,
  });

  const { data: categoriesData } = useQuery<{ categories: CalendarCategory[] }>({
    queryKey: ["/api/cases", caseId, "calendar-categories"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/calendar-categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !!caseId,
  });

  const { data: communicationsData } = useQuery<{ communications: CaseCommunication[] }>({
    queryKey: ["/api/cases", caseId, "communications"],
    enabled: !!caseId,
  });

  const { toast } = useToast();

  const addToTrialPrepMutation = useMutation({
    mutationFn: async (data: { sourceType: string; sourceId: string; title: string; summary?: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        ...data,
        binderSection: "Key Evidence",
        importance: 3,
        tags: ["pattern-analysis"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast({ title: "Already in Trial Prep", variant: "destructive" });
      } else {
        toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      }
    },
  });

  const currentCase = caseData?.case;
  const status = patternData?.status;
  const themes = patternData?.themes || [];
  const patterns = patternData?.patterns || [];
  const keyDates = patternData?.keyDates || [];
  const conflictsAndGaps = patternData?.conflictsAndGaps || [];
  const keyNames = patternData?.keyNames || [];

  const deadlines = deadlinesData?.deadlines || [];
  const tasks = tasksData?.tasks || [];
  const calendarItems = calendarItemsData?.items || [];
  const categories = categoriesData?.categories || [];
  const communications = communicationsData?.communications || [];

  useEffect(() => {
    if (currentCase) {
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  useEffect(() => {
    if (!caseLoading && !currentCase && caseId) {
      if (caseError && (caseError as any).status === 401) {
        setLocation("/login?reason=session");
      } else {
        setLocation("/app/cases");
      }
    }
  }, [caseLoading, currentCase, caseId, caseError, setLocation]);

  const now = new Date();

  const overdueDeadlines = deadlines.filter(d => 
    d.status !== "done" && new Date(d.dueDate) < now
  );

  const overdueTasks = tasks.filter(t => 
    t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
  );

  const overdueFollowUps = communications.filter(c => 
    c.needsFollowUp && 
    c.followUpAt && 
    new Date(c.followUpAt) < now
  );

  const upcomingDeadlines = deadlines.filter(d => 
    d.status !== "done" && new Date(d.dueDate) >= now
  );

  const upcomingTasks = tasks.filter(t => 
    t.status !== "completed" && t.dueDate && new Date(t.dueDate) >= now
  );

  const categoryStats = categories.map(cat => {
    const itemCount = calendarItems.filter(item => item.categoryId === cat.id && !item.isDone).length;
    return { ...cat, count: itemCount };
  });

  const uncategorizedCount = calendarItems.filter(item => !item.categoryId && !item.isDone).length;

  if (caseLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError || !currentCase) {
    return (
      <AppLayout>
        <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
          <div className="flex flex-col items-center text-center max-w-md">
            <p className="font-sans text-neutral-darkest/70 mb-4">Case not found or you don't have access.</p>
            <Link
              href="/app/cases"
              className="inline-flex items-center gap-2 text-sm text-primary font-medium"
              data-testid="link-back-to-cases"
            >
              <Briefcase className="w-4 h-4" />
              Back to Cases
            </Link>
          </div>
        </section>
      </AppLayout>
    );
  }

  const renderExampleItem = (item: ExampleItem, index: number) => (
    <div 
      key={`${item.sourceType}-${item.sourceId}-${index}`}
      className="flex items-start gap-2 p-2 bg-muted/50 rounded-md"
      data-testid={`example-item-${item.sourceType}-${item.sourceId}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-darkest truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{item.excerpt}</p>
        {item.fileName && (
          <p className="text-xs text-muted-foreground mt-1">
            <FileText className="w-3 h-3 inline-block mr-1" />
            {item.fileName}
            {item.pageNumber && ` (p. ${item.pageNumber})`}
          </p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 flex-shrink-0"
        onClick={() => addToTrialPrepMutation.mutate({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          title: item.title,
          summary: item.excerpt,
        })}
        disabled={addToTrialPrepMutation.isPending}
        title="Add to Trial Prep"
        data-testid={`button-trial-prep-${item.sourceId}`}
      >
        <Scale className="w-3 h-3" />
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <Link
            href={`/app/dashboard/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4 sm:mb-6 min-h-[44px]"
            data-testid="link-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest flex items-center gap-2 sm:gap-3">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                Pattern Analysis
              </h1>
              <p className="font-sans text-sm sm:text-base text-neutral-darkest/60 mt-2">
                Spot trends across evidence, communications, and timeline events.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.open(`/api/cases/${caseId}/pattern-analysis/export`, "_blank");
              }}
              disabled={patternLoading}
              data-testid="button-export-patterns"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
          </div>

          <ModuleIntro
            title="About Pattern Analysis"
            paragraphs={[
              "This tool analyzes your evidence, notes, communications, and timeline to identify recurring themes and patterns.",
              "Pattern analysis helps you understand the overall picture of your case."
            ]}
          />

          {patternLoading ? (
            <div className="w-full flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Analyzing patterns...</span>
            </div>
          ) : (
            <>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border border-[#A2BEC2]" data-testid="card-evidence-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      Evidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Files</span>
                        <span className="font-medium">{status?.evidenceTotal || 0}</span>
                      </div>
                      {status && status.evidenceTotal > 0 && (
                        <>
                          <Progress 
                            value={(status.extractedComplete / status.evidenceTotal) * 100} 
                            className="h-2" 
                          />
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Check className="w-3 h-3 mr-1" />
                              {status.extractedComplete}
                            </Badge>
                            {status.extractedProcessing > 0 && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                {status.extractedProcessing}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]" data-testid="card-ai-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="w-4 h-4 text-primary" />
                      AI Analyses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Complete</span>
                        <span className="font-medium">{status?.analysesComplete || 0}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(status?.analysesProcessing || 0) > 0 && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            {status?.analysesProcessing} processing
                          </Badge>
                        )}
                        {(status?.analysesFailed || 0) > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {status?.analysesFailed} failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]" data-testid="card-notes-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-primary" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-2">
                      <p className="text-2xl font-bold text-neutral-darkest">{status?.notesTotal || 0}</p>
                      <p className="text-sm text-muted-foreground">Evidence notes</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]" data-testid="card-timeline-status">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-4 h-4 text-primary" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-2">
                      <p className="text-2xl font-bold text-neutral-darkest">{status?.timelineTotal || 0}</p>
                      <p className="text-sm text-muted-foreground">Events logged</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="border border-[#A2BEC2]" data-testid="card-themes">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Themes Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {themes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No themes identified yet. Add more evidence and notes.</p>
                    ) : (
                      <div className="space-y-3">
                        {themes.map((theme, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {theme.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{theme.count} occurrence(s)</span>
                            </div>
                            {theme.examples.length > 0 && (
                              <div className="space-y-1 ml-2">
                                {theme.examples.slice(0, 2).map((ex, j) => renderExampleItem(ex, j))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]" data-testid="card-patterns">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-4 h-4 text-primary" />
                      Patterns Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patterns.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No patterns identified yet. Add more timeline events and communications.</p>
                    ) : (
                      <div className="space-y-3">
                        {patterns.map((pattern, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {pattern.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{pattern.count} item(s)</span>
                            </div>
                            {pattern.examples.length > 0 && (
                              <div className="space-y-1 ml-2">
                                {pattern.examples.slice(0, 2).map((ex, j) => renderExampleItem(ex, j))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="border border-[#A2BEC2]" data-testid="card-key-dates">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-4 h-4 text-primary" />
                      Key Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {keyDates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No key dates found. Add timeline events with dates.</p>
                    ) : (
                      <div className="space-y-3">
                        {keyDates.slice(0, 5).map((entry, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-neutral-darkest">
                                {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className="text-xs text-muted-foreground">{entry.label}</span>
                            </div>
                            {entry.sources.length > 0 && (
                              <div className="space-y-1 ml-2">
                                {entry.sources.slice(0, 2).map((src, j) => renderExampleItem(src, j))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]" data-testid="card-conflicts">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="w-4 h-4 text-[#E57373]" />
                      Conflicts & Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conflictsAndGaps.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No conflicts or gaps detected. Great job!</p>
                    ) : (
                      <div className="space-y-2">
                        {conflictsAndGaps.slice(0, 5).map((item, i) => renderExampleItem(item, i))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {keyNames.length > 0 && (
                <div className="w-full mb-6">
                  <Card className="border border-[#A2BEC2]" data-testid="card-key-names">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4 text-primary" />
                        Key Names
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {keyNames.map((entry, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {entry.name} ({entry.count})
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-[#A2BEC2]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="w-5 h-5 text-[#E57373]" />
                      Overdue / At Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overdueDeadlines.length === 0 && overdueTasks.length === 0 && overdueFollowUps.length === 0 ? (
                      <p className="text-sm text-neutral-darkest/60">No overdue items. Great job staying on track!</p>
                    ) : (
                      <div className="space-y-3">
                        {overdueDeadlines.map(d => (
                          <div 
                            key={`deadline-${d.id}`}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-neutral-darkest/10"
                            data-testid={`overdue-deadline-${d.id}`}
                          >
                            <Clock className="w-4 h-4 text-[#E57373] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-darkest truncate">{d.title}</p>
                              <p className="text-xs text-neutral-darkest/60">
                                Deadline - Due {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          </div>
                        ))}
                        {overdueTasks.map(t => (
                          <div 
                            key={`task-${t.id}`}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-neutral-darkest/10"
                            data-testid={`overdue-task-${t.id}`}
                          >
                            <CheckSquare className="w-4 h-4 text-[#64B5F6] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-darkest truncate">{t.title}</p>
                              <p className="text-xs text-neutral-darkest/60">
                                Case To-Do - Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                              </p>
                            </div>
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          </div>
                        ))}
                        {overdueFollowUps.map(c => (
                          <div 
                            key={`followup-${c.id}`}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-neutral-darkest/10"
                            data-testid={`overdue-followup-${c.id}`}
                          >
                            <MessageSquare className="w-4 h-4 text-[#9575CD] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-darkest truncate">
                                {c.subject || `Follow-up needed`}
                              </p>
                              <p className="text-xs text-neutral-darkest/60">
                                Follow-up Due {c.followUpAt ? new Date(c.followUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                              </p>
                            </div>
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-[#7BA3A8]" />
                      By Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#E57373]" />
                          <span className="text-sm font-medium text-neutral-darkest">Deadlines</span>
                        </div>
                        <Badge variant="outline">{upcomingDeadlines.length} upcoming</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-[#64B5F6]" />
                          <span className="text-sm font-medium text-neutral-darkest">Case To-Do</span>
                        </div>
                        <Badge variant="outline">{upcomingTasks.length} upcoming</Badge>
                      </div>
                      {categoryStats.map(cat => (
                        <div 
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm font-medium text-neutral-darkest">{cat.name}</span>
                          </div>
                          <Badge variant="outline">{cat.count} upcoming</Badge>
                        </div>
                      ))}
                      {uncategorizedCount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[#7BA3A8]" />
                            <span className="text-sm font-medium text-neutral-darkest">Uncategorized</span>
                          </div>
                          <Badge variant="outline">{uncategorizedCount} upcoming</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2] lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{status?.evidenceTotal || 0}</p>
                        <p className="text-sm text-neutral-darkest/60">Evidence Files</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{themes.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Themes Found</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{patterns.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Patterns Found</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{keyDates.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Key Dates</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-[#E57373]">{conflictsAndGaps.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Conflicts/Gaps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#A2BEC2] lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="w-5 h-5 text-[#9575CD]" />
                      Communications Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{status?.communicationsTotal || communications.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Total Logged</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{communications.filter(c => c.status !== "resolved").length}</p>
                        <p className="text-sm text-neutral-darkest/60">Unresolved</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-neutral-darkest">{communications.filter(c => c.needsFollowUp).length}</p>
                        <p className="text-sm text-neutral-darkest/60">Follow-ups Due</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-md">
                        <p className="text-2xl font-bold text-[#E57373]">{overdueFollowUps.length}</p>
                        <p className="text-sm text-neutral-darkest/60">Overdue Follow-ups</p>
                      </div>
                    </div>
                    {communications.length === 0 && (
                      <p className="text-sm text-neutral-darkest/60 mt-4 text-center">
                        No communications logged yet. Track co-parenting or counsel communications in the Communications Log.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
