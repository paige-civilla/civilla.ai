import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Scale, Briefcase, Pin, PinOff, Printer, FileText, MessageSquare, History, Calendar, CheckSquare, FolderOpen, Contact, Users, FileSearch, StickyNote } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, TrialBinderSection, TrialBinderItem, EvidenceFile, TimelineEvent, CaseCommunication, Deadline, Task, Document, CaseContact, CaseChild } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SECTION_ICONS: Record<string, typeof FileText> = {
  evidence: FolderOpen,
  timeline: History,
  communications: MessageSquare,
  deadlines: Calendar,
  tasks: CheckSquare,
  documents: FileText,
  disclosures: FileSearch,
  contacts: Contact,
  children: Users,
};

interface SourceItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  sourceType: string;
}

export default function AppTrialPrep() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>("evidence");
  const [noteDialogItem, setNoteDialogItem] = useState<{ itemId: string; note: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: caseData, isLoading: caseLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: sectionsData } = useQuery<TrialBinderSection[]>({
    queryKey: ["/api/cases", caseId, "trial-prep/sections"],
    enabled: !!caseId,
  });

  const { data: itemsData } = useQuery<TrialBinderItem[]>({
    queryKey: ["/api/cases", caseId, "trial-prep/items"],
    enabled: !!caseId,
  });

  const { data: evidenceData } = useQuery<{ files: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId,
  });

  const { data: timelineData } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: !!caseId,
  });

  const { data: communicationsData } = useQuery<CaseCommunication[]>({
    queryKey: ["/api/cases", caseId, "communications"],
    enabled: !!caseId,
  });

  const { data: deadlinesData } = useQuery<Deadline[]>({
    queryKey: ["/api/cases", caseId, "deadlines"],
    enabled: !!caseId,
  });

  const { data: tasksData } = useQuery<Task[]>({
    queryKey: ["/api/cases", caseId, "tasks"],
    enabled: !!caseId,
  });

  const { data: documentsData } = useQuery<Document[]>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!caseId,
  });

  const { data: contactsData } = useQuery<CaseContact[]>({
    queryKey: ["/api/cases", caseId, "contacts"],
    enabled: !!caseId,
  });

  const { data: childrenData } = useQuery<CaseChild[]>({
    queryKey: ["/api/cases", caseId, "children"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const sections = sectionsData || [];
  const binderItems = itemsData || [];

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

  const upsertMutation = useMutation({
    mutationFn: async (data: { sectionKey: string; sourceType: string; sourceId: string; pinnedRank?: number | null; note?: string | null }) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep/items"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: { pinnedRank?: number | null; note?: string | null } }) => {
      return apiRequest("PATCH", `/api/cases/${caseId}/trial-prep/items/${itemId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep/items"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/cases/${caseId}/trial-prep/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep/items"] });
    },
  });

  function getSourceItems(sectionKey: string): SourceItem[] {
    switch (sectionKey) {
      case "evidence":
        return (evidenceData?.files || []).map(f => ({
          id: f.id,
          title: f.originalName,
          subtitle: f.category || undefined,
          date: formatDate(f.createdAt),
          sourceType: "evidence",
        }));
      case "timeline":
        return (timelineData || []).map(e => ({
          id: e.id,
          title: e.title,
          subtitle: e.category || undefined,
          date: formatDate(e.eventDate),
          sourceType: "timeline",
        }));
      case "communications":
        return (communicationsData || []).map(c => ({
          id: c.id,
          title: c.subject || `${c.direction} ${c.channel}`,
          subtitle: c.summary?.substring(0, 50) || undefined,
          date: formatDate(c.occurredAt),
          sourceType: "communication",
        }));
      case "deadlines":
        return (deadlinesData || []).map(d => ({
          id: d.id,
          title: d.title,
          subtitle: d.status,
          date: formatDate(d.dueDate),
          sourceType: "deadline",
        }));
      case "tasks":
        return (tasksData || []).map(t => ({
          id: t.id,
          title: t.title,
          subtitle: t.status,
          date: formatDate(t.dueDate),
          sourceType: "task",
        }));
      case "documents":
        return (documentsData || []).map(d => ({
          id: d.id,
          title: d.title,
          subtitle: d.templateKey || undefined,
          date: formatDate(d.createdAt),
          sourceType: "document",
        }));
      case "contacts":
        return (contactsData || []).map(c => ({
          id: c.id,
          title: c.name,
          subtitle: c.role || undefined,
          date: undefined,
          sourceType: "contact",
        }));
      case "children":
        return (childrenData || []).map(c => ({
          id: c.id,
          title: `${c.firstName} ${c.lastName || ""}`.trim(),
          subtitle: c.dateOfBirth ? `DOB: ${formatDate(c.dateOfBirth)}` : undefined,
          date: undefined,
          sourceType: "child",
        }));
      default:
        return [];
    }
  }

  function getBinderItemForSource(sectionKey: string, sourceId: string): TrialBinderItem | undefined {
    return binderItems.find(i => i.sectionKey === sectionKey && i.sourceId === sourceId);
  }

  function getPinnedItems(sectionKey: string): (TrialBinderItem & { sourceItem?: SourceItem })[] {
    const sourceItems = getSourceItems(sectionKey);
    return binderItems
      .filter(i => i.sectionKey === sectionKey && i.pinnedRank !== null)
      .sort((a, b) => (a.pinnedRank || 0) - (b.pinnedRank || 0))
      .map(i => ({
        ...i,
        sourceItem: sourceItems.find(s => s.id === i.sourceId),
      }));
  }

  function handlePin(sectionKey: string, sourceType: string, sourceId: string) {
    const existing = getBinderItemForSource(sectionKey, sourceId);
    const pinnedCount = binderItems.filter(i => i.sectionKey === sectionKey && i.pinnedRank !== null).length;
    
    if (existing?.pinnedRank) {
      updateMutation.mutate({ itemId: existing.id, data: { pinnedRank: null } });
    } else if (pinnedCount < 3) {
      const nextRank = pinnedCount + 1;
      if (existing) {
        updateMutation.mutate({ itemId: existing.id, data: { pinnedRank: nextRank } });
      } else {
        upsertMutation.mutate({ sectionKey, sourceType, sourceId, pinnedRank: nextRank });
      }
    } else {
      toast({
        title: "Top 3 Limit",
        description: "You can only pin up to 3 items per section. Unpin one first.",
        variant: "destructive",
      });
    }
  }

  function handleAddNote(itemId: string, currentNote: string) {
    setNoteDialogItem({ itemId, note: currentNote });
    setNoteText(currentNote);
  }

  function saveNote() {
    if (noteDialogItem) {
      updateMutation.mutate(
        { itemId: noteDialogItem.itemId, data: { note: noteText } },
        {
          onSuccess: () => {
            setNoteDialogItem(null);
            toast({ title: "Note saved" });
          },
        }
      );
    }
  }

  if (caseLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!currentCase) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link href="/app/cases">
            <Button variant="ghost" size="icon" data-testid="button-back-cases">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Scale className="w-6 h-6 text-[#628286]" />
          <h1 className="text-2xl font-semibold" data-testid="text-trial-prep-title">Trial Prep</h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {currentCase.nickname || currentCase.title}
          </Badge>
          <div className="flex-1" />
          <Link href={`/app/trial-prep/${caseId}/print`}>
            <Button variant="outline" size="sm" data-testid="button-print-binder">
              <Printer className="w-4 h-4 mr-2" />
              Print Binder
            </Button>
          </Link>
        </div>

        <ModuleIntro
          title="Prepare Your Case for Court"
          paragraphs={[
            "Organize your key evidence, timeline, and documents into a structured binder. Pin your Top 3 most important items in each section for quick reference during hearings."
          ]}
        />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="flex flex-wrap gap-1 h-auto mb-4">
                {sections.map(section => {
                  const Icon = SECTION_ICONS[section.key] || FileText;
                  return (
                    <TabsTrigger
                      key={section.key}
                      value={section.key}
                      className="flex items-center gap-1"
                      data-testid={`tab-section-${section.key}`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.title}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {sections.map(section => {
                const sourceItems = getSourceItems(section.key);
                const pinnedItems = getPinnedItems(section.key);

                return (
                  <TabsContent key={section.key} value={section.key}>
                    {pinnedItems.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Pin className="w-4 h-4" />
                          Top 3 Pinned
                        </h3>
                        <div className="space-y-2">
                          {pinnedItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 bg-[hsl(var(--module-tile))] rounded-md border border-[hsl(var(--module-tile-border))]/30"
                              data-testid={`pinned-item-${item.id}`}
                            >
                              <Badge className="bg-[#A2BEC2] text-[#1a2a2c]">{idx + 1}</Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.sourceItem?.title || "Unknown"}</p>
                                {item.sourceItem?.subtitle && (
                                  <p className="text-sm text-muted-foreground">{item.sourceItem.subtitle}</p>
                                )}
                                {item.note && (
                                  <p className="text-xs text-muted-foreground italic mt-1">Note: {item.note}</p>
                                )}
                              </div>
                              {item.sourceItem?.date && (
                                <span className="text-sm text-muted-foreground">{item.sourceItem.date}</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePin(section.key, item.sourceType, item.sourceId)}
                                data-testid={`button-unpin-${item.id}`}
                              >
                                <PinOff className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddNote(item.id, item.note || "")}
                                data-testid={`button-note-${item.id}`}
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      All {section.title} ({sourceItems.length})
                    </h3>
                    {sourceItems.length === 0 ? (
                      <p className="text-muted-foreground py-4 text-center">
                        No {section.title.toLowerCase()} items yet. Add some in the {section.title} module.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sourceItems.map(item => {
                          const binderItem = getBinderItemForSource(section.key, item.id);
                          const isPinned = binderItem?.pinnedRank !== null && binderItem?.pinnedRank !== undefined;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 bg-card rounded-md border"
                              data-testid={`source-item-${item.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                {item.subtitle && (
                                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                                )}
                              </div>
                              {item.date && (
                                <span className="text-sm text-muted-foreground">{item.date}</span>
                              )}
                              <Button
                                variant={isPinned ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePin(section.key, item.sourceType, item.id)}
                                className={isPinned ? "bg-[#628286] hover:bg-[#4a6a6e]" : ""}
                                data-testid={`button-pin-${item.id}`}
                              >
                                <Pin className="w-4 h-4 mr-1" />
                                {isPinned ? `Top ${binderItem.pinnedRank}` : "Pin"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        <LexiSuggestedQuestions
          caseId={caseId!}
          moduleKey="trial-prep"
        />
      </div>

      <Dialog open={!!noteDialogItem} onOpenChange={(open) => !open && setNoteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about why this item is important..."
            className="min-h-[100px]"
            data-testid="input-note"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogItem(null)} data-testid="button-cancel-note">
              Cancel
            </Button>
            <Button onClick={saveNote} data-testid="button-save-note">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
