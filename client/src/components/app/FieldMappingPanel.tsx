import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, MapPin, Link2, Info, Ban } from "lucide-react";

interface SuggestedClaim {
  claimId: string;
  claimText: string;
  claimType: string;
  hasCitations: boolean;
  citationCount: number;
  canInsert: boolean;
  blockReason?: string;
}

interface SectionMapping {
  sectionKey: string;
  sectionTitle: string;
  description: string;
  claimTypes: string[];
  suggestedClaims: SuggestedClaim[];
}

interface FieldMappingResult {
  templateKey: string;
  templateName: string;
  sections: SectionMapping[];
  uncitedClaimsCount: number;
  totalClaimsCount: number;
}

interface FieldMappingPanelProps {
  caseId: string;
  templateKey: string;
}

export default function FieldMappingPanel({ caseId, templateKey }: FieldMappingPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: mappingData, isLoading } = useQuery<FieldMappingResult>({
    queryKey: ["/api/cases", caseId, "templates", "field-mapping", templateKey],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/templates/field-mapping?templateKey=${templateKey}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch field mapping");
      return res.json();
    },
    enabled: !!templateKey && !!caseId,
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 animate-pulse" />
            Loading field suggestions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mappingData || mappingData.sections.length === 0) {
    return null;
  }

  const sectionsWithClaims = mappingData.sections.filter(s => s.suggestedClaims.length > 0);

  return (
    <Card className="border-dashed border-primary/30">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Field Suggestions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {mappingData.totalClaimsCount} claims
            </Badge>
            {mappingData.uncitedClaimsCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {mappingData.uncitedClaimsCount} uncited
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    Uncited claims cannot be inserted into court documents. Add evidence citations to include them.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          These suggestions show where your claims may fit. You can accept, ignore, or manually place content.
        </p>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4">
        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            {sectionsWithClaims.map((section) => {
              const isExpanded = expandedSections.has(section.sectionKey);
              const insertableClaims = section.suggestedClaims.filter(c => c.canInsert);
              const blockedClaims = section.suggestedClaims.filter(c => !c.canInsert);

              return (
                <Collapsible
                  key={section.sectionKey}
                  open={isExpanded}
                  onOpenChange={() => toggleSection(section.sectionKey)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover-elevate text-left bg-muted/30">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{section.sectionTitle}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {insertableClaims.length > 0 && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {insertableClaims.length}
                        </Badge>
                      )}
                      {blockedClaims.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Ban className="w-3 h-3 mr-1" />
                          {blockedClaims.length}
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 pl-6">
                    <p className="text-xs text-muted-foreground mb-2 italic">
                      {section.description}
                    </p>
                    <div className="space-y-1">
                      {section.suggestedClaims.map((claim) => (
                        <div
                          key={claim.claimId}
                          className={`p-2 rounded border text-xs ${
                            claim.canInsert
                              ? "bg-green-50 border-green-200"
                              : "bg-muted/50 border-muted"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {claim.canInsert ? (
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger>
                                  <XCircle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <p className="text-xs">{claim.blockReason}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`line-clamp-2 ${!claim.canInsert ? "text-muted-foreground" : ""}`}>
                                {claim.claimText}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {claim.claimType}
                                </Badge>
                                {claim.hasCitations ? (
                                  <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                                    <Link2 className="w-2.5 h-2.5" />
                                    {claim.citationCount} citation{claim.citationCount !== 1 ? "s" : ""}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    No citations
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!claim.canInsert && claim.blockReason && (
                            <div className="mt-1.5 p-1.5 bg-amber-50 rounded text-[10px] text-amber-700 flex items-start gap-1">
                              <Info className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{claim.blockReason}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
