import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDeepLinkParam, scrollAndHighlight, clearDeepLinkQueryParams } from "@/lib/deepLink";
import { 
  ArrowLeft, ArrowRight, Scale, Briefcase, Pin, PinOff, Plus, Edit2, Trash2, 
  FolderOpen, History, MessageSquare, FileText, Sparkles, Star, Download,
  ChevronRight
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, TrialPrepShortlist } from "@shared/schema";
import { binderSectionValues } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";
import { getNextModule, modulePath, moduleLabel, type ModuleKey } from "@/lib/caseFlow";
import LinkToTimelineButton from "@/components/app/LinkToTimelineButton";

const SOURCE_TYPE_ICONS: Record<string, typeof FileText> = {
  evidence: FolderOpen,
  timeline_event: History,
  communication: MessageSquare,
  document: FileText,
  manual: Sparkles,
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  evidence: "Evidence",
  timeline_event: "Timeline",
  communication: "Communication",
  document: "Document",
  evidence_note: "Evidence Note",
  exhibit_item: "Exhibit",
  exhibit_snippet: "Exhibit Snippet",
  evidence_ai_analysis: "AI Analysis",
  analysis_finding: "Finding",
  manual: "Manual",
};

const IMPORTANCE_COLORS: Record<number, string> = {
  1: "text-muted-foreground",
  2: "text-muted-foreground",
  3: "text-foreground",
  4: "text-amber-600 dark:text-amber-400",
  5: "text-red-600 dark:text-red-400",
};

const COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
];

const COLOR_DOT_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

interface ShortlistFormData {
  title: string;
  summary: string;
  binderSection: string;
  importance: number;
  tags: string;
  color: string;
  isPinned: boolean;
}

const emptyFormData: ShortlistFormData = {
  title: "",
  summary: "",
  binderSection: "General",
  importance: 3,
  tags: "",
  color: "",
  isPinned: false,
};

function getTop3ForSection(items: TrialPrepShortlist[]): TrialPrepShortlist[] {
  const sorted = [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.importance !== b.importance) return b.importance - a.importance;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return sorted.slice(0, 3);
}

export default function AppTrialPrep() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  
  const [selectedSection, setSelectedSection] = useState<string>(binderSectionValues[0]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrialPrepShortlist | null>(null);
  const [formData, setFormData] = useState<ShortlistFormData>(emptyFormData);
  const [isExporting, setIsExporting] = useState(false);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  const { data: caseData, isLoading: caseLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: shortlistData, isLoading: shortlistLoading } = useQuery<{ items: TrialPrepShortlist[] }>({
    queryKey: ["/api/cases", caseId, "trial-prep-shortlist"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const items = shortlistData?.items || [];
  const hasChildren = currentCase?.hasChildren ?? false;

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

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || shortlistLoading || items.length === 0) return;
    const tpId = getDeepLinkParam("tpId");
    if (tpId) {
      const targetItem = items.find(i => i.id === tpId);
      if (targetItem && targetItem.binderSection !== selectedSection) {
        setSelectedSection(targetItem.binderSection);
      }
      deepLinkHandledRef.current = true;
      setTimeout(() => {
        const success = scrollAndHighlight(`tp-${tpId}`);
        if (success) {
          clearDeepLinkQueryParams();
        }
      }, 150);
    }
  }, [shortlistLoading, items, selectedSection]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      sourceType: string;
      sourceId: string;
      title: string;
      summary?: string | null;
      binderSection?: string;
      importance?: number;
      tags?: string[];
      color?: string | null;
      isPinned?: boolean;
    }) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      setAddDialogOpen(false);
      setFormData(emptyFormData);
      toast({ title: "Item added to Trial Prep" });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast({ title: "Already in Trial Prep", variant: "destructive" });
      } else {
        toast({ title: "Failed to add item", variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/trial-prep-shortlist/${itemId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      setEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Item updated" });
    },
    onError: () => {
      toast({ title: "Failed to update item", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/trial-prep-shortlist/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Item removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  function handleAddManual() {
    setFormData({ ...emptyFormData, binderSection: selectedSection });
    setAddDialogOpen(true);
  }

  function handleEdit(item: TrialPrepShortlist) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      summary: item.summary || "",
      binderSection: item.binderSection,
      importance: item.importance,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      color: item.color || "",
      isPinned: item.isPinned,
    });
    setEditDialogOpen(true);
  }

  function handleCreateSubmit() {
    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    createMutation.mutate({
      sourceType: "manual",
      sourceId: crypto.randomUUID(),
      title: formData.title,
      summary: formData.summary || null,
      binderSection: formData.binderSection,
      importance: formData.importance,
      tags: tagsArray,
      color: formData.color || null,
      isPinned: formData.isPinned,
    });
  }

  function handleUpdateSubmit() {
    if (!editingItem) return;
    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    updateMutation.mutate({
      itemId: editingItem.id,
      data: {
        title: formData.title,
        summary: formData.summary || null,
        binderSection: formData.binderSection,
        importance: formData.importance,
        tags: tagsArray,
        color: formData.color || null,
        isPinned: formData.isPinned,
      },
    });
  }

  function handleTogglePin(item: TrialPrepShortlist) {
    updateMutation.mutate({
      itemId: item.id,
      data: { isPinned: !item.isPinned },
    });
  }

  async function handleExportBinder() {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/trial-prep/export`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trial-binder-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Binder exported successfully" });
    } catch {
      toast({ title: "Failed to export binder", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  const groupedItems = binderSectionValues.reduce((acc, section) => {
    const sectionItems = items.filter(i => i.binderSection === section);
    const pinned = sectionItems.filter(i => i.isPinned).sort((a, b) => b.importance - a.importance);
    const unpinned = sectionItems.filter(i => !i.isPinned).sort((a, b) => b.importance - a.importance);
    acc[section] = [...pinned, ...unpinned];
    return acc;
  }, {} as Record<string, TrialPrepShortlist[]>);

  const currentSectionItems = groupedItems[selectedSection] || [];
  const top3Items = getTop3ForSection(currentSectionItems);
  const totalItems = items.length;
  const pinnedItems = items.filter(i => i.isPinned).length;

  const nextModule = getNextModule("trial-prep" as ModuleKey, { hasChildren });

  if (caseLoading || shortlistLoading) {
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

  function renderItemCard(item: TrialPrepShortlist, compact = false) {
    const Icon = SOURCE_TYPE_ICONS[item.sourceType] || FileText;
    const tags = Array.isArray(item.tags) ? item.tags : [];
    
    return (
      <div
        key={item.id}
        id={`tp-${item.id}`}
        className="flex items-start gap-3 p-3 bg-muted/30 rounded-md"
        data-testid={`shortlist-item-${item.id}`}
      >
        <div className="flex-shrink-0 mt-0.5 flex items-center gap-2">
          {item.color && (
            <div className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT_CLASSES[item.color] || ""}`} />
          )}
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
            <span className="font-medium">{item.title}</span>
            <Badge variant="outline" className="text-xs">
              {SOURCE_TYPE_LABELS[item.sourceType] || item.sourceType}
            </Badge>
            <span className={`text-xs flex items-center gap-0.5 ${IMPORTANCE_COLORS[item.importance]}`}>
              {Array.from({ length: item.importance }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </span>
          </div>
          {item.summary && (
            <p className={`text-sm text-muted-foreground mt-1 ${compact ? "line-clamp-2" : ""}`}>
              {item.summary}
            </p>
          )}
          {!compact && tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <LinkToTimelineButton
            caseId={caseId!}
            linkType="snippet"
            targetId={item.id}
            size="icon"
            variant="ghost"
            label=""
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTogglePin(item)}
            title={item.isPinned ? "Unpin" : "Pin"}
            data-testid={`button-pin-${item.id}`}
          >
            {item.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(item)}
            data-testid={`button-edit-${item.id}`}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(item.id)}
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link href={`/app/dashboard/${caseId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Scale className="w-6 h-6 text-[#628286]" />
          <h1 className="text-2xl font-semibold" data-testid="text-trial-prep-title">Trial Prep</h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {currentCase.nickname || currentCase.title}
          </Badge>
        </div>

        <ModuleIntro
          title="Build Your Trial Binder"
          paragraphs={[
            "Your strongest examples, organized by section. The top 3 items in each section are highlighted for quick reference during hearings."
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalItems} items total</span>
            <span>{pinnedItems} pinned</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportBinder}
              disabled={isExporting || totalItems === 0}
              data-testid="button-export-binder"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Binder (ZIP)"}
            </Button>
            <Button onClick={handleAddManual} data-testid="button-add-manual">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {totalItems === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Your trial binder is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add items from Evidence, Timeline, Communications, or Documents using the "Add to Trial Prep" button, or create a manual item here.
              </p>
              <Button onClick={handleAddManual} data-testid="button-add-manual-empty">
                <Plus className="w-4 h-4 mr-2" />
                Add a Manual Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="md:hidden mb-4">
              <Select 
                value={selectedSection} 
                onValueChange={(v) => { setSelectedSection(v); setMobileShowDetails(true); }}
              >
                <SelectTrigger data-testid="select-section-mobile" className="w-full">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {binderSectionValues.map(section => {
                    const count = (groupedItems[section] || []).length;
                    return (
                      <SelectItem key={section} value={section}>
                        {section} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-6">
              <Card className="h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Binder Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-400px)] max-h-[500px]">
                    <div className="p-2 space-y-1">
                      {binderSectionValues.map(section => {
                        const count = (groupedItems[section] || []).length;
                        const isSelected = section === selectedSection;
                        return (
                          <button
                            key={section}
                            onClick={() => setSelectedSection(section)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                              isSelected 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "hover-elevate"
                            }`}
                            data-testid={`section-btn-${section}`}
                          >
                            <span className="truncate">{section}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant={count > 0 ? "secondary" : "outline"} className="text-xs">
                                {count}
                              </Badge>
                              <ChevronRight className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">{selectedSection}</h2>
                  
                  {top3Items.length > 0 && (
                    <Card className="mb-6 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          Top 3 for this section
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {top3Items.map(item => renderItemCard(item, true))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                      <CardTitle className="text-sm">All items in this section</CardTitle>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setFormData({ ...emptyFormData, binderSection: selectedSection }); setAddDialogOpen(true); }}
                        data-testid="button-add-to-section"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {currentSectionItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No items in this section yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {currentSectionItems.map(item => renderItemCard(item))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-4">
              {mobileShowDetails && (
                <>
                  <h2 className="text-lg font-semibold">{selectedSection}</h2>
                  
                  {top3Items.length > 0 && (
                    <Card className="border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          Top 3
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {top3Items.map(item => renderItemCard(item, true))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">All items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentSectionItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No items in this section yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {currentSectionItems.map(item => renderItemCard(item))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 mt-8 pt-6 border-t">
          <Link href={caseId ? `/app/dashboard/${caseId}` : "/app/cases"}>
            <Button variant="outline" data-testid="button-back-to-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          {nextModule && caseId ? (
            <Link href={modulePath(nextModule, caseId)}>
              <Button data-testid="button-continue-next">
                Continue to {moduleLabel(nextModule)}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button disabled data-testid="button-continue-disabled">
              You're at the end
            </Button>
          )}
        </div>

        <div className="mt-8">
          <LexiSuggestedQuestions 
            caseId={caseId!}
            context="trial-prep"
          />
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter a title"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={e => setFormData(f => ({ ...f, summary: e.target.value }))}
                placeholder="Brief description or notes"
                data-testid="input-summary"
              />
            </div>
            <div>
              <Label htmlFor="binderSection">Binder Section</Label>
              <Select value={formData.binderSection} onValueChange={v => setFormData(f => ({ ...f, binderSection: v }))}>
                <SelectTrigger data-testid="select-binder-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {binderSectionValues.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="importance">Importance (1-5)</Label>
              <Select value={String(formData.importance)} onValueChange={v => setFormData(f => ({ ...f, importance: Number(v) }))}>
                <SelectTrigger data-testid="select-importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. custody, financial"
                data-testid="input-tags"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={v => setFormData(f => ({ ...f, color: v }))}>
                <SelectTrigger data-testid="select-color">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || "none"} value={opt.value || "none"}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isPinned"
                checked={formData.isPinned}
                onCheckedChange={v => setFormData(f => ({ ...f, isPinned: v }))}
                data-testid="switch-pinned"
              />
              <Label htmlFor="isPinned">Pin this item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={!formData.title || createMutation.isPending} data-testid="button-submit-add">
              {createMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                value={formData.summary}
                onChange={e => setFormData(f => ({ ...f, summary: e.target.value }))}
                data-testid="input-edit-summary"
              />
            </div>
            <div>
              <Label htmlFor="edit-binderSection">Binder Section</Label>
              <Select value={formData.binderSection} onValueChange={v => setFormData(f => ({ ...f, binderSection: v }))}>
                <SelectTrigger data-testid="select-edit-binder-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {binderSectionValues.map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-importance">Importance (1-5)</Label>
              <Select value={String(formData.importance)} onValueChange={v => setFormData(f => ({ ...f, importance: Number(v) }))}>
                <SelectTrigger data-testid="select-edit-importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={e => setFormData(f => ({ ...f, tags: e.target.value }))}
                data-testid="input-edit-tags"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Select value={formData.color || "none"} onValueChange={v => setFormData(f => ({ ...f, color: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-edit-color">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value || "none"} value={opt.value || "none"}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPinned"
                checked={formData.isPinned}
                onCheckedChange={v => setFormData(f => ({ ...f, isPinned: v }))}
                data-testid="switch-edit-pinned"
              />
              <Label htmlFor="edit-isPinned">Pin this item</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={!formData.title || updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
