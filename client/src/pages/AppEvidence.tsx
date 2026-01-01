import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Briefcase, Upload, Download, Trash2, File, FileText, Image, Archive, AlertCircle, Save, ChevronDown, ChevronUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, EvidenceFile } from "@shared/schema";

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

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: evidenceData, isLoading: evidenceLoading } = useQuery<{ files: EvidenceFile[]; r2Configured: boolean }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const rawFiles = evidenceData?.files || [];
  const r2Configured = evidenceData?.r2Configured ?? false;

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
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Evidence</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                data-testid="button-upload-file"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </div>

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
    </AppLayout>
  );
}
