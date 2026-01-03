import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, Briefcase, AlertCircle, Clock, CheckSquare, Calendar, Activity, MessageSquare } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Case, Task, Deadline, CaseCalendarItem, CalendarCategory, CaseCommunication } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";

type PatternDataResponse = {
  deadlines: Deadline[];
  tasks: Task[];
  calendarItems: CaseCalendarItem[];
  categories: CalendarCategory[];
};

export default function AppPatterns() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData, isLoading: caseLoading, isError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
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

  const currentCase = caseData?.case;
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
      setLocation("/app/cases");
    }
  }, [caseLoading, currentCase, caseId, setLocation]);

  const now = new Date();

  const overdueDeadlines = deadlines.filter(d => 
    d.status !== "done" && new Date(d.dueDate) < now
  );

  const overdueTasks = tasks.filter(t => 
    t.status !== "completed" && t.dueDate && new Date(t.dueDate) < now
  );

  const unresolvedCommunications = communications.filter(c => c.status !== "resolved");
  const followUpsDue = communications.filter(c => c.requiresFollowUp && !c.followUpCompleted);
  const overdueFollowUps = communications.filter(c => 
    c.requiresFollowUp && 
    !c.followUpCompleted && 
    c.followUpDueDate && 
    new Date(c.followUpDueDate) < now
  );

  const upcomingDeadlines = deadlines.filter(d => 
    d.status !== "done" && new Date(d.dueDate) >= now
  );

  const upcomingTasks = tasks.filter(t => 
    t.status !== "completed" && t.dueDate && new Date(t.dueDate) >= now
  );

  const upcomingCalendarItems = calendarItems.filter(item => 
    !item.isDone && new Date(item.startDate) >= now
  );

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const categoryStats = categories.map(cat => {
    const itemCount = calendarItems.filter(item => item.categoryId === cat.id && !item.isDone).length;
    return { ...cat, count: itemCount };
  });

  const uncategorizedCount = calendarItems.filter(item => !item.categoryId && !item.isDone).length;

  const recentActivity: Array<{ 
    type: "deadline" | "task" | "calendar" | "communication"; 
    id: string; 
    title: string; 
    updatedAt: Date; 
    status: string;
  }> = [];

  for (const d of deadlines.slice(0, 10)) {
    recentActivity.push({
      type: "deadline",
      id: d.id,
      title: d.title,
      updatedAt: new Date(d.updatedAt || d.createdAt),
      status: d.status === "done" ? "Completed" : "Pending",
    });
  }

  for (const t of tasks.slice(0, 10)) {
    recentActivity.push({
      type: "task",
      id: t.id,
      title: t.title,
      updatedAt: new Date(t.updatedAt || t.createdAt),
      status: t.status === "completed" ? "Completed" : "Pending",
    });
  }

  for (const item of calendarItems.slice(0, 10)) {
    recentActivity.push({
      type: "calendar",
      id: item.id,
      title: item.title,
      updatedAt: new Date(item.updatedAt || item.createdAt),
      status: item.isDone ? "Completed" : "Scheduled",
    });
  }

  for (const c of communications.slice(0, 10)) {
    recentActivity.push({
      type: "communication",
      id: c.id,
      title: c.subject || `${c.channel} with ${c.contactName || "contact"}`,
      updatedAt: new Date(c.updatedAt || c.createdAt),
      status: c.status === "resolved" ? "Resolved" : "Pending",
    });
  }

  recentActivity.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const top10Activity = recentActivity.slice(0, 10);

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
                Spot trends across tasks, deadlines, and calendar items over time.
              </p>
            </div>
          </div>

          <ModuleIntro
            title="About Pattern Analysis"
            paragraphs={[
              "This tool analyzes your logged communications to identify recurring themes and patterns. Recognizing patterns can help you understand the overall picture.",
              "Pattern analysis is for your own organization and understanding."
            ]}
          />

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
                            {c.subject || `Follow-up: ${c.contactName || "contact"}`}
                          </p>
                          <p className="text-xs text-neutral-darkest/60">
                            Follow-up Due {c.followUpDueDate ? new Date(c.followUpDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
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
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {top10Activity.length === 0 ? (
                  <p className="text-sm text-neutral-darkest/60">No recent activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {top10Activity.map(item => (
                      <div 
                        key={`${item.type}-${item.id}`}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border border-neutral-darkest/5"
                        data-testid={`activity-${item.type}-${item.id}`}
                      >
                        {item.type === "deadline" && <Clock className="w-4 h-4 text-[#E57373] flex-shrink-0" />}
                        {item.type === "task" && <CheckSquare className="w-4 h-4 text-[#64B5F6] flex-shrink-0" />}
                        {item.type === "calendar" && <Calendar className="w-4 h-4 text-[#7BA3A8] flex-shrink-0" />}
                        {item.type === "communication" && <MessageSquare className="w-4 h-4 text-[#9575CD] flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-darkest truncate">{item.title}</p>
                          <p className="text-xs text-neutral-darkest/60">
                            {item.type === "deadline" ? "Deadline" : item.type === "task" ? "Case To-Do" : item.type === "communication" ? "Communication" : "Calendar"} - {item.status}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-darkest/50 whitespace-nowrap">
                          {item.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{deadlines.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Total Deadlines</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{tasks.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Total Tasks</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{calendarItems.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Calendar Items</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-[#E57373]">{overdueDeadlines.length + overdueTasks.length + overdueFollowUps.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Overdue Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#A2BEC2]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-[#9575CD]" />
                  Communications Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{communications.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Total Logged</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{unresolvedCommunications.length}</p>
                    <p className="text-sm text-neutral-darkest/60">Unresolved</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-md">
                    <p className="text-2xl font-bold text-neutral-darkest">{followUpsDue.length}</p>
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
        </div>
      </section>
    </AppLayout>
  );
}
