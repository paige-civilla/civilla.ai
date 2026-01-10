import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileUp, 
  CheckCircle, 
  FileText, 
  Download, 
  Lightbulb, 
  XCircle, 
  Clock, 
  Shield,
  Activity,
  Eye
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityLogEntry {
  id: number;
  eventType: string;
  description: string;
  createdAt: string;
  caseId?: string;
  metadata?: Record<string, unknown>;
}

interface UserTransparencyLogProps {
  caseId?: number;
  limit?: number;
}

const USER_VISIBLE_EVENTS: Record<string, { label: string; icon: typeof FileUp; color: string }> = {
  evidence_upload: { label: "Evidence Uploaded", icon: FileUp, color: "text-blue-500" },
  evidence_extracted: { label: "Evidence Processed", icon: Eye, color: "text-emerald-500" },
  claims_suggested: { label: "Claims Suggested", icon: Lightbulb, color: "text-amber-500" },
  claim_accept: { label: "Claim Accepted", icon: CheckCircle, color: "text-emerald-500" },
  claim_reject: { label: "Claim Rejected", icon: XCircle, color: "text-slate-400" },
  document_generated: { label: "Document Generated", icon: FileText, color: "text-primary" },
  document_export: { label: "Document Exported", icon: Download, color: "text-violet-500" },
  export_performed: { label: "Export Performed", icon: Download, color: "text-violet-500" },
  timeline_event_created: { label: "Timeline Event Added", icon: Clock, color: "text-blue-500" },
  case_created: { label: "Case Created", icon: Activity, color: "text-emerald-500" },
};

export default function UserTransparencyLog({ caseId, limit = 50 }: UserTransparencyLogProps) {
  const queryKey = caseId 
    ? ["/api/cases", caseId, "transparency-log"]
    : ["/api/user/transparency-log"];

  const { data: logs, isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-2 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleLogs = (logs || [])
    .filter(log => USER_VISIBLE_EVENTS[log.eventType])
    .slice(0, limit);

  const groupedByDate = visibleLogs.reduce((acc, log) => {
    const date = format(new Date(log.createdAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLogEntry[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Activity Log</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Read-only
          </Badge>
        </div>
        <CardDescription className="text-xs">
          A transparent record of how your data has been used
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visibleLogs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No activity recorded yet
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, dayLogs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(date), "MMMM d, yyyy")}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-3">
                    {dayLogs.map((log) => {
                      const eventConfig = USER_VISIBLE_EVENTS[log.eventType];
                      if (!eventConfig) return null;
                      
                      const EventIcon = eventConfig.icon;
                      
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                          data-testid={`log-entry-${log.id}`}
                        >
                          <div className={`mt-0.5 ${eventConfig.color}`}>
                            <EventIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {eventConfig.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            {log.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {log.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            This log cannot be modified or deleted. It provides a complete record of activity for your transparency and protection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
