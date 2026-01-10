import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle, AlertTriangle, FileText, Download, Eye, Loader2, Scale, List, FileCheck, BookOpen, MessageSquare, Users, TrendingUp, Briefcase, Sparkles, Lightbulb, MapPin, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import AutoFillPreview from "./AutoFillPreview";
import FieldMappingPanel from "./FieldMappingPanel";
import FormPackFinder from "./FormPackFinder";

interface TemplateDefinition {
  templateKey: string;
  displayName: string;
  category: string;
  description: string;
  educationalOnly: boolean;
  requiredCitationCount: number;
  allowMissingInfoClaims: boolean;
}

interface TemplateCategory {
  label: string;
  description: string;
}

interface PreflightResult {
  canCompile: boolean;
  acceptedClaimsCount: number;
  includedClaimsCount: number;
  claimsWithCitationsCount: number;
  claimsMissingCitations: Array<{ id: string; claimText: string }>;
  claimsWithMissingInfo: Array<{ id: string; claimText: string }>;
  extractionCoveragePercent: number;
  warnings: string[];
  errors: string[];
}

interface CompileResult {
  ok: boolean;
  markdown?: string;
  sources?: Array<{ evidenceFileId: string; fileName: string; exhibitLabel: string; pagesReferenced: number[] }>;
  stats?: { totalClaimsIncluded: number; totalCitations: number; sectionsGenerated: number };
  document?: { title: string; markdown: string };
  errors?: string[];
}

interface CourtTemplatesProps {
  caseId: string;
}

const CATEGORY_ICONS: Record<string, typeof Scale> = {
  declarations: Scale,
  procedural: FileCheck,
  evidence: List,
  communications: MessageSquare,
  parenting: Users,
  patterns: TrendingUp,
  courtroom: Briefcase,
};

export default function CourtTemplates({ caseId }: CourtTemplatesProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [includeEvidenceFacts, setIncludeEvidenceFacts] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [showFormFinder, setShowFormFinder] = useState(false);

  const { data: templatesData } = useQuery<{ templates: TemplateDefinition[]; categories: Record<string, TemplateCategory> }>({
    queryKey: ["/api/templates"],
  });

  const { data: preflightData, isLoading: preflightLoading, refetch: refetchPreflight } = useQuery<PreflightResult>({
    queryKey: ["/api/cases", caseId, "templates", "preflight", selectedTemplate?.templateKey],
    enabled: !!selectedTemplate,
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/templates/preflight?templateKey=${selectedTemplate?.templateKey}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch preflight");
      return res.json();
    },
  });

  const compileMutation = useMutation({
    mutationFn: async ({ templateKey, title, options }: { templateKey: string; title: string; options?: { includeEvidenceFacts?: boolean } }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/documents/compile-template`, {
        templateKey,
        title,
        options,
      });
      return res.json() as Promise<CompileResult>;
    },
    onSuccess: (data) => {
      if (data.ok && data.markdown) {
        setPreviewMarkdown(data.markdown);
        setIsPreviewOpen(true);
        toast({ title: "Document compiled", description: `${data.stats?.totalClaimsIncluded || 0} claims included` });
      } else {
        toast({ title: "Compilation failed", description: data.errors?.join(", ") || "Unknown error", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Compilation failed", description: error.message, variant: "destructive" });
    },
  });

  const templates = templatesData?.templates || [];
  const categories = templatesData?.categories || {};

  const templatesByCategory: Record<string, TemplateDefinition[]> = {};
  for (const template of templates) {
    if (!templatesByCategory[template.category]) {
      templatesByCategory[template.category] = [];
    }
    templatesByCategory[template.category].push(template);
  }

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const handleSelectTemplate = (template: TemplateDefinition) => {
    setSelectedTemplate(template);
    setDocumentTitle(`${template.displayName} - ${new Date().toLocaleDateString()}`);
    setPreviewMarkdown(null);
    setShowAutoFill(false);
    setShowFieldMapping(false);
  };

  const handleAutoFillApply = (sections: Array<{ sectionKey: string; title: string; contentMarkdown: string }>) => {
    const combinedContent = sections
      .filter(s => s.contentMarkdown)
      .map(s => `## ${s.title}\n\n${s.contentMarkdown}`)
      .join("\n\n");
    setPreviewMarkdown(combinedContent);
    setIsPreviewOpen(true);
    setShowAutoFill(false);
  };

  const handleCompile = () => {
    if (!selectedTemplate || !documentTitle.trim()) return;
    compileMutation.mutate({
      templateKey: selectedTemplate.templateKey,
      title: documentTitle.trim(),
      options: { includeEvidenceFacts },
    });
  };

  const handleDownload = () => {
    if (!previewMarkdown) return;
    const blob = new Blob([previewMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Document saved as Markdown file" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-xl text-neutral-darkest">Court Templates</h2>
        <p className="font-sans text-sm text-neutral-darkest/70">
          Generate court-ready documents from your accepted claims and citations. All documents compile only from evidence-backed facts.
        </p>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <Button
          variant={showFormFinder ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFormFinder(!showFormFinder)}
          data-testid="button-toggle-form-finder"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Official Court Forms
        </Button>
      </div>

      {showFormFinder && (
        <FormPackFinder />
      )}

      {!selectedTemplate ? (
        <Accordion type="multiple" defaultValue={Object.keys(templatesByCategory)} className="space-y-2">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span className="font-semibold">{categories[category]?.label || category}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {categoryTemplates.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3">
                  {categoryTemplates.map((template) => (
                    <Card
                      key={template.templateKey}
                      className="hover-elevate cursor-pointer transition-all border"
                      onClick={() => handleSelectTemplate(template)}
                      data-testid={`template-${template.templateKey}`}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium">{template.displayName}</CardTitle>
                          {template.educationalOnly && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              <BookOpen className="w-3 h-3 mr-1" />
                              Org Only
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-0 px-4 pb-3">
                        <CardDescription className="text-xs line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(null);
              setPreviewMarkdown(null);
            }}
            data-testid="button-back-to-templates"
          >
            ← Back to templates
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(selectedTemplate.category)}
                  <CardTitle>{selectedTemplate.displayName}</CardTitle>
                </div>
                {selectedTemplate.educationalOnly && (
                  <Badge variant="outline">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Educational / Organizational Only
                  </Badge>
                )}
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

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <div>
                    <Label htmlFor="include-facts" className="text-sm font-medium cursor-pointer">
                      Include Evidence Facts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Add extracted facts summary to the document
                    </p>
                  </div>
                </div>
                <Switch
                  id="include-facts"
                  checked={includeEvidenceFacts}
                  onCheckedChange={setIncludeEvidenceFacts}
                  data-testid="switch-include-facts"
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{preflightData.acceptedClaimsCount} accepted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{preflightData.includedClaimsCount} included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{preflightData.claimsWithCitationsCount} cited</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{preflightData.extractionCoveragePercent}% coverage</span>
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
                        <ScrollArea className="h-20 border rounded p-2">
                          {preflightData.claimsMissingCitations.slice(0, 5).map((claim) => (
                            <div key={claim.id} className="text-xs text-muted-foreground py-1 border-b last:border-0">
                              {claim.claimText.substring(0, 80)}...
                            </div>
                          ))}
                          {preflightData.claimsMissingCitations.length > 5 && (
                            <div className="text-xs text-muted-foreground py-1">
                              ...and {preflightData.claimsMissingCitations.length - 5} more
                            </div>
                          )}
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

              <div className="flex gap-2 flex-wrap">
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
                <Button
                  variant="outline"
                  onClick={() => setShowAutoFill(!showAutoFill)}
                  data-testid="button-toggle-autofill"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {showAutoFill ? "Hide Auto-Fill" : "Auto-Fill from Evidence"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFieldMapping(!showFieldMapping)}
                  data-testid="button-toggle-field-mapping"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {showFieldMapping ? "Hide Suggestions" : "View Field Suggestions"}
                </Button>
              </div>

              {showFieldMapping && (
                <FieldMappingPanel
                  caseId={caseId}
                  templateKey={selectedTemplate.templateKey}
                />
              )}

              {showAutoFill && (
                <AutoFillPreview
                  caseId={caseId}
                  templateKey={selectedTemplate.templateKey}
                  templateLabel={selectedTemplate.displayName}
                  readinessPercent={preflightData?.extractionCoveragePercent || 0}
                  citedClaimsCount={preflightData?.claimsWithCitationsCount || 0}
                  onApply={handleAutoFillApply}
                  onClose={() => setShowAutoFill(false)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {documentTitle}
            </DialogTitle>
            <DialogDescription>
              Review your compiled document. Citation markers are shown in brackets.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 border rounded-lg p-4 bg-white">
            {previewMarkdown && (
              <article className="prose prose-sm max-w-none">
                <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
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
