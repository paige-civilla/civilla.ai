import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDeepLinkParam, scrollAndHighlight, clearDeepLinkQueryParams } from "@/lib/deepLink";
import { ArrowLeft, FolderOpen, Briefcase, Upload, Download, Trash2, File, FileText, Image, Archive, AlertCircle, Save, ChevronDown, ChevronUp, Paperclip, StickyNote, Plus, Pencil, X, Star, Loader2, FileSearch, Check, AlertTriangle, Tag, Scale, Brain, Sparkles, Scissors, BookOpen, RefreshCw, Eye } from "lucide-react";
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
import { useModuleView } from "@/hooks/useModuleView";
import { apiRequest, queryClient, isProcessingPackError, ApiError } from "@/lib/queryClient";
import { useProcessingPackModal } from "@/components/app/ProcessingPackModal";
import type { Case, EvidenceFile, ExhibitList, Exhibit, EvidenceNote, EvidenceProcessingJob, EvidenceOcrPage, EvidenceAnchor, EvidenceAiAnalysis, ExhibitSnippet } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";
import EvidenceViewer from "@/components/app/EvidenceViewer";
import PhaseBanner from "@/components/app/PhaseBanner";

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

interface ExtractionData {
  status: string;
  extractedTextPreview: string | null;
  extractedTextFull: string | null;
  meta: Record<string, unknown> | null;
  errorMessage: string | null;
  updatedAt: string | null;
}

function ExtractionStatusBadge({ status, errorMessage }: { status: string; errorMessage?: string | null }) {
  switch (status) {
    case "complete":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><Check className="w-3 h-3 mr-1" />Extracted</Badge>;
    case "processing":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
    case "failed":
      return (
        <Badge 
          variant="outline" 
          className="bg-red-100 text-red-800 border-red-200"
          title={errorMessage || "Extraction failed"}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />Failed
        </Badge>
      );
    case "queued":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Loader2 className="w-3 h-3 mr-1" />Queued</Badge>;
    default:
      return null;
  }
}

export default function AppEvidence() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  const { showPackModal } = useProcessingPackModal();
  useModuleView("evidence", caseId);
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
  const [textExtractFileId, setTextExtractFileId] = useState<string | null>(null);
  const [processingJobs, setProcessingJobs] = useState<Record<string, { status: string; progress: number }>>({});
  const [anchorForm, setAnchorForm] = useState<{ text: string; notes: string; tags: string }>({ text: "", notes: "", tags: "" });
  const [editingAnchorId, setEditingAnchorId] = useState<string | null>(null);
  const [extractionViewFileId, setExtractionViewFileId] = useState<string | null>(null);
  const [extractionStatuses, setExtractionStatuses] = useState<Record<string, ExtractionData>>({});
  const [aiAnalysisFileId, setAiAnalysisFileId] = useState<string | null>(null);
  const [snippetModalFileId, setSnippetModalFileId] = useState<string | null>(null);
  const [snippetForm, setSnippetForm] = useState<{ title: string; snippetText: string; pageNumber: string; exhibitListId: string }>({ title: "", snippetText: "", pageNumber: "", exhibitListId: "" });
  const [viewerFileId, setViewerFileId] = useState<string | null>(null);

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

  const { data: ocrJobData, refetch: refetchOcrJob } = useQuery<{ job: EvidenceProcessingJob | null }>({
    queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "process"],
    enabled: !!textExtractFileId && !!caseId,
    refetchInterval: (query) => {
      const job = query.state.data?.job;
      if (job && (job.status === "queued" || job.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });

  const { data: ocrPagesData, isLoading: ocrPagesLoading } = useQuery<{ pages: EvidenceOcrPage[] }>({
    queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "ocr-pages"],
    enabled: !!textExtractFileId && !!caseId && ocrJobData?.job?.status === "done",
  });

  const { data: anchorsData, isLoading: anchorsLoading } = useQuery<{ anchors: EvidenceAnchor[] }>({
    queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "anchors"],
    enabled: !!textExtractFileId && !!caseId,
  });

  const { data: aiAnalysesData, isLoading: aiAnalysesLoading } = useQuery<{ analyses: EvidenceAiAnalysis[] }>({
    queryKey: ["/api/cases", caseId, "evidence", aiAnalysisFileId, "ai-analyses"],
    enabled: !!aiAnalysisFileId && !!caseId,
  });

  const { data: snippetExhibitListsData } = useQuery<{ exhibitLists: ExhibitList[] }>({
    queryKey: ["/api/cases", caseId, "exhibit-lists"],
    enabled: !!snippetModalFileId && !!caseId,
  });

  const { data: extractionData, refetch: refetchExtraction } = useQuery<ExtractionData>({
    queryKey: ["/api/cases", caseId, "evidence", extractionViewFileId, "extraction"],
    enabled: !!extractionViewFileId && !!caseId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "processing" || data.status === "queued")) {
        return 5000;
      }
      return false;
    },
  });

  const retryExtractionMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      return apiRequest("POST", `/api/cases/${caseId}/evidence/${evidenceId}/extraction/run`);
    },
    onSuccess: (_, evidenceId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidenceId, "extraction"] });
      toast({ title: "Extraction started", description: "Text extraction is now processing." });
    },
    onError: (error: Error) => {
      if (isProcessingPackError(error)) {
        showPackModal((error as ApiError).packSuggested);
      } else {
        toast({ title: "Error", description: error.message || "Failed to start extraction", variant: "destructive" });
      }
    },
  });

  const addToTrialPrepMutation = useMutation({
    mutationFn: async (file: EvidenceFile) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        sourceType: "evidence",
        sourceId: file.id,
        title: file.originalName,
        summary: file.description || null,
        binderSection: "Key Evidence",
        importance: 3,
        tags: ["evidence"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast({ title: "Already in Trial Prep", variant: "destructive" });
      } else {
        toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      }
    },
  });

  const addNoteToTrialPrepMutation = useMutation({
    mutationFn: async (note: EvidenceNote) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        sourceType: "evidence_note",
        sourceId: note.id,
        title: `Note: ${note.label || (note.note.slice(0, 50) + (note.note.length > 50 ? "..." : ""))}`,
        summary: note.note.slice(0, 300),
        binderSection: note.isKey ? "Key Facts" : "General",
        importance: note.isKey ? 4 : 3,
        tags: ["evidence", "note"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast({ title: "Already in Trial Prep", variant: "destructive" });
      } else {
        toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      }
    },
  });

  const addAnalysisToTrialPrepMutation = useMutation({
    mutationFn: async (analysis: EvidenceAiAnalysis) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        sourceType: "evidence_ai_analysis",
        sourceId: analysis.id,
        title: `AI Analysis: ${analysis.analysisType || "summary"}`,
        summary: analysis.summary?.slice(0, 300) || null,
        binderSection: "Key Evidence",
        importance: 3,
        tags: ["evidence", "ai-analysis"],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast({ title: "Already in Trial Prep", variant: "destructive" });
      } else {
        toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      }
    },
  });

  const createSnippetMutation = useMutation({
    mutationFn: async (data: { exhibitListId: string; evidenceId: string; title: string; snippetText: string; pageNumber?: number | null }) => {
      return apiRequest("POST", `/api/cases/${caseId}/exhibit-snippets`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "exhibit-snippets"] });
      toast({ title: "Snippet created", description: "Exhibit snippet saved successfully." });
      closeSnippetModal();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create snippet", variant: "destructive" });
    },
  });

  const runAiAnalysisMutation = useMutation({
    mutationFn: async ({ evidenceId, refresh }: { evidenceId: string; refresh?: boolean }) => {
      return apiRequest("POST", `/api/cases/${caseId}/evidence/${evidenceId}/ai-analyses/run`, { refresh });
    },
    onSuccess: (_, { evidenceId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidenceId, "ai-analyses"] });
      toast({ title: "Analysis started", description: "AI is analyzing your document..." });
    },
    onError: (error: Error & { status?: number }) => {
      if (isProcessingPackError(error)) {
        showPackModal((error as ApiError).packSuggested);
      } else if (error.status === 409) {
        toast({ title: "Analysis exists", description: "Use the Brain icon to view existing analysis." });
      } else if (error.status === 400) {
        toast({ title: "Extraction required", description: "Run text extraction first before AI analysis.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to run analysis", variant: "destructive" });
      }
    },
  });

  const ocrJob = ocrJobData?.job;
  const ocrPages = ocrPagesData?.pages || [];
  const anchors = anchorsData?.anchors || [];
  const aiAnalyses = aiAnalysesData?.analyses || [];
  const snippetExhibitLists = snippetExhibitListsData?.exhibitLists || [];

  const exhibitLists = exhibitListsData?.exhibitLists || [];
  const exhibits = exhibitsData?.exhibits || [];
  const notes = notesData?.notes || [];

  const currentCase = caseData?.case;
  const rawFiles = evidenceData?.files || [];
  const r2Configured = evidenceData?.r2Configured ?? false;
  const notesFile = rawFiles.find(f => f.id === notesFileId);
  const textExtractFile = rawFiles.find(f => f.id === textExtractFileId);

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
    if (!caseLoading && !caseError && !currentCase && caseId) {
      setLocation("/app/cases");
    }
  }, [caseLoading, caseError, currentCase, caseId, setLocation]);

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || evidenceLoading || rawFiles.length === 0) return;
    const noteId = getDeepLinkParam("noteId");
    const fileId = getDeepLinkParam("fileId");
    if (noteId && fileId) {
      deepLinkHandledRef.current = true;
      setNotesFileId(fileId);
      setTimeout(() => {
        const success = scrollAndHighlight(`note-${noteId}`);
        if (success) {
          clearDeepLinkQueryParams();
        }
      }, 300);
    } else if (fileId && !noteId) {
      deepLinkHandledRef.current = true;
      setTimeout(() => {
        const success = scrollAndHighlight(`file-${fileId}`);
        if (success) {
          clearDeepLinkQueryParams();
        }
      }, 100);
    }
  }, [evidenceLoading, rawFiles]);

  useEffect(() => {
    if (!caseId || rawFiles.length === 0) return;

    const fetchExtractionStatuses = async () => {
      const statuses: Record<string, ExtractionData> = {};
      for (const file of rawFiles) {
        try {
          const res = await fetch(`/api/cases/${caseId}/evidence/${file.id}/extraction`, { credentials: "include" });
          if (res.ok) {
            statuses[file.id] = await res.json();
          }
        } catch {
        }
      }
      setExtractionStatuses(statuses);
    };

    fetchExtractionStatuses();

    const hasProcessing = Object.values(extractionStatuses).some(s => s.status === "processing" || s.status === "queued");
    if (hasProcessing) {
      const interval = setInterval(fetchExtractionStatuses, 8000);
      return () => clearInterval(interval);
    }
  }, [caseId, rawFiles.length]);

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
    mutationFn: async (data: { pageNumber?: number | null; label?: string | null; note: string; isKey?: boolean }) => {
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
    mutationFn: async ({ noteId, data }: { noteId: string; data: { pageNumber?: number | null; label?: string | null; note?: string; isKey?: boolean } }) => {
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

  const startProcessingMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/evidence/${evidenceId}/process`, {});
      return res.json() as Promise<{ ok: boolean; jobId: string; status: string }>;
    },
    onSuccess: (data, evidenceId) => {
      setProcessingJobs((prev) => ({ ...prev, [evidenceId]: { status: data.status, progress: 0 } }));
      refetchOcrJob();
      toast({ title: "Processing started", description: "Text extraction has begun." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to start text extraction", variant: "destructive" });
    },
  });

  const createAnchorMutation = useMutation({
    mutationFn: async (data: { evidenceId: string; excerpt: string; pageNumber?: number | null; note?: string | null; tags?: string[] }) => {
      return apiRequest("POST", `/api/cases/${caseId}/evidence/${data.evidenceId}/anchors`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "anchors"] });
      toast({ title: "Anchor saved", description: "Text excerpt confirmed for pattern analysis." });
      resetAnchorForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to save anchor", variant: "destructive" });
    },
  });

  const updateAnchorMutation = useMutation({
    mutationFn: async ({ anchorId, data }: { anchorId: string; data: { excerpt?: string; note?: string | null; tags?: string[] } }) => {
      return apiRequest("PATCH", `/api/anchors/${anchorId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "anchors"] });
      toast({ title: "Anchor updated", description: "Text excerpt updated successfully." });
      resetAnchorForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update anchor", variant: "destructive" });
    },
  });

  const deleteAnchorMutation = useMutation({
    mutationFn: async (anchorId: string) => {
      return apiRequest("DELETE", `/api/anchors/${anchorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", textExtractFileId, "anchors"] });
      toast({ title: "Anchor deleted", description: "Text excerpt removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete anchor", variant: "destructive" });
    },
  });

  const resetNoteForm = () => {
    setEditingNoteId(null);
    setNoteForm({ pageNumber: "", label: "", note: "", isKey: false });
  };

  const resetAnchorForm = () => {
    setEditingAnchorId(null);
    setAnchorForm({ text: "", notes: "", tags: "" });
  };

  const closeTextExtractSheet = () => {
    setTextExtractFileId(null);
    resetAnchorForm();
  };

  const handleStartProcessing = (evidenceId: string) => {
    setTextExtractFileId(evidenceId);
    startProcessingMutation.mutate(evidenceId);
  };

  const handleSaveAnchor = () => {
    if (!textExtractFileId || !anchorForm.text.trim()) return;
    const tagsArray = anchorForm.tags.trim() 
      ? anchorForm.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0) 
      : [];
    
    if (editingAnchorId) {
      updateAnchorMutation.mutate({
        anchorId: editingAnchorId,
        data: {
          excerpt: anchorForm.text.trim(),
          note: anchorForm.notes.trim() || null,
          tags: tagsArray,
        },
      });
    } else {
      createAnchorMutation.mutate({
        evidenceId: textExtractFileId,
        excerpt: anchorForm.text.trim(),
        note: anchorForm.notes.trim() || null,
        tags: tagsArray,
      });
    }
  };

  const startEditAnchor = (anchor: EvidenceAnchor) => {
    setEditingAnchorId(anchor.id);
    const tagsArr = Array.isArray(anchor.tags) ? anchor.tags as string[] : [];
    setAnchorForm({
      text: anchor.excerpt,
      notes: anchor.note || "",
      tags: tagsArr.join(", "),
    });
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

  const closeSnippetModal = () => {
    setSnippetModalFileId(null);
    setSnippetForm({ title: "", snippetText: "", pageNumber: "", exhibitListId: "" });
  };

  const openSnippetModal = (file: EvidenceFile) => {
    const extraction = extractionStatuses[file.id];
    setSnippetModalFileId(file.id);
    setSnippetForm({
      title: file.originalName,
      snippetText: extraction?.extractedTextPreview?.slice(0, 500) || "",
      pageNumber: "",
      exhibitListId: "",
    });
  };

  const handleSaveSnippet = () => {
    if (!snippetModalFileId || !snippetForm.exhibitListId || !snippetForm.title.trim() || !snippetForm.snippetText.trim()) return;
    const pageNum = snippetForm.pageNumber.trim() ? parseInt(snippetForm.pageNumber, 10) : null;
    createSnippetMutation.mutate({
      exhibitListId: snippetForm.exhibitListId,
      evidenceId: snippetModalFileId,
      title: snippetForm.title.trim(),
      snippetText: snippetForm.snippetText.trim(),
      pageNumber: pageNum,
    });
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

          <PhaseBanner caseId={caseId} currentModule="evidence" />

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
                data-tour-id="upload-button"
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
            <div className="w-full space-y-3" data-tour-id="evidence-list">
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.mimeType);
                const isExpanded = expandedId === file.id;
                const metadata = editingMetadata[file.id] || {
                  category: file.category || "",
                  description: file.description || "",
                  tags: file.tags || "",
                };

                return (
                  <Card key={file.id} id={`file-${file.id}`} className="w-full" data-testid={`card-evidence-${file.id}`}>
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
                            {extractionStatuses[file.id] && extractionStatuses[file.id].status !== "not_started" && (
                              <ExtractionStatusBadge status={extractionStatuses[file.id].status} errorMessage={extractionStatuses[file.id].errorMessage} />
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
                                variant="default"
                                onClick={() => setViewerFileId(file.id)}
                                data-testid={`button-open-annotate-${file.id}`}
                                title="Open & Annotate"
                              >
                                <Eye className="w-4 h-4" />
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
                                onClick={() => setTextExtractFileId(file.id)}
                                data-testid={`button-extract-text-${file.id}`}
                                title="Extract text for pattern analysis"
                              >
                                <FileSearch className="w-4 h-4" />
                              </Button>
                              {extractionStatuses[file.id]?.status === "complete" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setExtractionViewFileId(file.id)}
                                  data-testid={`button-view-extraction-${file.id}`}
                                  title="View extracted text"
                                  className="text-green-600"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              {extractionStatuses[file.id]?.status === "failed" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => retryExtractionMutation.mutate(file.id)}
                                  disabled={retryExtractionMutation.isPending}
                                  data-testid={`button-retry-extraction-${file.id}`}
                                  title={extractionStatuses[file.id]?.errorMessage 
                                    ? `Error: ${extractionStatuses[file.id].errorMessage} - Click to retry`
                                    : "Extraction failed - Click to retry"}
                                  className="text-red-600"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(file.id)}
                                data-testid={`button-delete-${file.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => addToTrialPrepMutation.mutate(file)}
                                disabled={addToTrialPrepMutation.isPending}
                                data-testid={`button-trial-prep-${file.id}`}
                                title="Add to Trial Prep"
                              >
                                <Scale className="w-4 h-4" />
                              </Button>
                              {extractionStatuses[file.id]?.status === "complete" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openSnippetModal(file)}
                                    data-testid={`button-create-snippet-${file.id}`}
                                    title="Create exhibit snippet"
                                  >
                                    <Scissors className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => runAiAnalysisMutation.mutate({ evidenceId: file.id })}
                                    disabled={runAiAnalysisMutation.isPending}
                                    data-testid={`button-run-ai-${file.id}`}
                                    title="Run AI Analysis"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => { setAiAnalysisFileId(file.id); }}
                                data-testid={`button-ai-analysis-${file.id}`}
                                title="View AI Analysis"
                              >
                                <Brain className="w-4 h-4" />
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
                  <Card key={n.id} id={`note-${n.id}`} className={`relative ${n.isKey ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : ""}`} data-testid={`card-note-${n.id}`}>
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
                            onClick={() => addNoteToTrialPrepMutation.mutate(n)}
                            disabled={addNoteToTrialPrepMutation.isPending}
                            title="Add to Trial Prep"
                            data-testid={`button-note-trial-prep-${n.id}`}
                          >
                            <Scale className="w-4 h-4" />
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

      <Sheet open={!!textExtractFileId} onOpenChange={(open) => !open && closeTextExtractSheet()}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5" />
              Text Extraction: {textExtractFile?.originalName || "File"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {!ocrJob ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileSearch className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-darkest">Extract Text from Document</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                    Extract text from this file to enable pattern analysis. This uses optical character recognition (OCR) to read text from images and PDFs.
                  </p>
                </div>
                <Button
                  onClick={() => textExtractFileId && handleStartProcessing(textExtractFileId)}
                  disabled={startProcessingMutation.isPending}
                  data-testid="button-start-extraction"
                >
                  {startProcessingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4 mr-2" />
                      Start Text Extraction
                    </>
                  )}
                </Button>
              </div>
            ) : ocrJob.status === "queued" || ocrJob.status === "processing" ? (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-darkest">
                    {ocrJob.status === "queued" ? "Queued for Processing" : "Extracting Text..."}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a minute depending on file size.
                  </p>
                </div>
                {ocrJob.progress > 0 && (
                  <div className="max-w-xs mx-auto">
                    <Progress value={ocrJob.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{ocrJob.progress}% complete</p>
                  </div>
                )}
              </div>
            ) : ocrJob.status === "error" ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-neutral-darkest">Extraction Failed</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                    {ocrJob.error?.includes("not configured") || ocrJob.error?.includes("API_KEY")
                      ? "OCR is not configured yet. Contact support."
                      : ocrJob.error || "An error occurred during text extraction. Please try again."}
                  </p>
                </div>
                {!ocrJob.error?.includes("not configured") && (
                  <Button
                    onClick={() => textExtractFileId && handleStartProcessing(textExtractFileId)}
                    disabled={startProcessingMutation.isPending}
                    data-testid="button-retry-extraction"
                  >
                    Retry Extraction
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-neutral-darkest">Extracted Text</h3>
                    <p className="text-sm text-muted-foreground">
                      {ocrPages.length} page{ocrPages.length !== 1 ? "s" : ""} processed
                    </p>
                  </div>
                  <Badge variant={ocrPages.some(p => p.needsReview) ? "outline" : "secondary"}>
                    {ocrPages.filter(p => p.needsReview).length > 0 
                      ? `${ocrPages.filter(p => p.needsReview).length} need review`
                      : "All reviewed"
                    }
                  </Badge>
                </div>

                {ocrPagesLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : ocrPages.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No text was extracted from this document.
                  </div>
                ) : (
                  <ScrollArea className="h-64 rounded-md border p-3">
                    <div className="space-y-4">
                      {ocrPages.map((page) => (
                        <div 
                          key={page.id} 
                          className={`p-3 rounded-md ${page.needsReview ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-muted/50"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {page.pageNumber != null && (
                                <Badge variant="outline" className="text-xs">Page {page.pageNumber}</Badge>
                              )}
                              {page.needsReview && (
                                <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Needs Review
                                </Badge>
                              )}
                            </div>
                            {page.confidencePrimary != null && (
                              <span className="text-xs text-muted-foreground">
                                {page.confidencePrimary}% confidence
                              </span>
                            )}
                          </div>
                          <p 
                            className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-primary/5 rounded p-1 -m-1"
                            onClick={() => setAnchorForm(prev => ({ ...prev, text: prev.text ? prev.text + "\n\n" + page.textPrimary : page.textPrimary }))}
                            title="Click to add this text to anchor"
                            data-testid={`text-ocr-page-${page.id}`}
                          >
                            {page.textPrimary.substring(0, 500)}
                            {page.textPrimary.length > 500 && "..."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-heading font-bold text-base text-neutral-darkest flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Confirmed Text Anchors ({anchors.length})
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Select or paste text excerpts you want to use for pattern analysis. These confirmed excerpts will be used by Lexi to identify patterns.
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div>
                      <Label htmlFor="anchor-text" className="text-xs text-muted-foreground">Text Excerpt</Label>
                      <Textarea
                        id="anchor-text"
                        placeholder="Click on extracted text above or paste text here..."
                        value={anchorForm.text}
                        onChange={(e) => setAnchorForm(prev => ({ ...prev, text: e.target.value }))}
                        rows={3}
                        className="mt-1"
                        data-testid="textarea-anchor-text"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="anchor-notes" className="text-xs text-muted-foreground">Notes (optional)</Label>
                        <Input
                          id="anchor-notes"
                          placeholder="Why is this significant?"
                          value={anchorForm.notes}
                          onChange={(e) => setAnchorForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="mt-1"
                          data-testid="input-anchor-notes"
                        />
                      </div>
                      <div>
                        <Label htmlFor="anchor-tags" className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
                        <Input
                          id="anchor-tags"
                          placeholder="e.g., contradiction, timeline"
                          value={anchorForm.tags}
                          onChange={(e) => setAnchorForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="mt-1"
                          data-testid="input-anchor-tags"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingAnchorId && (
                        <Button variant="outline" size="sm" onClick={resetAnchorForm} data-testid="button-cancel-anchor">
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSaveAnchor}
                        disabled={!anchorForm.text.trim() || createAnchorMutation.isPending || updateAnchorMutation.isPending}
                        data-testid="button-save-anchor"
                      >
                        {createAnchorMutation.isPending || updateAnchorMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingAnchorId ? (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            Update Anchor
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Save Anchor
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {anchorsLoading ? (
                    <div className="py-4 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : anchors.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No anchors confirmed yet. Add text excerpts above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {anchors.map((anchor) => (
                        <Card key={anchor.id} data-testid={`card-anchor-${anchor.id}`}>
                          <CardContent className="py-3">
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm whitespace-pre-wrap line-clamp-3" data-testid={`text-anchor-excerpt-${anchor.id}`}>
                                  {anchor.excerpt}
                                </p>
                                {anchor.note && (
                                  <p className="text-xs text-muted-foreground mt-1">{anchor.note}</p>
                                )}
                                {Array.isArray(anchor.tags) && (anchor.tags as string[]).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {(anchor.tags as string[]).map((tag: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => startEditAnchor(anchor)}
                                  data-testid={`button-edit-anchor-${anchor.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteAnchorMutation.mutate(anchor.id)}
                                  disabled={deleteAnchorMutation.isPending}
                                  data-testid={`button-delete-anchor-${anchor.id}`}
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
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={closeTextExtractSheet} data-testid="button-close-extraction-drawer">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!extractionViewFileId} onOpenChange={(open) => !open && setExtractionViewFileId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Extracted Text</DialogTitle>
          </DialogHeader>
          {extractionViewFileId && extractionStatuses[extractionViewFileId] ? (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline-block mr-2" />
                Text extraction may contain errors. Verify against the original document.
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ExtractionStatusBadge status={extractionStatuses[extractionViewFileId].status} errorMessage={extractionStatuses[extractionViewFileId].errorMessage} />
                  {extractionStatuses[extractionViewFileId].meta && (() => {
                    const meta = extractionStatuses[extractionViewFileId].meta as Record<string, unknown>;
                    const parts: string[] = [];
                    if (meta.pagesProcessed) parts.push(`${meta.pagesProcessed} pages processed`);
                    if (meta.usedOcr) parts.push("OCR");
                    if (meta.usedNativeText) parts.push("Native PDF");
                    return parts.length > 0 ? <span>{parts.join(" | ")}</span> : null;
                  })()}
                </div>
                {extractionViewFileId && (
                  <a
                    href={`/api/evidence/${extractionViewFileId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    data-testid="link-open-original-evidence"
                  >
                    <Download className="w-4 h-4" />
                    Open Original
                  </a>
                )}
              </div>
              <ScrollArea className="flex-1 max-h-[60vh]">
                <pre className="text-sm whitespace-pre-wrap font-mono p-4 bg-muted rounded-lg" data-testid="text-extracted-content">
                  {extractionStatuses[extractionViewFileId].extractedTextFull || extractionStatuses[extractionViewFileId].extractedTextPreview || "No text extracted"}
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtractionViewFileId(null)} data-testid="button-close-extraction-modal">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!aiAnalysisFileId} onOpenChange={(open) => !open && setAiAnalysisFileId(null)}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Analysis
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {aiAnalysisFileId && (
              <>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    AI analysis helps identify key information in your evidence. Extraction must be completed first.
                  </p>
                  {extractionStatuses[aiAnalysisFileId]?.status !== "complete" && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Text extraction not complete. Run extraction first.
                    </div>
                  )}
                </div>

                {aiAnalysesLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : aiAnalyses.length === 0 ? (
                  <div className="py-8 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-4">No AI analyses yet for this file.</p>
                    {extractionStatuses[aiAnalysisFileId]?.status === "complete" ? (
                      <Button
                        onClick={() => runAiAnalysisMutation.mutate({ evidenceId: aiAnalysisFileId })}
                        disabled={runAiAnalysisMutation.isPending}
                        data-testid="button-run-analysis-empty"
                      >
                        {runAiAnalysisMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Run AI Analysis
                      </Button>
                    ) : (
                      <p className="text-xs text-amber-600">Run text extraction first to enable AI analysis.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiAnalyses.map((analysis) => (
                      <Card key={analysis.id} data-testid={`card-ai-analysis-${analysis.id}`}>
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <Brain className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {analysis.analysisType?.replace(/_/g, " ") || "summary"}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    analysis.status === "complete" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                    analysis.status === "processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                    analysis.status === "failed" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : ""
                                  }`}
                                >
                                  {analysis.status === "processing" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                                  {analysis.status}
                                </Badge>
                                {analysis.status === "failed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => runAiAnalysisMutation.mutate({ evidenceId: aiAnalysisFileId!, refresh: true })}
                                    disabled={runAiAnalysisMutation.isPending}
                                    data-testid={`button-retry-analysis-${analysis.id}`}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </div>
                              {analysis.error && analysis.status === "failed" && (
                                <p className="text-xs text-red-600 dark:text-red-400 mb-2">{analysis.error}</p>
                              )}
                              {analysis.summary && (
                                <p className="text-sm font-medium text-foreground mb-2" data-testid={`text-analysis-summary-${analysis.id}`}>
                                  {analysis.summary}
                                </p>
                              )}
                              {analysis.findings && typeof analysis.findings === "object" && (
                                <div className="text-xs text-muted-foreground space-y-2 mt-2">
                                  {Object.entries(analysis.findings as Record<string, unknown>)
                                    .filter(([key]) => key !== "summary" && key !== "error")
                                    .map(([key, value]) => (
                                    <div key={key} className="border-l-2 border-primary/20 pl-2">
                                      <span className="font-medium capitalize text-foreground/80">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}:</span>
                                      {Array.isArray(value) ? (
                                        <ul className="list-disc list-inside ml-2 mt-1">
                                          {(value as string[]).slice(0, 5).map((item, i) => (
                                            <li key={i} className="text-muted-foreground">{String(item)}</li>
                                          ))}
                                          {(value as string[]).length > 5 && (
                                            <li className="text-muted-foreground/60">+{(value as string[]).length - 5} more...</li>
                                          )}
                                        </ul>
                                      ) : (
                                        <span className="ml-1">{typeof value === "string" ? value : JSON.stringify(value)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(analysis.createdAt)}
                                  {analysis.model && ` via ${analysis.model}`}
                                </p>
                                {analysis.status === "complete" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addAnalysisToTrialPrepMutation.mutate(analysis)}
                                    disabled={addAnalysisToTrialPrepMutation.isPending}
                                    data-testid={`button-analysis-trial-prep-${analysis.id}`}
                                  >
                                    <Scale className="w-3 h-3 mr-1" />
                                    Add to Trial Prep
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setAiAnalysisFileId(null)} data-testid="button-close-ai-analysis">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!snippetModalFileId} onOpenChange={(open) => !open && closeSnippetModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Create Exhibit Snippet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="snippet-exhibit-list">Exhibit List</Label>
              <Select 
                value={snippetForm.exhibitListId} 
                onValueChange={(v) => setSnippetForm(prev => ({ ...prev, exhibitListId: v }))}
              >
                <SelectTrigger id="snippet-exhibit-list" data-testid="select-snippet-exhibit-list">
                  <SelectValue placeholder="Select an exhibit list" />
                </SelectTrigger>
                <SelectContent>
                  {snippetExhibitLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>{list.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {snippetExhibitLists.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No exhibit lists found. Create one in the Exhibits section first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="snippet-title">Title</Label>
              <Input
                id="snippet-title"
                value={snippetForm.title}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter snippet title"
                maxLength={200}
                data-testid="input-snippet-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="snippet-page">Page Number (optional)</Label>
              <Input
                id="snippet-page"
                value={snippetForm.pageNumber}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, pageNumber: e.target.value.replace(/\D/g, "") }))}
                placeholder="e.g., 5"
                maxLength={10}
                data-testid="input-snippet-page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="snippet-text">Snippet Text</Label>
              <Textarea
                id="snippet-text"
                value={snippetForm.snippetText}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, snippetText: e.target.value }))}
                placeholder="Enter or paste the text excerpt..."
                rows={6}
                maxLength={10000}
                data-testid="textarea-snippet-text"
              />
              <p className="text-xs text-muted-foreground">
                Copy key text from the extracted content to create a snippet for your exhibits.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSnippetModal}>Cancel</Button>
            <Button
              onClick={handleSaveSnippet}
              disabled={!snippetForm.exhibitListId || !snippetForm.title.trim() || !snippetForm.snippetText.trim() || createSnippetMutation.isPending}
              data-testid="button-save-snippet"
            >
              {createSnippetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Create Snippet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewerFileId && (() => {
        const viewerFile = rawFiles.find(f => f.id === viewerFileId);
        if (!viewerFile) return null;
        const extraction = extractionStatuses[viewerFileId];
        return (
          <EvidenceViewer
            caseId={caseId!}
            evidence={viewerFile}
            onClose={() => setViewerFileId(null)}
            extractedText={extraction?.extractedTextFull || null}
            extractionStatus={extraction?.status}
          />
        );
      })()}
    </AppLayout>
  );
}
