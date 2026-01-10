export type CasePhase = "collecting" | "reviewing" | "draft-ready";

interface PhaseInput {
  acceptedClaims: number;
  totalClaims: number;
  readinessPercent: number;
}

export function resolveCasePhase(input: PhaseInput): CasePhase {
  const { acceptedClaims, totalClaims, readinessPercent } = input;

  if (readinessPercent >= 80 && acceptedClaims > 0) {
    return "draft-ready";
  }

  if (totalClaims > 0) {
    return "reviewing";
  }

  return "collecting";
}
