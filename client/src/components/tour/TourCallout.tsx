import { useEffect, useState, useRef } from "react";
import { X, MessageCircle, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTour } from "./useTour";
import { getTourModule, TourStep } from "./tours";
import { openLexiAndSend } from "@/lib/openLexi";

interface TourCalloutProps {
  moduleKey: string;
}

export function TourCallout({ moduleKey }: TourCalloutProps) {
  const { tourState, isStepDone, isModuleDismissed, completeStep, dismissStep } = useTour();
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const calloutRef = useRef<HTMLDivElement>(null);

  const tourModule = getTourModule(moduleKey);

  useEffect(() => {
    if (!tourModule) return;
    if (tourState.globalDisable) return;
    if (isModuleDismissed(moduleKey)) return;

    const nextStep = tourModule.steps.find((step) => !isStepDone(moduleKey, step.id));
    if (!nextStep) {
      setCurrentStep(null);
      return;
    }

    const findAnchor = () => {
      const anchor = document.querySelector(`[data-tour-id="${nextStep.anchorId}"]`);
      if (anchor) {
        setAnchorRect(anchor.getBoundingClientRect());
        setCurrentStep(nextStep);
      } else {
        setAnchorRect(null);
        setCurrentStep(null);
      }
    };

    findAnchor();
    const interval = setInterval(findAnchor, 1000);
    window.addEventListener("resize", findAnchor);
    window.addEventListener("scroll", findAnchor, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", findAnchor);
      window.removeEventListener("scroll", findAnchor, true);
    };
  }, [tourModule, moduleKey, tourState.globalDisable, isModuleDismissed, isStepDone]);

  if (!currentStep || !anchorRect) return null;

  const handleGotIt = () => {
    completeStep(moduleKey, currentStep.id);
  };

  const handleSkip = () => {
    dismissStep(moduleKey, currentStep.id);
  };

  const handleAskLexi = () => {
    openLexiAndSend(currentStep.lexiPrompt, moduleKey);
    completeStep(moduleKey, currentStep.id);
  };

  const calloutStyle: React.CSSProperties = {
    position: "fixed",
    top: Math.min(anchorRect.bottom + 12, window.innerHeight - 200),
    left: Math.min(Math.max(anchorRect.left, 16), window.innerWidth - 320),
    zIndex: 9999,
    maxWidth: 300,
  };

  return (
    <div ref={calloutRef} style={calloutStyle}>
      <Card className="shadow-lg border-primary/20 bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-sm text-foreground">{currentStep.title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleSkip}
              data-testid="button-tour-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{currentStep.body}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleGotIt}
              className="gap-1"
              data-testid="button-tour-got-it"
            >
              <Check className="h-3 w-3" />
              Got it
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSkip}
              className="gap-1"
              data-testid="button-tour-skip"
            >
              <SkipForward className="h-3 w-3" />
              Skip
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAskLexi}
              className="gap-1"
              data-testid="button-tour-ask-lexi"
            >
              <MessageCircle className="h-3 w-3" />
              Ask Lexi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
