export type CasePhase = "collecting" | "reviewing" | "draft-ready";

interface PhaseStatusBarProps {
  phase: CasePhase;
}

const PHASE_COPY: Record<CasePhase, { title: string; subtitle: string }> = {
  collecting: {
    title: "Collecting & organizing your case",
    subtitle: "Drafting becomes available after claims are reviewed.",
  },
  reviewing: {
    title: "Reviewing claims",
    subtitle: "You're almost ready to draft.",
  },
  "draft-ready": {
    title: "Draft-ready",
    subtitle: "Documents are generated from approved claims and linked evidence.",
  },
};

export default function PhaseStatusBar({ phase }: PhaseStatusBarProps) {
  const copy = PHASE_COPY[phase] || PHASE_COPY.collecting;

  return (
    <div className="text-sm text-[#243032]" data-testid="phase-status-bar">
      <div className="font-medium">
        Current stage: {copy.title}
      </div>
      <div className="text-[#243032]/60 text-xs mt-0.5">
        {copy.subtitle}
      </div>
    </div>
  );
}
