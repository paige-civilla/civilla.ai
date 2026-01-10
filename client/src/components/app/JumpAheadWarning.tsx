import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface JumpAheadWarningProps {
  message?: string;
  dismissible?: boolean;
}

export default function JumpAheadWarning({ 
  message = "You can continue, but your draft may be incomplete due to missing evidence or citations.",
  dismissible = true 
}: JumpAheadWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div 
      className="w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2"
      data-testid="jump-ahead-warning"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-jump-warning"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
