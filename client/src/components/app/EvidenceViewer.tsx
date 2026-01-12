import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCw, FileText, StickyNote, Plus, Pencil, Trash2, Check, Loader2, BookOpen, Scale, ChevronDown, ChevronUp, CheckCircle, Circle, Tag, Clock, AlignLeft, AlertTriangle, Sparkles, XCircle, MessageSquareQuote, Link as LinkIcon, Shield, ShieldCheck, ShieldAlert, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, isProcessingPackError } from "@/lib/queryClient";
import { useProcessingPackModal } from "@/components/app/ProcessingPackModal";
import type { EvidenceFile, EvidenceNoteFull, ExhibitList, CaseClaim, CitationPointer } from "@shared/schema";
import LinkToTimelineButton from "./LinkToTimelineButton";

interface EvidenceViewerProps {
  caseId: string;
  evidence: EvidenceFile;
  onClose: () => void;
  extractedText?: string | null;
  extractionStatus?: string;
}

const BINDER_SECTIONS = [
  "Overview", "Key Facts", "Key Evidence", "Timeline Highlights", "Communications",
  "Discovery & Disclosures", "Witnesses", "Financial", "Parenting", "Safety", "Other", "General"
];

const NOTE_COLORS = [
  { value: "yellow", label: "Yellow", class: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "green", label: "Green", class: "bg-green-100 dark:bg-green-900/30" },
  { value: "blue", label: "Blue", class: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "red", label: "Red", class: "bg-red-100 dark:bg-red-900/30" },
  { value: "purple", label: "Purple", class: "bg-purple-100 dark:bg-purple-900/30" },
];

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getAnchorSummary(note: EvidenceNoteFull): string {
  if (note.anchorType === "page" && note.pageNumber) {
    return `Page ${note.pageNumber}`;
  }
  if (note.anchorType === "timestamp" && note.timestamp != null) {
    return formatTimestamp(note.timestamp);
  }
  if (note.anchorType === "text" && note.selectionText) {
    const preview = note.selectionText.length > 40 ? note.selectionText.substring(0, 40) + "..." : note.selectionText;
    return `"${preview}"`;
  }
  return "General";
}

function getNoteColorClass(color: string | null): string {
  const found = NOTE_COLORS.find(c => c.value === color);
  return found?.class || "bg-muted/50";
}

function getClaimConfidence(claim: { citations?: { id: string }[]; missingInfoFlag?: boolean }): {
  level: "high" | "medium" | "low";
  label: string;
  colorClass: string;
  icon: typeof ShieldCheck;
} {
  const citationCount = claim.citations?.length || 0;
  if (claim.missingInfoFlag) {
    return { level: "low", label: "Needs Info", colorClass: "text-amber-600 dark:text-amber-400", icon: ShieldAlert };
  }
  if (citationCount >= 2) {
    return { level: "high", label: "Strong", colorClass: "text-green-600 dark:text-green-400", icon: ShieldCheck };
  }
  if (citationCount === 1) {
    return { level: "medium", label: "Supported", colorClass: "text-blue-600 dark:text-blue-400", icon: Shield };
  }
  return { level: "low", label: "Unsupported", colorClass: "text-red-600 dark:text-red-400", icon: ShieldAlert };
}

function getCreatedFromLabel(createdFrom: string): string {
  switch (createdFrom) {
    case "ai_suggestion": return "AI Suggested";
    case "ai_extracted": return "AI Extracted";
    case "manual": return "Manually Added";
    case "imported": return "Imported";
    default: return createdFrom;
  }
}

export default function EvidenceViewer({ caseId, evidence, onClose, extractedText, extractionStatus }: EvidenceViewerProps) {
  const { toast } = useToast();
  const { showPackModal } = useProcessingPackModal();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [snippetNoteId, setSnippetNoteId] = useState<string | null>(null);
  const [showTrialPrepModal, setShowTrialPrepModal] = useState(false);
  const [trialPrepNoteId, setTrialPrepNoteId] = useState<string | null>(null);
  const [claimsOpen, setClaimsOpen] = useState(true);
  const [acceptedClaimsOpen, setAcceptedClaimsOpen] = useState(false);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [claimEditForm, setClaimEditForm] = useState({ claimText: "", tags: "", missingInfoFlag: false });
  const [suggestingClaims, setSuggestingClaims] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [extractingFacts, setExtractingFacts] = useState(false);
  const [claimsReassuranceShown, setClaimsReassuranceShown] = useState(() => {
    const key = `claims-reassurance-shown-${caseId}`;
    return sessionStorage.getItem(key) === "true";
  });

  const { data: backgroundStatus } = useQuery<{
    claimsSuggestionPending: boolean;
    globalStats: { active: number; pending: number; processed: number };
    latestActivity: {
      eventType: string;
      description: string;
      metadata: any;
      createdAt: string;
    } | null;
  }>({
    queryKey: ["/api/cases", caseId, "background-ai-status"],
    refetchInterval: 15000,
  });

  const [noteForm, setNoteForm] = useState({
    noteTitle: "",
    noteText: "",
    anchorType: "page" as "page" | "timestamp" | "text" | "range",
    pageNumber: "",
    timestamp: "",
    selectionText: "",
    tags: "",
    color: "yellow",
  });

  const [snippetForm, setSnippetForm] = useState({
    title: "",
    snippetText: "",
    pageNumber: "",
    exhibitListId: "",
  });

  const [trialPrepForm, setTrialPrepForm] = useState({
    title: "",
    summary: "",
    binderSection: "General",
    importance: 3,
  });

  const isPdf = evidence.mimeType === "application/pdf";
  const isImage = evidence.mimeType?.startsWith("image/");
  const isAudioVideo = evidence.mimeType?.startsWith("audio/") || evidence.mimeType?.startsWith("video/");
  const fileUrl = `/api/cases/${caseId}/evidence/${evidence.id}/download`;

  const { data: notesData, isLoading: notesLoading } = useQuery<{ notes: EvidenceNoteFull[] }>({
    queryKey: ["/api/cases", caseId, "evidence", evidence.id, "notes-full"],
  });

  const { data: exhibitListsData } = useQuery<{ exhibitLists: ExhibitList[] }>({
    queryKey: ["/api/cases", caseId, "exhibit-lists"],
    enabled: showSnippetModal,
  });

  const notes = notesData?.notes || [];
  const exhibitLists = exhibitListsData?.exhibitLists || [];
  const resolvedCount = notes.filter(n => n.isResolved).length;

  interface ClaimWithCitations extends CaseClaim {
    citations?: CitationPointer[];
  }

  const { data: claimsData, isLoading: claimsLoading } = useQuery<{ claims: ClaimWithCitations[] }>({
    queryKey: ["/api/cases", caseId, "claims", { evidenceFileId: evidence.id }],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/claims?evidenceFileId=${evidence.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  const allClaims = claimsData?.claims || [];
  const suggestedClaims = allClaims.filter(c => c.status === "suggested");
  const acceptedClaims = allClaims.filter(c => c.status === "accepted");

  interface EvidenceFact {
    id: string;
    caseId: string;
    evidenceId: string;
    factText: string;
    factType: string;
    confidence: number;
    citationId: string | null;
    promotedToClaim: boolean;
    promotedClaimId: string | null;
    createdAt: string;
    updatedAt: string;
  }

  const { data: factsData, isLoading: factsLoading } = useQuery<{ facts: EvidenceFact[] }>({
    queryKey: ["/api/cases", caseId, "evidence", evidence.id, "facts"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/evidence/${evidence.id}/facts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch facts");
      return res.json();
    },
  });

  const evidenceFacts = factsData?.facts || [];
  const pendingFacts = evidenceFacts.filter(f => !f.promotedToClaim);
  const promotedFacts = evidenceFacts.filter(f => f.promotedToClaim);

  const runFactExtractionMutation = useMutation({
    mutationFn: async () => {
      setExtractingFacts(true);
      const res = await apiRequest("POST", `/api/cases/${caseId}/evidence/${evidence.id}/facts/run`, {});
      return res;
    },
    onSuccess: (data: any) => {
      setExtractingFacts(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "facts"] });
      toast({ title: "Facts extracted", description: `Found ${data.factsCreated || 0} facts` });
    },
    onError: (error: any) => {
      setExtractingFacts(false);
      toast({ title: "Failed to extract facts", description: error.message, variant: "destructive" });
    },
  });

  const promoteFactMutation = useMutation({
    mutationFn: async (factId: string) => {
      return apiRequest("POST", `/api/facts/${factId}/promote-to-claim`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "facts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
      toast({ title: "Fact promoted to claim" });
    },
    onError: () => {
      toast({ title: "Failed to promote fact", variant: "destructive" });
    },
  });

  const deleteFactMutation = useMutation({
    mutationFn: async (factId: string) => {
      return apiRequest("DELETE", `/api/facts/${factId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "facts"] });
      toast({ title: "Fact deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete fact", variant: "destructive" });
    },
  });

  function getFactTypeBadgeColor(factType: string): string {
    const colors: Record<string, string> = {
      date: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      event: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      communication: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      financial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      medical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      custody: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      procedural: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      other: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    };
    return colors[factType] || colors.other;
  }

  const createNoteMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", `/api/cases/${caseId}/evidence/${evidence.id}/notes-full`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "notes-full"] });
      resetNoteForm();
      setShowAddNote(false);
      toast({ title: "Note added" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, data }: { noteId: string; data: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/notes-full/${noteId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "notes-full"] });
      resetNoteForm();
      setEditingNoteId(null);
      setShowAddNote(false);
      toast({ title: "Note updated" });
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return apiRequest("DELETE", `/api/notes-full/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "notes-full"] });
      toast({ title: "Note deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const toggleResolvedMutation = useMutation({
    mutationFn: async ({ noteId, isResolved }: { noteId: string; isResolved: boolean }) => {
      return apiRequest("PATCH", `/api/notes-full/${noteId}`, { isResolved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "evidence", evidence.id, "notes-full"] });
    },
  });

  const createSnippetMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", `/api/cases/${caseId}/exhibit-snippets`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "exhibit-snippets"] });
      setShowSnippetModal(false);
      setSnippetNoteId(null);
      setSnippetForm({ title: "", snippetText: "", pageNumber: "", exhibitListId: "" });
      toast({ title: "Exhibit snippet created" });
    },
    onError: () => {
      toast({ title: "Failed to create snippet", variant: "destructive" });
    },
  });

  const createTrialPrepMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      setShowTrialPrepModal(false);
      setTrialPrepNoteId(null);
      setTrialPrepForm({ title: "", summary: "", binderSection: "General", importance: 3 });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast({ title: "Already in Trial Prep", description: "This item is already in your shortlist" });
      } else {
        toast({ title: "Failed to add to Trial Prep", variant: "destructive" });
      }
    },
  });

  const suggestClaimsMutation = useMutation({
    mutationFn: async (refresh: boolean) => {
      setSuggestingClaims(true);
      const res = await fetch(`/api/cases/${caseId}/evidence/${evidence.id}/claims/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refresh, limit: 10 }),
      });
      if (!res.ok) {
        const err = await res.json();
        const error = new Error(err.error || "Failed to suggest claims") as Error & { code?: string; packSuggested?: string };
        error.code = err.code;
        error.packSuggested = err.packSuggested;
        throw error;
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuggestingClaims(false);
      if (data.message?.includes("Generating")) {
        toast({ title: "Generating claims...", description: "This may take a moment" });
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
        }, 3000);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
        toast({ title: "Claims suggested" });
      }
    },
    onError: (err: Error & { code?: string; packSuggested?: string }) => {
      setSuggestingClaims(false);
      if (err.code === "NEEDS_PROCESSING_PACK") {
        showPackModal(err.packSuggested as "overlimit_200" | "plus_600" | undefined);
      } else {
        toast({ title: "Failed to suggest claims", description: err.message, variant: "destructive" });
      }
    },
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ claimId, data }: { claimId: string; data: Record<string, unknown> }) => {
      return apiRequest("PATCH", `/api/claims/${claimId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
      setEditingClaimId(null);
      toast({ title: "Claim updated" });
    },
    onError: () => {
      toast({ title: "Failed to update claim", variant: "destructive" });
    },
  });

  const addClaimToTrialPrepMutation = useMutation({
    mutationFn: async (claim: CaseClaim) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        sourceType: "claim",
        sourceId: claim.id,
        title: claim.claimText.substring(0, 80),
        summary: claim.claimText,
        binderSection: "Key Facts",
        importance: 3,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "trial-prep-shortlist"] });
      toast({ title: "Added to Trial Prep" });
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast({ title: "Already in Trial Prep" });
      } else {
        toast({ title: "Failed to add to Trial Prep", variant: "destructive" });
      }
    },
  });

  const [autoAttachingClaimId, setAutoAttachingClaimId] = useState<string | null>(null);
  const autoAttachMutation = useMutation({
    mutationFn: async (claimId: string) => {
      setAutoAttachingClaimId(claimId);
      const res = await apiRequest("POST", `/api/claims/${claimId}/citations/auto`, { maxAttach: 1 });
      return res.json();
    },
    onSuccess: (data) => {
      setAutoAttachingClaimId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
      if (data.ok && data.attached > 0) {
        toast({ title: "Source attached" });
      } else if (data.error === "no_citations_available") {
        toast({ title: "No sources available", description: "No matching citations found in this case", variant: "destructive" });
      } else {
        toast({ title: "Claim already has sources" });
      }
    },
    onError: () => {
      setAutoAttachingClaimId(null);
      toast({ title: "Failed to attach source", variant: "destructive" });
    },
  });

  const detachCitationMutation = useMutation({
    mutationFn: async ({ claimId, citationId }: { claimId: string; citationId: string }) => {
      return apiRequest("DELETE", `/api/claims/${claimId}/citations/${citationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "claims"] });
      toast({ title: "Source removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove source", variant: "destructive" });
    },
  });

  const [expandedClaimSources, setExpandedClaimSources] = useState<Set<string>>(new Set());
  const [expandedWhyIncluded, setExpandedWhyIncluded] = useState<Set<string>>(new Set());
  function toggleClaimSources(claimId: string) {
    setExpandedClaimSources(prev => {
      const next = new Set(prev);
      if (next.has(claimId)) next.delete(claimId);
      else next.add(claimId);
      return next;
    });
  }
  function toggleWhyIncluded(claimId: string) {
    setExpandedWhyIncluded(prev => {
      const next = new Set(prev);
      if (next.has(claimId)) next.delete(claimId);
      else next.add(claimId);
      return next;
    });
  }

  function handleAcceptClaim(claimId: string) {
    const claim = suggestedClaims.find(c => c.id === claimId);
    const hasCitations = claim?.citations && claim.citations.length > 0;
    updateClaimMutation.mutate({ claimId, data: { status: "accepted" } }, {
      onSuccess: () => {
        if (!hasCitations) {
          toast({ 
            title: "Accepted", 
            description: "This claim needs a source to compile. Tap 'Auto-attach source'.",
          });
        }
      }
    });
  }

  function handleRejectClaim(claimId: string) {
    updateClaimMutation.mutate({ claimId, data: { status: "rejected" } });
  }

  function startEditClaim(claim: CaseClaim) {
    setEditingClaimId(claim.id);
    setClaimEditForm({
      claimText: claim.claimText,
      tags: Array.isArray(claim.tags) ? (claim.tags as string[]).join(", ") : "",
      missingInfoFlag: claim.missingInfoFlag || false,
    });
  }

  function handleSaveClaimEdit() {
    if (!editingClaimId) return;
    updateClaimMutation.mutate({
      claimId: editingClaimId,
      data: {
        claimText: claimEditForm.claimText,
        tags: claimEditForm.tags ? claimEditForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        missingInfoFlag: claimEditForm.missingInfoFlag,
      },
    });
  }

  function resetNoteForm() {
    setNoteForm({
      noteTitle: "",
      noteText: "",
      anchorType: "page",
      pageNumber: isPdf ? String(currentPage) : "",
      timestamp: "",
      selectionText: "",
      tags: "",
      color: "yellow",
    });
    setSelectedText("");
  }

  function startEditNote(note: EvidenceNoteFull) {
    setEditingNoteId(note.id);
    setNoteForm({
      noteTitle: note.noteTitle || "",
      noteText: note.noteText,
      anchorType: note.anchorType as "page" | "timestamp" | "text" | "range",
      pageNumber: note.pageNumber?.toString() || "",
      timestamp: note.timestamp?.toString() || "",
      selectionText: note.selectionText || "",
      tags: Array.isArray(note.tags) ? (note.tags as string[]).join(", ") : "",
      color: note.color || "yellow",
    });
    setShowAddNote(true);
  }

  function handleSaveNote() {
    const data: Record<string, unknown> = {
      noteTitle: noteForm.noteTitle || null,
      noteText: noteForm.noteText,
      anchorType: noteForm.anchorType,
      pageNumber: noteForm.anchorType === "page" && noteForm.pageNumber ? parseInt(noteForm.pageNumber) : null,
      timestamp: noteForm.anchorType === "timestamp" && noteForm.timestamp ? parseInt(noteForm.timestamp) : null,
      selectionText: noteForm.anchorType === "text" ? noteForm.selectionText || null : null,
      tags: noteForm.tags ? noteForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      color: noteForm.color,
    };

    if (editingNoteId) {
      updateNoteMutation.mutate({ noteId: editingNoteId, data });
    } else {
      createNoteMutation.mutate(data);
    }
  }

  function openSnippetModal(note: EvidenceNoteFull) {
    setSnippetNoteId(note.id);
    setSnippetForm({
      title: note.noteTitle || "Snippet",
      snippetText: note.selectionText || note.noteText,
      pageNumber: note.pageNumber?.toString() || "",
      exhibitListId: "",
    });
    setShowSnippetModal(true);
  }

  function handleCreateSnippet() {
    if (!snippetForm.exhibitListId || !snippetForm.snippetText.trim()) return;
    createSnippetMutation.mutate({
      evidenceId: evidence.id,
      noteId: snippetNoteId,
      exhibitListId: snippetForm.exhibitListId,
      title: snippetForm.title || "Snippet",
      snippetText: snippetForm.snippetText,
      pageNumber: snippetForm.pageNumber ? parseInt(snippetForm.pageNumber) : null,
    });
  }

  function openTrialPrepModal(note: EvidenceNoteFull) {
    setTrialPrepNoteId(note.id);
    setTrialPrepForm({
      title: note.noteTitle || note.noteText.substring(0, 80),
      summary: note.noteText,
      binderSection: "Key Evidence",
      importance: 3,
    });
    setShowTrialPrepModal(true);
  }

  function handleAddToTrialPrep() {
    if (!trialPrepForm.title.trim()) return;
    createTrialPrepMutation.mutate({
      sourceType: "evidence_note",
      sourceId: trialPrepNoteId,
      title: trialPrepForm.title,
      summary: trialPrepForm.summary,
      binderSection: trialPrepForm.binderSection,
      importance: trialPrepForm.importance,
    });
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim().substring(0, 1000);
      setSelectedText(text);
      setNoteForm(prev => ({
        ...prev,
        anchorType: "text",
        selectionText: text,
      }));
    }
  }

  useEffect(() => {
    if (isPdf) {
      setNoteForm(prev => ({ ...prev, pageNumber: String(currentPage) }));
    }
  }, [currentPage, isPdf]);

  const notesPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Notes</span>
          <Badge variant="outline" className="text-xs">{notes.length}</Badge>
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {resolvedCount}/{notes.length} done
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => { resetNoteForm(); setShowAddNote(true); }}
          data-testid="button-add-note"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {extractionStatus === "processing" && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-amber-800 dark:text-amber-200">Text extraction processing. Page anchors still work.</span>
        </div>
      )}

      {backgroundStatus?.claimsSuggestionPending && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 text-sm flex items-center gap-2" data-testid="status-claims-pending">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-blue-800 dark:text-blue-200">AI analyzing evidence for claims...</span>
        </div>
      )}

      <ScrollArea className="flex-1 p-3">
        {notesLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notes yet. Add a note to annotate this evidence.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className={`transition-opacity ${note.isResolved ? "opacity-60" : ""} ${getNoteColorClass(note.color)}`}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleResolvedMutation.mutate({ noteId: note.id, isResolved: !note.isResolved })}
                        className="flex-shrink-0"
                        data-testid={`button-toggle-resolved-${note.id}`}
                      >
                        {note.isResolved ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm ${note.isResolved ? "line-through text-muted-foreground" : ""}`}>
                          {note.noteTitle || "Note"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {note.anchorType === "page" && <FileText className="w-3 h-3" />}
                          {note.anchorType === "timestamp" && <Clock className="w-3 h-3" />}
                          {note.anchorType === "text" && <AlignLeft className="w-3 h-3" />}
                          {getAnchorSummary(note)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditNote(note)}
                        className="h-7 w-7"
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        className="h-7 w-7"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <p className={`text-sm ${note.isResolved ? "text-muted-foreground" : ""}`}>
                    {note.noteText.length > 150 ? note.noteText.substring(0, 150) + "..." : note.noteText}
                  </p>

                  {note.selectionText && (
                    <div className="bg-background/50 p-2 rounded text-xs italic border-l-2 border-primary/30">
                      "{note.selectionText.length > 100 ? note.selectionText.substring(0, 100) + "..." : note.selectionText}"
                    </div>
                  )}

                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(note.tags as string[]).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => openSnippetModal(note)}
                      data-testid={`button-snippet-${note.id}`}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Exhibit Snippet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => openTrialPrepModal(note)}
                      data-testid={`button-trial-prep-${note.id}`}
                    >
                      <Scale className="w-3 h-3 mr-1" />
                      Trial Prep
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const claimsPanel = (
    <div className="flex flex-col border-t">
      <Collapsible open={claimsOpen} onOpenChange={setClaimsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between gap-2 p-3 w-full hover-elevate" data-testid="button-toggle-claims">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">Claims (Evidence-Backed Facts)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{suggestedClaims.length} pending</Badge>
              {claimsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 border-t space-y-3">
            {!claimsReassuranceShown && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5" data-testid="text-claims-reassurance">
                Suggestions are based on your evidence. Nothing is used unless you approve it.
                <button
                  className="ml-1 text-primary underline"
                  onClick={() => {
                    sessionStorage.setItem(`claims-reassurance-shown-${caseId}`, "true");
                    setClaimsReassuranceShown(true);
                  }}
                >
                  Got it
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => suggestClaimsMutation.mutate(false)}
                disabled={suggestingClaims || extractionStatus !== "complete"}
                data-testid="button-suggest-claims"
              >
                {suggestingClaims ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                Suggest Claims (AI)
              </Button>
              {suggestedClaims.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => suggestClaimsMutation.mutate(true)}
                  disabled={suggestingClaims}
                  data-testid="button-refresh-claims"
                >
                  Refresh
                </Button>
              )}
            </div>

            {extractionStatus !== "complete" && (
              <p className="text-xs text-muted-foreground">Extract text first to enable AI claim suggestions.</p>
            )}

            {claimsLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : suggestedClaims.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No suggested claims yet. Click "Suggest Claims" to generate.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestedClaims.map((claim) => (
                  <Card key={claim.id} className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-3 space-y-2">
                      {editingClaimId === claim.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={claimEditForm.claimText}
                            onChange={(e) => setClaimEditForm(prev => ({ ...prev, claimText: e.target.value }))}
                            rows={3}
                            className="text-sm"
                            data-testid={`textarea-edit-claim-${claim.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Tags (comma-separated)"
                              value={claimEditForm.tags}
                              onChange={(e) => setClaimEditForm(prev => ({ ...prev, tags: e.target.value }))}
                              className="text-xs"
                              data-testid={`input-claim-tags-${claim.id}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`missing-${claim.id}`}
                              checked={claimEditForm.missingInfoFlag}
                              onCheckedChange={(c) => setClaimEditForm(prev => ({ ...prev, missingInfoFlag: !!c }))}
                            />
                            <Label htmlFor={`missing-${claim.id}`} className="text-xs">Missing info</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveClaimEdit} disabled={updateClaimMutation.isPending} data-testid={`button-save-claim-${claim.id}`}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingClaimId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm flex-1">{claim.claimText}</p>
                            {(() => {
                              const confidence = getClaimConfidence(claim);
                              const ConfIcon = confidence.icon;
                              return (
                                <div className={`flex items-center gap-1 text-xs ${confidence.colorClass}`} data-testid={`badge-confidence-${claim.id}`}>
                                  <ConfIcon className="w-3.5 h-3.5" />
                                  <span className="font-medium">{confidence.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex flex-wrap gap-1 items-center">
                            <Badge variant="secondary" className="text-xs">{claim.claimType}</Badge>
                            {claim.missingInfoFlag && <Badge variant="destructive" className="text-xs">Missing Info</Badge>}
                            {claim.isLocked && (
                              <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                                <Lock className="w-3 h-3 mr-1" />Locked
                              </Badge>
                            )}
                            {Array.isArray(claim.tags) && (claim.tags as string[]).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            <Badge 
                              variant={claim.citations && claim.citations.length > 0 ? "secondary" : "destructive"} 
                              className="text-xs"
                              data-testid={`badge-sources-${claim.id}`}
                            >
                              Sources: {claim.citations?.length || 0}
                            </Badge>
                          </div>
                          <button 
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={() => toggleWhyIncluded(claim.id)}
                            data-testid={`button-why-included-${claim.id}`}
                          >
                            <Info className="w-3 h-3" />
                            {expandedWhyIncluded.has(claim.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            Why included
                          </button>
                          {expandedWhyIncluded.has(claim.id) && (
                            <div className="pl-3 border-l-2 border-muted space-y-1 text-xs text-muted-foreground" data-testid={`why-included-content-${claim.id}`}>
                              <p><strong>Origin:</strong> {getCreatedFromLabel(claim.createdFrom)}</p>
                              <p><strong>Type:</strong> {claim.claimType}</p>
                              <p><strong>Sources:</strong> {claim.citations?.length || 0} citation{(claim.citations?.length || 0) !== 1 ? "s" : ""} attached</p>
                              {claim.sourceNoteId && <p><strong>From Note:</strong> Linked to evidence note</p>}
                              {claim.isLocked && <p><strong>Status:</strong> Locked - used in compiled document</p>}
                            </div>
                          )}
                          {(!claim.citations || claim.citations.length === 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => autoAttachMutation.mutate(claim.id)}
                              disabled={autoAttachingClaimId === claim.id}
                              data-testid={`button-auto-attach-${claim.id}`}
                            >
                              {autoAttachingClaimId === claim.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <LinkIcon className="w-3 h-3 mr-1" />
                              )}
                              Auto-attach source
                            </Button>
                          )}
                          {claim.citations && claim.citations.length > 0 && (
                            <div className="space-y-1">
                              <button 
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                onClick={() => toggleClaimSources(claim.id)}
                                data-testid={`button-manage-sources-${claim.id}`}
                              >
                                {expandedClaimSources.has(claim.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                Manage sources
                              </button>
                              {expandedClaimSources.has(claim.id) && (
                                <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                                  {claim.citations.map((cit) => (
                                    <div key={cit.id} className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{evidence.originalName}</p>
                                        {cit.pageNumber && <span>p.{cit.pageNumber}</span>}
                                        {cit.timestampSeconds && <span>{Math.floor(cit.timestampSeconds / 60)}:{(cit.timestampSeconds % 60).toString().padStart(2, "0")}</span>}
                                        {cit.quote && <p className="italic truncate">"{cit.quote.substring(0, 60)}..."</p>}
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() => detachCitationMutation.mutate({ claimId: claim.id, citationId: cit.id })}
                                        data-testid={`button-remove-citation-${cit.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex gap-1 pt-2">
                            <Button size="sm" variant="default" onClick={() => handleAcceptClaim(claim.id)} disabled={updateClaimMutation.isPending} data-testid={`button-accept-claim-${claim.id}`}>
                              <Check className="w-3 h-3 mr-1" />Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectClaim(claim.id)} disabled={updateClaimMutation.isPending} data-testid={`button-reject-claim-${claim.id}`}>
                              <XCircle className="w-3 h-3 mr-1" />Reject
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => startEditClaim(claim)} data-testid={`button-edit-claim-${claim.id}`}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {acceptedClaims.length > 0 && (
              <Collapsible open={acceptedClaimsOpen} onOpenChange={setAcceptedClaimsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full" data-testid="button-toggle-accepted-claims">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Accepted ({acceptedClaims.length})</span>
                    {acceptedClaimsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {acceptedClaims.map((claim) => (
                      <Card key={claim.id} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-2 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs flex-1">{claim.claimText.length > 100 ? claim.claimText.substring(0, 100) + "..." : claim.claimText}</p>
                            {(() => {
                              const confidence = getClaimConfidence(claim);
                              const ConfIcon = confidence.icon;
                              return (
                                <div className={`flex items-center gap-1 text-xs shrink-0 ${confidence.colorClass}`} data-testid={`badge-confidence-accepted-${claim.id}`}>
                                  <ConfIcon className="w-3 h-3" />
                                  <span className="font-medium">{confidence.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex flex-wrap gap-1 items-center">
                            {claim.isLocked && (
                              <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                                <Lock className="w-3 h-3 mr-1" />Locked
                              </Badge>
                            )}
                            <Badge 
                              variant={claim.citations && claim.citations.length > 0 ? "secondary" : "destructive"} 
                              className="text-xs"
                            >
                              Sources: {claim.citations?.length || 0}
                            </Badge>
                            {(!claim.citations || claim.citations.length === 0) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 text-xs"
                                onClick={() => autoAttachMutation.mutate(claim.id)}
                                disabled={autoAttachingClaimId === claim.id}
                                data-testid={`button-auto-attach-accepted-${claim.id}`}
                              >
                                {autoAttachingClaimId === claim.id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                )}
                                Auto-attach
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => addClaimToTrialPrepMutation.mutate(claim)}
                              disabled={addClaimToTrialPrepMutation.isPending}
                              data-testid={`button-trial-prep-claim-${claim.id}`}
                            >
                              <Scale className="w-3 h-3 mr-1" />
                              Trial Prep
                            </Button>
                            <LinkToTimelineButton
                              caseId={caseId}
                              linkType="claim"
                              targetId={claim.id}
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              label="Timeline"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const factsPanel = (
    <div className="border-t">
      <Collapsible open={factsOpen} onOpenChange={setFactsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between gap-2 p-3 w-full hover-elevate" data-testid="button-toggle-facts">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm">Extracted Facts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{pendingFacts.length} extracted</Badge>
              {factsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runFactExtractionMutation.mutate()}
                disabled={extractingFacts || extractionStatus !== "complete"}
                data-testid="button-extract-facts"
              >
                {extractingFacts ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Extract Facts (AI)
              </Button>
            </div>

            {factsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingFacts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No facts extracted yet. Click "Extract Facts" to analyze this document.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingFacts.map((fact) => (
                  <Card key={fact.id} className="border">
                    <CardContent className="p-2 space-y-2">
                      <p className="text-xs leading-relaxed">{fact.factText}</p>
                      <div className="flex flex-wrap gap-1 items-center">
                        <Badge className={`text-xs ${getFactTypeBadgeColor(fact.factType)}`}>
                          {fact.factType.charAt(0).toUpperCase() + fact.factType.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {fact.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => promoteFactMutation.mutate(fact.id)}
                          disabled={promoteFactMutation.isPending}
                          data-testid={`button-promote-fact-${fact.id}`}
                        >
                          <Scale className="w-3 h-3 mr-1" />
                          Promote to Claim
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFactMutation.mutate(fact.id)}
                          disabled={deleteFactMutation.isPending}
                          data-testid={`button-delete-fact-${fact.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {promotedFacts.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                  {promotedFacts.length} fact{promotedFacts.length !== 1 ? "s" : ""} promoted to claims
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ top: "64px" }}>
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-background">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-viewer">
            <X className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-sm truncate" data-testid="text-viewer-filename">{evidence.originalName}</h2>
            <p className="text-xs text-muted-foreground truncate">{evidence.category || "Evidence"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPdf && (
            <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <span>Page</span>
              <Input
                type="number"
                min={1}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-center"
                data-testid="input-page-number"
              />
            </div>
          )}

          {isImage && (
            <div className="hidden md:flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(25, z - 25))} data-testid="button-zoom-out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(200, z + 25))} data-testid="button-zoom-in">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setRotation(r => (r + 90) % 360)} data-testid="button-rotate">
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          )}

          {extractedText && (
            <Button 
              size="sm" 
              variant={showExtractedText ? "default" : "outline"}
              onClick={() => setShowExtractedText(!showExtractedText)}
              className="hidden md:flex"
              data-testid="button-toggle-extracted-text"
            >
              <AlignLeft className="w-4 h-4 mr-1" />
              Text
            </Button>
          )}

          <LinkToTimelineButton
            caseId={caseId}
            linkType="evidence"
            targetId={evidence.id}
            size="sm"
            variant="outline"
            className="hidden md:flex"
            label="Link to Timeline"
          />

          <Button size="sm" variant="outline" asChild data-testid="button-open-original">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Open Original</span>
            </a>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {showExtractedText && extractedText ? (
            <ScrollArea className="h-full p-4" onMouseUp={handleTextSelection}>
              <div className="max-w-3xl mx-auto bg-background p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Extracted Text</h3>
                  {selectedText && (
                    <Button 
                      size="sm" 
                      onClick={() => { 
                        setNoteForm(prev => ({ ...prev, anchorType: "text", selectionText: selectedText }));
                        setShowAddNote(true);
                      }}
                      data-testid="button-use-selection"
                    >
                      Use Selection
                    </Button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm select-text" data-testid="text-extracted-content">
                  {extractedText}
                </p>
              </div>
            </ScrollArea>
          ) : isPdf ? (
            <iframe
              src={`${fileUrl}#page=${currentPage}`}
              className="w-full h-full"
              title={evidence.originalName}
              data-testid="iframe-pdf-viewer"
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={fileUrl}
                alt={evidence.originalName}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                data-testid="img-evidence-viewer"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">Preview not available for this file type</p>
              <Button asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Download File
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="hidden md:flex md:flex-col w-80 border-l bg-background overflow-y-auto">
          {notesPanel}
          {claimsPanel}
          {factsPanel}
        </div>
      </div>

      <div className="md:hidden border-t bg-background">
        <Collapsible open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full h-12 flex items-center justify-between px-4" data-testid="button-toggle-mobile-notes">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                <span>Notes ({notes.length})</span>
                {resolvedCount > 0 && <Badge variant="secondary" className="text-xs">{resolvedCount} done</Badge>}
              </div>
              {mobileNotesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="h-64 border-t">
              {notesPanel}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNoteId ? "Edit Note" : "Add Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note-title">Title (optional)</Label>
              <Input
                id="note-title"
                placeholder="Give this note a title"
                value={noteForm.noteTitle}
                onChange={(e) => setNoteForm(prev => ({ ...prev, noteTitle: e.target.value }))}
                className="mt-1"
                data-testid="input-note-title"
              />
            </div>

            <div>
              <Label htmlFor="anchor-type">Anchor Type</Label>
              <Select
                value={noteForm.anchorType}
                onValueChange={(v) => setNoteForm(prev => ({ ...prev, anchorType: v as "page" | "timestamp" | "text" | "range" }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-anchor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page Number</SelectItem>
                  <SelectItem value="text">Text Selection</SelectItem>
                  <SelectItem value="timestamp" disabled={!isAudioVideo}>Timestamp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {noteForm.anchorType === "page" && (
              <div>
                <Label htmlFor="page-number">Page Number</Label>
                <Input
                  id="page-number"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={noteForm.pageNumber}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, pageNumber: e.target.value }))}
                  className="mt-1"
                  data-testid="input-anchor-page"
                />
              </div>
            )}

            {noteForm.anchorType === "timestamp" && (
              <div>
                <Label htmlFor="timestamp">Timestamp (seconds)</Label>
                <Input
                  id="timestamp"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={noteForm.timestamp}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, timestamp: e.target.value }))}
                  className="mt-1"
                  data-testid="input-anchor-timestamp"
                />
              </div>
            )}

            {noteForm.anchorType === "text" && (
              <div>
                <Label htmlFor="selection-text">Selected Text</Label>
                <Textarea
                  id="selection-text"
                  placeholder="Paste or type the selected text"
                  value={noteForm.selectionText}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, selectionText: e.target.value }))}
                  rows={3}
                  className="mt-1"
                  data-testid="input-selection-text"
                />
              </div>
            )}

            <div>
              <Label htmlFor="note-text">Note</Label>
              <Textarea
                id="note-text"
                placeholder="Write your note here..."
                value={noteForm.noteText}
                onChange={(e) => setNoteForm(prev => ({ ...prev, noteText: e.target.value }))}
                rows={4}
                className="mt-1"
                data-testid="textarea-note-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-tags">Tags (comma-separated)</Label>
                <Input
                  id="note-tags"
                  placeholder="important, timeline"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="mt-1"
                  data-testid="input-note-tags"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Select
                  value={noteForm.color}
                  onValueChange={(v) => setNoteForm(prev => ({ ...prev, color: v }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-note-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddNote(false); setEditingNoteId(null); resetNoteForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteForm.noteText.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
              data-testid="button-save-note"
            >
              {(createNoteMutation.isPending || updateNoteMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                editingNoteId ? "Save Changes" : "Add Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSnippetModal} onOpenChange={setShowSnippetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Exhibit Snippet</DialogTitle>
            <DialogDescription>
              Add this note as a snippet to an exhibit list for easy reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Exhibit List</Label>
              <Select
                value={snippetForm.exhibitListId}
                onValueChange={(v) => setSnippetForm(prev => ({ ...prev, exhibitListId: v }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-snippet-exhibit-list">
                  <SelectValue placeholder="Select an exhibit list" />
                </SelectTrigger>
                <SelectContent>
                  {exhibitLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>{list.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={snippetForm.title}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
                data-testid="input-snippet-title"
              />
            </div>
            <div>
              <Label>Snippet Text</Label>
              <Textarea
                value={snippetForm.snippetText}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, snippetText: e.target.value }))}
                rows={4}
                className="mt-1"
                data-testid="textarea-snippet-text"
              />
            </div>
            <div>
              <Label>Page Number (optional)</Label>
              <Input
                type="number"
                min={1}
                value={snippetForm.pageNumber}
                onChange={(e) => setSnippetForm(prev => ({ ...prev, pageNumber: e.target.value }))}
                className="mt-1"
                data-testid="input-snippet-page"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnippetModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSnippet}
              disabled={!snippetForm.exhibitListId || !snippetForm.snippetText.trim() || createSnippetMutation.isPending}
              data-testid="button-create-snippet"
            >
              {createSnippetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Snippet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrialPrepModal} onOpenChange={setShowTrialPrepModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Trial Prep</DialogTitle>
            <DialogDescription>
              Add this note to your trial preparation shortlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={trialPrepForm.title}
                onChange={(e) => setTrialPrepForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
                data-testid="input-trial-prep-title"
              />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea
                value={trialPrepForm.summary}
                onChange={(e) => setTrialPrepForm(prev => ({ ...prev, summary: e.target.value }))}
                rows={3}
                className="mt-1"
                data-testid="textarea-trial-prep-summary"
              />
            </div>
            <div>
              <Label>Binder Section</Label>
              <Select
                value={trialPrepForm.binderSection}
                onValueChange={(v) => setTrialPrepForm(prev => ({ ...prev, binderSection: v }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-binder-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BINDER_SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Importance (1-5)</Label>
              <Select
                value={String(trialPrepForm.importance)}
                onValueChange={(v) => setTrialPrepForm(prev => ({ ...prev, importance: parseInt(v) }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrialPrepModal(false)}>Cancel</Button>
            <Button
              onClick={handleAddToTrialPrep}
              disabled={!trialPrepForm.title.trim() || createTrialPrepMutation.isPending}
              data-testid="button-add-trial-prep"
            >
              {createTrialPrepMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Trial Prep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
