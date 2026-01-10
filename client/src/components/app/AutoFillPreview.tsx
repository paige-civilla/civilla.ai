import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileText, Link as LinkIcon, Loader2, Copy, X, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AutoFillSection {
  sectionKey: string;
  title: string;
  contentMarkdown: string;
  usedClaimIds: string[];
  usedCitationIds: string[];
  missingEvidence: boolean;
  missingReason?: string;
}

interface AutoFillSource {
  evidenceId: string;
  fileName: string;
  citations: Array<{
    citationId: string;
    pageNumber?: number;
    quoteSnippet?: string;
  }>;
}

interface AutoFillResponse {
  ok: boolean;
  templateKey: string;
  sections: AutoFillSection[];
  sources: AutoFillSource[];
}

interface AutoFillPreviewProps {
  caseId: string;
  templateKey: string;
  templateLabel: string;
  readinessPercent: number;
  citedClaimsCount: number;
  onApply: (sections: AutoFillSection[]) => void;
  onClose: () => void;
}

export default function AutoFillPreview({
  caseId,
  templateKey,
  templateLabel,
  readinessPercent,
  citedClaimsCount,
  onApply,
  onClose,
}: AutoFillPreviewProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);
  const [editedSections, setEditedSections] = useState<Set<string>>(new Set());

  const canAutofill = readinessPercent >= 60 && citedClaimsCount >= 5;

  const autofillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/documents/autofill`, {
        templateKey,
        scope: "all",
        maxSections: 12,
      });
      return res.json() as Promise<AutoFillResponse>;
    },
    onSuccess: (data) => {
      if (data.ok) {
        toast({ title: "Auto-fill complete", description: `Generated ${data.sections.length} sections` });
        setExpandedSections(new Set(data.sections.map(s => s.sectionKey)));
      }
    },
    onError: (error: Error) => {
      toast({ title: "Auto-fill failed", description: error.message, variant: "destructive" });
    },
  });

  const result = autofillMutation.data;

  const handleCopySection = (section: AutoFillSection) => {
    navigator.clipboard.writeText(section.contentMarkdown);
    toast({ title: "Copied", description: `${section.title} content copied to clipboard` });
  };

  const handleApply = () => {
    if (result?.sections) {
      onApply(result.sections);
    }
  };

  const toggleSection = (sectionKey: string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionKey)) {
      next.delete(sectionKey);
    } else {
      next.add(sectionKey);
    }
    setExpandedSections(next);
  };

  const sectionsWithContent = result?.sections.filter(s => !s.missingEvidence) || [];
  const sectionsMissing = result?.sections.filter(s => s.missingEvidence) || [];
  const totalClaimsUsed = sectionsWithContent.reduce((acc, s) => acc + s.usedClaimIds.length, 0);

  if (!canAutofill) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4" />
            Auto-Fill from Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-100/50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Auto-fill requires at least 60% readiness and 5 cited claims.
              <br />
              Current: {readinessPercent}% readiness, {citedClaimsCount} cited claims.
              <br />
              <a href={`/app/cases/${caseId}/evidence`} className="underline font-medium">
                Go to Evidence → Claims
              </a>{" "}
              to review and cite more claims.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            Auto-Fill from Evidence
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-autofill">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Pre-populate sections using only accepted claims with citations. No fabricated facts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">{readinessPercent}% ready</Badge>
              <Badge variant="outline">{citedClaimsCount} cited claims</Badge>
            </div>
            <Button
              onClick={() => autofillMutation.mutate()}
              disabled={autofillMutation.isPending}
              className="w-full"
              data-testid="button-generate-autofill"
            >
              {autofillMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Auto-Fill for {templateLabel}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                {sectionsWithContent.length} sections filled
              </Badge>
              <Badge variant="secondary">{totalClaimsUsed} claims used</Badge>
              {sectionsMissing.length > 0 && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {sectionsMissing.length} need evidence
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-3 space-y-3">
                {result.sections.map((section) => (
                  <Collapsible
                    key={section.sectionKey}
                    open={expandedSections.has(section.sectionKey)}
                    onOpenChange={() => toggleSection(section.sectionKey)}
                  >
                    <div
                      className={`border rounded-lg ${
                        section.missingEvidence ? "border-amber-200 bg-amber-50/50" : "bg-card"
                      }`}
                    >
                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{section.title}</span>
                          {section.missingEvidence ? (
                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                              Missing
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {section.usedClaimIds.length} claims
                            </Badge>
                          )}
                          {editedSections.has(section.sectionKey) && (
                            <Badge variant="outline" className="text-xs">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edited by you
                            </Badge>
                          )}
                        </div>
                        {expandedSections.has(section.sectionKey) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 pt-0 border-t">
                          {section.missingEvidence ? (
                            <Alert className="border-amber-200 bg-amber-100/50">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <AlertDescription className="text-sm text-amber-800">
                                {section.missingReason}
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="space-y-2">
                              <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/50 p-3 rounded-lg">
                                {section.contentMarkdown}
                              </pre>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopySection(section)}
                                  data-testid={`button-copy-section-${section.sectionKey}`}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>

            {result.sources.length > 0 && (
              <Collapsible open={showSources} onOpenChange={setShowSources}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <LinkIcon className="w-4 h-4" />
                  <span>View {result.sources.length} source files</span>
                  {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 border rounded-lg p-3 space-y-2 bg-muted/50">
                    {result.sources.map((source) => (
                      <div key={source.evidenceId} className="text-sm">
                        <span className="font-medium">{source.fileName}</span>
                        <span className="text-muted-foreground ml-2">
                          ({source.citations.length} citation{source.citations.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleApply} className="flex-1" data-testid="button-apply-autofill">
                Apply to Document
              </Button>
              <Button variant="outline" onClick={() => autofillMutation.reset()}>
                Regenerate
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              All content above is generated from your accepted claims with citations.
              No fabricated statements are included.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
