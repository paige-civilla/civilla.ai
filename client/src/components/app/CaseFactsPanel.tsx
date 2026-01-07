import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Sparkles, FileText, Clock, MessageSquare, AlertTriangle, Loader2, RefreshCw, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CaseFact } from "@shared/schema";

interface CaseFactsPanelProps {
  caseId: string;
  onFactClick?: (fact: CaseFact) => void;
}

function getSourceIcon(sourceType: string) {
  switch (sourceType) {
    case "claim":
      return <FileText className="w-3 h-3" />;
    case "note":
      return <MessageSquare className="w-3 h-3" />;
    case "timeline":
      return <Clock className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
  }
}

function getSourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "claim":
      return "From Claim";
    case "note":
      return "From Note";
    case "timeline":
      return "From Timeline";
    case "manual":
      return "Manual";
    default:
      return sourceType;
  }
}

function FactCard({ 
  fact, 
  onAccept, 
  onReject, 
  onUndo,
  isUpdating,
  showActions = true 
}: { 
  fact: CaseFact; 
  onAccept?: () => void; 
  onReject?: () => void;
  onUndo?: () => void;
  isUpdating?: boolean;
  showActions?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const valuePreview = fact.value && fact.value.length > 120 
    ? fact.value.substring(0, 120) + "..." 
    : fact.value;
  const needsExpand = fact.value && fact.value.length > 120;

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-xs">
                {fact.key}
              </Badge>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {getSourceIcon(fact.sourceType)}
                {getSourceLabel(fact.sourceType)}
              </Badge>
              {fact.missingInfoFlag && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  No Citation
                </Badge>
              )}
            </div>
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <p className="text-sm text-foreground/80">
                {expanded ? fact.value : valuePreview}
              </p>
              {needsExpand && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-1 h-6 px-2 text-xs">
                    {expanded ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}
            </Collapsible>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 shrink-0">
              {fact.status === "suggested" && (
                <>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={onAccept}
                    disabled={isUpdating}
                    data-testid={`button-accept-fact-${fact.id}`}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-600" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={onReject}
                    disabled={isUpdating}
                    data-testid={`button-reject-fact-${fact.id}`}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </>
              )}
              {(fact.status === "accepted" || fact.status === "rejected") && onUndo && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={onUndo}
                  disabled={isUpdating}
                  data-testid={`button-undo-fact-${fact.id}`}
                >
                  Undo
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CaseFactsPanel({ caseId, onFactClick }: CaseFactsPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("suggested");
  const [updatingFactId, setUpdatingFactId] = useState<string | null>(null);

  const { data: facts, isLoading } = useQuery<CaseFact[]>({
    queryKey: ["/api/cases", caseId, "facts"],
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/facts/suggest`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "facts"] });
      toast({
        title: "Facts Suggested",
        description: `${data.suggestedCount} new facts suggested from your case data.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suggest facts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ factId, status }: { factId: string; status: string }) => {
      setUpdatingFactId(factId);
      const res = await apiRequest("PATCH", `/api/cases/${caseId}/facts/${factId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "facts"] });
      setUpdatingFactId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update fact status.",
        variant: "destructive",
      });
      setUpdatingFactId(null);
    },
  });

  const suggestedFacts = facts?.filter(f => f.status === "suggested") || [];
  const acceptedFacts = facts?.filter(f => f.status === "accepted") || [];
  const rejectedFacts = facts?.filter(f => f.status === "rejected") || [];

  const handleAccept = (factId: string) => {
    updateMutation.mutate({ factId, status: "accepted" });
  };

  const handleReject = (factId: string) => {
    updateMutation.mutate({ factId, status: "rejected" });
  };

  const handleUndo = (factId: string) => {
    updateMutation.mutate({ factId, status: "suggested" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h3 className="font-semibold">Case Facts</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => suggestMutation.mutate()}
          disabled={suggestMutation.isPending}
          data-testid="button-suggest-facts"
        >
          {suggestMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          Suggest Facts
        </Button>
      </CardHeader>
      <CardContent className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-3">
            <TabsTrigger value="suggested" className="text-xs" data-testid="tab-suggested-facts">
              Suggested ({suggestedFacts.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs" data-testid="tab-accepted-facts">
              Accepted ({acceptedFacts.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs" data-testid="tab-rejected-facts">
              Rejected ({rejectedFacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="mt-0">
            <ScrollArea className="h-[300px]">
              {suggestedFacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggested facts yet.</p>
                  <p className="text-xs mt-1">Click "Suggest Facts" to extract facts from your case data.</p>
                </div>
              ) : (
                suggestedFacts.map(fact => (
                  <FactCard
                    key={fact.id}
                    fact={fact}
                    onAccept={() => handleAccept(fact.id)}
                    onReject={() => handleReject(fact.id)}
                    isUpdating={updatingFactId === fact.id}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="accepted" className="mt-0">
            <ScrollArea className="h-[300px]">
              {acceptedFacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No accepted facts yet.</p>
                  <p className="text-xs mt-1">Accept suggested facts to use them in document templates.</p>
                </div>
              ) : (
                acceptedFacts.map(fact => (
                  <FactCard
                    key={fact.id}
                    fact={fact}
                    onUndo={() => handleUndo(fact.id)}
                    isUpdating={updatingFactId === fact.id}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            <ScrollArea className="h-[300px]">
              {rejectedFacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <X className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No rejected facts.</p>
                </div>
              ) : (
                rejectedFacts.map(fact => (
                  <FactCard
                    key={fact.id}
                    fact={fact}
                    onUndo={() => handleUndo(fact.id)}
                    isUpdating={updatingFactId === fact.id}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {acceptedFacts.length > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>{acceptedFacts.length} facts ready for templates</span>
            <div className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              <span>
                {acceptedFacts.filter(f => f.sourceType === "claim").length} with citations
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
