import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Paperclip, Plus, X, FileText, MessageSquare, Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HydratedLink {
  linkId: string;
  linkType: "evidence" | "claim" | "snippet";
  note: string | null;
  createdAt: string;
  evidence?: { id: string; originalName: string } | null;
  claim?: { id: string; text: string; status: string } | null;
  snippet?: { id: string; title: string } | null;
}

interface EvidenceFile {
  id: string;
  originalName: string;
}

interface CaseClaim {
  id: string;
  claimText: string;
  status: string;
}

interface ExhibitSnippet {
  id: string;
  title: string;
}

export default function TimelineEventLinks({
  caseId,
  eventId,
}: {
  caseId: string;
  eventId: string;
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"evidence" | "claims" | "snippets">("evidence");

  const { data: linksData, isLoading: linksLoading } = useQuery<{ links: HydratedLink[] }>({
    queryKey: ["/api/cases", caseId, "timeline/events", eventId, "links"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/timeline/events/${eventId}/links`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json();
    },
    enabled: !!caseId && !!eventId,
  });

  const { data: evidenceData } = useQuery<{ evidence: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: dialogOpen && !!caseId,
  });

  const { data: claimsData } = useQuery<{ claims: CaseClaim[] }>({
    queryKey: ["/api/cases", caseId, "claims"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/claims?status=accepted,suggested`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    enabled: dialogOpen && !!caseId,
  });

  const { data: snippetsData } = useQuery<{ snippets: ExhibitSnippet[] }>({
    queryKey: ["/api/cases", caseId, "exhibit-snippets"],
    enabled: dialogOpen && !!caseId,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (payload: {
      linkType: "evidence" | "claim" | "snippet";
      evidenceId?: string;
      claimId?: string;
      snippetId?: string;
    }) => {
      return apiRequest("POST", `/api/cases/${caseId}/timeline/events/${eventId}/links`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "timeline/events", eventId, "links"],
      });
      toast({ title: "Link added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add link", description: error.message, variant: "destructive" });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      return apiRequest("DELETE", `/api/timeline/event-links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "timeline/events", eventId, "links"],
      });
      toast({ title: "Link removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove link", description: error.message, variant: "destructive" });
    },
  });

  const links = linksData?.links || [];
  const evidenceList = evidenceData?.evidence || [];
  const claimsList = claimsData?.claims || [];
  const snippetsList = snippetsData?.snippets || [];

  const linkedEvidenceIds = new Set(links.filter((l) => l.linkType === "evidence").map((l) => l.evidence?.id));
  const linkedClaimIds = new Set(links.filter((l) => l.linkType === "claim").map((l) => l.claim?.id));
  const linkedSnippetIds = new Set(links.filter((l) => l.linkType === "snippet").map((l) => l.snippet?.id));

  const filteredEvidence = evidenceList.filter(
    (e) => !linkedEvidenceIds.has(e.id) && e.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredClaims = claimsList.filter(
    (c) => !linkedClaimIds.has(c.id) && c.claimText.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSnippets = snippetsList.filter(
    (s) => !linkedSnippetIds.has(s.id) && s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEvidence = (evidenceId: string) => {
    createLinkMutation.mutate({ linkType: "evidence", evidenceId });
  };

  const handleAddClaim = (claimId: string) => {
    createLinkMutation.mutate({ linkType: "claim", claimId });
  };

  const handleAddSnippet = (snippetId: string) => {
    createLinkMutation.mutate({ linkType: "snippet", snippetId });
  };

  const handleRemoveLink = (linkId: string) => {
    deleteLinkMutation.mutate(linkId);
  };

  if (linksLoading) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 flex-wrap">
        <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        
        {links.length === 0 && (
          <span className="text-xs text-muted-foreground">No links</span>
        )}

        {links.map((link) => {
          let label = "";
          let icon = <FileText className="w-3 h-3" />;
          
          if (link.linkType === "evidence" && link.evidence) {
            label = link.evidence.originalName;
            icon = <FileText className="w-3 h-3" />;
          } else if (link.linkType === "claim" && link.claim) {
            label = link.claim.text.slice(0, 60) + (link.claim.text.length > 60 ? "..." : "");
            icon = <MessageSquare className="w-3 h-3" />;
          } else if (link.linkType === "snippet" && link.snippet) {
            label = link.snippet.title;
            icon = <Scissors className="w-3 h-3" />;
          }

          if (!label) return null;

          return (
            <Badge
              key={link.linkId}
              variant="secondary"
              className="gap-1 pr-1 max-w-[200px]"
              data-testid={`link-chip-${link.linkId}`}
            >
              {icon}
              <span className="truncate text-xs">{label}</span>
              <button
                onClick={() => handleRemoveLink(link.linkId)}
                className="ml-1 p-0.5 rounded hover:bg-destructive/20"
                disabled={deleteLinkMutation.isPending}
                data-testid={`button-remove-link-${link.linkId}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setDialogOpen(true)}
          data-testid={`button-add-link-${eventId}`}
        >
          <Plus className="w-3 h-3" />
          Link
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Timeline Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-link-search"
            />

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="evidence" data-testid="tab-evidence">
                  Evidence ({filteredEvidence.length})
                </TabsTrigger>
                <TabsTrigger value="claims" data-testid="tab-claims">
                  Claims ({filteredClaims.length})
                </TabsTrigger>
                <TabsTrigger value="snippets" data-testid="tab-snippets">
                  Snippets ({filteredSnippets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evidence" className="mt-3">
                <ScrollArea className="h-[250px]">
                  {filteredEvidence.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available evidence files
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredEvidence.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => handleAddEvidence(e.id)}
                          disabled={createLinkMutation.isPending}
                          className="w-full text-left p-2 rounded hover:bg-muted flex items-center gap-2"
                          data-testid={`select-evidence-${e.id}`}
                        >
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{e.originalName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="claims" className="mt-3">
                <ScrollArea className="h-[250px]">
                  {filteredClaims.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available claims
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredClaims.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleAddClaim(c.id)}
                          disabled={createLinkMutation.isPending}
                          className="w-full text-left p-2 rounded hover:bg-muted flex items-start gap-2"
                          data-testid={`select-claim-${c.id}`}
                        >
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm line-clamp-2">{c.claimText}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {c.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="snippets" className="mt-3">
                <ScrollArea className="h-[250px]">
                  {filteredSnippets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No available snippets
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredSnippets.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleAddSnippet(s.id)}
                          disabled={createLinkMutation.isPending}
                          className="w-full text-left p-2 rounded hover:bg-muted flex items-center gap-2"
                          data-testid={`select-snippet-${s.id}`}
                        >
                          <Scissors className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{s.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
