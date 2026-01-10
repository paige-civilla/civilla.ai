import { Upload, Search, FileText } from "lucide-react";

export type WorkflowPhase = 1 | 2 | 3;

interface WorkflowPhaseBannerProps {
  currentPhase: WorkflowPhase;
}

const PHASES = [
  { num: 1 as const, label: "Evidence & Timeline", icon: Upload },
  { num: 2 as const, label: "Patterns & Claims", icon: Search },
  { num: 3 as const, label: "Court-Formatted Documents", icon: FileText },
];

export function getPhaseFromRoute(pathname: string): WorkflowPhase {
  if (pathname.includes("/documents") || pathname.includes("/court-forms") || pathname.includes("/disclosures") || pathname.includes("/trial-prep")) {
    return 3;
  }
  if (pathname.includes("/patterns") || pathname.includes("/claims")) {
    return 2;
  }
  return 1;
}

export default function WorkflowPhaseBanner({ currentPhase }: WorkflowPhaseBannerProps) {
  return (
    <div 
      className="w-full bg-muted/40 border-b px-4 py-2"
      data-testid="workflow-phase-banner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 sm:gap-4">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = currentPhase === phase.num;
          const isComplete = currentPhase > phase.num;

          return (
            <div key={phase.num} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : isComplete
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`phase-indicator-${phase.num}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{phase.label}</span>
                <span className="sm:hidden">Phase {phase.num}</span>
              </div>
              {idx < PHASES.length - 1 && (
                <div className={`w-4 sm:w-8 h-0.5 mx-1 ${
                  currentPhase > phase.num ? "bg-green-400" : "bg-muted-foreground/30"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
