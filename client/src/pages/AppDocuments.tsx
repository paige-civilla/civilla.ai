import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, FileText, Briefcase, Plus, Copy, Trash2, Download, Save, X, FileType, FileDown } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Case, Document } from "@shared/schema";

interface DocumentTemplate {
  key: string;
  title: string;
}

export default function AppDocuments() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocTemplate, setNewDocTemplate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;

  const { data: templatesData } = useQuery<{ templates: DocumentTemplate[] }>({
    queryKey: ["/api/document-templates"],
    enabled: !!currentCase,
  });

  const { data: documentsData, isLoading: docsLoading } = useQuery<{ documents: Document[] }>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!currentCase,
  });

  const templates = templatesData?.templates || [];
  const documents = documentsData?.documents || [];

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

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; templateKey: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/documents`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      setIsCreateDialogOpen(false);
      setNewDocTitle("");
      setNewDocTemplate("");
      toast({ title: "Document created" });
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

  const [isDownloadingCourtDoc, setIsDownloadingCourtDoc] = useState(false);
  const [isCourtDocDialogOpen, setIsCourtDocDialogOpen] = useState(false);
  const [selectedCourtDocType, setSelectedCourtDocType] = useState("");

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
        "[Name]",
        "[Address]",
        "via [ ] U.S. Mail  [ ] Hand Delivery  [ ] Email  [ ] Other: __________",
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

  const handleDownloadCourtFormat = async (docType: CourtDocType) => {
    if (!currentCase) return;
    setIsDownloadingCourtDoc(true);
    try {
      const template = courtDocTemplates[docType];
      const payload = {
        court: {
          district: "Seventh",
          county: currentCase.county || "Bonneville",
          state: currentCase.state || "Idaho",
        },
        case: {
          caseNumber: currentCase.caseNumber || "CV10-XX-XXXX",
        },
        parties: {
          petitioner: "[Petitioner Name]",
          respondent: "[Respondent Name]",
        },
        document: {
          title: template.title,
          subtitle: "",
        },
        contactBlock: {
          isRepresented: false,
          name: "[Your Full Name]",
          address: "[Your Address, City, State ZIP]",
          phone: "",
          email: "[your.email@example.com]",
          barNumber: "",
          firm: "",
        },
        body: {
          paragraphs: template.body,
        },
        signature: {
          datedLine: "DATED this __ day of ______, 2025.",
          signerName: "[Your Full Name]",
          signerTitle: "Petitioner, Pro Se",
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
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }

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
      setIsCourtDocDialogOpen(false);
      setSelectedCourtDocType("");
    } catch (error) {
      toast({ title: "Failed to download court document", variant: "destructive" });
    } finally {
      setIsDownloadingCourtDoc(false);
    }
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
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Documents</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-darkest/60">
                {currentCase.state && <span>{currentCase.state}</span>}
                {currentCase.county && <span>{currentCase.county}</span>}
                {currentCase.caseType && <span>{currentCase.caseType}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsCourtDocDialogOpen(true)}
                variant="outline"
                className="font-sans"
                data-testid="button-download-court-docx"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download DOCX (Court Format)
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-bush text-white font-sans"
                data-testid="button-create-document"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>

          {docsLoading ? (
            <div className="w-full py-12 text-center">
              <p className="font-sans text-neutral-darkest/60">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-bush/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-bush" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">No Documents Yet</h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-4">
                Create your first document using one of our legal templates.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-bush text-white font-sans"
                data-testid="button-create-first-document"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
          ) : (
            <div className="w-full grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="overflow-visible" data-testid={`card-document-${doc.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded bg-bush/10 flex items-center justify-center flex-shrink-0">
                        <FileType className="w-5 h-5 text-bush" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-heading font-bold text-lg text-neutral-darkest truncate cursor-pointer"
                          onClick={() => openEditor(doc)}
                          data-testid={`text-document-title-${doc.id}`}
                        >
                          {doc.title}
                        </h3>
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
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
            <DialogDescription>Choose a template and give your document a title.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-bush text-white"
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
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
                className="bg-bush text-white"
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
              onClick={() => selectedCourtDocType && handleDownloadCourtFormat(selectedCourtDocType as CourtDocType)}
              disabled={!selectedCourtDocType || isDownloadingCourtDoc}
              className="bg-bush text-white"
              data-testid="button-confirm-court-doc"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isDownloadingCourtDoc ? "Downloading..." : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
