import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, RotateCcw, BookOpen, FileText, Scale, BarChart3, Briefcase } from "lucide-react";
import { useTour } from "./useTour";
import { getAllModuleKeys } from "./tours";

interface TourLauncherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModuleKey?: string;
}

const MODULE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard: { label: "Dashboard", icon: <BookOpen className="h-4 w-4" /> },
  "start-here": { label: "Start Here", icon: <Play className="h-4 w-4" /> },
  evidence: { label: "Evidence", icon: <FileText className="h-4 w-4" /> },
  claims: { label: "Claims", icon: <Scale className="h-4 w-4" /> },
  documents: { label: "Documents", icon: <FileText className="h-4 w-4" /> },
  "pattern-analysis": { label: "Pattern Analysis", icon: <BarChart3 className="h-4 w-4" /> },
  "trial-prep": { label: "Trial Prep", icon: <Briefcase className="h-4 w-4" /> },
};

export function TourLauncherModal({ open, onOpenChange, currentModuleKey }: TourLauncherModalProps) {
  const { tourState, startTour, resetModule, setGlobalDisable } = useTour();
  const moduleKeys = getAllModuleKeys();

  const handleStartTour = (moduleKey: string) => {
    resetModule(moduleKey);
    startTour(moduleKey);
    onOpenChange(false);
  };

  const handleToggleGlobal = (checked: boolean) => {
    setGlobalDisable(!checked);
  };

  const isGlobalEnabled = !tourState.globalDisable;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guided Walkthrough</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
            <Label htmlFor="tour-toggle" className="text-sm font-medium">
              Show tour tips
            </Label>
            <Switch
              id="tour-toggle"
              checked={isGlobalEnabled}
              onCheckedChange={handleToggleGlobal}
              data-testid="switch-tour-toggle"
            />
          </div>

          {currentModuleKey && MODULE_LABELS[currentModuleKey] && (
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground mb-2">Current page</p>
              <Button
                variant="default"
                className="w-full justify-start gap-2"
                onClick={() => handleStartTour(currentModuleKey)}
                data-testid="button-resume-current-tour"
              >
                <RotateCcw className="h-4 w-4" />
                Restart {MODULE_LABELS[currentModuleKey].label} tour
              </Button>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-2">All tours</p>
            <div className="grid gap-2">
              {moduleKeys.map((key) => {
                const config = MODULE_LABELS[key];
                if (!config) return null;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleStartTour(key)}
                    data-testid={`button-start-tour-${key}`}
                  >
                    {config.icon}
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
