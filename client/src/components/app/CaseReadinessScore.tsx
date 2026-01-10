import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, CheckCircle, Clock, Link2, Calendar, ChevronDown, Lightbulb, TrendingUp } from "lucide-react";
import { useState } from "react";

interface ReadinessMetric {
  label: string;
  current: number;
  total: number;
  weight: number;
  icon: typeof FileText;
  tip?: string;
}

interface ReadinessData {
  evidenceExtracted: { current: number; total: number };
  claimsAccepted: { current: number; total: number };
  citationsAttached: { current: number; total: number };
  timelineEvents: { count: number };
}

interface CaseReadinessScoreProps {
  caseId: number;
}

export default function CaseReadinessScore({ caseId }: CaseReadinessScoreProps) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: readinessData, isLoading } = useQuery<ReadinessData>({
    queryKey: ["/api/cases", caseId, "readiness"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readinessData) return null;

  const metrics: ReadinessMetric[] = [
    {
      label: "Evidence Processed",
      current: readinessData.evidenceExtracted.current,
      total: readinessData.evidenceExtracted.total,
      weight: 25,
      icon: FileText,
      tip: readinessData.evidenceExtracted.current < readinessData.evidenceExtracted.total
        ? "Some evidence files are still being processed or awaiting extraction."
        : undefined,
    },
    {
      label: "Claims Reviewed",
      current: readinessData.claimsAccepted.current,
      total: readinessData.claimsAccepted.total,
      weight: 35,
      icon: CheckCircle,
      tip: readinessData.claimsAccepted.current < readinessData.claimsAccepted.total
        ? "Review pending claims to decide which to accept or reject."
        : undefined,
    },
    {
      label: "Citations Linked",
      current: readinessData.citationsAttached.current,
      total: readinessData.citationsAttached.total,
      weight: 25,
      icon: Link2,
      tip: readinessData.citationsAttached.current < readinessData.citationsAttached.total
        ? "Some claims may benefit from additional source citations."
        : undefined,
    },
    {
      label: "Timeline Events",
      current: Math.min(readinessData.timelineEvents.count, 10),
      total: 10,
      weight: 15,
      icon: Calendar,
      tip: readinessData.timelineEvents.count < 5
        ? "Adding timeline events helps organize the case chronology."
        : undefined,
    },
  ];

  const calculateScore = () => {
    let weightedSum = 0;
    let totalWeight = 0;

    metrics.forEach((metric) => {
      const ratio = metric.total > 0 ? metric.current / metric.total : 1;
      weightedSum += ratio * metric.weight;
      totalWeight += metric.weight;
    });

    return Math.round((weightedSum / totalWeight) * 100);
  };

  const score = calculateScore();

  const getProgressColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-slate-400";
  };

  const getStatusLabel = (score: number) => {
    if (score >= 75) return "Well Prepared";
    if (score >= 50) return "In Progress";
    if (score >= 25) return "Getting Started";
    return "Early Stage";
  };

  const activeTips = metrics.filter(m => m.tip);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Preparation Level</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono">
            {score}%
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Track your case organization progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStatusLabel(score)}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1">
            <span>{showDetails ? "Hide" : "View"} details</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            {metrics.map((metric, idx) => {
              const MetricIcon = metric.icon;
              const ratio = metric.total > 0 ? (metric.current / metric.total) * 100 : 100;
              
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <MetricIcon className="w-3 h-3 text-muted-foreground" />
                      <span>{metric.label}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">
                      {metric.current}/{metric.total}
                    </span>
                  </div>
                  <Progress value={ratio} className="h-1" />
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {activeTips.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-xs">
              <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {activeTips.slice(0, 2).map((metric, idx) => (
                  <p key={idx} className="text-muted-foreground">
                    {metric.tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
