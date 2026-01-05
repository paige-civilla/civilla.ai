import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Briefcase, Plus, Pencil, Trash2, Settings, LayoutList, LayoutGrid, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, TimelineEvent, TimelineCategory } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";

const DEFAULT_COLORS = [
  "#1565C0", "#2E7D32", "#F9A825", "#6A1B9A", "#00838F",
  "#D84315", "#5D4037", "#C62828", "#558B2F", "#AD1457", "#546E7A",
];

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTimeLocal(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface EventFormData {
  eventDate: string;
  title: string;
  categoryId: string;
  notes: string;
}

const initialFormData: EventFormData = {
  eventDate: formatDateTimeLocal(new Date()),
  title: "",
  categoryId: "",
  notes: "",
};

export default function AppTimeline() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery<{ events: TimelineEvent[] }>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: !!caseId,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{ categories: TimelineCategory[] }>({
    queryKey: ["/api/timeline-categories"],
  });

  const currentCase = caseData?.case;
  const events = timelineData?.events || [];
  const categories = categoriesData?.categories || [];

  useEffect(() => {
    if (categories.length === 0 && !categoriesLoading) {
      apiRequest("POST", "/api/timeline-categories/seed").then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/timeline-categories"] });
      }).catch(() => {});
    }
  }, [categories.length, categoriesLoading]);

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

  const createMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      return apiRequest("POST", `/api/cases/${caseId}/timeline`, {
        eventDate: new Date(data.eventDate).toISOString(),
        title: data.title,
        category: getCategoryName(data.categoryId),
        categoryId: data.categoryId || undefined,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "timeline"] });
      setShowAddForm(false);
      setFormData(initialFormData);
      toast({ title: "Event added", description: "Timeline event created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create event", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: EventFormData }) => {
      return apiRequest("PATCH", `/api/timeline/${eventId}`, {
        eventDate: new Date(data.eventDate).toISOString(),
        title: data.title,
        category: getCategoryName(data.categoryId),
        categoryId: data.categoryId || undefined,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "timeline"] });
      setEditingEventId(null);
      setFormData(initialFormData);
      toast({ title: "Event updated", description: "Timeline event updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update event", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/timeline/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "timeline"] });
      toast({ title: "Event deleted", description: "Timeline event removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete event", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return apiRequest("POST", "/api/timeline-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline-categories"] });
      setNewCategoryName("");
      setNewCategoryColor(DEFAULT_COLORS[0]);
      toast({ title: "Category created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      return apiRequest("PATCH", `/api/timeline-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline-categories"] });
      setEditingCategoryId(null);
      toast({ title: "Category updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/timeline-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline-categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    },
  });

  const getCategoryName = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Other";
  };

  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return "#546E7A";
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || "#546E7A";
  };

  const getCategoryById = (categoryId: string | null): TimelineCategory | undefined => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.categoryId || !formData.eventDate) {
      toast({ title: "Validation error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (editingEventId) {
      updateMutation.mutate({ eventId: editingEventId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    const cat = categories.find((c) => c.name === event.category || c.id === event.categoryId);
    setFormData({
      eventDate: formatDateTimeLocal(event.eventDate),
      title: event.title,
      categoryId: cat?.id || event.categoryId || "",
      notes: event.notes || "",
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setFormData(initialFormData);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setFormData(initialFormData);
  };

  const handleDelete = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(eventId);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate({ name: newCategoryName.trim(), color: newCategoryColor });
  };

  const handleUpdateCategory = () => {
    if (!editingCategoryId || !editCategoryName.trim()) return;
    updateCategoryMutation.mutate({
      id: editingCategoryId,
      data: { name: editCategoryName.trim(), color: editCategoryColor },
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Delete this category? Events using it will be set to 'Other'.")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const startEditCategory = (cat: TimelineCategory) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
    setEditCategoryColor(cat.color);
  };

  if (caseLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (caseError || !currentCase) {
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

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  const sortedEvents = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

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
              <p className="font-sans text-xs sm:text-sm text-neutral-darkest/60 mb-1">Timeline</p>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setViewMode(viewMode === "vertical" ? "horizontal" : "vertical")}
                title={viewMode === "vertical" ? "Switch to horizontal view" : "Switch to vertical view"}
                data-testid="button-toggle-view"
              >
                {viewMode === "vertical" ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowCategoryManager(true)}
                title="Manage categories"
                data-testid="button-manage-categories"
              >
                <Settings className="w-4 h-4" />
              </Button>
              {!showAddForm && !editingEventId && (
                <Button
                  onClick={() => {
                    setShowAddForm(true);
                    setFormData(initialFormData);
                  }}
                  className="flex items-center gap-2 min-h-[44px]"
                  data-testid="button-add-event"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </Button>
              )}
            </div>
          </div>

          <ModuleIntro
            title="About the Case Timeline"
            paragraphs={[
              "The timeline helps you organize important events chronologically. Recording events as they happen can help you maintain an accurate record of your case history.",
              "Courts often find chronological organization helpful when reviewing case details."
            ]}
          />

          {caseId && (
            <LexiSuggestedQuestions moduleKey="timeline" caseId={caseId} />
          )}

          {(showAddForm || editingEventId) && (
            <Card className="w-full mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-heading font-semibold text-lg text-neutral-darkest mb-4">
                    {editingEventId ? "Edit Event" : "Add New Event"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="eventDate" className="text-sm font-medium text-neutral-darkest">
                        Date & Time <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        required
                        data-testid="input-event-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium text-neutral-darkest">
                        Category <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-neutral-darkest">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Event title (max 120 characters)"
                      maxLength={120}
                      required
                      data-testid="input-event-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium text-neutral-darkest">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes about this event"
                      rows={3}
                      className="resize-none"
                      data-testid="textarea-event-notes"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button type="submit" disabled={isFormPending} data-testid="button-save-event">
                      {isFormPending ? "Saving..." : editingEventId ? "Update Event" : "Add Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={editingEventId ? handleCancelEdit : handleCancelAdd}
                      data-testid="button-cancel-event"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {timelineLoading || categoriesLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="w-full bg-muted/30 rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">
                No Events Yet
              </h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                Start building your case timeline by adding key dates and events.
              </p>
              {!showAddForm && (
                <Button
                  onClick={() => {
                    setShowAddForm(true);
                    setFormData(initialFormData);
                  }}
                  className="flex items-center gap-2"
                  data-testid="button-add-first-event"
                >
                  <Plus className="w-4 h-4" />
                  Add First Event
                </Button>
              )}
            </div>
          ) : viewMode === "vertical" ? (
            <div className="w-full space-y-4">
              {sortedEvents.map((event) => {
                const catColor = getCategoryColor(event.categoryId);
                const cat = getCategoryById(event.categoryId);
                return (
                  <Card key={event.id} className="w-full" data-testid={`card-event-${event.id}`}>
                    <CardContent className="pt-6">
                      {editingEventId === event.id ? null : (
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: catColor, color: "#fff" }}
                              >
                                {cat?.name || event.category}
                              </Badge>
                              <span className="text-sm text-neutral-darkest/60">
                                {formatDate(event.eventDate)}
                              </span>
                            </div>
                            <h3 className="font-heading font-semibold text-base text-neutral-darkest break-words">
                              {event.title}
                            </h3>
                            {event.notes && (
                              <p className="font-sans text-sm text-neutral-darkest/70 mt-2 break-words whitespace-pre-wrap">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(event)}
                              data-testid={`button-edit-event-${event.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(event.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-event-${event.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="w-full">
              <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
                <div className="flex py-6 px-4 gap-4">
                  {sortedEvents.map((event) => {
                    const catColor = getCategoryColor(event.categoryId);
                    const cat = getCategoryById(event.categoryId);
                    return (
                      <Card
                        key={event.id}
                        className="flex-shrink-0 w-64"
                        data-testid={`card-event-horizontal-${event.id}`}
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{ backgroundColor: catColor, color: "#fff" }}
                            >
                              {cat?.name || event.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(event.eventDate)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-neutral-darkest line-clamp-2 mb-2">
                            {event.title}
                          </h3>
                          {event.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {event.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => handleEdit(event)}
                              data-testid={`button-edit-event-h-${event.id}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => handleDelete(event.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-event-h-${event.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>
      </section>

      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Add New Category</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  maxLength={50}
                  data-testid="input-new-category-name"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                  data-testid="input-new-category-color"
                />
                <Button
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  data-testid="button-create-category"
                >
                  {createCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Existing Categories</Label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    data-testid={`category-item-${cat.id}`}
                  >
                    {editingCategoryId === cat.id ? (
                      <>
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 h-8"
                          maxLength={50}
                          data-testid="input-edit-category-name"
                        />
                        <input
                          type="color"
                          value={editCategoryColor}
                          onChange={(e) => setEditCategoryColor(e.target.value)}
                          className="w-8 h-8 rounded border cursor-pointer"
                          data-testid="input-edit-category-color"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={handleUpdateCategory}
                          disabled={updateCategoryMutation.isPending}
                          data-testid="button-save-category"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => setEditingCategoryId(null)}
                          data-testid="button-cancel-edit-category"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="flex-1 text-sm">{cat.name}</span>
                        {cat.isSystem && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditCategory(cat)}
                          data-testid={`button-edit-category-${cat.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {!cat.isSystem && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deleteCategoryMutation.isPending}
                            data-testid={`button-delete-category-${cat.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryManager(false)} data-testid="button-close-category-manager">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
