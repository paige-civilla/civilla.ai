import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Clock, CheckSquare, Calendar, FileCheck, AlertCircle, TrendingUp, X, Sparkles, FileText, ArrowRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CaseMonthCalendar from "@/components/calendar/CaseMonthCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useModuleView } from "@/hooks/useModuleView";
import type { Case, CalendarCategory } from "@shared/schema";
import { CASE_FLOW, getVisibleModules, modulePath, moduleLabel, moduleDescription, type ModuleKey } from "@/lib/caseFlow";
import { BookOpen, FolderOpen, History, MessageSquare, BarChart3, FileSearch, FileEdit, FileStack, Calendar as CalendarIcon, CheckSquare as CheckSquareIcon, Contact, Users, Calculator, Scale, HelpCircle, Heart } from "lucide-react";
import AiProcessingStatusCard from "@/components/dashboard/AiProcessingStatusCard";
import PhaseStatusBar from "@/components/app/PhaseStatusBar";

type UpcomingEvent = {
  kind: "deadline" | "todo" | "calendar" | "communication";
  id: string;
  title: string;
  date: string;
  isDone: boolean;
  color: string;
  categoryName?: string;
};

type DashboardCalendarResponse = {
  monthStart: string;
  monthEnd: string;
  events: UpcomingEvent[];
  upcoming: UpcomingEvent[];
  categories: CalendarCategory[];
};

type AddItemType = "deadline" | "todo" | "calendar";

type CasePhase = "collecting" | "reviewing" | "draft-ready";

type DraftReadinessStats = {
  totalClaims: number;
  acceptedClaims: number;
  suggestedClaims: number;
  rejectedClaims: number;
  claimsWithMissingInfo: number;
  totalEvidence: number;
  evidenceWithExtraction: number;
  evidenceWithClaims: number;
  readinessScore: number;
};

type DraftReadinessResponse = {
  stats: DraftReadinessStats;
  phase: CasePhase;
};

const colorPresets = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
  "#AED581", "#DCE775", "#FFD54F", "#FFB74D", "#FF8A65",
];

export default function AppDashboard() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  useModuleView("dashboard", caseId);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<AddItemType | null>(null);
  const [addForm, setAddForm] = useState({
    title: "",
    dueDate: "",
    notes: "",
    priority: "2",
    categoryId: "",
    colorOverride: "",
  });
  const [createCategoryMode, setCreateCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#7BA3A8");
  const [dismissedPhaseBanner, setDismissedPhaseBanner] = useState<string | null>(null);
  const [previousPhase, setPreviousPhase] = useState<CasePhase | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: caseData, isLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: dashboardData } = useQuery<DashboardCalendarResponse>({
    queryKey: ["/api/cases", caseId, "dashboard", "calendar", currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/dashboard/calendar?month=${currentMonth}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard calendar");
      return res.json();
    },
    enabled: !!caseId,
  });

  const { data: draftReadinessData } = useQuery<DraftReadinessResponse>({
    queryKey: ["/api/cases", caseId, "draft-readiness"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/draft-readiness`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch draft readiness");
      return res.json();
    },
    enabled: !!caseId,
  });

  const draftStats = draftReadinessData?.stats;
  const casePhase = draftReadinessData?.phase || "collecting";

  const upcomingItems = dashboardData?.upcoming || [];
  const categories = dashboardData?.categories || [];

  const toggleTaskMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${payload.id}`, { status: payload.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
    },
  });

  const toggleDeadlineMutation = useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/deadlines/${payload.id}`, { status: payload.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
    },
  });

  const toggleCalendarItemMutation = useMutation({
    mutationFn: async (payload: { id: string; isDone: boolean }) => {
      return apiRequest("PATCH", `/api/calendar/items/${payload.id}`, { isDone: payload.isDone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
    },
  });

  const createDeadlineMutation = useMutation({
    mutationFn: async (data: { title: string; dueDate: string; notes?: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/deadlines`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
      toast({ title: "Deadline created" });
      resetAddModal();
    },
    onError: () => {
      toast({ title: "Failed to create deadline", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; dueDate?: string; description?: string; priority?: number }) => {
      return apiRequest("POST", `/api/cases/${caseId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
      toast({ title: "To-Do created" });
      resetAddModal();
    },
    onError: () => {
      toast({ title: "Failed to create to-do", variant: "destructive" });
    },
  });

  const createCalendarItemMutation = useMutation({
    mutationFn: async (data: { title: string; startDate: string; categoryId?: string; colorOverride?: string; notes?: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/calendar/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
      toast({ title: "Calendar item created" });
      resetAddModal();
    },
    onError: () => {
      toast({ title: "Failed to create calendar item", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/calendar/categories`, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
      toast({ title: "Category created" });
      setCreateCategoryMode(false);
      setNewCategoryName("");
      setNewCategoryColor("#7BA3A8");
      if (data?.category?.id) {
        setAddForm(prev => ({ ...prev, categoryId: data.category.id }));
      }
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const resetAddModal = () => {
    setAddModalOpen(false);
    setAddItemType(null);
    setAddForm({ title: "", dueDate: "", notes: "", priority: "2", categoryId: "", colorOverride: "" });
    setCreateCategoryMode(false);
    setNewCategoryName("");
    setNewCategoryColor("#7BA3A8");
  };

  const handleAddSubmit = () => {
    if (!addForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (addItemType === "deadline") {
      if (!addForm.dueDate) {
        toast({ title: "Due date is required for deadlines", variant: "destructive" });
        return;
      }
      createDeadlineMutation.mutate({
        title: addForm.title,
        dueDate: new Date(addForm.dueDate).toISOString(),
        notes: addForm.notes || undefined,
      });
    } else if (addItemType === "todo") {
      createTaskMutation.mutate({
        title: addForm.title,
        dueDate: addForm.dueDate ? new Date(addForm.dueDate).toISOString() : undefined,
        description: addForm.notes || undefined,
        priority: parseInt(addForm.priority, 10),
      });
    } else if (addItemType === "calendar") {
      if (!addForm.dueDate) {
        toast({ title: "Date is required for calendar items", variant: "destructive" });
        return;
      }
      createCalendarItemMutation.mutate({
        title: addForm.title,
        startDate: new Date(addForm.dueDate).toISOString(),
        categoryId: addForm.categoryId || undefined,
        colorOverride: addForm.colorOverride || undefined,
        notes: addForm.notes || undefined,
      });
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName,
      color: newCategoryColor,
    });
  };

  const resolveCommunicationMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/cases/${caseId}/communications/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "dashboard"] });
    },
  });

  const handleToggleItem = (item: UpcomingEvent) => {
    if (item.kind === "todo") {
      toggleTaskMutation.mutate({ id: item.id, status: "completed" });
    } else if (item.kind === "deadline") {
      toggleDeadlineMutation.mutate({ id: item.id, status: "done" });
    } else if (item.kind === "calendar") {
      toggleCalendarItemMutation.mutate({ id: item.id, isDone: true });
    } else if (item.kind === "communication") {
      resolveCommunicationMutation.mutate(item.id);
    }
  };

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

  useEffect(() => {
    if (casePhase && previousPhase && casePhase !== previousPhase && caseId) {
      const bannerKey = `phase-banner-${caseId}-${casePhase}`;
      const alreadyDismissed = sessionStorage.getItem(bannerKey);
      if (!alreadyDismissed) {
        setDismissedPhaseBanner(null);
      }
    }
    if (casePhase && casePhase !== previousPhase) {
      setPreviousPhase(casePhase);
    }
  }, [casePhase, previousPhase, caseId]);

  const showPhaseBanner = useMemo(() => {
    if (!caseId || !casePhase) return false;
    const bannerKey = `phase-banner-${caseId}-${casePhase}`;
    const alreadyDismissed = sessionStorage.getItem(bannerKey);
    if (alreadyDismissed) return false;
    if (dismissedPhaseBanner === casePhase) return false;
    return true;
  }, [caseId, casePhase, dismissedPhaseBanner]);

  const handleDismissPhaseBanner = () => {
    if (caseId && casePhase) {
      const bannerKey = `phase-banner-${caseId}-${casePhase}`;
      sessionStorage.setItem(bannerKey, "true");
      setDismissedPhaseBanner(casePhase);
    }
  };

  const getPhaseBannerContent = (phase: CasePhase) => {
    switch (phase) {
      case "collecting":
        return {
          title: "Phase: Collecting Evidence",
          message: "Upload your documents, images, and recordings. Lexi will help you extract key facts and claims.",
          icon: FileText,
          color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      case "reviewing":
        return {
          title: "Phase: Reviewing Claims",
          message: "You have claims to review! Accept or reject suggested claims and attach sources to strengthen your case.",
          icon: Sparkles,
          color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "draft-ready":
        return {
          title: "Phase: Ready for Draft",
          message: "Your case has enough accepted claims with sources. You can now compile them into a document.",
          icon: FileCheck,
          color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
          iconColor: "text-green-600 dark:text-green-400",
        };
    }
  };

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
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="mb-4">
            <PhaseStatusBar phase={casePhase} />
          </div>

          {showPhaseBanner && casePhase && (() => {
            const bannerContent = getPhaseBannerContent(casePhase);
            const BannerIcon = bannerContent.icon;
            return (
              <div className={`w-full mb-4 p-4 rounded-lg border ${bannerContent.color} flex items-start gap-3`} data-testid="phase-transition-banner">
                <BannerIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${bannerContent.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{bannerContent.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{bannerContent.message}</p>
                  {casePhase === "reviewing" && (
                    <Link href={`/app/cases/${caseId}/evidence`}>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" data-testid="button-banner-evidence">
                        Review Evidence <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                  {casePhase === "draft-ready" && (
                    <Link href={`/app/cases/${caseId}/documents`}>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" data-testid="button-banner-documents">
                        Go to Documents <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={handleDismissPhaseBanner} data-testid="button-dismiss-phase-banner">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-bold text-lg sm:text-xl md:text-2xl text-neutral-darkest break-words leading-tight" data-testid="text-case-header">
                {primaryCase.nickname || primaryCase.title}
              </h1>
              {primaryCase.nickname && (
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1 truncate" data-testid="text-case-title-secondary">
                  {primaryCase.title}
                </p>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-full lg:w-[380px] lg:flex-shrink-0">
              <div className="bg-white rounded-lg border border-[#1E2020] overflow-hidden">
                <CaseMonthCalendar caseId={primaryCase.id} />
                
                <div className="px-4 pb-4">
                  <div className="border-t border-neutral-darkest/10 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-neutral-darkest">Upcoming</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-darkest/60">Next 7</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddModalOpen(true)}
                          data-testid="button-add-calendar-item"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {upcomingItems.length === 0 ? (
                      <p className="text-sm text-neutral-darkest/60">
                        Nothing upcoming yet. Add a deadline or a Case To-Do with a due date.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingItems.map((item) => {
                          const dateLabel = new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });

                          return (
                            <div
                              key={`${item.kind}-${item.id}`}
                              className="flex items-start gap-3 rounded-md border border-neutral-darkest/10 bg-white/60 p-3"
                              data-testid={`upcoming-item-${item.kind}-${item.id}`}
                            >
                              <Checkbox
                                checked={false}
                                onCheckedChange={(val) => {
                                  if (val === true) {
                                    handleToggleItem(item);
                                  }
                                }}
                                data-testid={`checkbox-upcoming-${item.kind}-${item.id}`}
                              />
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-sans font-medium text-sm text-neutral-darkest leading-tight truncate">{item.title}</p>
                                  <span className="text-xs text-neutral-darkest/60 whitespace-nowrap flex-shrink-0">{dateLabel}</span>
                                </div>
                                <p className="text-xs text-neutral-darkest/60 mt-1">
                                  {item.kind === "deadline" ? "Deadline" : item.kind === "todo" ? "Case To-Do" : item.categoryName || "Calendar"}
                                </p>
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

            <div className="flex-1 min-w-0">
              <div className="w-full space-y-6">
                {draftStats && (
                  <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20" data-testid="card-draft-readiness">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Draft Readiness
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Readiness Score</span>
                            <span className="text-sm font-medium">{draftStats.readinessScore}%</span>
                          </div>
                          <Progress value={draftStats.readinessScore} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-lg" data-testid="text-accepted-claims">{draftStats.acceptedClaims}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Accepted Claims</span>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-lg" data-testid="text-pending-claims">{draftStats.suggestedClaims}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Pending Review</span>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-lg" data-testid="text-missing-info">{draftStats.claimsWithMissingInfo}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Missing Info</span>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <FileCheck className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-lg" data-testid="text-evidence-extracted">{draftStats.evidenceWithExtraction}/{draftStats.totalEvidence}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Evidence Extracted</span>
                        </div>
                      </div>

                      {draftStats.suggestedClaims > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You have {draftStats.suggestedClaims} claims pending review. Review them in your evidence files.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <AiProcessingStatusCard caseId={caseId!} />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {getVisibleModules({ hasChildren: primaryCase.hasChildren || false }).map((moduleKey) => {
                    const MODULE_ICONS: Record<ModuleKey, typeof BookOpen> = {
                      "start-here": HelpCircle,
                      "document-library": BookOpen,
                      "evidence": FolderOpen,
                      "timeline": History,
                      "communications": MessageSquare,
                      "pattern-analysis": BarChart3,
                      "disclosures": FileSearch,
                      "documents": FileEdit,
                      "exhibits": FileStack,
                      "deadlines": CalendarIcon,
                      "case-to-do": CheckSquareIcon,
                      "contacts": Contact,
                      "children": Users,
                      "child-support": Calculator,
                      "trial-prep": Scale,
                      "parenting-plan": Heart,
                    };
                    const Icon = MODULE_ICONS[moduleKey];
                    return (
                      <Link
                        key={moduleKey}
                        href={modulePath(moduleKey, primaryCase.id)}
                        className="relative bg-[hsl(var(--module-tile))] border border-[hsl(var(--module-tile-border))] rounded-lg p-4 sm:p-5 hover:bg-[hsl(var(--module-tile-hover))] hover:border-[#314143] cursor-pointer block transition-colors min-h-[44px]"
                        data-testid={`module-card-${moduleKey}`}
                      >
                        <div className="w-10 h-10 rounded-md bg-[#F2F2F2] dark:bg-[hsl(var(--background))] flex items-center justify-center mb-2 sm:mb-3">
                          <Icon className="w-5 h-5 text-[hsl(var(--module-tile-icon))]" />
                        </div>
                        <h3 className="font-heading font-bold text-base text-[#1E2020] dark:text-[hsl(var(--foreground))] mb-1 break-words">
                          {moduleLabel(moduleKey)}
                        </h3>
                        <p className="font-sans text-sm text-[#1E2020]/70 dark:text-[hsl(var(--foreground))]/70 break-words">
                          {moduleDescription(moduleKey)}
                        </p>
                      </Link>
                    );
                  })}
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

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>

          {!addItemType ? (
            <div className="grid grid-cols-1 gap-3 py-4">
              <Button
                variant="outline"
                className="h-16 justify-start gap-3"
                onClick={() => setAddItemType("deadline")}
                data-testid="button-add-type-deadline"
              >
                <Clock className="w-6 h-6 text-[#E57373]" />
                <div className="text-left">
                  <p className="font-semibold">Deadline</p>
                  <p className="text-xs text-neutral-darkest/60">Important date with a due date</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 justify-start gap-3"
                onClick={() => setAddItemType("todo")}
                data-testid="button-add-type-todo"
              >
                <CheckSquare className="w-6 h-6 text-[#64B5F6]" />
                <div className="text-left">
                  <p className="font-semibold">Case To-Do</p>
                  <p className="text-xs text-neutral-darkest/60">Task with optional due date</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 justify-start gap-3"
                onClick={() => setAddItemType("calendar")}
                data-testid="button-add-type-calendar"
              >
                <Calendar className="w-6 h-6 text-[#7BA3A8]" />
                <div className="text-left">
                  <p className="font-semibold">Calendar Item</p>
                  <p className="text-xs text-neutral-darkest/60">Event with category and color</p>
                </div>
              </Button>
            </div>
          ) : createCategoryMode ? (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Court Dates"
                  data-testid="input-new-category-name"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                    data-testid="input-new-category-color"
                  />
                  <div className="flex flex-wrap gap-1">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border border-neutral-darkest/20 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                        data-testid={`preset-color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCreateCategoryMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Button size="sm" variant="ghost" onClick={() => setAddItemType(null)}>
                  Back
                </Button>
                <span className="text-sm font-medium">
                  {addItemType === "deadline" ? "New Deadline" : addItemType === "todo" ? "New Case To-Do" : "New Calendar Item"}
                </span>
              </div>

              <div>
                <Label htmlFor="add-title">Title</Label>
                <Input
                  id="add-title"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Enter title"
                  data-testid="input-add-title"
                />
              </div>

              <div>
                <Label htmlFor="add-date">{addItemType === "calendar" ? "Date" : "Due Date"}{addItemType !== "todo" && " *"}</Label>
                <Input
                  id="add-date"
                  type="date"
                  value={addForm.dueDate}
                  onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                  data-testid="input-add-date"
                />
              </div>

              {addItemType === "todo" && (
                <div>
                  <Label htmlFor="add-priority">Priority</Label>
                  <Select
                    value={addForm.priority}
                    onValueChange={(val) => setAddForm({ ...addForm, priority: val })}
                  >
                    <SelectTrigger data-testid="select-add-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {addItemType === "calendar" && (
                <>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={addForm.categoryId}
                      onValueChange={(val) => {
                        if (val === "__create__") {
                          setCreateCategoryMode(true);
                        } else {
                          setAddForm({ ...addForm, categoryId: val });
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-add-category">
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="__create__">
                          <span className="text-primary">+ Create new category</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Color Override (optional)</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={addForm.colorOverride || "#7BA3A8"}
                        onChange={(e) => setAddForm({ ...addForm, colorOverride: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                        data-testid="input-add-color"
                      />
                      <div className="flex flex-wrap gap-1">
                        {colorPresets.slice(0, 8).map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="w-6 h-6 rounded-full border border-neutral-darkest/20 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => setAddForm({ ...addForm, colorOverride: color })}
                            data-testid={`add-preset-color-${color}`}
                          />
                        ))}
                      </div>
                      {addForm.colorOverride && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddForm({ ...addForm, colorOverride: "" })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="add-notes">{addItemType === "todo" ? "Description" : "Notes"}</Label>
                <Textarea
                  id="add-notes"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={3}
                  data-testid="input-add-notes"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={resetAddModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSubmit}
                  disabled={createDeadlineMutation.isPending || createTaskMutation.isPending || createCalendarItemMutation.isPending}
                  data-testid="button-add-submit"
                >
                  {(createDeadlineMutation.isPending || createTaskMutation.isPending || createCalendarItemMutation.isPending)
                    ? "Creating..."
                    : "Create"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
