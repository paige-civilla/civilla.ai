import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, FileText, Calendar, TrendingUp, Users, FolderOpen, FileStack, CheckSquare, Clock, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CaseMonthCalendar from "@/components/calendar/CaseMonthCalendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Case, CalendarCategory } from "@shared/schema";

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
    title: "Pattern Analysis",
    description: "Spot trends across your case",
    icon: TrendingUp,
    href: `/app/patterns/${caseId}`,
  },
  {
    title: "Contacts",
    description: "Manage case-related contacts",
    icon: Users,
    href: `/app/contacts/${caseId}`,
  },
];

type UpcomingEvent = {
  kind: "deadline" | "todo" | "calendar";
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

  const handleToggleItem = (item: UpcomingEvent) => {
    if (item.kind === "todo") {
      toggleTaskMutation.mutate({ id: item.id, status: "completed" });
    } else if (item.kind === "deadline") {
      toggleDeadlineMutation.mutate({ id: item.id, status: "done" });
    } else if (item.kind === "calendar") {
      toggleCalendarItemMutation.mutate({ id: item.id, isDone: true });
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
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {primaryCase.title}
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/app/cases")}
              data-testid="button-view-all-cases"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              View all cases
            </Button>
          </div>

          <div className="w-full flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="bg-card rounded-lg border border-[#A2BEC2] overflow-hidden">
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

            <div className="flex-1">
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getModuleCards(primaryCase.id).map((module) => (
                    <Link
                      key={module.title}
                      href={module.href}
                      className="relative bg-card border border-[#A2BEC2] rounded-lg p-5 hover:bg-muted cursor-pointer block transition-colors"
                      data-testid={`module-card-${module.title.toLowerCase()}`}
                    >
                      <div className="w-10 h-10 rounded-md bg-[hsl(var(--muted))] flex items-center justify-center mb-3">
                        <module.icon className="w-5 h-5 text-primary" />
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
