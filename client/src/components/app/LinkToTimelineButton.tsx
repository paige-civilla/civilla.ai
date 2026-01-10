import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  id: string;
  title: string;
  eventDate: string;
  category: string;
}

interface LinkToTimelineButtonProps {
  caseId: string;
  linkType: "evidence" | "claim" | "snippet";
  targetId: string;
  size?: "sm" | "default" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  label?: string;
}

export default function LinkToTimelineButton({
  caseId,
  linkType,
  targetId,
  size = "sm",
  variant = "outline",
  className = "",
  label = "Link to Timeline",
}: LinkToTimelineButtonProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: timelineData, isLoading } = useQuery<{ events: TimelineEvent[] }>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: dialogOpen && !!caseId,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const payload: Record<string, string> = { linkType };
      if (linkType === "evidence") payload.evidenceId = targetId;
      if (linkType === "claim") payload.claimId = targetId;
      if (linkType === "snippet") payload.snippetId = targetId;
      
      return apiRequest("POST", `/api/cases/${caseId}/timeline/events/${eventId}/links`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      setDialogOpen(false);
      toast({ title: "Linked to timeline event" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to link", description: error.message, variant: "destructive" });
    },
  });

  const events = timelineData?.events || [];
  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setDialogOpen(true)}
        data-testid={`button-link-timeline-${targetId}`}
      >
        <Calendar className="w-3 h-3 mr-1" />
        {label}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Timeline Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-timeline-search"
            />

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {events.length === 0 ? "No timeline events yet" : "No matching events"}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => createLinkMutation.mutate(event.id)}
                      disabled={createLinkMutation.isPending}
                      className="w-full text-left p-3 rounded hover:bg-muted flex flex-col gap-1"
                      data-testid={`select-event-${event.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(event.eventDate)}
                        </span>
                      </div>
                      <span className="text-sm font-medium line-clamp-2">{event.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
