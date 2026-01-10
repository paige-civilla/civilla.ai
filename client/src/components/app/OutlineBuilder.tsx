import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, FileText, AlertTriangle, Check, ChevronDown, ChevronUp, Lock, Unlock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface DraftOutline {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  templateKey: string;
  sectionsJson: Section[];
  createdAt: string;
  updatedAt: string;
}

interface DraftOutlineClaim {
  id: string;
  userId: string;
  caseId: string;
  outlineId: string;
  sectionId: string;
  claimId: string;
  sortOrder: number;
  createdAt: string;
}

interface Section {
  id: string;
  title: string;
  sortOrder: number;
}

interface ClaimWithCitations {
  id: string;
  claimText: string;
  claimType: string;
  status: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedReason?: string;
  citations?: { id: string; quote: string | null; pageNumber: number | null }[];
}

interface CompileBlocker {
  type: string;
  claimId?: string;
  text?: string;
  message?: string;
}

const TEMPLATE_OPTIONS = [
  { value: "neutral_summary", label: "Neutral Summary" },
  { value: "declaration_style", label: "Declaration Style" },
  { value: "trial_binder_summary", label: "Trial Binder Summary" },
];

const DEFAULT_SECTIONS: Section[] = [
  { id: "background", title: "Background", sortOrder: 0 },
  { id: "facts", title: "Statement of Facts", sortOrder: 1 },
  { id: "evidence", title: "Supporting Evidence", sortOrder: 2 },
  { id: "conclusion", title: "Conclusion", sortOrder: 3 },
];

export default function OutlineBuilder({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [selectedOutlineId, setSelectedOutlineId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("Draft Outline");
  const [newTemplate, setNewTemplate] = useState("neutral_summary");
  const [deleteOutlineId, setDeleteOutlineId] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileBlockers, setCompileBlockers] = useState<CompileBlocker[]>([]);
  const [showBlockers, setShowBlockers] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["background", "facts", "evidence", "conclusion"]));

  const { data: outlinesData, isLoading: outlinesLoading } = useQuery<{ outlines: DraftOutline[] }>({
    queryKey: ["/api/cases", caseId, "draft-outlines"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/draft-outlines`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch outlines");
      return res.json();
    },
    enabled: !!caseId,
  });

  const outlines = outlinesData?.outlines || [];
  const selectedOutline = outlines.find(o => o.id === selectedOutlineId);

  const { data: outlineDetailData, isLoading: detailLoading } = useQuery<{ outline: DraftOutline; claims: DraftOutlineClaim[] }>({
    queryKey: ["/api/draft-outlines", selectedOutlineId],
    queryFn: async () => {
      const res = await fetch(`/api/draft-outlines/${selectedOutlineId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch outline");
      return res.json();
    },
    enabled: !!selectedOutlineId,
  });

  const outlineClaims = outlineDetailData?.claims || [];
  const sections: Section[] = selectedOutline?.sectionsJson?.length ? selectedOutline.sectionsJson : DEFAULT_SECTIONS;

  const { data: allClaimsData, isLoading: claimsLoading } = useQuery<{ claims: ClaimWithCitations[] }>({
    queryKey: ["/api/cases", caseId, "claims", { status: "accepted" }],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/claims?status=accepted`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    enabled: !!caseId,
  });

  const allClaims = allClaimsData?.claims || [];
  const assignedClaimIds = new Set(outlineClaims.map(oc => oc.claimId));
  const unassignedClaims = allClaims.filter(c => !assignedClaimIds.has(c.id));

  const createOutlineMutation = useMutation({
    mutationFn: async (data: { title: string; templateKey: string }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/draft-outlines`, data);
      return res.json() as Promise<{ outline: DraftOutline }>;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "draft-outlines"] });
      setSelectedOutlineId(result.outline.id);
      setIsCreateOpen(false);
      setNewTitle("Draft Outline");
      setNewTemplate("neutral_summary");
      toast({ title: "Outline created", description: "Your draft outline is ready for claims" });
    },
    onError: () => {
      toast({ title: "Failed to create outline", variant: "destructive" });
    },
  });

  const deleteOutlineMutation = useMutation({
    mutationFn: async (outlineId: string) => {
      return apiRequest("DELETE", `/api/draft-outlines/${outlineId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "draft-outlines"] });
      if (selectedOutlineId === deleteOutlineId) {
        setSelectedOutlineId(null);
      }
      setDeleteOutlineId(null);
      toast({ title: "Outline deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete outline", variant: "destructive" });
    },
  });

  const addClaimMutation = useMutation({
    mutationFn: async ({ sectionId, claimId }: { sectionId: string; claimId: string }) => {
      return apiRequest("POST", `/api/draft-outlines/${selectedOutlineId}/claims`, { sectionId, claimId, sortOrder: outlineClaims.filter(oc => oc.sectionId === sectionId).length });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/draft-outlines", selectedOutlineId] });
      toast({ title: "Claim added to section" });
    },
    onError: () => {
      toast({ title: "Failed to add claim", variant: "destructive" });
    },
  });

  const removeClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      return apiRequest("DELETE", `/api/draft-outlines/${selectedOutlineId}/claims/${claimId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/draft-outlines", selectedOutlineId] });
      toast({ title: "Claim removed from outline" });
    },
    onError: () => {
      toast({ title: "Failed to remove claim", variant: "destructive" });
    },
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/draft-outlines/${selectedOutlineId}/compile`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw { status: res.status, data };
      }
      return data;
    },
    onSuccess: (data: { success: boolean; claimsLocked: number }) => {
      setCompileBlockers([]);
      setShowBlockers(false);
      toast({
        title: "Outline compiled",
        description: `${data.claimsLocked} claims locked to this document`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/draft-outlines", selectedOutlineId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
    },
    onError: (error: { status: number; data: { blockers?: CompileBlocker[]; message?: string } }) => {
      if (error.data?.blockers) {
        setCompileBlockers(error.data.blockers);
        setShowBlockers(true);
      } else {
        toast({ title: "Compile failed", description: error.data?.message || "Unknown error", variant: "destructive" });
      }
    },
  });

  const handleCompile = () => {
    setIsCompiling(true);
    compileMutation.mutate();
  };

  const toggleSection = (sectionId: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    setExpandedSections(next);
  };

  const getClaimById = (claimId: string) => allClaims.find(c => c.id === claimId);
  const getClaimsForSection = (sectionId: string) => outlineClaims.filter(oc => oc.sectionId === sectionId);

  const hasCitations = (claim: ClaimWithCitations) => (claim.citations?.length ?? 0) > 0;

  if (outlinesLoading) {
    return (
      <div className="p-6 text-center text-neutral-darkest/60">
        Loading outlines...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-neutral-darkest">Draft Outline Builder</h2>
          <p className="font-sans text-sm text-neutral-darkest/70">
            Organize claims into sections. All claims need citations before compiling.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground"
          data-testid="button-create-outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Outline
        </Button>
      </div>

      {outlines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-neutral-darkest/30 mb-4" />
            <p className="text-neutral-darkest/60 mb-4">No outlines yet. Create one to organize your claims into sections.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" data-testid="button-create-outline-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Outline
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-sm">Your Outlines</h3>
              </CardHeader>
              <CardContent className="p-2">
                <div className="flex flex-col gap-1">
                  {outlines.map((outline) => (
                    <div
                      key={outline.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedOutlineId === outline.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedOutlineId(outline.id)}
                      data-testid={`outline-item-${outline.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{outline.title}</p>
                        <p className="text-xs text-neutral-darkest/50">
                          {TEMPLATE_OPTIONS.find(t => t.value === outline.templateKey)?.label || outline.templateKey}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteOutlineId(outline.id);
                        }}
                        data-testid={`button-delete-outline-${outline.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedOutlineId && selectedOutline ? (
            <div className="flex-1 min-w-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOutline.title}</h3>
                    <p className="text-xs text-neutral-darkest/50">
                      {outlineClaims.length} claims assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCompile}
                      disabled={compileMutation.isPending || outlineClaims.length === 0}
                      className="bg-primary text-primary-foreground"
                      data-testid="button-compile-outline"
                    >
                      {compileMutation.isPending ? (
                        <>Compiling...</>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Compile
                        </>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteOutlineId(selectedOutlineId)}
                      data-testid="button-delete-selected-outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showBlockers && compileBlockers.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {compileBlockers.length} claim(s) need citations
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Add supporting evidence to these claims before compiling.
                          </p>
                          <ul className="mt-2 space-y-1">
                            {compileBlockers.slice(0, 5).map((blocker, i) => (
                              <li key={i} className="text-xs text-amber-700 dark:text-amber-300 truncate">
                                • {blocker.text?.substring(0, 80)}...
                              </li>
                            ))}
                            {compileBlockers.length > 5 && (
                              <li className="text-xs text-amber-700 dark:text-amber-300">
                                + {compileBlockers.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {sections.map((section) => {
                      const sectionClaims = getClaimsForSection(section.id);
                      const isExpanded = expandedSections.has(section.id);

                      return (
                        <div key={section.id} className="border rounded-lg" data-testid={`section-${section.id}`}>
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover-elevate rounded-t-lg"
                            onClick={() => toggleSection(section.id)}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-neutral-darkest/30" />
                              <h4 className="font-medium text-sm">{section.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {sectionClaims.length}
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-neutral-darkest/50" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-darkest/50" />
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-3 pt-0 border-t">
                              {sectionClaims.length === 0 ? (
                                <p className="text-xs text-neutral-darkest/50 py-2">
                                  No claims in this section. Drag or add claims below.
                                </p>
                              ) : (
                                <div className="flex flex-col gap-2 mb-3">
                                  {sectionClaims.map((oc) => {
                                    const claim = getClaimById(oc.claimId);
                                    if (!claim) return null;
                                    const cited = hasCitations(claim);

                                    return (
                                      <div
                                        key={oc.id}
                                        className="flex items-start gap-2 p-2 rounded border bg-white dark:bg-neutral-900"
                                        data-testid={`claim-in-section-${claim.id}`}
                                      >
                                        <GripVertical className="w-4 h-4 text-neutral-darkest/30 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm line-clamp-2">{claim.claimText}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {cited ? (
                                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                <Check className="w-3 h-3 mr-1" />
                                                Cited
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Needs Citation
                                              </Badge>
                                            )}
                                            {claim.isLocked && (
                                              <Badge variant="secondary" className="text-xs">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Locked
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 flex-shrink-0"
                                          onClick={() => removeClaimMutation.mutate(claim.id)}
                                          disabled={removeClaimMutation.isPending}
                                          data-testid={`button-remove-claim-${claim.id}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {unassignedClaims.length > 0 && (
                                <Select
                                  onValueChange={(claimId) => {
                                    addClaimMutation.mutate({ sectionId: section.id, claimId });
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs" data-testid={`select-add-claim-${section.id}`}>
                                    <SelectValue placeholder="+ Add claim to section..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <ScrollArea className="max-h-60">
                                      {unassignedClaims.map((claim) => (
                                        <SelectItem key={claim.id} value={claim.id} className="text-xs">
                                          <div className="flex items-center gap-2">
                                            {hasCitations(claim) ? (
                                              <Check className="w-3 h-3 text-green-600" />
                                            ) : (
                                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                                            )}
                                            <span className="truncate max-w-xs">{claim.claimText.substring(0, 60)}...</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </ScrollArea>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {unassignedClaims.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg border border-dashed">
                      <p className="text-xs text-neutral-darkest/60 mb-2">
                        {unassignedClaims.length} accepted claims not yet assigned
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 border rounded-lg border-dashed">
              <p className="text-neutral-darkest/50">Select an outline to edit</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Draft Outline</DialogTitle>
            <DialogDescription>
              Choose a template and name for your outline. You can organize claims into sections after creating it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Motion Summary"
                maxLength={500}
                data-testid="input-outline-title"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Template</label>
              <Select value={newTemplate} onValueChange={setNewTemplate}>
                <SelectTrigger data-testid="select-outline-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createOutlineMutation.mutate({ title: newTitle, templateKey: newTemplate })}
              disabled={!newTitle.trim() || createOutlineMutation.isPending}
              data-testid="button-create-outline-confirm"
            >
              {createOutlineMutation.isPending ? "Creating..." : "Create Outline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteOutlineId} onOpenChange={() => setDeleteOutlineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outline?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the outline and all claim assignments. Claims themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOutlineId && deleteOutlineMutation.mutate(deleteOutlineId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-outline"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
