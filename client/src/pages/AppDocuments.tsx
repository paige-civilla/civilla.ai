import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDeepLinkParam, scrollAndHighlight, clearDeepLinkQueryParams } from "@/lib/deepLink";
import { ArrowLeft, FileText, Briefcase, Plus, Copy, Trash2, Download, Save, X, FileType, FileDown, Scale, FileCheck, Loader2, Check, AlertCircle, Link as LinkIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useModuleView } from "@/hooks/useModuleView";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Case, Document, GeneratedDocument, GenerateDocumentPayload } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { History, Edit3, ChevronDown, ChevronUp, Eye, AlertTriangle, ListOrdered } from "lucide-react";
import OutlineBuilder from "@/components/app/OutlineBuilder";
import CourtTemplates from "@/components/app/CourtTemplates";
import PhaseBanner from "@/components/app/PhaseBanner";

const DRAFT_TOPIC_BY_MODULE: Record<string, string> = {
  evidence: "Evidence summary",
  timeline: "Timeline narrative",
  messages: "Communication log summary",
  communications: "Communication log summary",
  "pattern-analysis": "Pattern summary",
  exhibits: "Exhibit summary",
  "trial-prep": "Trial prep summary",
  "parenting-plan": "Parenting plan summary",
  default: "Statement of Facts",
};

function getDraftTopicForModule(moduleKey?: string | null): string {
  if (!moduleKey) return DRAFT_TOPIC_BY_MODULE.default;
  return DRAFT_TOPIC_BY_MODULE[moduleKey] || DRAFT_TOPIC_BY_MODULE.default;
}

// --- UX: Simple 1-2-3 court-filing steps (beginner-friendly) ---
function StepStrip({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const base = "flex items-center gap-2 rounded-full border px-3 py-2 text-sm";
  const on = "bg-white text-neutral-darkest border-neutral-darkest/20 shadow-sm";
  const off = "bg-transparent text-neutral-darkest/60 border-neutral-darkest/10";
  const dotBase = "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold";
  const dotOn = "bg-primary text-primary-foreground border-primary";
  const dotOff = "bg-transparent text-neutral-darkest/50 border-neutral-darkest/20";

  const Item = (n: 1 | 2 | 3, label: string) => (
    <div className={`${base} ${activeStep === n ? on : off}`}>
      <div className={`${dotBase} ${activeStep === n ? dotOn : dotOff}`}>{n}</div>
      <div className="font-sans">{label}</div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-2 md:flex-row md:items-center md:gap-3 mt-3">
      {Item(1, "Draft: Create or edit your document")}
      {Item(2, "Review: Confirm case details, role, and date")}
      {Item(3, "Download: Court-Formatted Documents")}
    </div>
  );
}
// --- end StepStrip ---

type CasePhase = "collecting" | "reviewing" | "draft-ready";

function PhaseNotice({ caseId }: { caseId: string }) {
  const { data } = useQuery<{ phase: CasePhase }>({
    queryKey: ["/api/cases", caseId, "draft-readiness"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/draft-readiness`, { credentials: "include" });
      if (!res.ok) return { phase: "collecting" as CasePhase };
      return res.json();
    },
    enabled: !!caseId,
    staleTime: 60000,
  });

  const phase = data?.phase || "collecting";

  const notices: Record<CasePhase, { text: string; className: string }> = {
    collecting: {
      text: "Not draft-ready yet — and that's expected. Civilla drafts from reviewed, cited info. Keep collecting and reviewing claims to unlock drafting.",
      className: "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    },
    reviewing: {
      text: "Almost draft-ready. Review remaining claims to enable full drafting capability.",
      className: "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    },
    "draft-ready": {
      text: "Draft-ready. This draft is built from approved claims + linked evidence.",
      className: "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
    },
  };

  const notice = notices[phase];

  return (
    <div className={`text-xs rounded-lg px-3 py-2 mb-3 border ${notice.className}`} data-testid="text-phase-notice">
      {notice.text}
    </div>
  );
}

interface DocumentTemplate {
  key: string;
  title: string;
}

interface UserProfile {
  fullName: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  partyRole: string | null;
  isSelfRepresented: boolean;
  autoFillEnabled: boolean;
  autoFillChoiceMade: boolean;
  defaultRole: "self_represented" | "attorney";
  barNumber: string | null;
  firmName: string | null;
  petitionerName: string | null;
  respondentName: string | null;
}

interface ExtendedPayload extends GenerateDocumentPayload {
  meta?: {
    autofillEnabledUsed: boolean;
    roleUsed: "self_represented" | "attorney";
    dateConfirmed: boolean;
  };
}

export default function AppDocuments() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  useModuleView("documents", caseId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"template" | "claims">("claims");
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocTemplate, setNewDocTemplate] = useState("");
  const [compileClaimsTitle, setCompileClaimsTitle] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [moduleKey, setModuleKey] = useState<string | null>(null);
  const [sourceEvidenceId, setSourceEvidenceId] = useState<string | null>(null);
  const [filterByEvidence, setFilterByEvidence] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mk = urlParams.get("moduleKey");
    const sid = urlParams.get("sourceId");
    
    if (mk) {
      setModuleKey(mk);
      localStorage.setItem(`lastDraftTopic_${caseId}`, getDraftTopicForModule(mk));
    } else {
      const savedTopic = localStorage.getItem(`lastDraftTopic_${caseId}`);
      if (savedTopic) {
        setModuleKey(savedTopic);
      }
    }
    if (sid) {
      setSourceEvidenceId(sid);
      setFilterByEvidence(true);
    }
  }, [caseId]);

  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;

  useEffect(() => {
    if (!currentCase) return;
    const today = new Date().toISOString().split("T")[0];
    const topicPart = moduleKey ? getDraftTopicForModule(moduleKey) : (localStorage.getItem(`lastDraftTopic_${caseId}`) || "Compiled Summary");
    const casePart = (currentCase.title || "Case").substring(0, 40);
    setCompileClaimsTitle(`${topicPart} — ${casePart} — ${today}`.substring(0, 120));
  }, [currentCase, moduleKey, caseId]);

  const { data: templatesData } = useQuery<{ templates: DocumentTemplate[] }>({
    queryKey: ["/api/document-templates"],
    enabled: !!currentCase,
  });

  const { data: documentsData, isLoading: docsLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!currentCase,
  });

  const { data: profileData, refetch: refetchProfile } = useQuery<{ profile: UserProfile }>({
    queryKey: ["/api/profile"],
  });

  const { data: generatedDocsData, isLoading: genDocsLoading } = useQuery<{ documents: GeneratedDocument[] }>({
    queryKey: ["/api/cases", caseId, "generated-documents"],
    enabled: !!currentCase,
  });

  interface ClaimWithCitations {
    id: string;
    caseId: string;
    claimText: string;
    claimType: string;
    status: string;
    tags: string[] | null;
    missingInfoFlag: boolean | null;
    citations?: { quote: string | null; pageNumber: number | null; evidenceId: string | null }[];
  }

  const { data: acceptedClaimsData, isLoading: claimsLoading } = useQuery<{ claims: ClaimWithCitations[] }>({
    queryKey: ["/api/cases", caseId, "claims", { status: "accepted" }],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/claims?status=accepted`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    enabled: !!currentCase && isCreateDialogOpen && createMode === "claims",
  });

  const acceptedClaims = acceptedClaimsData?.claims || [];

  interface PreflightResponse {
    ok: boolean;
    canCompile: boolean;
    totals: {
      acceptedClaims: number;
      acceptedClaimsWithCitations: number;
      acceptedClaimsMissingCitations: number;
      acceptedClaimsMissingInfoFlagged: number;
      extractionCoverage: number;
    };
    missing: {
      claimIdsMissingCitations: string[];
      claimIdsMissingInfoFlagged: string[];
    };
    message: string;
    readinessPercent: number;
  }

  const { data: preflightData, isLoading: preflightLoading, refetch: refetchPreflight } = useQuery<PreflightResponse>({
    queryKey: ["/api/cases", caseId, "documents/compile-claims/preflight"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/documents/compile-claims/preflight`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch preflight");
      return res.json();
    },
    enabled: !!currentCase && isCreateDialogOpen && createMode === "claims",
  });

  interface TraceEntry {
    claimId: string;
    claimText: string;
    citations: Array<{
      citationId: string;
      evidenceId: string;
      evidenceName: string;
      pointer: {
        pageNumber?: number;
        timestampSeconds?: number;
        quote?: string;
      };
    }>;
    linkedTimelineEvents?: Array<{
      eventId: string;
      eventDate: string;
      eventTitle: string;
    }>;
  }

  const [compileResult, setCompileResult] = useState<{ markdown: string; trace: TraceEntry[]; documentId?: string; title?: string } | null>(null);
  const [isRenamingCompiled, setIsRenamingCompiled] = useState(false);
  const [compiledRenameTitle, setCompiledRenameTitle] = useState("");
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renamingDocTitle, setRenamingDocTitle] = useState("");

  const generatedDocuments = generatedDocsData?.documents || [];

  interface TemplateAutofillResponse {
    payload: GenerateDocumentPayload;
    missingFields: string[];
    factCount: number;
    citationBackedCount: number;
    guardrailsPassed: boolean;
  }

  const { data: templateAutofillData, refetch: refetchTemplateAutofill } = useQuery<TemplateAutofillResponse>({
    queryKey: ["/api/cases", caseId, "template-autofill"],
    enabled: false,
  });

  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [autoFillFormData, setAutoFillFormData] = useState<Partial<UserProfile>>({});
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const templates = templatesData?.templates || [];
  const documents = documentsData?.documents || [];
  const userProfile = profileData?.profile;

  useEffect(() => {
    if (currentCase) {
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  useEffect(() => {
    if (!caseLoading && !currentCase && caseId) {
      if (caseError && (caseError as any).status === 401) {
        console.log("[redirect->login] 401 on case fetch");
        setLocation("/login?reason=session");
      } else {
        console.log("[redirect->cases] case not found or access denied");
        setLocation("/app/cases");
      }
    }
  }, [caseLoading, currentCase, caseId, caseError, setLocation]);

  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || docsLoading || documents.length === 0) return;
    const docId = getDeepLinkParam("docId");
    if (docId) {
      deepLinkHandledRef.current = true;
      setTimeout(() => {
        const success = scrollAndHighlight(`doc-${docId}`);
        if (success) {
          clearDeepLinkQueryParams();
        }
      }, 100);
    }
  }, [docsLoading, documents]);

  const compileClaimsMutation = useMutation({
    mutationFn: async (data: { title: string; draftTopic?: string }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/documents/compile-claims`, data);
      return res.json();
    },
    onSuccess: (data: { ok: boolean; markdown: string; trace: TraceEntry[]; document?: { id: string; title: string } }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setCompileResult({ 
        markdown: data.markdown, 
        trace: data.trace, 
        documentId: data.document?.id, 
        title: data.document?.title 
      });
      setCompiledRenameTitle(data.document?.title || compileClaimsTitle);
      toast({ title: "Document compiled from claims" });
    },
    onError: (error: Error) => {
      const msg = error.message || "Failed to compile document";
      if (msg.includes("NO_ACCEPTED_CLAIMS")) {
        toast({ title: "No accepted claims to compile", variant: "destructive" });
      } else if (msg.includes("ACCEPTED_CLAIMS_MISSING_CITATIONS")) {
        toast({ title: "Some claims are missing citations", description: "Add citations to all accepted claims first", variant: "destructive" });
      } else {
        toast({ title: "Failed to compile document", variant: "destructive" });
      }
    },
  });

  const renameDocMutation = useMutation({
    mutationFn: async ({ docId, title }: { docId: string; title: string }) => {
      const res = await apiRequest("PATCH", `/api/documents/${docId}`, { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setIsRenamingCompiled(false);
      if (compileResult) {
        setCompileResult({ ...compileResult, title: compiledRenameTitle });
      }
      toast({ title: "Document renamed" });
    },
    onError: () => {
      toast({ title: "Failed to rename document", variant: "destructive" });
    },
  });

  const [bulkAutoAttaching, setBulkAutoAttaching] = useState(false);
  const bulkAutoAttachMutation = useMutation({
    mutationFn: async (claimIds: string[]) => {
      setBulkAutoAttaching(true);
      let attachedCount = 0;
      for (const claimId of claimIds) {
        try {
          const res = await apiRequest("POST", `/api/claims/${claimId}/citations/auto`, { maxAttach: 1 });
          const data = await res.json();
          if (data.ok && data.attached > 0) attachedCount++;
        } catch { /* continue with next */ }
      }
      return attachedCount;
    },
    onSuccess: (attachedCount) => {
      setBulkAutoAttaching(false);
      refetchPreflight();
      if (attachedCount > 0) {
        toast({ title: `Attached sources to ${attachedCount} claims` });
      } else {
        toast({ title: "No matching sources found", description: "Add more citations in Evidence Viewer", variant: "destructive" });
      }
    },
    onError: () => {
      setBulkAutoAttaching(false);
      toast({ title: "Failed to auto-attach sources", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; templateKey: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/documents`, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setIsCreateDialogOpen(false);
      setNewDocTitle("");
      setNewDocTemplate("");
      toast({ title: "Document created" });

      const profileResult = await refetchProfile();
      const profile = profileResult.data?.profile;
      if (profile?.autoFillEnabled && (!profile?.fullName || !profile?.addressLine1)) {
        setAutoFillFormData({
          fullName: profile.fullName || "",
          email: profile.email || "",
          addressLine1: profile.addressLine1 || "",
          addressLine2: profile.addressLine2 || "",
          city: profile.city || "",
          state: profile.state || "",
          zip: profile.zip || "",
          phone: profile.phone || "",
          partyRole: profile.partyRole || "petitioner",
          isSelfRepresented: profile.isSelfRepresented ?? true,
        });
        setIsAutoFillModalOpen(true);
      }
    },
    onError: () => {
      toast({ title: "Failed to create document", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { docId: string; title: string; content: string }) => {
      return apiRequest("PATCH", `/api/documents/${data.docId}`, { title: data.title, content: data.content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setEditingDoc(null);
      toast({ title: "Document saved" });
    },
    onError: () => {
      toast({ title: "Failed to save document", variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (docId: string) => {
      return apiRequest("POST", `/api/documents/${docId}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      toast({ title: "Document duplicated" });
    },
    onError: () => {
      toast({ title: "Failed to duplicate document", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      return apiRequest("DELETE", `/api/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setDeleteDocId(null);
      toast({ title: "Document deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const addToTrialPrepMutation = useMutation({
    mutationFn: async (doc: Document) => {
      return apiRequest("POST", `/api/cases/${caseId}/trial-prep-shortlist`, {
        sourceType: "document",
        sourceId: doc.id,
        title: doc.title,
        summary: null,
        binderSection: "Discovery & Disclosures",
        importance: 3,
        tags: ["document"],
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsAutoFillModalOpen(false);
      setAutoFillFormData({});
      setDontAskAgain(false);
      toast({ title: "Profile saved" });
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  const saveGeneratedDocMutation = useMutation({
    mutationFn: async (data: { templateType: string; title: string; payload: GenerateDocumentPayload }) => {
      return apiRequest("POST", `/api/cases/${caseId}/documents/generate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "generated-documents"] });
    },
    onError: () => {
      toast({ title: "Failed to save document history", variant: "destructive" });
    },
  });

  const isProfileIncomplete = !userProfile?.fullName || !userProfile?.addressLine1;

  const openAutoFillModal = () => {
    if (userProfile) {
      setAutoFillFormData({
        fullName: userProfile.fullName || "",
        email: userProfile.email || "",
        addressLine1: userProfile.addressLine1 || "",
        addressLine2: userProfile.addressLine2 || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        zip: userProfile.zip || "",
        phone: userProfile.phone || "",
        partyRole: userProfile.partyRole || "petitioner",
        isSelfRepresented: userProfile.isSelfRepresented ?? true,
      });
    }
    setIsAutoFillModalOpen(true);
  };

  const handleSaveProfile = () => {
    const profileUpdate: Partial<UserProfile> = {
      ...autoFillFormData,
      autoFillEnabled: !dontAskAgain,
    };
    updateProfileMutation.mutate(profileUpdate);
  };

  const handleSkipAutoFill = () => {
    if (dontAskAgain) {
      updateProfileMutation.mutate({ autoFillEnabled: false });
    } else {
      setIsAutoFillModalOpen(false);
      setAutoFillFormData({});
      setDontAskAgain(false);
    }
  };

  const [isDownloadingCourtDoc, setIsDownloadingCourtDoc] = useState(false);
  const [isCourtDocDialogOpen, setIsCourtDocDialogOpen] = useState(false);
  const [selectedCourtDocType, setSelectedCourtDocType] = useState("");
  
  type DocStep = "draft" | "outline" | "court" | "review" | "filing";
  const [docStep, setDocStep] = useState<DocStep>("draft");
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewPayload, setReviewPayload] = useState<GenerateDocumentPayload | null>(null);
  const [reviewDocType, setReviewDocType] = useState<CourtDocType | null>(null);
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);
  const [editableBody, setEditableBody] = useState<string[]>([]);
  
  const [showAutofillConsentModal, setShowAutofillConsentModal] = useState(false);
  const [pendingDocType, setPendingDocType] = useState<CourtDocType | null>(null);
  const [dateConfirmed, setDateConfirmed] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"self_represented" | "attorney">("self_represented");
  const [attorneyBarNumber, setAttorneyBarNumber] = useState("");
  const [attorneyFirmName, setAttorneyFirmName] = useState("");
  const [autofillToggle, setAutofillToggle] = useState(true);

  interface TemplatePreflightResponse {
    templateKey: string;
    isReady: boolean;
    filledFieldsCount: number;
    requiredFieldsCount: number;
    missingFields: string[];
    filledFields: string[];
    citationBackedCount: number;
    guardrailsPassed: boolean;
    readinessScore: number;
  }

  const { data: templatePreflightData, isLoading: templatePreflightLoading } = useQuery<TemplatePreflightResponse>({
    queryKey: ["/api/cases", caseId, "documents/templates", selectedCourtDocType, "preflight"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/documents/templates/${selectedCourtDocType}/preflight`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch preflight");
      return res.json();
    },
    enabled: !!caseId && !!selectedCourtDocType && isCourtDocDialogOpen,
  });

  type CourtDocType = "declaration" | "affidavit" | "motion" | "memorandum" | "certificate_of_service";

  const courtDocTemplates: Record<CourtDocType, { title: string; body: string[] }> = {
    declaration: {
      title: "DECLARATION",
      body: [
        "1. I am the Petitioner in this matter and I am over the age of 18 years.",
        "2. I have personal knowledge of the facts stated herein.",
        "3. [Add your statements of fact here, each as a numbered paragraph.]",
        "4. [Include specific dates, times, and details where relevant.]",
      ],
    },
    affidavit: {
      title: "AFFIDAVIT",
      body: [
        "1. I am the Petitioner in this matter and I am over the age of 18 years.",
        "2. I have personal knowledge of the facts stated herein.",
        "3. [Add your statements of fact here, each as a numbered paragraph.]",
        "4. [Include specific dates, times, and details where relevant.]",
      ],
    },
    motion: {
      title: "MOTION",
      body: [
        "COMES NOW the Petitioner, and hereby moves the Court for an Order granting the following relief:",
        "1. [State the specific relief requested.]",
        "2. [State additional requests.]",
        "This Motion is supported by the attached Declaration/Affidavit and any accompanying exhibits.",
      ],
    },
    memorandum: {
      title: "MEMORANDUM",
      body: [
        "I. INTRODUCTION",
        "[Write a brief introduction.]",
        "II. FACTS",
        "[Summarize the relevant facts.]",
        "III. ARGUMENT",
        "[Explain the legal argument and why the Court should grant the requested relief.]",
        "IV. CONCLUSION",
        "[State the requested outcome.]",
      ],
    },
    certificate_of_service: {
      title: "CERTIFICATE OF SERVICE",
      body: [
        "I certify that on this ____ day of __________, 2025, I served a true and correct copy of the foregoing [Document Title] upon:",
        "",
        "[Name]",
        "[Address]",
        "[City, State ZIP]",
        "",
        "by the following method:",
        "",
        "☐  U.S. Mail, postage prepaid",
        "☐  Hand Delivery",
        "☐  Electronic Mail to: [email address]",
        "☐  Facsimile to: [fax number]",
        "☐  Other: __________",
      ],
    },
  };

  const courtDocOptions = [
    { value: "declaration", label: "Declaration" },
    { value: "affidavit", label: "Affidavit" },
    { value: "motion", label: "Motion" },
    { value: "memorandum", label: "Memorandum" },
    { value: "certificate_of_service", label: "Certificate of Service" },
  ];

  const openReviewModal = (docType: CourtDocType) => {
    if (!currentCase) return;
    
    if (userProfile && !userProfile.autoFillChoiceMade) {
      setPendingDocType(docType);
      setShowAutofillConsentModal(true);
      setIsCourtDocDialogOpen(false);
      setSelectedCourtDocType("");
      return;
    }
    
    proceedToReview(docType, userProfile?.autoFillEnabled ?? true);
  };

  const proceedToReview = async (docType: CourtDocType, useAutofill: boolean) => {
    if (!currentCase) return;
    const template = courtDocTemplates[docType];

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const role = userProfile?.defaultRole || "self_represented";
    setSelectedRole(role);
    setAttorneyBarNumber(userProfile?.barNumber || "");
    setAttorneyFirmName(userProfile?.firmName || "");
    setAutofillToggle(useAutofill);
    setDateConfirmed(false);

    let factsPayload: TemplateAutofillResponse | null = null;
    if (useAutofill) {
      try {
        const result = await refetchTemplateAutofill();
        factsPayload = result.data || null;
      } catch { /* continue without facts data */ }
    }

    const payload: GenerateDocumentPayload = {
      court: {
        district: factsPayload?.payload?.court?.district || "Seventh",
        county: factsPayload?.payload?.court?.county || currentCase.county || "Bonneville",
        state: factsPayload?.payload?.court?.state || currentCase.state || "Idaho",
      },
      case: {
        caseNumber: factsPayload?.payload?.case?.caseNumber || currentCase.caseNumber || "___________",
      },
      parties: {
        petitioner: useAutofill 
          ? (factsPayload?.payload?.parties?.petitioner || userProfile?.petitionerName || "[Petitioner Name]") 
          : "[Petitioner Name]",
        respondent: useAutofill 
          ? (factsPayload?.payload?.parties?.respondent || userProfile?.respondentName || "[Respondent Name]") 
          : "[Respondent Name]",
      },
      filer: {
        fullName: useAutofill 
          ? (factsPayload?.payload?.filer?.fullName || userProfile?.fullName || "[Your Full Name]") 
          : "[Your Full Name]",
        email: useAutofill ? (factsPayload?.payload?.filer?.email || userProfile?.email || "") : "",
        addressLine1: useAutofill 
          ? (factsPayload?.payload?.filer?.addressLine1 || userProfile?.addressLine1 || "[Your Address]") 
          : "[Your Address]",
        addressLine2: useAutofill ? (factsPayload?.payload?.filer?.addressLine2 || userProfile?.addressLine2 || "") : "",
        city: useAutofill ? (factsPayload?.payload?.filer?.city || userProfile?.city || "") : "",
        state: useAutofill ? (factsPayload?.payload?.filer?.state || userProfile?.state || "") : "",
        zip: useAutofill ? (factsPayload?.payload?.filer?.zip || userProfile?.zip || "") : "",
        phone: useAutofill ? (factsPayload?.payload?.filer?.phone || userProfile?.phone || "") : "",
        partyRole: useAutofill 
          ? (factsPayload?.payload?.filer?.partyRole || userProfile?.partyRole || "petitioner") 
          : "petitioner",
        isSelfRepresented: role === "self_represented",
        attorney: role === "attorney" ? {
          name: useAutofill ? (userProfile?.fullName || "") : "",
          firm: useAutofill ? (userProfile?.firmName || "") : "",
          barNumber: useAutofill ? (userProfile?.barNumber || "") : "",
          email: useAutofill ? (userProfile?.email || "") : "",
          phone: useAutofill ? (userProfile?.phone || "") : "",
          address: useAutofill ? (userProfile?.addressLine1 || "") : "",
        } : undefined,
      },
      document: {
        title: factsPayload?.payload?.document?.title || template.title,
        subtitle: factsPayload?.payload?.document?.subtitle || "",
      },
      date: dateStr,
    };

    setReviewPayload(payload);
    setReviewDocType(docType);
    setEditableBody([...template.body]);
    setShowAutofillConsentModal(false);
    setPendingDocType(null);
    setIsCourtDocDialogOpen(false);
    setSelectedCourtDocType("");
    setIsReviewModalOpen(true);
  };

  const handleAutofillConsentAccept = async () => {
    await updateProfileMutation.mutateAsync({ autoFillEnabled: true, autoFillChoiceMade: true });
    if (pendingDocType) {
      proceedToReview(pendingDocType, true);
    }
  };

  const handleAutofillConsentDecline = async () => {
    await updateProfileMutation.mutateAsync({ autoFillEnabled: false, autoFillChoiceMade: true });
    if (pendingDocType) {
      proceedToReview(pendingDocType, false);
    }
  };

  const handleAutofillToggleChange = (enabled: boolean) => {
    setAutofillToggle(enabled);
    updateProfileMutation.mutate({ autoFillEnabled: enabled });
    
    if (!reviewPayload || !currentCase) return;
    
    if (enabled && userProfile) {
      setReviewPayload({
        ...reviewPayload,
        filer: {
          ...reviewPayload.filer,
          fullName: userProfile.fullName || reviewPayload.filer.fullName,
          email: userProfile.email || reviewPayload.filer.email,
          addressLine1: userProfile.addressLine1 || reviewPayload.filer.addressLine1,
          addressLine2: userProfile.addressLine2 || reviewPayload.filer.addressLine2,
          city: userProfile.city || reviewPayload.filer.city,
          state: userProfile.state || reviewPayload.filer.state,
          zip: userProfile.zip || reviewPayload.filer.zip,
          phone: userProfile.phone || reviewPayload.filer.phone,
        },
        parties: {
          petitioner: userProfile.petitionerName || "[Petitioner Name]",
          respondent: userProfile.respondentName || "[Respondent Name]",
        },
      });
    }
  };

  const handleRoleChange = (role: "self_represented" | "attorney") => {
    setSelectedRole(role);
    updateProfileMutation.mutate({ defaultRole: role });
    
    if (reviewPayload) {
      setReviewPayload({
        ...reviewPayload,
        filer: {
          ...reviewPayload.filer,
          isSelfRepresented: role === "self_represented",
          attorney: role === "attorney" ? {
            name: reviewPayload.filer.fullName,
            firm: attorneyFirmName,
            barNumber: attorneyBarNumber,
            email: reviewPayload.filer.email,
            phone: reviewPayload.filer.phone,
            address: reviewPayload.filer.addressLine1,
          } : undefined,
        },
      });
    }
  };

  const handleFinalDownload = async () => {
    if (!reviewPayload || !reviewDocType || !currentCase) return;
    setIsDownloadingCourtDoc(true);
    try {
      const template = courtDocTemplates[reviewDocType];
      
      const addressParts = [
        reviewPayload.filer.addressLine1,
        reviewPayload.filer.addressLine2,
        [reviewPayload.filer.city, reviewPayload.filer.state, reviewPayload.filer.zip].filter(Boolean).join(" "),
      ].filter(Boolean).join(", ");

      const docxPayload = {
        court: reviewPayload.court,
        case: reviewPayload.case,
        parties: reviewPayload.parties,
        document: reviewPayload.document,
        contactBlock: {
          isRepresented: !reviewPayload.filer.isSelfRepresented,
          name: reviewPayload.filer.fullName,
          address: addressParts,
          phone: reviewPayload.filer.phone || "",
          email: reviewPayload.filer.email || "",
          barNumber: reviewPayload.filer.attorney?.barNumber || "",
          firm: reviewPayload.filer.attorney?.firm || "",
        },
        body: {
          paragraphs: editableBody,
        },
        signature: {
          datedLine: `DATED this ${reviewPayload.date}.`,
          signerName: reviewPayload.filer.fullName,
          signerTitle: reviewPayload.filer.isSelfRepresented 
            ? `${reviewPayload.filer.partyRole === "petitioner" ? "Petitioner" : "Respondent"}, Pro Se`
            : reviewPayload.filer.attorney?.name || "Attorney",
        },
        footer: {
          docName: template.title,
          showPageNumbers: true,
        },
      };

      const response = await fetch("/api/templates/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(docxPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }

      const payloadWithMeta: ExtendedPayload = {
        ...reviewPayload,
        filer: {
          ...reviewPayload.filer,
          attorney: selectedRole === "attorney" ? {
            name: reviewPayload.filer.fullName,
            firm: attorneyFirmName,
            barNumber: attorneyBarNumber,
            email: reviewPayload.filer.email,
            phone: reviewPayload.filer.phone,
            address: reviewPayload.filer.addressLine1,
          } : undefined,
        },
        meta: {
          autofillEnabledUsed: autofillToggle,
          roleUsed: selectedRole,
          dateConfirmed: dateConfirmed,
        },
      };

      saveGeneratedDocMutation.mutate({
        templateType: reviewDocType,
        title: template.title,
        payload: payloadWithMeta as GenerateDocumentPayload,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.title.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: `${template.title} downloaded` });
      
      setIsReviewModalOpen(false);
      setReviewPayload(null);
      setReviewDocType(null);
      setEditableBody([]);
    } catch (error) {
      toast({ title: "Failed to download court document", variant: "destructive" });
    } finally {
      setIsDownloadingCourtDoc(false);
    }
  };

  const handleRedownloadFromHistory = async (doc: GeneratedDocument) => {
    const payload = doc.payloadJson as ExtendedPayload;
    const docType = doc.templateType as CourtDocType;
    const template = courtDocTemplates[docType];
    
    if (!template) {
      toast({ title: "Unknown document type", variant: "destructive" });
      return;
    }

    const savedMeta = payload.meta;
    setSelectedRole(savedMeta?.roleUsed || "self_represented");
    setAutofillToggle(savedMeta?.autofillEnabledUsed ?? true);
    setDateConfirmed(false);
    setAttorneyBarNumber(payload.filer.attorney?.barNumber || "");
    setAttorneyFirmName(payload.filer.attorney?.firm || "");

    setReviewPayload(payload);
    setReviewDocType(docType);
    setEditableBody([...template.body]);
    setIsReviewModalOpen(true);
  };

  const handleCreate = () => {
    if (!newDocTitle.trim() || !newDocTemplate) {
      toast({ title: "Please provide a title and select a template", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title: newDocTitle.trim(), templateKey: newDocTemplate });
  };

  const handleSave = () => {
    if (!editingDoc) return;
    updateMutation.mutate({ docId: editingDoc.id, title: editTitle, content: editContent });
  };

  const handleExport = (docId: string) => {
    window.open(`/api/documents/${docId}/export/docx`, "_blank");
  };

  const openEditor = (doc: Document) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditContent(doc.content);
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTemplateLabel = (key: string) => {
    const t = templates.find((tpl) => tpl.key === key);
    return t ? t.title : key;
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

          <PhaseBanner caseId={caseId} currentModule="documents" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div>
              <p className="font-sans text-xs sm:text-sm text-neutral-darkest/60 mb-1">Documents</p>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>
          </div>

          <ModuleIntro
            title="About Document Preparation"
            paragraphs={[
              "Create and edit documents for your case. You can draft documents in your own words, then generate court-formatted versions when ready to file.",
              "This tool supports various document types commonly used in family law proceedings."
            ]}
            caution="Review all documents carefully before filing with the court."
          />

          {caseId && (
            <LexiSuggestedQuestions moduleKey="documents" caseId={caseId} />
          )}

          <Tabs value={docStep} onValueChange={(v) => setDocStep(v as DocStep)} className="w-full">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 gap-2 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="draft"
                className="justify-start rounded-lg border border-neutral-light bg-white data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                data-testid="tab-step-1-draft"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
                Draft
              </TabsTrigger>

              <TabsTrigger
                value="outline"
                className="justify-start rounded-lg border border-neutral-light bg-white data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                data-testid="tab-step-outline"
              >
                <ListOrdered className="w-4 h-4 mr-2" />
                Outline
              </TabsTrigger>

              <TabsTrigger
                value="court"
                className="justify-start rounded-lg border border-neutral-light bg-white data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                data-testid="tab-step-court"
              >
                <Scale className="w-4 h-4 mr-2" />
                Court Templates
              </TabsTrigger>

              <TabsTrigger
                value="review"
                className="justify-start rounded-lg border border-neutral-light bg-white data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                data-testid="tab-step-2-review"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">2</span>
                Review
              </TabsTrigger>

              <TabsTrigger
                value="filing"
                className="justify-start rounded-lg border border-neutral-light bg-white data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                data-testid="tab-step-3-filing"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</span>
                Filing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draft" className="mt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Step 1: Draft Your Document</h2>
                  <p className="font-sans text-sm text-neutral-darkest/70">
                    Start with a working draft. You'll review everything before creating a court-formatted version.
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-primary text-primary-foreground font-sans"
                  data-testid="button-create-document"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </div>
              {docsLoading ? (
                <div className="w-full py-12 text-center">
                  <p className="font-sans text-neutral-darkest/60">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">No Documents Yet</h2>
                  <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                    Create your first document using one of our legal templates.
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-primary text-primary-foreground font-sans"
                    data-testid="button-create-first-document"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </div>
              ) : (
                <div className="w-full grid gap-4">
                  {documents.map((doc) => (
                <Card key={doc.id} id={`doc-${doc.id}`} className="overflow-visible" data-testid={`card-document-${doc.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileType className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {renamingDocId === doc.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renamingDocTitle}
                              onChange={(e) => setRenamingDocTitle(e.target.value)}
                              className="h-8 text-sm flex-1"
                              maxLength={200}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && renamingDocTitle.trim()) {
                                  renameDocMutation.mutate({ docId: doc.id, title: renamingDocTitle.trim() });
                                  setRenamingDocId(null);
                                } else if (e.key === "Escape") {
                                  setRenamingDocId(null);
                                }
                              }}
                              data-testid={`input-rename-document-${doc.id}`}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                if (renamingDocTitle.trim()) {
                                  renameDocMutation.mutate({ docId: doc.id, title: renamingDocTitle.trim() });
                                  setRenamingDocId(null);
                                }
                              }}
                              disabled={renameDocMutation.isPending}
                              data-testid={`button-confirm-rename-${doc.id}`}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setRenamingDocId(null)}
                              data-testid={`button-cancel-rename-${doc.id}`}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group">
                            <h3
                              className="font-heading font-bold text-lg text-neutral-darkest truncate cursor-pointer"
                              onClick={() => openEditor(doc)}
                              data-testid={`text-document-title-${doc.id}`}
                            >
                              {doc.title}
                            </h3>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setRenamingDocId(doc.id);
                                setRenamingDocTitle(doc.title);
                              }}
                              data-testid={`button-rename-document-${doc.id}`}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <p className="font-sans text-xs text-neutral-darkest/60">
                          {getTemplateLabel(doc.templateKey)} | Updated {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditor(doc)}
                        title="Edit"
                        data-testid={`button-edit-document-${doc.id}`}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => duplicateMutation.mutate(doc.id)}
                        title="Duplicate"
                        disabled={duplicateMutation.isPending}
                        data-testid={`button-duplicate-document-${doc.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleExport(doc.id)}
                        title="Export to Word"
                        data-testid={`button-export-document-${doc.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteDocId(doc.id)}
                        title="Delete"
                        data-testid={`button-delete-document-${doc.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => addToTrialPrepMutation.mutate(doc)}
                        disabled={addToTrialPrepMutation.isPending}
                        title="Add to Trial Prep"
                        data-testid={`button-trial-prep-document-${doc.id}`}
                      >
                        <Scale className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="outline" className="mt-6">
              <OutlineBuilder caseId={caseId} />
            </TabsContent>

            <TabsContent value="court" className="mt-6">
              <CourtTemplates caseId={caseId} />
            </TabsContent>

            <TabsContent value="review" className="mt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Step 2: Review & Edit</h2>
                  <p className="font-sans text-sm text-neutral-darkest/70">
                    Review your information and make any changes before generating a court-formatted document.
                  </p>
                </div>
                <Button
                  onClick={() => setIsCourtDocDialogOpen(true)}
                  variant="outline"
                  className="font-sans"
                  data-testid="button-open-court-doc-dialog"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Prepare Court-Formatted DOCX
                </Button>
              </div>

              <div className="rounded-lg border border-neutral-light bg-white p-4">
                <p className="font-sans text-sm text-neutral-darkest/80 mb-2 font-medium">
                  What happens next:
                </p>
                <ol className="list-decimal pl-5 font-sans text-sm text-neutral-darkest/70 space-y-1">
                  <li>Select the document type (Declaration, Motion, Proposed Order, Certificate of Service)</li>
                  <li>Review and edit the court caption + your information</li>
                  <li>Confirm the date</li>
                  <li>Download the court-formatted DOCX</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="filing" className="mt-6">
              <div className="mb-4">
                <h2 className="font-heading font-bold text-xl text-neutral-darkest">Step 3: Court-Formatted Documents</h2>
                <p className="font-sans text-sm text-neutral-darkest/70">These documents are formatted for court. You can download them as needed.</p>
                <p className="font-sans text-xs text-neutral-darkest/60 mt-1">Civilla does not file documents with the court.</p>
              </div>
              {genDocsLoading ? (
                <div className="w-full py-12 text-center">
                  <p className="font-sans text-neutral-darkest/60">Loading history...</p>
                </div>
              ) : generatedDocuments.length === 0 ? (
                <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">No Court Filings Yet</h2>
                  <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                    Documents you generate and download will appear here for easy re-downloading.
                  </p>
                  <Button
                    onClick={() => { setDocStep("review"); }}
                    className="bg-primary text-primary-foreground font-sans"
                    data-testid="button-go-to-step-2"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Go to Step 2: Review
                  </Button>
                </div>
              ) : (
                <div className="w-full grid gap-4">
                  {generatedDocuments.map((genDoc) => (
                    <Card key={genDoc.id} className="overflow-visible" data-testid={`card-generated-doc-${genDoc.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileDown className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading font-bold text-lg text-neutral-darkest truncate" data-testid={`text-generated-doc-title-${genDoc.id}`}>
                              {genDoc.title}
                            </h3>
                            <p className="font-sans text-xs text-neutral-darkest/60">
                              Generated {formatDate(genDoc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRedownloadFromHistory(genDoc)}
                            data-testid={`button-redownload-${genDoc.id}`}
                          >
                            <FileDown className="w-4 h-4 mr-2" />
                            Download Court-Formatted DOCX
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setCreateMode("claims");
          setCompileClaimsTitle("");
          setCompileResult(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
            <DialogDescription>Create from a template or compile from your accepted claims.</DialogDescription>
          </DialogHeader>

          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "template" | "claims")} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template" data-testid="tab-create-template">
                <FileText className="w-4 h-4 mr-2" />
                From Template
              </TabsTrigger>
              <TabsTrigger value="claims" data-testid="tab-create-claims">
                <FileCheck className="w-4 h-4 mr-2" />
                Compile from Claims
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="doc-title">Title</Label>
                  <Input
                    id="doc-title"
                    placeholder="e.g., Motion to Modify Custody"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    maxLength={200}
                    data-testid="input-new-document-title"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="doc-template">Template</Label>
                  <Select value={newDocTemplate} onValueChange={setNewDocTemplate}>
                    <SelectTrigger id="doc-template" data-testid="select-document-template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.key} value={t.key} data-testid={`option-template-${t.key}`}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="claims" className="mt-4">
              <PhaseNotice caseId={caseId} />
              {compileResult ? (
                <div className="flex flex-col gap-4">
                  <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Document compiled successfully</p>
                    <div className="flex items-center gap-2 mt-2">
                      {isRenamingCompiled ? (
                        <>
                          <Input
                            value={compiledRenameTitle}
                            onChange={(e) => setCompiledRenameTitle(e.target.value)}
                            className="h-7 text-xs flex-1"
                            maxLength={200}
                            data-testid="input-rename-compiled"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (compileResult.documentId && compiledRenameTitle.trim()) {
                                renameDocMutation.mutate({ docId: compileResult.documentId, title: compiledRenameTitle.trim() });
                              }
                            }}
                            disabled={renameDocMutation.isPending || !compiledRenameTitle.trim()}
                            data-testid="button-save-rename"
                          >
                            {renameDocMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setIsRenamingCompiled(false);
                              setCompiledRenameTitle(compileResult.title || "");
                            }}
                            data-testid="button-cancel-rename"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">Saved as:</span>
                          <span className="text-xs font-medium">{compileResult.title || compileClaimsTitle}</span>
                          {compileResult.documentId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs ml-1"
                              onClick={() => {
                                setCompiledRenameTitle(compileResult.title || compileClaimsTitle);
                                setIsRenamingCompiled(true);
                              }}
                              data-testid="button-rename-compiled"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Traceability</p>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {compileResult.trace.map((entry, idx) => (
                          <div key={entry.claimId} className="border-b pb-2 last:border-b-0">
                            <p className="text-xs font-medium">
                              {idx + 1}. {entry.claimText.length > 100 ? entry.claimText.substring(0, 100) + "..." : entry.claimText}
                            </p>
                            {entry.citations.length > 0 && (
                              <div className="mt-1 pl-3 space-y-1">
                                {entry.citations.map((cit) => (
                                  <div key={cit.citationId} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{cit.evidenceName}</span>
                                    {cit.pointer.pageNumber && <span> (p.{cit.pointer.pageNumber})</span>}
                                    {cit.pointer.timestampSeconds && (
                                      <span> ({Math.floor(cit.pointer.timestampSeconds / 60)}:{(cit.pointer.timestampSeconds % 60).toString().padStart(2, "0")})</span>
                                    )}
                                    {cit.pointer.quote && (
                                      <p className="italic mt-0.5">"{cit.pointer.quote.length > 200 ? cit.pointer.quote.substring(0, 200) + "..." : cit.pointer.quote}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {entry.linkedTimelineEvents && entry.linkedTimelineEvents.length > 0 && (
                              <div className="mt-2 pl-3">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  Linked Timeline Events:
                                </p>
                                <div className="space-y-1">
                                  {entry.linkedTimelineEvents.map((event) => (
                                    <div key={event.eventId} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                                      <span className="font-medium">{event.eventDate}</span>
                                      {event.eventTitle && <span className="ml-1">— {event.eventTitle.length > 60 ? event.eventTitle.substring(0, 60) + "..." : event.eventTitle}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="compile-title">Document Title</Label>
                    <Input
                      id="compile-title"
                      placeholder="e.g., Statement of Facts"
                      value={compileClaimsTitle}
                      onChange={(e) => setCompileClaimsTitle(e.target.value)}
                      maxLength={200}
                      data-testid="input-compile-claims-title"
                    />
                  </div>

                  <div className="border rounded-lg p-3 bg-muted/50" data-testid="card-ready-to-draft-claims">
                    <p className="text-sm font-medium mb-3">Ready to Draft</p>
                    {preflightLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : preflightData ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium">Draft Readiness</span>
                          <Progress value={preflightData.readinessPercent || 0} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">{preflightData.readinessPercent || 0}%</span>
                        </div>
                        {(preflightData.readinessPercent || 0) < 60 && (
                          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>You'll get better output after reviewing suggested claims and sources.</span>
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {preflightData.totals.acceptedClaims >= 1 ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span>Accepted claims: {preflightData.totals.acceptedClaims}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {preflightData.totals.acceptedClaimsMissingCitations === 0 ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span>Claims missing citations: {preflightData.totals.acceptedClaimsMissingCitations}</span>
                            </div>
                            {preflightData.totals.acceptedClaimsMissingCitations > 0 && preflightData.missing.claimIdsMissingCitations.length > 0 && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={() => {
                                    window.open(`/app/cases/${caseId}/claims?filter=uncited`, "_blank");
                                  }}
                                  data-testid="button-show-uncited"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Show
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={() => bulkAutoAttachMutation.mutate(preflightData.missing.claimIdsMissingCitations)}
                                  disabled={bulkAutoAttaching}
                                  data-testid="button-bulk-auto-attach"
                                >
                                  {bulkAutoAttaching ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                  )}
                                  Auto-attach
                                </Button>
                              </div>
                            )}
                          </div>

                          {preflightData.totals.acceptedClaimsMissingInfoFlagged > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span>Claims flagged missing info: {preflightData.totals.acceptedClaimsMissingInfoFlagged} (warning)</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={() => {
                                  window.open(`/app/cases/${caseId}/claims?filter=missing-info`, "_blank");
                                }}
                                data-testid="button-show-missing-info"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            </div>
                          )}

                          {preflightData.totals.extractionCoverage !== undefined && preflightData.totals.extractionCoverage < 80 && (
                            <div className="flex items-center gap-2 text-xs">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span>Evidence extraction coverage: {preflightData.totals.extractionCoverage}% (warning)</span>
                            </div>
                          )}
                        </div>

                        <p className={`text-xs mt-2 pt-2 border-t ${preflightData.canCompile ? "text-green-600" : "text-red-600"}`}>
                          {preflightData.message}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Unable to check compile readiness</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setCompileResult(null);
              }}
              data-testid="button-cancel-create"
            >
              {compileResult ? "Close" : "Cancel"}
            </Button>
            {createMode === "template" ? (
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-primary text-primary-foreground"
                data-testid="button-confirm-create"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            ) : !compileResult && (
              <Button
                onClick={() => {
                  if (!compileClaimsTitle.trim()) {
                    toast({ title: "Please enter a title", variant: "destructive" });
                    return;
                  }
                  if (!preflightData?.canCompile) {
                    toast({ title: "Cannot compile", description: "Resolve issues in the checklist first", variant: "destructive" });
                    return;
                  }
                  const draftTopic = moduleKey ? getDraftTopicForModule(moduleKey) : (localStorage.getItem(`lastDraftTopic_${caseId}`) || "Compiled Summary");
                  compileClaimsMutation.mutate({ title: compileClaimsTitle, draftTopic });
                }}
                disabled={compileClaimsMutation.isPending || !preflightData?.canCompile}
                className="bg-primary text-primary-foreground"
                data-testid="button-compile-claims"
              >
                {compileClaimsMutation.isPending ? "Compiling..." : `Compile ${preflightData?.totals.acceptedClaims || 0} Claims`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Make changes and save when ready.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={200}
                data-testid="input-edit-document-title"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 overflow-hidden">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 min-h-[300px] resize-none font-mono text-sm"
                data-testid="textarea-edit-document-content"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => editingDoc && handleExport(editingDoc.id)}
              data-testid="button-export-from-editor"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Word
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingDoc(null)} data-testid="button-cancel-edit">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-primary text-primary-foreground"
                data-testid="button-save-document"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId && deleteMutation.mutate(deleteDocId)}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCourtDocDialogOpen} onOpenChange={setIsCourtDocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Court Document</DialogTitle>
            <DialogDescription>Select a court document template to download in DOCX format.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-doc-type">Document Type</Label>
              <Select value={selectedCourtDocType} onValueChange={setSelectedCourtDocType}>
                <SelectTrigger id="court-doc-type" data-testid="select-court-doc-type">
                  <SelectValue placeholder="Select a document type" />
                </SelectTrigger>
                <SelectContent>
                  {courtDocOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} data-testid={`option-court-doc-${opt.value}`}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourtDocType && (
              <div className="border rounded-lg p-3 bg-muted/50" data-testid="card-ready-to-draft">
                <p className="text-sm font-medium mb-2">Ready to Draft</p>
                {templatePreflightLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : templatePreflightData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Readiness</span>
                      <Progress value={templatePreflightData.readinessScore} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{templatePreflightData.readinessScore}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {templatePreflightData.filledFieldsCount === templatePreflightData.requiredFieldsCount ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>Fields: {templatePreflightData.filledFieldsCount}/{templatePreflightData.requiredFieldsCount} filled</span>
                    </div>
                    {templatePreflightData.missingFields.length > 0 && (
                      <div className="text-xs text-muted-foreground pl-5">
                        Missing: {templatePreflightData.missingFields.map(f => f.split('.').pop()).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      {templatePreflightData.guardrailsPassed ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>Citation-backed facts: {templatePreflightData.citationBackedCount}</span>
                    </div>
                    {!templatePreflightData.guardrailsPassed && (
                      <p className="text-xs text-amber-600 mt-1">Add evidence citations to improve your document.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Unable to check readiness</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCourtDocDialogOpen(false);
                setSelectedCourtDocType("");
              }}
              data-testid="button-cancel-court-doc"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedCourtDocType && openReviewModal(selectedCourtDocType as CourtDocType)}
              disabled={!selectedCourtDocType}
              className="bg-primary text-primary-foreground"
              data-testid="button-confirm-court-doc"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Review & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAutofillConsentModal} onOpenChange={(open) => {
        if (!open) {
          setShowAutofillConsentModal(false);
          setPendingDocType(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Use Saved Information?</DialogTitle>
            <DialogDescription>
              Would you like to automatically fill in your name, address, and contact details from your saved profile?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-neutral-darkest/70">
              This setting will be remembered for future documents. You can change it anytime from the document review screen.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleAutofillConsentDecline}
              disabled={updateProfileMutation.isPending}
              data-testid="button-decline-autofill"
            >
              Not Now
            </Button>
            <Button
              onClick={handleAutofillConsentAccept}
              disabled={updateProfileMutation.isPending}
              className="bg-primary text-primary-foreground"
              data-testid="button-accept-autofill"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Use Autofill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReviewModalOpen(false);
          setReviewPayload(null);
          setReviewDocType(null);
          setEditableBody([]);
          setDateConfirmed(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Step 2 of 3: Review & Confirm</DialogTitle>
            <DialogDescription>
              Review and confirm these details before generating your court-formatted DOCX.
            </DialogDescription>
          </DialogHeader>
          {reviewPayload && (
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between p-3 bg-neutral-lightest rounded-md border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autofill-toggle"
                      checked={autofillToggle}
                      onCheckedChange={(checked) => handleAutofillToggleChange(!!checked)}
                      data-testid="checkbox-autofill-toggle"
                    />
                    <Label htmlFor="autofill-toggle" className="text-sm cursor-pointer">
                      Use saved info for auto-fill
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Filing as:</Label>
                    <Select value={selectedRole} onValueChange={(val) => handleRoleChange(val as "self_represented" | "attorney")}>
                      <SelectTrigger className="w-[160px]" data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_represented">Self-Represented</SelectItem>
                        <SelectItem value="attorney">Attorney</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>County</Label>
                    <Input
                      value={reviewPayload.court.county}
                      onChange={(e) => setReviewPayload({
                        ...reviewPayload,
                        court: { ...reviewPayload.court, county: e.target.value }
                      })}
                      data-testid="input-review-county"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>State</Label>
                    <Input
                      value={reviewPayload.court.state}
                      onChange={(e) => setReviewPayload({
                        ...reviewPayload,
                        court: { ...reviewPayload.court, state: e.target.value }
                      })}
                      data-testid="input-review-state"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Case Number</Label>
                  <Input
                    value={reviewPayload.case.caseNumber}
                    onChange={(e) => setReviewPayload({
                      ...reviewPayload,
                      case: { ...reviewPayload.case, caseNumber: e.target.value }
                    })}
                    data-testid="input-review-case-number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Petitioner</Label>
                    <Input
                      value={reviewPayload.parties.petitioner || ""}
                      onChange={(e) => setReviewPayload({
                        ...reviewPayload,
                        parties: { ...reviewPayload.parties, petitioner: e.target.value }
                      })}
                      data-testid="input-review-petitioner"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Respondent</Label>
                    <Input
                      value={reviewPayload.parties.respondent || ""}
                      onChange={(e) => setReviewPayload({
                        ...reviewPayload,
                        parties: { ...reviewPayload.parties, respondent: e.target.value }
                      })}
                      data-testid="input-review-respondent"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Your Information</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Full Name</Label>
                      <Input
                        value={reviewPayload.filer.fullName}
                        onChange={(e) => setReviewPayload({
                          ...reviewPayload,
                          filer: { ...reviewPayload.filer, fullName: e.target.value }
                        })}
                        data-testid="input-review-filer-name"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Address</Label>
                      <Input
                        value={reviewPayload.filer.addressLine1}
                        onChange={(e) => setReviewPayload({
                          ...reviewPayload,
                          filer: { ...reviewPayload.filer, addressLine1: e.target.value }
                        })}
                        data-testid="input-review-filer-address"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-2">
                        <Label>City</Label>
                        <Input
                          value={reviewPayload.filer.city || ""}
                          onChange={(e) => setReviewPayload({
                            ...reviewPayload,
                            filer: { ...reviewPayload.filer, city: e.target.value }
                          })}
                          data-testid="input-review-filer-city"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>State</Label>
                        <Input
                          value={reviewPayload.filer.state || ""}
                          onChange={(e) => setReviewPayload({
                            ...reviewPayload,
                            filer: { ...reviewPayload.filer, state: e.target.value }
                          })}
                          data-testid="input-review-filer-state"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>ZIP</Label>
                        <Input
                          value={reviewPayload.filer.zip || ""}
                          onChange={(e) => setReviewPayload({
                            ...reviewPayload,
                            filer: { ...reviewPayload.filer, zip: e.target.value }
                          })}
                          data-testid="input-review-filer-zip"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Phone</Label>
                        <Input
                          value={reviewPayload.filer.phone || ""}
                          onChange={(e) => setReviewPayload({
                            ...reviewPayload,
                            filer: { ...reviewPayload.filer, phone: e.target.value }
                          })}
                          data-testid="input-review-filer-phone"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Email</Label>
                        <Input
                          value={reviewPayload.filer.email || ""}
                          onChange={(e) => setReviewPayload({
                            ...reviewPayload,
                            filer: { ...reviewPayload.filer, email: e.target.value }
                          })}
                          data-testid="input-review-filer-email"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRole === "attorney" && (
                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm font-medium mb-3">Attorney Information</p>
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Bar Number</Label>
                          <Input
                            value={attorneyBarNumber}
                            onChange={(e) => {
                              setAttorneyBarNumber(e.target.value);
                              if (reviewPayload) {
                                setReviewPayload({
                                  ...reviewPayload,
                                  filer: {
                                    ...reviewPayload.filer,
                                    attorney: {
                                      ...reviewPayload.filer.attorney,
                                      barNumber: e.target.value,
                                      name: reviewPayload.filer.fullName,
                                      firm: attorneyFirmName,
                                      email: reviewPayload.filer.email,
                                      phone: reviewPayload.filer.phone,
                                      address: reviewPayload.filer.addressLine1,
                                    },
                                  },
                                });
                              }
                            }}
                            placeholder="e.g., 12345"
                            data-testid="input-attorney-bar-number"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Firm Name</Label>
                          <Input
                            value={attorneyFirmName}
                            onChange={(e) => {
                              setAttorneyFirmName(e.target.value);
                              if (reviewPayload) {
                                setReviewPayload({
                                  ...reviewPayload,
                                  filer: {
                                    ...reviewPayload.filer,
                                    attorney: {
                                      ...reviewPayload.filer.attorney,
                                      firm: e.target.value,
                                      name: reviewPayload.filer.fullName,
                                      barNumber: attorneyBarNumber,
                                      email: reviewPayload.filer.email,
                                      phone: reviewPayload.filer.phone,
                                      address: reviewPayload.filer.addressLine1,
                                    },
                                  },
                                });
                              }
                            }}
                            placeholder="e.g., Smith & Associates"
                            data-testid="input-attorney-firm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium mb-3 hover-elevate p-1 rounded"
                    onClick={() => setIsBodyExpanded(!isBodyExpanded)}
                    data-testid="button-toggle-body-edit"
                  >
                    {isBodyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Edit Document Body ({editableBody.length} paragraphs)
                  </button>
                  {isBodyExpanded && (
                    <div className="flex flex-col gap-2">
                      {editableBody.map((para, idx) => (
                        <Textarea
                          key={idx}
                          value={para}
                          onChange={(e) => {
                            const newBody = [...editableBody];
                            newBody[idx] = e.target.value;
                            setEditableBody(newBody);
                          }}
                          className="min-h-[60px]"
                          data-testid={`textarea-body-paragraph-${idx}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mt-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Document Date</Label>
                      <Input
                        value={reviewPayload.date}
                        onChange={(e) => {
                          setReviewPayload({
                            ...reviewPayload,
                            date: e.target.value
                          });
                          setDateConfirmed(false);
                        }}
                        data-testid="input-review-date"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-neutral-lightest rounded-md border">
                      <Checkbox
                        id="date-confirm"
                        checked={dateConfirmed}
                        onCheckedChange={(checked) => setDateConfirmed(!!checked)}
                        data-testid="checkbox-date-confirm"
                      />
                      <Label htmlFor="date-confirm" className="text-sm cursor-pointer">
                        I confirm the date is correct
                      </Label>
                    </div>
                    {!dateConfirmed && (
                      <p className="text-sm text-amber-600">
                        Please confirm the date is correct before downloading.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewModalOpen(false);
                setReviewPayload(null);
                setReviewDocType(null);
                setEditableBody([]);
                setDateConfirmed(false);
              }}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalDownload}
              disabled={isDownloadingCourtDoc || !dateConfirmed}
              className="bg-primary text-primary-foreground"
              data-testid="button-download-final"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isDownloadingCourtDoc ? "Downloading..." : "Download Court-Formatted DOCX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAutoFillModalOpen} onOpenChange={setIsAutoFillModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Auto-Fill Your Information</DialogTitle>
            <DialogDescription>
              Save your contact details to automatically fill them into documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-fullName">Full Legal Name</Label>
              <Input
                id="autofill-fullName"
                placeholder="John Doe"
                value={autoFillFormData.fullName || ""}
                onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                data-testid="input-autofill-fullname"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-email">Email</Label>
              <Input
                id="autofill-email"
                type="email"
                placeholder="john@example.com"
                value={autoFillFormData.email || ""}
                onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, email: e.target.value }))}
                data-testid="input-autofill-email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-addressLine1">Address Line 1</Label>
              <Input
                id="autofill-addressLine1"
                placeholder="123 Main Street"
                value={autoFillFormData.addressLine1 || ""}
                onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                data-testid="input-autofill-address1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="autofill-addressLine2"
                placeholder="Apt 4B"
                value={autoFillFormData.addressLine2 || ""}
                onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, addressLine2: e.target.value }))}
                data-testid="input-autofill-address2"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="autofill-city">City</Label>
                <Input
                  id="autofill-city"
                  placeholder="Boise"
                  value={autoFillFormData.city || ""}
                  onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, city: e.target.value }))}
                  data-testid="input-autofill-city"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="autofill-state">State</Label>
                <Input
                  id="autofill-state"
                  placeholder="ID"
                  value={autoFillFormData.state || ""}
                  onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, state: e.target.value }))}
                  data-testid="input-autofill-state"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="autofill-zip">ZIP</Label>
                <Input
                  id="autofill-zip"
                  placeholder="83702"
                  value={autoFillFormData.zip || ""}
                  onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, zip: e.target.value }))}
                  data-testid="input-autofill-zip"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-phone">Phone</Label>
              <Input
                id="autofill-phone"
                type="tel"
                placeholder="(208) 555-1234"
                value={autoFillFormData.phone || ""}
                onChange={(e) => setAutoFillFormData((prev) => ({ ...prev, phone: e.target.value }))}
                data-testid="input-autofill-phone"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="autofill-partyRole">Your Role in Case</Label>
              <Select
                value={autoFillFormData.partyRole || "petitioner"}
                onValueChange={(val) => setAutoFillFormData((prev) => ({ ...prev, partyRole: val }))}
              >
                <SelectTrigger id="autofill-partyRole" data-testid="select-autofill-partyrole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petitioner">Petitioner</SelectItem>
                  <SelectItem value="respondent">Respondent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="autofill-selfRep"
                checked={autoFillFormData.isSelfRepresented ?? true}
                onCheckedChange={(checked) =>
                  setAutoFillFormData((prev) => ({ ...prev, isSelfRepresented: !!checked }))
                }
                data-testid="checkbox-autofill-selfrep"
              />
              <Label htmlFor="autofill-selfRep" className="text-sm">
                I am representing myself (Pro Se)
              </Label>
            </div>
            <div className="flex items-center gap-2 border-t pt-4 mt-2">
              <Checkbox
                id="dontAskAgain"
                checked={dontAskAgain}
                onCheckedChange={(checked) => setDontAskAgain(!!checked)}
                data-testid="checkbox-dont-ask-again"
              />
              <Label htmlFor="dontAskAgain" className="text-sm text-muted-foreground">
                Don't ask me again
              </Label>
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between gap-2">
            <Button variant="outline" onClick={handleSkipAutoFill} data-testid="button-skip-autofill">
              Skip
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="bg-primary text-primary-foreground"
              data-testid="button-save-autofill"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
