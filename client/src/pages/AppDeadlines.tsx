import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Clock, Briefcase, Plus, Pencil, Trash2, Check, Calendar, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertDeadlineSchema, type Case, type Deadline, type InsertDeadline } from "@shared/schema";
import { cn } from "@/lib/utils";
import ModuleIntro from "@/components/app/ModuleIntro";

export default function AppDeadlines() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);
  const [deleteConfirmDeadline, setDeleteConfirmDeadline] = useState<Deadline | null>(null);

  const { data: caseData, isLoading, isError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: deadlinesData, isLoading: deadlinesLoading } = useQuery<{ deadlines: Deadline[] }>({
    queryKey: ["/api/cases", caseId, "deadlines"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const deadlines = deadlinesData?.deadlines || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertDeadline) => {
      return apiRequest("POST", `/api/cases/${caseId}/deadlines`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
      setIsCreateOpen(false);
      toast({ title: "Deadline created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create deadline", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ deadlineId, data }: { deadlineId: string; data: Partial<InsertDeadline> }) => {
      return apiRequest("PATCH", `/api/deadlines/${deadlineId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
      setEditDeadline(null);
      toast({ title: "Deadline updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update deadline", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (deadlineId: string) => {
      return apiRequest("DELETE", `/api/deadlines/${deadlineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
      setDeleteConfirmDeadline(null);
      toast({ title: "Deadline deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete deadline", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ deadlineId, status }: { deadlineId: string; status: string }) => {
      return apiRequest("PATCH", `/api/deadlines/${deadlineId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "deadlines"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update deadline status", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (currentCase) {
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  useEffect(() => {
    if (!isLoading && !currentCase && caseId) {
      setLocation("/app/cases");
    }
  }, [isLoading, currentCase, caseId, setLocation]);

  if (isLoading) {
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

  const upcomingDeadlines = deadlines.filter(d => d.status === "upcoming");
  const doneDeadlines = deadlines.filter(d => d.status === "done");

  const getUrgencyInfo = (dueDate: Date) => {
    const due = new Date(dueDate);
    if (isPast(due) && !isToday(due)) {
      return { label: "Overdue", className: "bg-red-100 text-red-800", urgent: true };
    }
    if (isToday(due)) {
      return { label: "Today", className: "bg-orange-100 text-orange-800", urgent: true };
    }
    if (isTomorrow(due)) {
      return { label: "Tomorrow", className: "bg-yellow-100 text-yellow-800", urgent: false };
    }
    const days = differenceInDays(due, new Date());
    if (days <= 7) {
      return { label: `${days} days`, className: "bg-blue-100 text-blue-800", urgent: false };
    }
    return { label: format(due, "MMM d"), className: "bg-gray-100 text-gray-600", urgent: false };
  };

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
              <p className="font-sans text-xs sm:text-sm text-neutral-darkest/60 mb-1">Deadlines</p>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground min-h-[44px] w-full sm:w-auto"
              data-testid="button-add-deadline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Deadline
            </Button>
          </div>

          <ModuleIntro
            title="About Deadlines"
            paragraphs={[
              "Court deadlines are often strict. This tool helps you track filing deadlines, hearing dates, and other important dates.",
              "Missing a deadline can have serious consequences for your case."
            ]}
            caution="Always verify deadlines with official court documents or your court clerk."
          />

          {deadlinesLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading deadlines...</p>
            </div>
          ) : deadlines.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">
                No Deadlines Yet
              </h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                Track important court dates, filing deadlines, and other time-sensitive events.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary text-primary-foreground"
                data-testid="button-add-first-deadline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Deadline
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-8">
              {upcomingDeadlines.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest mb-4">
                    Upcoming ({upcomingDeadlines.length})
                  </h2>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline) => (
                      <DeadlineCard
                        key={deadline.id}
                        deadline={deadline}
                        onToggleStatus={() => toggleStatusMutation.mutate({ deadlineId: deadline.id, status: "done" })}
                        onEdit={() => setEditDeadline(deadline)}
                        onDelete={() => setDeleteConfirmDeadline(deadline)}
                        getUrgencyInfo={getUrgencyInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {doneDeadlines.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest/60 mb-4">
                    Done ({doneDeadlines.length})
                  </h2>
                  <div className="space-y-3">
                    {doneDeadlines.map((deadline) => (
                      <DeadlineCard
                        key={deadline.id}
                        deadline={deadline}
                        onToggleStatus={() => toggleStatusMutation.mutate({ deadlineId: deadline.id, status: "upcoming" })}
                        onEdit={() => setEditDeadline(deadline)}
                        onDelete={() => setDeleteConfirmDeadline(deadline)}
                        getUrgencyInfo={getUrgencyInfo}
                        isDone
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <DeadlineFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        title="Add Deadline"
      />

      <DeadlineFormDialog
        open={!!editDeadline}
        onOpenChange={(open) => !open && setEditDeadline(null)}
        onSubmit={(data) => editDeadline && updateMutation.mutate({ deadlineId: editDeadline.id, data })}
        isLoading={updateMutation.isPending}
        title="Edit Deadline"
        defaultValues={editDeadline || undefined}
      />

      <Dialog open={!!deleteConfirmDeadline} onOpenChange={(open) => !open && setDeleteConfirmDeadline(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deadline</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-darkest/70">
            Are you sure you want to delete "{deleteConfirmDeadline?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDeadline(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmDeadline && deleteMutation.mutate(deleteConfirmDeadline.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function DeadlineCard({
  deadline,
  onToggleStatus,
  onEdit,
  onDelete,
  getUrgencyInfo,
  isDone = false,
}: {
  deadline: Deadline;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getUrgencyInfo: (date: Date) => { label: string; className: string; urgent: boolean };
  isDone?: boolean;
}) {
  const urgency = getUrgencyInfo(new Date(deadline.dueDate));

  return (
    <Card className={cn("transition-opacity", isDone && "opacity-60")} data-testid={`card-deadline-${deadline.id}`}>
      <CardContent className="flex items-start gap-4 p-4">
        <button
          onClick={onToggleStatus}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
            isDone ? "bg-primary border-primary text-primary-foreground" : "border-neutral-darkest/30"
          )}
          data-testid={`button-toggle-deadline-${deadline.id}`}
        >
          {isDone && <Check className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className={cn("font-sans font-medium text-neutral-darkest", isDone && "line-through")}>
              {deadline.title}
            </h3>
            {!isDone && urgency.urgent && (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          {deadline.notes && (
            <p className="font-sans text-sm text-neutral-darkest/60 mt-1 line-clamp-2">
              {deadline.notes}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={urgency.className} variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(deadline.dueDate), "MMM d, yyyy")}
            </Badge>
            {!isDone && (
              <Badge variant="outline" className={urgency.urgent ? "border-red-300 text-red-700" : ""}>
                {urgency.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            data-testid={`button-edit-deadline-${deadline.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            data-testid={`button-delete-deadline-${deadline.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeadlineFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertDeadline) => void;
  isLoading: boolean;
  title: string;
  defaultValues?: Deadline;
}) {
  const form = useForm<InsertDeadline>({
    resolver: zodResolver(insertDeadlineSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      notes: defaultValues?.notes || "",
      status: (defaultValues?.status as "upcoming" | "done") || "upcoming",
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : new Date(),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultValues?.title || "",
        notes: defaultValues?.notes || "",
        status: (defaultValues?.status as "upcoming" | "done") || "upcoming",
        dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : new Date(),
      });
    }
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Court hearing, Filing deadline" data-testid="input-deadline-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal justify-start",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-deadline-due-date"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Add details about this deadline..."
                      data-testid="input-deadline-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-deadline">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={isLoading} data-testid="button-save-deadline">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
