import { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, FileText, Calendar, MessageSquare, Users, FolderOpen, FileStack, CheckSquare, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CaseMonthCalendar from "@/components/calendar/CaseMonthCalendar";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, Task, Deadline } from "@shared/schema";

const getModuleCards = (caseId: string) => [
  {
    title: "Documents",
    description: "Upload and organize your case documents",
    icon: FileText,
    href: `/app/documents/${caseId}`,
  },
  {
    title: "Timeline",
    description: "Track key dates and deadlines",
    icon: Calendar,
    href: `/app/timeline/${caseId}`,
  },
  {
    title: "Evidence",
    description: "Manage and organize case evidence",
    icon: FolderOpen,
    href: `/app/evidence/${caseId}`,
  },
  {
    title: "Exhibits",
    description: "Prepare exhibits for court filings",
    icon: FileStack,
    href: `/app/exhibits/${caseId}`,
  },
  {
    title: "Case To-Do",
    description: "Track your to-do items",
    icon: CheckSquare,
    href: `/app/tasks/${caseId}`,
  },
  {
    title: "Deadlines",
    description: "Never miss an important date",
    icon: Clock,
    href: `/app/deadlines/${caseId}`,
  },
  {
    title: "Messages",
    description: "Secure communication center",
    icon: MessageSquare,
    href: `/app/messages/${caseId}`,
  },
  {
    title: "Contacts",
    description: "Manage case-related contacts",
    icon: Users,
    href: `/app/contacts/${caseId}`,
  },
];

type UpcomingUnified = {
  kind: "task" | "deadline";
  id: string;
  title: string;
  dateISO: string;
  completed: boolean;
  subtitle: string;
};

export default function AppDashboard() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData, isLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: tasksData } = useQuery<{ tasks: Task[] }>({
    queryKey: ["/api/cases", caseId, "tasks"],
    enabled: !!caseId,
  });

  const { data: deadlinesData } = useQuery<{ deadlines: Deadline[] }>({
    queryKey: ["/api/cases", caseId, "deadlines"],
    enabled: !!caseId,
  });

  const tasks = tasksData?.tasks || [];
  const deadlines = deadlinesData?.deadlines || [];

  const toggleTaskMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${payload.id}`, { status: payload.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
    },
  });

  const toggleDeadlineMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/deadlines/${payload.id}`, { status: payload.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
    },
  });

  const upcomingItems: UpcomingUnified[] = useMemo(() => {
    const normalize = (d?: string | null) => {
      if (!d) return null;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toISOString();
    };

    const taskUnified: UpcomingUnified[] = tasks
      .map((t) => {
        const iso = normalize(t.dueDate);
        if (!iso) return null;
        return {
          kind: "task" as const,
          id: t.id,
          title: t.title,
          dateISO: iso,
          completed: t.status === "completed",
          subtitle: "Case To-Do",
        };
      })
      .filter(Boolean) as UpcomingUnified[];

    const deadlineUnified: UpcomingUnified[] = deadlines
      .map((d) => {
        const iso = normalize(d.dueDate);
        if (!iso) return null;
        return {
          kind: "deadline" as const,
          id: d.id,
          title: d.title,
          dateISO: iso,
          completed: d.status === "done",
          subtitle: "Deadline",
        };
      })
      .filter(Boolean) as UpcomingUnified[];

    const combined = [...taskUnified, ...deadlineUnified]
      .filter((x) => !x.completed)
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
      .slice(0, 7);

    return combined;
  }, [tasks, deadlines]);

  const primaryCase = caseData?.case;

  useEffect(() => {
    if (primaryCase) {
      localStorage.setItem("selectedCaseId", primaryCase.id);
    }
  }, [primaryCase]);

  useEffect(() => {
    if (!isLoading && !primaryCase && caseId) {
      setLocation("/app/cases");
    }
  }, [isLoading, primaryCase, caseId, setLocation]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!primaryCase) {
    return null;
  }

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full mb-8">
            <div>
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Case Workspace</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {primaryCase.title}
              </h1>
            </div>
            <Link
              href="/app/cases"
              className="inline-flex items-center gap-2 text-sm text-bush font-medium"
              data-testid="link-view-all-cases"
            >
              <Briefcase className="w-4 h-4" />
              View all cases
            </Link>
          </div>

          <div className="w-full flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="bg-white rounded-lg border border-[hsl(var(--app-panel-border))] overflow-hidden">
                <CaseMonthCalendar caseId={primaryCase.id} />
                
                <div className="px-4 pb-4">
                  <div className="border-t border-neutral-darkest/10 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-neutral-darkest">Upcoming</h3>
                      <span className="text-xs text-neutral-darkest/60">Next 7</span>
                    </div>

                    {upcomingItems.length === 0 ? (
                      <p className="text-sm text-neutral-darkest/60">
                        Nothing upcoming yet. Add a deadline or a Case To-Do with a due date.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingItems.map((item) => {
                          const dateLabel = new Date(item.dateISO).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });

                          return (
                            <div
                              key={`${item.kind}-${item.id}`}
                              className="flex items-start gap-3 rounded-md border border-neutral-darkest/10 bg-[#F3F6F7] p-3"
                              data-testid={`upcoming-item-${item.kind}-${item.id}`}
                            >
                              <Checkbox
                                checked={false}
                                onCheckedChange={(val) => {
                                  const checked = val === true;
                                  if (!checked) return;
                                  if (item.kind === "task") {
                                    toggleTaskMutation.mutate({ id: item.id, status: "completed" });
                                  }
                                  if (item.kind === "deadline") {
                                    toggleDeadlineMutation.mutate({ id: item.id, status: "done" });
                                  }
                                }}
                                data-testid={`checkbox-upcoming-${item.kind}-${item.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-sans font-medium text-sm text-neutral-darkest leading-tight truncate">{item.title}</p>
                                  <span className="text-xs text-neutral-darkest/60 whitespace-nowrap flex-shrink-0">{dateLabel}</span>
                                </div>
                                <p className="text-xs text-neutral-darkest/60 mt-1">{item.subtitle}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="w-full bg-[#e7ebea] rounded-lg p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-bush flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-lg text-neutral-darkest">
                      Case Workspace
                    </p>
                    <p className="font-sans text-sm text-neutral-darkest/70 mt-1">
                      This is your central hub for managing your case. Access documents, track deadlines, and stay organized.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getModuleCards(primaryCase.id).map((module) => (
                    <Link
                      key={module.title}
                      href={module.href}
                      className="relative bg-white border border-[hsl(var(--app-panel-border))] rounded-lg p-5 hover:bg-[hsl(var(--app-surface-2))] cursor-pointer block transition-colors"
                      data-testid={`module-card-${module.title.toLowerCase()}`}
                    >
                      <div className="w-10 h-10 rounded-md bg-muted-green/30 flex items-center justify-center mb-3">
                        <module.icon className="w-5 h-5 text-bush" />
                      </div>
                      <h3 className="font-heading font-bold text-base text-neutral-darkest mb-1">
                        {module.title}
                      </h3>
                      <p className="font-sans text-sm text-neutral-darkest/60">
                        {module.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {primaryCase.state && (
            <div className="w-full mt-8 pt-8 border-t border-neutral-darkest/10">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-3">
                Case Details
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-darkest/70">
                {primaryCase.state && <span>State: {primaryCase.state}</span>}
                {primaryCase.county && <span>County: {primaryCase.county}</span>}
                {primaryCase.caseType && <span>Type: {primaryCase.caseType}</span>}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
