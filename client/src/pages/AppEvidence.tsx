import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Briefcase, Upload, Download, Trash2, File, FileText, Image, Archive, AlertCircle, Save, ChevronDown, ChevronUp, Paperclip, StickyNote, Plus, Pencil, X, Star, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, EvidenceFile, ExhibitList, Exhibit, EvidenceNote } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";

const CATEGORIES = [
  { value: "document", label: "Document" },
  { value: "photo", label: "Photo" },
  { value: "message", label: "Message" },
  { value: "medical", label: "Medical" },
  { value: "financial", label: "Financial" },
  { value: "school", label: "School" },
  { value: "other", label: "Other" },
] as const;

function getCategoryLabel(value: string): string {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType === "application/zip") return Archive;
  return File;
}

export default function AppEvidence() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<Record<string, { category: string; description: string; tags: string }>>({});
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [addToExhibitEvidenceId, setAddToExhibitEvidenceId] = useState<string | null>(null);
  const [selectedExhibitListId, setSelectedExhibitListId] = useState<string>("");
  const [selectedExhibitId, setSelectedExhibitId] = useState<string>("");
  const [newExhibitTitle, setNewExhibitTitle] = useState("");
  const [notesFileId, setNotesFileId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState<{ pageNumber: string; label: string; note: string; isKey: boolean }>({ pageNumber: "", label: "", note: "", isKey: false });

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: evidenceData, isLoading: evidenceLoading } = useQuery<{ files: EvidenceFile[]; r2Configured: boolean }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId,
  });

  const { data: exhibitListsData } = useQuery<{ exhibitLists: ExhibitList[] }>({
    queryKey: ["/api/cases", caseId, "exhibit-lists"],
    enabled: !!addToExhibitEvidenceId && !!caseId,
  });

  const { data: exhibitsData } = useQuery<{ exhibits: Exhibit[] }>({
    queryKey: ["/api/exhibit-lists", selectedExhibitListId, "exhibits"],
    enabled: !!selectedExhibitListId,
  });

  const { data: notesData, isLoading: notesLoading } = useQuery<{ notes: EvidenceNote[] }>({
    queryKey: ["/api/cases", caseId, "evidence", notesFileId, "notes"],
    enabled: !!notesFileId && !!caseId,
  });

  const exhibitLists = exhibitListsData?.exhibitLists || [];
  const exhibits = exhibitsData?.exhibits || [];
  const notes = notesData?.notes || [];

  const currentCase = caseData?.case;
  const rawFiles = evidenceData?.files || [];
  const r2Configured = evidenceData?.r2Configured ?? false;
  const notesFile = rawFiles.find(f => f.id === notesFileId);

  const filteredFiles = rawFiles
    .filter((f) => filterCategory === "all" || f.category === filterCategory)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

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

  const updateMutation = useMutation({
    mutationFn: async ({ evidenceId, data }: { evidenceId: string; data: { category?: string; description?: string; tags?: string } }) => {
      return apiRequest("PATCH", `/api/cases/${caseId}/evidence/${evidenceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence"] });
      toast({ title: "Metadata saved", description: "File metadata updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update metadata", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      const res = await fetch(`/api/evidence/${evidenceId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(err.error || "Delete failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence"] });
      setDeleteConfirmId(null);
      toast({ title: "File deleted", description: "Evidence file removed successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete file", variant: "destructive" });
    },
  });

  const addToExhibitMutation = useMutation({
    mutationFn: async ({ evidenceId, exhibitListId, exhibitId, createNewExhibitTitle }: { evidenceId: string; exhibitListId: string; exhibitId?: string; createNewExhibitTitle?: string }) => {
      return apiRequest("POST", `/api/evidence/${evidenceId}/add-to-exhibit`, { exhibitListId, exhibitId, createNewExhibitTitle });
    },
    onSuccess: () => {
      toast({ title: "Added to exhibit", description: "Evidence file linked to exhibit successfully." });
      closeAddToExhibitModal();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add to exhibit", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { pageNumber?: number | null; label?: string | null; note: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/evidence/${notesFileId}/notes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", notesFileId, "notes"] });
      toast({ title: "Note created", description: "Evidence note added successfully." });
      resetNoteForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, data }: { noteId: string; data: { pageNumber?: number | null; label?: string | null; note?: string } }) => {
      return apiRequest("PATCH", `/api/evidence-notes/${noteId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", notesFileId, "notes"] });
      toast({ title: "Note updated", description: "Evidence note updated successfully." });
      resetNoteForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest("DELETE", `/api/evidence-notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", notesFileId, "notes"] });
      toast({ title: "Note deleted", description: "Evidence note removed successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete note", variant: "destructive" });
    },
  });

  const resetNoteForm = () => {
    setEditingNoteId(null);
    setNoteForm({ pageNumber: "", label: "", note: "", isKey: false });
  };

  const closeNotesModal = () => {
    setNotesFileId(null);
    resetNoteForm();
  };

  const startEditNote = (n: EvidenceNote) => {
    setEditingNoteId(n.id);
    setNoteForm({
      pageNumber: n.pageNumber != null ? String(n.pageNumber) : "",
      label: n.label || "",
      note: n.note,
      isKey: n.isKey || false,
    });
  };

  const handleSaveNote = () => {
    const pageNum = noteForm.pageNumber.trim() ? parseInt(noteForm.pageNumber, 10) : null;
    const labelVal = noteForm.label.trim() || null;
    if (!noteForm.note.trim()) return;

    if (editingNoteId) {
      updateNoteMutation.mutate({
        noteId: editingNoteId,
        data: { pageNumber: pageNum, label: labelVal, note: noteForm.note.trim(), isKey: noteForm.isKey },
      });
    } else {
      createNoteMutation.mutate({
        pageNumber: pageNum,
        label: labelVal,
        note: noteForm.note.trim(),
        isKey: noteForm.isKey,
      });
    }
  };

  const toggleNoteKey = (noteId: string, currentIsKey: boolean) => {
    updateNoteMutation.mutate({
      noteId,
      data: { isKey: !currentIsKey },
    });
  };

  const closeAddToExhibitModal = () => {
    setAddToExhibitEvidenceId(null);
    setSelectedExhibitListId("");
    setSelectedExhibitId("");
    setNewExhibitTitle("");
  };

  const handleAddToExhibit = () => {
    if (!addToExhibitEvidenceId || !selectedExhibitListId) return;
    if (!selectedExhibitId && !newExhibitTitle.trim()) return;
    addToExhibitMutation.mutate({
      evidenceId: addToExhibitEvidenceId,
      exhibitListId: selectedExhibitListId,
      exhibitId: selectedExhibitId || undefined,
      createNewExhibitTitle: !selectedExhibitId && newExhibitTitle.trim() ? newExhibitTitle.trim() : undefined,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!r2Configured) {
      toast({ title: "Uploads disabled", description: "File storage is not configured. Please contact support.", variant: "destructive" });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 25MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        if (res.status === 503) {
          throw new Error("Uploads not configured");
        }
        throw new Error(err.error || err.fields?.file || "Upload failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence"] });
      toast({ title: "File uploaded", description: "Evidence file added successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = (evidenceId: string) => {
    window.open(`/api/evidence/${evidenceId}/download`, "_blank");
  };

  const handleExpand = (file: EvidenceFile) => {
    if (expandedId === file.id) {
      setExpandedId(null);
    } else {
      setExpandedId(file.id);
      if (!editingMetadata[file.id]) {
        setEditingMetadata((prev) => ({
          ...prev,
          [file.id]: {
            category: file.category || "",
            description: file.description || "",
            tags: file.tags || "",
          },
        }));
      }
    }
  };

  const handleMetadataChange = (fileId: string, field: "category" | "description" | "tags", value: string) => {
    setEditingMetadata((prev) => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value,
      },
    }));
  };

  const handleSaveMetadata = (fileId: string) => {
    const data = editingMetadata[fileId];
    if (!data) return;
    updateMutation.mutate({
      evidenceId: fileId,
      data: {
        category: data.category || undefined,
        description: data.description || undefined,
        tags: data.tags || undefined,
      },
    });
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
              <p className="font-sans text-xs sm:text-sm text-neutral-darkest/60 mb-1">Evidence</p>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt,.csv,.zip"
                data-testid="input-file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !r2Configured}
                className="min-h-[44px] w-full sm:w-auto"
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </div>

          <ModuleIntro
            title="About Evidence Management"
            paragraphs={[
              "This tool helps you organize and store evidence files for your case. Upload documents, photos, messages, and other files that may be relevant to your proceedings.",
              "Keeping evidence organized can help when preparing exhibits or referring to specific documents later."
            ]}
            caution="Store copies of your evidence securely. This tool is for organization purposes."
          />

          {caseId && (
            <LexiSuggestedQuestions moduleKey="evidence" caseId={caseId} />
          )}

          {!r2Configured && (
            <Card className="w-full mb-6 border-amber-300 bg-amber-50">
              <CardContent className="py-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="font-sans text-sm text-amber-800">
                  File uploads are not configured. Please contact support to enable evidence uploads.
                </p>
              </CardContent>
            </Card>
          )}

          {rawFiles.length > 0 && (
            <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-darkest/60">Filter:</span>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-category">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-darkest/60">Sort:</span>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                  <SelectTrigger className="w-[120px]" data-testid="select-sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-neutral-darkest/60 ml-auto">
                {filteredFiles.length} of {rawFiles.length} files
              </span>
            </div>
          )}

          {evidenceLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading files...</p>
            </div>
          ) : rawFiles.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">
                No Evidence Files Yet
              </h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md">
                {r2Configured
                  ? "Upload documents, images, and other files related to your case."
                  : "File storage needs to be configured before you can upload evidence."}
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 flex flex-col items-center justify-center text-center">
              <p className="font-sans text-sm text-neutral-darkest/70">
                No files match the current filter.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.mimeType);
                const isExpanded = expandedId === file.id;
                const metadata = editingMetadata[file.id] || {
                  category: file.category || "",
                  description: file.description || "",
                  tags: file.tags || "",
                };

                return (
                  <Card key={file.id} className="w-full" data-testid={`card-evidence-${file.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleExpand(file)}>
                          <p className="font-sans font-medium text-neutral-darkest truncate" data-testid={`text-filename-${file.id}`}>
                            {file.originalName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-darkest/60">
                            <span>{formatFileSize(Number(file.sizeBytes))}</span>
                            <span>{formatDate(file.createdAt)}</span>
                            {file.category && (
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {getCategoryLabel(file.category)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {deleteConfirmId === file.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(file.id)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-confirm-delete-${file.id}`}
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Confirm"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirmId(null)}
                                data-testid={`button-cancel-delete-${file.id}`}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleExpand(file)}
                                data-testid={`button-expand-${file.id}`}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownload(file.id)}
                                data-testid={`button-download-${file.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setAddToExhibitEvidenceId(file.id)}
                                data-testid={`button-add-to-exhibit-${file.id}`}
                                title="Add to exhibit"
                              >
                                <Paperclip className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setNotesFileId(file.id)}
                                data-testid={`button-notes-${file.id}`}
                                title="View/add notes"
                              >
                                <StickyNote className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(file.id)}
                                data-testid={`button-delete-${file.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-neutral-darkest/10 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-darkest mb-1">
                                Category
                              </label>
                              <Select
                                value={metadata.category || "none"}
                                onValueChange={(v) => handleMetadataChange(file.id, "category", v === "none" ? "" : v)}
                              >
                                <SelectTrigger data-testid={`select-category-${file.id}`}>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No category</SelectItem>
                                  {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-darkest mb-1">
                                Tags
                              </label>
                              <Input
                                value={metadata.tags}
                                onChange={(e) => handleMetadataChange(file.id, "tags", e.target.value)}
                                placeholder="Comma-separated tags"
                                maxLength={500}
                                data-testid={`input-tags-${file.id}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-darkest mb-1">
                              Description
                            </label>
                            <Textarea
                              value={metadata.description}
                              onChange={(e) => handleMetadataChange(file.id, "description", e.target.value)}
                              placeholder="Add a description for this file..."
                              rows={3}
                              maxLength={5000}
                              data-testid={`textarea-description-${file.id}`}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSaveMetadata(file.id)}
                              disabled={updateMutation.isPending}
                              data-testid={`button-save-metadata-${file.id}`}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {updateMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!addToExhibitEvidenceId} onOpenChange={(open) => !open && closeAddToExhibitModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Exhibit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {exhibitLists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No exhibit lists found. Create an exhibit list first in the Exhibits section.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exhibit-list-select">Exhibit List</Label>
                  <Select value={selectedExhibitListId} onValueChange={(v) => { setSelectedExhibitListId(v); setSelectedExhibitId(""); setNewExhibitTitle(""); }}>
                    <SelectTrigger id="exhibit-list-select" data-testid="select-exhibit-list">
                      <SelectValue placeholder="Select an exhibit list" />
                    </SelectTrigger>
                    <SelectContent>
                      {exhibitLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>{list.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedExhibitListId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="exhibit-select">Existing Exhibit (optional)</Label>
                      <Select value={selectedExhibitId} onValueChange={(v) => { setSelectedExhibitId(v); if (v) setNewExhibitTitle(""); }}>
                        <SelectTrigger id="exhibit-select" data-testid="select-exhibit">
                          <SelectValue placeholder="Select an exhibit or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Create new exhibit</SelectItem>
                          {exhibits.map((exhibit) => (
                            <SelectItem key={exhibit.id} value={exhibit.id}>{exhibit.label}: {exhibit.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!selectedExhibitId && (
                      <div className="space-y-2">
                        <Label htmlFor="new-exhibit-title">New Exhibit Title</Label>
                        <Input
                          id="new-exhibit-title"
                          placeholder="Enter title for new exhibit"
                          value={newExhibitTitle}
                          onChange={(e) => setNewExhibitTitle(e.target.value)}
                          data-testid="input-new-exhibit-title"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddToExhibitModal}>Cancel</Button>
            <Button
              onClick={handleAddToExhibit}
              disabled={!selectedExhibitListId || (!selectedExhibitId && !newExhibitTitle.trim()) || addToExhibitMutation.isPending}
            >
              {addToExhibitMutation.isPending ? "Adding..." : "Add to Exhibit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!notesFileId} onOpenChange={(open) => !open && closeNotesModal()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Notes for: {notesFile?.originalName || "File"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-24">
                  <Label htmlFor="note-page" className="text-xs text-muted-foreground">Page #</Label>
                  <Input
                    id="note-page"
                    placeholder="Optional"
                    value={noteForm.pageNumber}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, pageNumber: e.target.value.replace(/\D/g, "") }))}
                    maxLength={10}
                    data-testid="input-note-page"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="note-label" className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    id="note-label"
                    placeholder="Optional label (e.g., Important, Follow-up)"
                    value={noteForm.label}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, label: e.target.value }))}
                    maxLength={80}
                    data-testid="input-note-label"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="note-content" className="text-xs text-muted-foreground">Note</Label>
                <Textarea
                  id="note-content"
                  placeholder="Add your note here..."
                  value={noteForm.note}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  maxLength={5000}
                  data-testid="textarea-note-content"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="note-is-key"
                    checked={noteForm.isKey}
                    onCheckedChange={(checked) => setNoteForm((prev) => ({ ...prev, isKey: checked }))}
                    data-testid="switch-note-is-key"
                  />
                  <Label htmlFor="note-is-key" className="text-sm flex items-center gap-1 cursor-pointer">
                    <Star className="w-4 h-4 text-amber-500" />
                    Mark as Key
                  </Label>
                </div>
                <div className="flex gap-2">
                  {editingNoteId && (
                    <Button variant="outline" size="sm" onClick={resetNoteForm} data-testid="button-cancel-edit-note">
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={!noteForm.note.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
                    data-testid="button-save-note"
                  >
                    {createNoteMutation.isPending || updateNoteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingNoteId ? (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {notesLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notes yet. Add your first note above.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <Card key={n.id} className={`relative ${n.isKey ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : ""}`} data-testid={`card-note-${n.id}`}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {n.isKey && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            )}
                            {n.pageNumber != null && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Page {n.pageNumber}
                              </span>
                            )}
                            {n.label && (
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                {n.label}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap" data-testid={`text-note-content-${n.id}`}>
                            {n.note}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleNoteKey(n.id, n.isKey)}
                            title={n.isKey ? "Remove key status" : "Mark as key"}
                            data-testid={`button-toggle-key-${n.id}`}
                          >
                            <Star className={`w-4 h-4 ${n.isKey ? "text-amber-500 fill-amber-500" : ""}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditNote(n)}
                            data-testid={`button-edit-note-${n.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteNoteMutation.mutate(n.id)}
                            disabled={deleteNoteMutation.isPending}
                            data-testid={`button-delete-note-${n.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={closeNotesModal} data-testid="button-close-notes-drawer">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
