import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckSquare, Briefcase, Plus, Pencil, Trash2, Check, X, Calendar, Flag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema, type Case, type Task, type InsertTask, taskStatuses } from "@shared/schema";
import { cn } from "@/lib/utils";
import ModuleIntro from "@/components/app/ModuleIntro";

export default function AppTasks() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  const { data: caseData, isLoading, isError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<{ tasks: Task[] }>({
    queryKey: ["/api/cases", caseId, "tasks"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const tasks = tasksData?.tasks || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      return apiRequest("POST", `/api/cases/${caseId}/tasks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
      setIsCreateOpen(false);
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<InsertTask> }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
      setEditTask(null);
      toast({ title: "Task updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
      setDeleteConfirmTask(null);
      toast({ title: "Task deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "tasks"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task status", description: error.message, variant: "destructive" });
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

  const openTasks = tasks.filter(t => t.status === "open");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return "High";
    if (priority === 3) return "Low";
    return "Medium";
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-100 text-red-800";
    if (priority === 3) return "bg-gray-100 text-gray-600";
    return "bg-yellow-100 text-yellow-800";
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
              <p className="font-sans text-xs sm:text-sm text-neutral-darkest/60 mb-1">Case To-Do</p>
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
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add To-Do
            </Button>
          </div>

          <ModuleIntro
            title="About Case To-Do"
            paragraphs={[
              "Keep track of tasks you need to complete for your case. Set due dates and mark tasks complete as you finish them.",
              "Breaking larger tasks into smaller steps can help you stay organized and make progress."
            ]}
          />

          {tasksLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">
                No To-Do Items Yet
              </h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                Keep track of what needs to be done for your case.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary text-primary-foreground"
                data-testid="button-add-first-task"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First To-Do
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-8">
              {openTasks.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest mb-4">
                    Open To-Do Items ({openTasks.length})
                  </h2>
                  <div className="space-y-3">
                    {openTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={() => toggleStatusMutation.mutate({ taskId: task.id, status: "completed" })}
                        onEdit={() => setEditTask(task)}
                        onDelete={() => setDeleteConfirmTask(task)}
                        getPriorityLabel={getPriorityLabel}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest/60 mb-4">
                    Completed ({completedTasks.length})
                  </h2>
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={() => toggleStatusMutation.mutate({ taskId: task.id, status: "open" })}
                        onEdit={() => setEditTask(task)}
                        onDelete={() => setDeleteConfirmTask(task)}
                        getPriorityLabel={getPriorityLabel}
                        getPriorityColor={getPriorityColor}
                        isCompleted
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <TaskFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        title="Add To-Do"
      />

      <TaskFormDialog
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
        onSubmit={(data) => editTask && updateMutation.mutate({ taskId: editTask.id, data })}
        isLoading={updateMutation.isPending}
        title="Edit To-Do"
        defaultValues={editTask || undefined}
      />

      <Dialog open={!!deleteConfirmTask} onOpenChange={(open) => !open && setDeleteConfirmTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete To-Do</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-darkest/70">
            Are you sure you want to delete "{deleteConfirmTask?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmTask(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmTask && deleteMutation.mutate(deleteConfirmTask.id)}
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

function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  getPriorityLabel,
  getPriorityColor,
  isCompleted = false,
}: {
  task: Task;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getPriorityLabel: (p: number) => string;
  getPriorityColor: (p: number) => string;
  isCompleted?: boolean;
}) {
  return (
    <Card className={cn("transition-opacity", isCompleted && "opacity-60")} data-testid={`card-task-${task.id}`}>
      <CardContent className="flex items-start gap-4 p-4">
        <button
          onClick={onToggleStatus}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
            isCompleted ? "bg-primary border-primary text-primary-foreground" : "border-neutral-darkest/30"
          )}
          data-testid={`button-toggle-task-${task.id}`}
        >
          {isCompleted && <Check className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-sans font-medium text-neutral-darkest", isCompleted && "line-through")}>
            {task.title}
          </h3>
          {task.description && (
            <p className="font-sans text-sm text-neutral-darkest/60 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={getPriorityColor(task.priority)} variant="secondary">
              <Flag className="w-3 h-3 mr-1" />
              {getPriorityLabel(task.priority)}
            </Badge>
            {task.dueDate && (
              <Badge variant="outline" className="text-neutral-darkest/70">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            data-testid={`button-edit-task-${task.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            data-testid={`button-delete-task-${task.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertTask) => void;
  isLoading: boolean;
  title: string;
  defaultValues?: Task;
}) {
  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      status: (defaultValues?.status as "open" | "completed") || "open",
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : undefined,
      priority: defaultValues?.priority || 2,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultValues?.title || "",
        description: defaultValues?.description || "",
        status: (defaultValues?.status as "open" | "completed") || "open",
        dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : undefined,
        priority: defaultValues?.priority || 2,
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
                    <Input {...field} placeholder="Task title" data-testid="input-task-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Add details..."
                      data-testid="input-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">High</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal justify-start",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-task-due-date"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-task">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={isLoading} data-testid="button-save-task">
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
