import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Briefcase, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, TimelineEvent } from "@shared/schema";

const CATEGORIES = [
  { value: "court", label: "Court" },
  { value: "filing", label: "Filing" },
  { value: "communication", label: "Communication" },
  { value: "incident", label: "Incident" },
  { value: "parenting_time", label: "Parenting Time" },
  { value: "expense", label: "Expense" },
  { value: "medical", label: "Medical" },
  { value: "school", label: "School" },
  { value: "other", label: "Other" },
] as const;

function getCategoryLabel(value: string): string {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
}

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
  category: string;
  notes: string;
}

const initialFormData: EventFormData = {
  eventDate: formatDateTimeLocal(new Date()),
  title: "",
  category: "",
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

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery<{ events: TimelineEvent[] }>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const events = timelineData?.events || [];

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
        category: data.category,
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
        category: data.category,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category || !formData.eventDate) {
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
    setFormData({
      eventDate: formatDateTimeLocal(event.eventDate),
      title: event.title,
      category: event.category,
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

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <Link
            href={`/app/dashboard/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-6"
            data-testid="link-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full mb-8">
            <div>
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Timeline</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>
            {!showAddForm && !editingEventId && (
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setFormData(initialFormData);
                }}
                className="flex items-center gap-2"
                data-testid="button-add-event"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            )}
          </div>

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
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
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

          {timelineLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading events...</p>
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
          ) : (
            <div className="w-full space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="w-full" data-testid={`card-event-${event.id}`}>
                  <CardContent className="pt-6">
                    {editingEventId === event.id ? null : (
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(event.category)}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
