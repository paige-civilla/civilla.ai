import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Briefcase, Upload, Download, Trash2, File, FileText, Image, Archive, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Case, EvidenceFile } from "@shared/schema";

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

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: evidenceData, isLoading: evidenceLoading } = useQuery<{ files: EvidenceFile[]; r2Configured: boolean }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const files = evidenceData?.files || [];
  const r2Configured = evidenceData?.r2Configured ?? false;

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
              className="inline-flex items-center gap-2 text-sm text-bush font-medium"
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
            className="inline-flex items-center gap-2 text-sm text-bush font-medium mb-6"
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

          {evidenceLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-bush/10 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-bush" />
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
          ) : (
            <div className="w-full space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.mimeType);
                return (
                  <Card key={file.id} className="w-full" data-testid={`card-evidence-${file.id}`}>
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-bush/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-bush" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-medium text-neutral-darkest truncate" data-testid={`text-filename-${file.id}`}>
                          {file.originalName}
                        </p>
                        <p className="font-sans text-xs text-neutral-darkest/60">
                          {formatFileSize(Number(file.sizeBytes))} · {formatDate(file.createdAt)}
                        </p>
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
