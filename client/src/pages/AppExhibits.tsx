import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, FileText, Trash2, ChevronDown, ChevronUp, GripVertical, Check, X, Paperclip, FolderOpen } from "lucide-react";
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
import type { Case, ExhibitList, Exhibit, EvidenceFile } from "@shared/schema";
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

  const { data: exhibitsData, isLoading: exhibitsLoading } = useQuery<{ exhibits: Exhibit[] }>({
    queryKey: ["/api/exhibit-lists", list.id, "exhibits"],
    enabled: expanded,
  });

  const { data: evidenceData } = useQuery<{ files: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!attachModalExhibitId,
  });

  const exhibits = exhibitsData?.exhibits || [];
  const allEvidence = evidenceData?.files || [];

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
            <Badge variant="secondary" size="sm">{expanded ? exhibits.length : "..."} exhibits</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setDeleteListConfirmId(list.id); }}
            data-testid={`button-delete-list-${list.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {exhibitsLoading ? (
            <p className="text-sm text-muted-foreground">Loading exhibits...</p>
          ) : (
            <>
              {exhibits.length === 0 && !showAddExhibit ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">No exhibits in this list yet.</p>
                  <Button variant="outline" size="sm" onClick={() => setShowAddExhibit(true)} data-testid={`button-add-first-exhibit-${list.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exhibit
                  </Button>
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
                <Badge key={ev.id} variant="secondary" size="sm" className="text-xs">
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
