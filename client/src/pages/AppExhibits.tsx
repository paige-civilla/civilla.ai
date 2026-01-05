import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDeepLinkParam, scrollAndHighlight, clearDeepLinkQueryParams } from "@/lib/deepLink";
import { Plus, FileText, Trash2, ChevronDown, ChevronUp, GripVertical, Check, X, Paperclip, FolderOpen, Download, Loader2, Settings, Calendar, MoveUp, MoveDown, File, Scale, ExternalLink, Edit } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, ExhibitList, Exhibit, EvidenceFile, ExhibitEvidence, ExhibitSnippet } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AppExhibits() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [showCreateList, setShowCreateList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [showAddExhibit, setShowAddExhibit] = useState<string | null>(null);
  const [newExhibitTitle, setNewExhibitTitle] = useState("");
  const [newExhibitDescription, setNewExhibitDescription] = useState("");
  const [editingExhibitId, setEditingExhibitId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteListConfirmId, setDeleteListConfirmId] = useState<string | null>(null);
  const [attachModalExhibitId, setAttachModalExhibitId] = useState<string | null>(null);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);

  const { data: caseData, isLoading: caseLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: listsData, isLoading: listsLoading } = useQuery<{ exhibitLists: ExhibitList[] }>({
    queryKey: ["/api/cases", caseId, "exhibit-lists"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const exhibitLists = listsData?.exhibitLists || [];

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || listsLoading) return;
    const snippetId = getDeepLinkParam("snippetId");
    if (snippetId && exhibitLists.length > 0) {
      deepLinkHandledRef.current = true;
      if (!expandedListId) {
        setExpandedListId(exhibitLists[0].id);
      }
      setTimeout(() => {
        const success = scrollAndHighlight(`snippet-${snippetId}`);
        if (success) {
          clearDeepLinkQueryParams();
        }
      }, 200);
    }
  }, [listsLoading, exhibitLists, expandedListId]);

  const createListMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/exhibit-lists`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "exhibit-lists"] });
      setShowCreateList(false);
      setNewListTitle("");
      toast({ title: "Exhibit list created", description: "Your new exhibit list is ready." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create exhibit list", variant: "destructive" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      return apiRequest("DELETE", `/api/exhibit-lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "exhibit-lists"] });
      setDeleteListConfirmId(null);
      toast({ title: "Exhibit list deleted", description: "Exhibit list and all exhibits removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete exhibit list", variant: "destructive" });
    },
  });

  const handleCreateList = () => {
    if (!newListTitle.trim()) return;
    createListMutation.mutate({ title: newListTitle.trim() });
  };

  if (caseLoading || listsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading exhibits...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentCase) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Case not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-5 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-exhibits-title">Exhibits</h1>
            <p className="text-muted-foreground text-sm mt-1">{currentCase.title}</p>
          </div>
          <Button onClick={() => setShowCreateList(true)} data-testid="button-create-exhibit-list">
            <Plus className="w-4 h-4 mr-2" />
            New Exhibit List
          </Button>
        </div>

        <ModuleIntro
          title="About Exhibit Lists"
          paragraphs={[
            "Exhibits are pieces of evidence formally presented to the court. This tool helps you organize and number exhibits according to court requirements.",
            "Many courts require exhibit lists to be submitted in advance of hearings or trials."
          ]}
          caution="Check your court's local rules for specific exhibit formatting requirements."
        />

        {showCreateList && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-list-title">List Title</Label>
                <Input
                  id="new-list-title"
                  placeholder="e.g., Trial Exhibits, Hearing Exhibits"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  data-testid="input-new-list-title"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateList} disabled={!newListTitle.trim() || createListMutation.isPending} data-testid="button-save-new-list">
                  {createListMutation.isPending ? "Creating..." : "Create List"}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreateList(false); setNewListTitle(""); }} data-testid="button-cancel-new-list">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {exhibitLists.length === 0 && !showCreateList ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Exhibit Lists Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create an exhibit list to organize your trial or hearing exhibits.</p>
              <Button onClick={() => setShowCreateList(true)} data-testid="button-create-first-list">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exhibitLists.map((list) => (
              <ExhibitListCard
                key={list.id}
                list={list}
                caseId={caseId!}
                expanded={expandedListId === list.id}
                onToggle={() => setExpandedListId(expandedListId === list.id ? null : list.id)}
                showAddExhibit={showAddExhibit === list.id}
                setShowAddExhibit={(show) => setShowAddExhibit(show ? list.id : null)}
                newExhibitTitle={newExhibitTitle}
                setNewExhibitTitle={setNewExhibitTitle}
                newExhibitDescription={newExhibitDescription}
                setNewExhibitDescription={setNewExhibitDescription}
                editingExhibitId={editingExhibitId}
                setEditingExhibitId={setEditingExhibitId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                deleteConfirmId={deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
                attachModalExhibitId={attachModalExhibitId}
                setAttachModalExhibitId={setAttachModalExhibitId}
                selectedEvidenceIds={selectedEvidenceIds}
                setSelectedEvidenceIds={setSelectedEvidenceIds}
                deleteListConfirmId={deleteListConfirmId}
                setDeleteListConfirmId={setDeleteListConfirmId}
                deleteListMutation={deleteListMutation}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface ExhibitListCardProps {
  list: ExhibitList;
  caseId: string;
  expanded: boolean;
  onToggle: () => void;
  showAddExhibit: boolean;
  setShowAddExhibit: (show: boolean) => void;
  newExhibitTitle: string;
  setNewExhibitTitle: (val: string) => void;
  newExhibitDescription: string;
  setNewExhibitDescription: (val: string) => void;
  editingExhibitId: string | null;
  setEditingExhibitId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  attachModalExhibitId: string | null;
  setAttachModalExhibitId: (id: string | null) => void;
  selectedEvidenceIds: string[];
  setSelectedEvidenceIds: (ids: string[]) => void;
  deleteListConfirmId: string | null;
  setDeleteListConfirmId: (id: string | null) => void;
  deleteListMutation: ReturnType<typeof useMutation<unknown, Error, string>>;
}

function ExhibitListCard({
  list,
  caseId,
  expanded,
  onToggle,
  showAddExhibit,
  setShowAddExhibit,
  newExhibitTitle,
  setNewExhibitTitle,
  newExhibitDescription,
  setNewExhibitDescription,
  editingExhibitId,
  setEditingExhibitId,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  deleteConfirmId,
  setDeleteConfirmId,
  attachModalExhibitId,
  setAttachModalExhibitId,
  selectedEvidenceIds,
  setSelectedEvidenceIds,
  deleteListConfirmId,
  setDeleteListConfirmId,
  deleteListMutation,
}: ExhibitListCardProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showListSettings, setShowListSettings] = useState(false);
  const [listSettings, setListSettings] = useState({
    coverPageTitle: list.coverPageTitle || "",
    coverPageSubtitle: list.coverPageSubtitle || "",
    isUsedForFiling: list.isUsedForFiling || false,
    usedForFilingDate: list.usedForFilingDate ? new Date(list.usedForFilingDate).toISOString().split("T")[0] : "",
    notes: list.notes || "",
  });

  const updateListMutation = useMutation({
    mutationFn: async (data: { coverPageTitle?: string | null; coverPageSubtitle?: string | null; isUsedForFiling?: boolean; usedForFilingDate?: Date | null; notes?: string | null }) => {
      return apiRequest("PATCH", `/api/exhibit-lists/${list.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "exhibit-lists"] });
      toast({ title: "List settings saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveListSettings = () => {
    updateListMutation.mutate({
      coverPageTitle: listSettings.coverPageTitle || null,
      coverPageSubtitle: listSettings.coverPageSubtitle || null,
      isUsedForFiling: listSettings.isUsedForFiling,
      usedForFilingDate: listSettings.usedForFilingDate ? new Date(listSettings.usedForFilingDate) : null,
      notes: listSettings.notes || null,
    });
  };

  const handleExportZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setExporting(true);
    try {
      const response = await fetch(`/api/exhibit-lists/${list.id}/export`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${list.title.replace(/[^a-zA-Z0-9]/g, "_")}_exhibits.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Exhibit list ZIP downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: error instanceof Error ? error.message : "Failed to export", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const { data: exhibitsData, isLoading: exhibitsLoading } = useQuery<{ exhibits: Exhibit[] }>({
    queryKey: ["/api/exhibit-lists", list.id, "exhibits"],
    enabled: expanded,
  });

  const { data: evidenceData } = useQuery<{ files: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!attachModalExhibitId,
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery<{ evidenceLinks: ExhibitEvidence[]; snippets: ExhibitSnippet[] }>({
    queryKey: ["/api/exhibit-lists", list.id, "items"],
    enabled: expanded,
  });

  const { data: allEvidenceFiles } = useQuery<{ files: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: expanded,
  });

  const exhibits = exhibitsData?.exhibits || [];
  const allEvidence = evidenceData?.files || [];
  const linkedEvidence = itemsData?.evidenceLinks || [];
  const snippets = itemsData?.snippets || [];
  const evidenceFilesMap = new Map((allEvidenceFiles?.files || []).map(f => [f.id, f]));

  const createExhibitMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      return apiRequest("POST", `/api/exhibit-lists/${list.id}/exhibits`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "exhibits"] });
      setShowAddExhibit(false);
      setNewExhibitTitle("");
      setNewExhibitDescription("");
      toast({ title: "Exhibit added", description: "New exhibit created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create exhibit", variant: "destructive" });
    },
  });

  const updateExhibitMutation = useMutation({
    mutationFn: async ({ exhibitId, data }: { exhibitId: string; data: { title?: string; description?: string; included?: boolean } }) => {
      return apiRequest("PATCH", `/api/exhibits/${exhibitId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "exhibits"] });
      setEditingExhibitId(null);
      toast({ title: "Exhibit updated", description: "Changes saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update exhibit", variant: "destructive" });
    },
  });

  const deleteExhibitMutation = useMutation({
    mutationFn: async (exhibitId: string) => {
      return apiRequest("DELETE", `/api/exhibits/${exhibitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "exhibits"] });
      setDeleteConfirmId(null);
      toast({ title: "Exhibit deleted", description: "Exhibit removed successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete exhibit", variant: "destructive" });
    },
  });

  const attachEvidenceMutation = useMutation({
    mutationFn: async ({ exhibitId, evidenceId }: { exhibitId: string; evidenceId: string }) => {
      return apiRequest("POST", `/api/exhibits/${exhibitId}/evidence/attach`, { evidenceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibits", attachModalExhibitId, "evidence"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to attach evidence", variant: "destructive" });
    },
  });

  const addEvidenceToListMutation = useMutation({
    mutationFn: async (evidenceFileId: string) => {
      return apiRequest("POST", `/api/exhibit-lists/${list.id}/evidence`, { evidenceFileId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "items"] });
      toast({ title: "Evidence added", description: "Evidence linked to exhibit list." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add evidence", variant: "destructive" });
    },
  });

  const removeEvidenceFromListMutation = useMutation({
    mutationFn: async (evidenceFileId: string) => {
      return apiRequest("DELETE", `/api/exhibit-lists/${list.id}/evidence/${evidenceFileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "items"] });
      toast({ title: "Evidence removed", description: "Evidence unlinked from exhibit list." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to remove evidence", variant: "destructive" });
    },
  });

  const reorderEvidenceMutation = useMutation({
    mutationFn: async (evidenceOrder: { id: string; sortOrder: number }[]) => {
      return apiRequest("POST", `/api/exhibit-lists/${list.id}/reorder`, { evidenceOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "items"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to reorder", variant: "destructive" });
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async (snippetId: string) => {
      return apiRequest("DELETE", `/api/exhibit-snippets/${snippetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exhibit-lists", list.id, "items"] });
      toast({ title: "Snippet deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete snippet", variant: "destructive" });
    },
  });

  const addToTrialPrepMutation = useMutation({
    mutationFn: async (data: { sourceType: string; sourceId: string; title: string; summary?: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep/shortlist`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep", "shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (error: Error) => {
      if (error.message?.includes("already exists")) {
        toast({ title: "Already in Trial Prep", description: "This item is already in your shortlist." });
      } else {
        toast({ title: "Error", description: error.message || "Failed to add to trial prep", variant: "destructive" });
      }
    },
  });

  const handleMoveEvidence = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= linkedEvidence.length) return;
    const newOrder = [...linkedEvidence];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    reorderEvidenceMutation.mutate(newOrder.map((item, i) => ({ id: item.id, sortOrder: i + 1 })));
  };

  const [showAddEvidenceToList, setShowAddEvidenceToList] = useState(false);

  const handleCreateExhibit = () => {
    if (!newExhibitTitle.trim()) return;
    createExhibitMutation.mutate({
      title: newExhibitTitle.trim(),
      description: newExhibitDescription.trim() || undefined,
    });
  };

  const handleSaveEdit = (exhibitId: string) => {
    updateExhibitMutation.mutate({
      exhibitId,
      data: { title: editTitle.trim(), description: editDescription.trim() || undefined },
    });
  };

  const handleToggleIncluded = (exhibit: Exhibit) => {
    updateExhibitMutation.mutate({
      exhibitId: exhibit.id,
      data: { included: !exhibit.included },
    });
  };

  const handleAttachSelected = async () => {
    if (!attachModalExhibitId || selectedEvidenceIds.length === 0) return;
    for (const evidenceId of selectedEvidenceIds) {
      await attachEvidenceMutation.mutateAsync({ exhibitId: attachModalExhibitId, evidenceId });
    }
    toast({ title: "Evidence attached", description: `${selectedEvidenceIds.length} file(s) linked to exhibit.` });
    setSelectedEvidenceIds([]);
    setAttachModalExhibitId(null);
  };

  return (
    <Card data-testid={`card-exhibit-list-${list.id}`}>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            <CardTitle className="text-lg">{list.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">{expanded ? exhibits.length : "..."} exhibits</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setShowListSettings(!showListSettings); }}
              title="List settings"
              data-testid={`button-settings-list-${list.id}`}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportZip}
              disabled={exporting}
              title="Export as ZIP"
              data-testid={`button-export-list-${list.id}`}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setDeleteListConfirmId(list.id); }}
              data-testid={`button-delete-list-${list.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {showListSettings && (
            <div className="border rounded-md p-4 space-y-4 bg-muted/30 mb-4" data-testid={`panel-list-settings-${list.id}`}>
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                List Settings & Cover Page
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cover-title-${list.id}`}>Cover Page Title</Label>
                  <Input
                    id={`cover-title-${list.id}`}
                    placeholder="e.g., Petitioner's Exhibit List"
                    value={listSettings.coverPageTitle}
                    onChange={(e) => setListSettings({ ...listSettings, coverPageTitle: e.target.value })}
                    data-testid={`input-cover-title-${list.id}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cover-subtitle-${list.id}`}>Cover Page Subtitle</Label>
                  <Input
                    id={`cover-subtitle-${list.id}`}
                    placeholder="e.g., Case No. 2024-FC-12345"
                    value={listSettings.coverPageSubtitle}
                    onChange={(e) => setListSettings({ ...listSettings, coverPageSubtitle: e.target.value })}
                    data-testid={`input-cover-subtitle-${list.id}`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`filing-checkbox-${list.id}`}
                    checked={listSettings.isUsedForFiling}
                    onChange={(e) => setListSettings({ ...listSettings, isUsedForFiling: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                    data-testid={`checkbox-filing-${list.id}`}
                  />
                  <Label htmlFor={`filing-checkbox-${list.id}`} className="text-sm">Used for court filing</Label>
                </div>
                {listSettings.isUsedForFiling && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={listSettings.usedForFilingDate}
                      onChange={(e) => setListSettings({ ...listSettings, usedForFilingDate: e.target.value })}
                      className="w-auto"
                      data-testid={`input-filing-date-${list.id}`}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`notes-${list.id}`}>Notes</Label>
                <Textarea
                  id={`notes-${list.id}`}
                  placeholder="Internal notes about this exhibit list..."
                  value={listSettings.notes}
                  onChange={(e) => setListSettings({ ...listSettings, notes: e.target.value })}
                  rows={2}
                  data-testid={`input-notes-${list.id}`}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveListSettings} disabled={updateListMutation.isPending} data-testid={`button-save-settings-${list.id}`}>
                  {updateListMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowListSettings(false)} data-testid={`button-close-settings-${list.id}`}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Linked Evidence Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <File className="w-4 h-4" />
                Linked Evidence ({linkedEvidence.length})
              </h4>
              <Button variant="outline" size="sm" onClick={() => setShowAddEvidenceToList(true)} data-testid={`button-add-evidence-to-list-${list.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Evidence
              </Button>
            </div>
            
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : linkedEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence files linked yet. Click "Add Evidence" to link files.</p>
            ) : (
              <div className="space-y-2">
                {linkedEvidence.map((link, idx) => {
                  const fileId = link.evidenceFileId || "";
                  const file = fileId ? evidenceFilesMap.get(fileId) : undefined;
                  return (
                    <div key={link.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/20" data-testid={`evidence-link-${link.id}`}>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" className="h-5 w-5" disabled={idx === 0} onClick={() => handleMoveEvidence(idx, "up")} data-testid={`button-move-up-${link.id}`}>
                          <MoveUp className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" disabled={idx === linkedEvidence.length - 1} onClick={() => handleMoveEvidence(idx, "down")} data-testid={`button-move-down-${link.id}`}>
                          <MoveDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file?.originalName || "Unknown file"}</p>
                        <p className="text-xs text-muted-foreground">{file ? formatDate(file.createdAt) : ""} {link.label ? `- ${link.label}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {file && (
                          <Button size="icon" variant="ghost" asChild data-testid={`button-download-evidence-${link.id}`}>
                            <a href={`/api/evidence/${file.id}/download`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {fileId && (
                          <Button size="icon" variant="ghost" onClick={() => removeEvidenceFromListMutation.mutate(fileId)} data-testid={`button-remove-evidence-${link.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Snippets Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Snippets ({snippets.length})
            </h4>
            
            {snippets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No snippets in this list. Create snippets from Evidence AI analyses.</p>
            ) : (
              <div className="space-y-2">
                {snippets.map((snippet) => (
                  <div key={snippet.id} id={`snippet-${snippet.id}`} className="p-3 border rounded-md bg-muted/20" data-testid={`snippet-${snippet.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{snippet.title}</p>
                        {snippet.pageNumber && <Badge variant="secondary" className="text-xs mt-1">Page {snippet.pageNumber}</Badge>}
                        {snippet.snippetText && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{snippet.snippetText}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => addToTrialPrepMutation.mutate({
                            sourceType: "exhibit_snippet",
                            sourceId: snippet.id,
                            title: snippet.title,
                            summary: snippet.snippetText || undefined,
                          })}
                          disabled={addToTrialPrepMutation.isPending}
                          title="Add to Trial Prep"
                          data-testid={`button-snippet-trial-prep-${snippet.id}`}
                        >
                          <Scale className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteSnippetMutation.mutate(snippet.id)} data-testid={`button-delete-snippet-${snippet.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Evidence to List Modal */}
          <Dialog open={showAddEvidenceToList} onOpenChange={setShowAddEvidenceToList}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Evidence to Exhibit List</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {(allEvidenceFiles?.files || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No evidence files available.</p>
                  ) : (
                    (allEvidenceFiles?.files || []).filter(ev => !linkedEvidence.some(l => l.evidenceFileId === ev.id)).map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover-elevate">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.originalName}</p>
                          <p className="text-xs text-muted-foreground">{ev.category} - {formatDate(ev.createdAt)}</p>
                        </div>
                        <Button size="sm" onClick={() => { addEvidenceToListMutation.mutate(ev.id); }} disabled={addEvidenceToListMutation.isPending} data-testid={`button-add-evidence-${ev.id}`}>
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddEvidenceToList(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <hr className="my-4" />

          {/* Legacy Exhibits Section (if needed) */}
          {exhibitsLoading ? (
            <p className="text-sm text-muted-foreground">Loading exhibits...</p>
          ) : (
            <>
              {exhibits.length === 0 && !showAddExhibit ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No individual exhibits created.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exhibits.map((exhibit) => (
                    <ExhibitRow
                      key={exhibit.id}
                      exhibit={exhibit}
                      listId={list.id}
                      caseId={caseId}
                      isEditing={editingExhibitId === exhibit.id}
                      editTitle={editTitle}
                      setEditTitle={setEditTitle}
                      editDescription={editDescription}
                      setEditDescription={setEditDescription}
                      onStartEdit={() => {
                        setEditingExhibitId(exhibit.id);
                        setEditTitle(exhibit.title);
                        setEditDescription(exhibit.description || "");
                      }}
                      onCancelEdit={() => setEditingExhibitId(null)}
                      onSaveEdit={() => handleSaveEdit(exhibit.id)}
                      onToggleIncluded={() => handleToggleIncluded(exhibit)}
                      deleteConfirmId={deleteConfirmId}
                      setDeleteConfirmId={setDeleteConfirmId}
                      deleteExhibitMutation={deleteExhibitMutation}
                      onOpenAttachModal={() => setAttachModalExhibitId(exhibit.id)}
                    />
                  ))}
                </div>
              )}

              {!showAddExhibit && exhibits.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowAddExhibit(true)} data-testid={`button-add-exhibit-${list.id}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exhibit
                </Button>
              )}

              {showAddExhibit && (
                <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="new-exhibit-title">Exhibit Title</Label>
                    <Input
                      id="new-exhibit-title"
                      placeholder="e.g., Email from Respondent"
                      value={newExhibitTitle}
                      onChange={(e) => setNewExhibitTitle(e.target.value)}
                      data-testid="input-new-exhibit-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-exhibit-description">Description (optional)</Label>
                    <Textarea
                      id="new-exhibit-description"
                      placeholder="Brief description of this exhibit"
                      value={newExhibitDescription}
                      onChange={(e) => setNewExhibitDescription(e.target.value)}
                      rows={2}
                      data-testid="input-new-exhibit-description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateExhibit} disabled={!newExhibitTitle.trim() || createExhibitMutation.isPending} data-testid="button-save-new-exhibit">
                      {createExhibitMutation.isPending ? "Adding..." : "Add Exhibit"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowAddExhibit(false); setNewExhibitTitle(""); setNewExhibitDescription(""); }} data-testid="button-cancel-new-exhibit">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}

      <Dialog open={deleteListConfirmId === list.id} onOpenChange={(open) => !open && setDeleteListConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exhibit List?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete &quot;{list.title}&quot; and all exhibits within it. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteListConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteListMutation.mutate(list.id)} disabled={deleteListMutation.isPending}>
              {deleteListMutation.isPending ? "Deleting..." : "Delete List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={attachModalExhibitId !== null} onOpenChange={(open) => { if (!open) { setAttachModalExhibitId(null); setSelectedEvidenceIds([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach Evidence to Exhibit</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {allEvidence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No evidence files available.</p>
              ) : (
                allEvidence.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                    <Checkbox
                      checked={selectedEvidenceIds.includes(ev.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvidenceIds([...selectedEvidenceIds, ev.id]);
                        } else {
                          setSelectedEvidenceIds(selectedEvidenceIds.filter((id) => id !== ev.id));
                        }
                      }}
                      data-testid={`checkbox-evidence-${ev.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.originalName}</p>
                      <p className="text-xs text-muted-foreground">{ev.category} - {formatDate(ev.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedEvidenceIds([]); setAttachModalExhibitId(null); }}>Cancel</Button>
            <Button onClick={handleAttachSelected} disabled={selectedEvidenceIds.length === 0 || attachEvidenceMutation.isPending}>
              {attachEvidenceMutation.isPending ? "Attaching..." : `Attach (${selectedEvidenceIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ExhibitRowProps {
  exhibit: Exhibit;
  listId: string;
  caseId: string;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggleIncluded: () => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  deleteExhibitMutation: ReturnType<typeof useMutation<unknown, Error, string>>;
  onOpenAttachModal: () => void;
}

function ExhibitRow({
  exhibit,
  isEditing,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleIncluded,
  deleteConfirmId,
  setDeleteConfirmId,
  deleteExhibitMutation,
  onOpenAttachModal,
}: ExhibitRowProps) {
  const { data: linkedEvidenceData } = useQuery<{ evidence: EvidenceFile[] }>({
    queryKey: ["/api/exhibits", exhibit.id, "evidence"],
  });

  const linkedEvidence = linkedEvidenceData?.evidence || [];

  if (isEditing) {
    return (
      <div className="border rounded-md p-3 space-y-3 bg-muted/30" data-testid={`row-exhibit-editing-${exhibit.id}`}>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} data-testid="input-edit-exhibit-title" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} data-testid="input-edit-exhibit-description" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSaveEdit} data-testid="button-save-exhibit-edit">
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onCancelEdit} data-testid="button-cancel-exhibit-edit">
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md p-3 ${!exhibit.included ? "opacity-60" : ""}`} data-testid={`row-exhibit-${exhibit.id}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
        <Badge variant="outline" className="font-mono text-sm shrink-0">{exhibit.label}</Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate cursor-pointer" onClick={onStartEdit} data-testid={`text-exhibit-title-${exhibit.id}`}>
            {exhibit.title}
          </p>
          {exhibit.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exhibit.description}</p>
          )}
          {linkedEvidence.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {linkedEvidence.map((ev) => (
                <Badge key={ev.id} variant="secondary" className="text-xs">
                  <Paperclip className="w-3 h-3 mr-1" />
                  {ev.originalName.length > 20 ? ev.originalName.slice(0, 20) + "..." : ev.originalName}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              checked={exhibit.included}
              onCheckedChange={onToggleIncluded}
              data-testid={`switch-include-${exhibit.id}`}
            />
            <span className="text-xs text-muted-foreground">{exhibit.included ? "Included" : "Excluded"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onOpenAttachModal} data-testid={`button-attach-evidence-${exhibit.id}`}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(exhibit.id)} data-testid={`button-delete-exhibit-${exhibit.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={deleteConfirmId === exhibit.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exhibit?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &quot;{exhibit.label}: {exhibit.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteExhibitMutation.mutate(exhibit.id)} disabled={deleteExhibitMutation.isPending}>
              {deleteExhibitMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
