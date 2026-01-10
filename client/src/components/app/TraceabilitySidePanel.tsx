import { useState } from "react";
import { X, FileText, Hash, Quote, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CitationDetail {
  citationId: string;
  evidenceFileId: string;
  fileName: string;
  pageNumber?: number;
  timestampSeconds?: number;
  quoteSnippet: string;
}

interface TracedSentence {
  sentenceId: string;
  sectionKey: string;
  sectionTitle: string;
  paragraphNumber: number;
  text: string;
  claimId: string;
  citationIds: string[];
  evidenceFileIds: string[];
  citationDetails: CitationDetail[];
}

interface TraceabilitySidePanelProps {
  sentence: TracedSentence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewEvidence?: (evidenceFileId: string, pageNumber?: number) => void;
}

export default function TraceabilitySidePanel({
  sentence,
  open,
  onOpenChange,
  onViewEvidence,
}: TraceabilitySidePanelProps) {
  if (!sentence) return null;

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Source Trace
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          <div className="space-y-4 pr-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">Claim Text</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    {sentence.paragraphNumber}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sentence.text}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {sentence.sectionTitle}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Quote className="w-4 h-4" />
                Citations ({sentence.citationDetails.length})
              </h4>

              {sentence.citationDetails.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No citations attached to this claim.
                </p>
              ) : (
                sentence.citationDetails.map((citation) => (
                  <Card key={citation.citationId} className="border-l-2 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{citation.fileName}</span>
                        </div>
                        {onViewEvidence && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => onViewEvidence(citation.evidenceFileId, citation.pageNumber)}
                            data-testid={`button-view-evidence-${citation.citationId}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {citation.pageNumber && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            Page {citation.pageNumber}
                          </span>
                        )}
                        {citation.timestampSeconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(citation.timestampSeconds)}
                          </span>
                        )}
                      </div>

                      {citation.quoteSnippet && (
                        <blockquote className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 mt-2">
                          "{citation.quoteSnippet}"
                        </blockquote>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Claim ID:</strong> {sentence.claimId.slice(0, 8)}...
              </p>
              <p>
                <strong>Evidence Files:</strong> {sentence.evidenceFileIds.length}
              </p>
              <p>
                <strong>Total Citations:</strong> {sentence.citationIds.length}
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
