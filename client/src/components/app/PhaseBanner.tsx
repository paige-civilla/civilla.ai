import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, Search, CheckCircle, FolderKanban, FileText, AlertTriangle, Loader2, ChevronRight, Info } from "lucide-react";
import { useState } from "react";

interface PhaseStatus {
  phaseNumber: number;
  checks: {
    evidenceCount: number;
    extractionCompleteCount: number;
    extractionPendingCount: number;
    suggestedClaimsCount: number;
    acceptedClaimsCount: number;
    acceptedClaimsMissingCitationsCount: number;
    issueGroupingsCount: number;
    readinessPercent: number;
  };
  blockers: string[];
  warnings: string[];
  recommendedActions: Array<{ label: string; href: string; actionKey: string }>;
}

interface PhaseBannerProps {
  caseId: string;
  currentModule?: string;
}

const PHASES = [
  { num: 1, label: "Evidence", icon: Upload, description: "Upload documents" },
  { num: 2, label: "Extraction", icon: Search, description: "Extract text & data" },
  { num: 3, label: "Claims", icon: CheckCircle, description: "Review & accept claims" },
  { num: 4, label: "Issues", icon: FolderKanban, description: "Organize by issue" },
  { num: 5, label: "Draft", icon: FileText, description: "Compile documents" },
];

const ACTION_ICONS: Record<string, typeof Upload> = {
  upload_evidence: Upload,
  run_extraction: Search,
  review_claims: CheckCircle,
  auto_attach: CheckCircle,
  compile_draft: FileText,
};

export default function PhaseBanner({ caseId, currentModule }: PhaseBannerProps) {
  const [showJumpWarning, setShowJumpWarning] = useState(false);

  const { data: status, isLoading } = useQuery<PhaseStatus>({
    queryKey: ["/api/cases", caseId, "phase-status"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading case status...</span>
      </div>
    );
  }

  if (!status) return null;

  const { phaseNumber, checks, blockers, warnings, recommendedActions } = status;
  const progressPercent = Math.round(((phaseNumber - 1) / 4) * 100);

  const isDocumentsModule = currentModule === "documents";
  const shouldWarnJumpAhead = isDocumentsModule && phaseNumber < 3;

  return (
    <>
      <div className="border rounded-lg p-4 mb-4 bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={phaseNumber === 5 ? "default" : "secondary"} className="shrink-0">
                Phase {phaseNumber} of 5
              </Badge>
              <span className="text-sm font-medium truncate">
                {PHASES[phaseNumber - 1]?.label}
              </span>
              {phaseNumber === 5 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Ready to Draft
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="h-2 flex-1 max-w-xs" />
              <span className="text-xs text-muted-foreground">{progressPercent}%</span>
            </div>

            <div className="hidden md:flex items-center gap-1 mt-2">
              {PHASES.map((phase, idx) => {
                const isComplete = phaseNumber > phase.num;
                const isCurrent = phaseNumber === phase.num;
                const Icon = phase.icon;
                return (
                  <div key={phase.num} className="flex items-center">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isComplete
                          ? "bg-green-100 text-green-800"
                          : isCurrent
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden lg:inline">{phase.label}</span>
                    </div>
                    {idx < PHASES.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {recommendedActions.slice(0, 2).map((action) => {
              const ActionIcon = ACTION_ICONS[action.actionKey] || FileText;
              const isDisabled = action.actionKey === "compile_draft" && phaseNumber < 5;

              if (shouldWarnJumpAhead && action.actionKey === "compile_draft") {
                return (
                  <Button
                    key={action.actionKey}
                    size="sm"
                    variant="outline"
                    onClick={() => setShowJumpWarning(true)}
                    data-testid={`action-${action.actionKey}`}
                  >
                    <ActionIcon className="w-4 h-4 mr-1" />
                    {action.label}
                  </Button>
                );
              }

              return (
                <Button
                  key={action.actionKey}
                  size="sm"
                  variant={action.actionKey === "compile_draft" ? "default" : "outline"}
                  disabled={isDisabled}
                  asChild
                  data-testid={`action-${action.actionKey}`}
                >
                  <Link href={action.href}>
                    <ActionIcon className="w-4 h-4 mr-1" />
                    {action.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {(blockers.length > 0 || warnings.length > 0) && (
          <div className="mt-3 space-y-2">
            {blockers.map((blocker, i) => (
              <Alert key={i} variant="destructive" className="py-2">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">{blocker}</AlertDescription>
              </Alert>
            ))}
            {warnings.map((warning, i) => (
              <Alert key={i} className="py-2 border-amber-200 bg-amber-50">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
          <span>{checks.evidenceCount} files</span>
          <span>{checks.extractionCompleteCount} extracted</span>
          <span>{checks.acceptedClaimsCount} accepted claims</span>
          {checks.acceptedClaimsMissingCitationsCount > 0 && (
            <span className="text-amber-600">{checks.acceptedClaimsMissingCitationsCount} missing citations</span>
          )}
          <span>{checks.issueGroupingsCount} issues</span>
        </div>
      </div>

      <Dialog open={showJumpWarning} onOpenChange={setShowJumpWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Jump Ahead Warning
            </DialogTitle>
            <DialogDescription>
              You can explore templates and document options, but drafting is locked until claims are accepted and properly cited.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Current status: <strong>Phase {phaseNumber}</strong> ({PHASES[phaseNumber - 1]?.label})
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              To compile court-ready documents, you need to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              {phaseNumber < 2 && <li>Upload evidence documents</li>}
              {phaseNumber < 3 && <li>Complete text extraction</li>}
              {phaseNumber < 4 && <li>Review and accept claims</li>}
              {phaseNumber < 5 && <li>Attach citations to all accepted claims</li>}
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJumpWarning(false)}>
              Go Back
            </Button>
            <Button asChild>
              <Link href={recommendedActions[0]?.href || `/app/cases/${caseId}/evidence`}>
                {recommendedActions[0]?.label || "Continue Workflow"}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
