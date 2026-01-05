import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ModuleKey, getNextModule, modulePath, moduleLabel } from "@/lib/caseFlow";

interface ModuleHeaderNavProps {
  caseId?: string;
  currentModule: ModuleKey;
  hasChildren: boolean;
  rightActions?: React.ReactNode;
}

export default function ModuleHeaderNav({
  caseId,
  currentModule,
  hasChildren,
  rightActions,
}: ModuleHeaderNavProps) {
  const nextModule = getNextModule(currentModule, { hasChildren });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {rightActions}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href={caseId ? `/app/dashboard/${caseId}` : "/app/cases"}>
          <Button variant="outline" size="sm" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>

        {nextModule && caseId && (
          <Link href={modulePath(nextModule, caseId)}>
            <Button size="sm" data-testid="button-continue-next">
              Continue to {moduleLabel(nextModule)}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
