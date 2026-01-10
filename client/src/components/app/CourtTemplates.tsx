import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, AlertTriangle, FileText, Download, Eye, Loader2, Scale, List, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CourtTemplateConfig, CompilePreflightResult, CompiledCourtDocument } from "@shared/courtTemplates";
import ReactMarkdown from "react-markdown";

interface CourtTemplatesProps {
  caseId: string;
}

export default function CourtTemplates({ caseId }: CourtTemplatesProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<CourtTemplateConfig | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [previewDocument, setPreviewDocument] = useState<CompiledCourtDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: templatesData } = useQuery<{ templates: CourtTemplateConfig[] }>({
    queryKey: ["/api/court-templates"],
  });

  const { data: preflightData, isLoading: preflightLoading, refetch: refetchPreflight } = useQuery<CompilePreflightResult>({
    queryKey: ["/api/cases", caseId, "court-templates", "preflight", selectedTemplate?.templateKey],
    enabled: !!selectedTemplate,
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/court-templates/preflight?templateKey=${selectedTemplate?.templateKey}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch preflight");
      return res.json();
    },
  });

  const compileMutation = useMutation({
    mutationFn: async ({ templateKey, title }: { templateKey: string; title: string }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/court-templates/compile`, {
        templateKey,
        title,
      });
      return res.json() as Promise<{ document: CompiledCourtDocument }>;
    },
    onSuccess: (data) => {
      setPreviewDocument(data.document);
      setIsPreviewOpen(true);
      toast({ title: "Document compiled", description: "Review your document before downloading" });
    },
    onError: (error: Error) => {
      toast({ title: "Compilation failed", description: error.message, variant: "destructive" });
    },
  });

  const templates = templatesData?.templates || [];

  const getTemplateIcon = (key: string) => {
    switch (key) {
      case "declaration": return <Scale className="w-5 h-5" />;
      case "statement_of_facts": return <FileText className="w-5 h-5" />;
      case "exhibit_index": return <List className="w-5 h-5" />;
      default: return <FileCheck className="w-5 h-5" />;
    }
  };

  const handleSelectTemplate = (template: CourtTemplateConfig) => {
    setSelectedTemplate(template);
    setDocumentTitle(`${template.displayName} - ${new Date().toLocaleDateString()}`);
  };

  const handleCompile = () => {
    if (!selectedTemplate || !documentTitle.trim()) return;
    compileMutation.mutate({
      templateKey: selectedTemplate.templateKey,
      title: documentTitle.trim(),
    });
  };

  const handleDownload = () => {
    if (!previewDocument) return;
    const blob = new Blob([previewDocument.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${previewDocument.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Document saved as Markdown file" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl text-neutral-darkest">Court Templates</h2>
        <p className="font-sans text-sm text-neutral-darkest/70">
          Generate court-ready documents from your accepted claims and citations
        </p>
      </div>

      {!selectedTemplate ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.templateKey}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => handleSelectTemplate(template)}
              data-testid={`template-${template.templateKey}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {getTemplateIcon(template.templateKey)}
                  <CardTitle className="text-base">{template.displayName}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    Min {template.requiredCitationCount} citation/claim
                  </Badge>
                  {template.allowMissingInfoClaims && (
                    <Badge variant="outline" className="text-xs">
                      Allows flagged claims
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(null);
              setPreviewDocument(null);
            }}
            data-testid="button-back-to-templates"
          >
            ← Back to templates
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {getTemplateIcon(selectedTemplate.templateKey)}
                <CardTitle>{selectedTemplate.displayName}</CardTitle>
              </div>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Document Title</Label>
                <Input
                  id="doc-title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title..."
                  data-testid="input-document-title"
                />
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Preflight Check
                </h3>

                {preflightLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking claims and citations...
                  </div>
                ) : preflightData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{preflightData.acceptedClaimsCount} accepted claims</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{preflightData.claimsWithCitationsCount} with citations</span>
                      </div>
                    </div>

                    {preflightData.errors.length > 0 && (
                      <div className="space-y-2">
                        {preflightData.errors.map((error, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {preflightData.warnings.length > 0 && (
                      <div className="space-y-2">
                        {preflightData.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {preflightData.claimsMissingCitations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-destructive">Claims missing citations:</p>
                        <ScrollArea className="h-24 border rounded p-2">
                          {preflightData.claimsMissingCitations.map((claim) => (
                            <div key={claim.id} className="text-xs text-muted-foreground py-1 border-b last:border-0">
                              {claim.claimText.substring(0, 100)}...
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {preflightData.canCompile ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready to compile
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Cannot compile
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => refetchPreflight()}
                        data-testid="button-refresh-preflight"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCompile}
                  disabled={!preflightData?.canCompile || !documentTitle.trim() || compileMutation.isPending}
                  data-testid="button-compile-document"
                >
                  {compileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Document
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {previewDocument?.title}
            </DialogTitle>
            <DialogDescription>
              Review your compiled document. Citation markers are shown in brackets.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 border rounded-lg p-4 bg-white">
            {previewDocument && (
              <article className="prose prose-sm max-w-none">
                <ReactMarkdown>{previewDocument.markdown}</ReactMarkdown>
              </article>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} data-testid="button-download-document">
              <Download className="w-4 h-4 mr-2" />
              Download Markdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
