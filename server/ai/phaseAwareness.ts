/**
 * User Phase Awareness (Intake Safe Mode)
 * 
 * Detects early-stage users and enables calmer, slower AI pacing.
 * 
 * Early-stage users (first 14 days OR <3 cases):
 * - Slower AI pacing
 * - Larger queues allowed
 * - Calmer messaging
 * - No scary warnings
 * 
 * NEVER block uploads or evidence ingestion.
 */

export interface UserPhase {
  isEarlyStage: boolean;
  accountAgeDays: number;
  caseCount: number;
  phase: "intake" | "active" | "power";
}

const EARLY_STAGE_DAYS = 14;
const EARLY_STAGE_CASES = 3;

export function determineUserPhase(
  accountCreatedAt: Date | null,
  caseCount: number
): UserPhase {
  const now = new Date();
  let accountAgeDays = 0;
  
  if (accountCreatedAt) {
    accountAgeDays = Math.floor(
      (now.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
  
  const isEarlyStage = accountAgeDays < EARLY_STAGE_DAYS || caseCount < EARLY_STAGE_CASES;
  
  let phase: UserPhase["phase"];
  if (isEarlyStage) {
    phase = "intake";
  } else if (caseCount >= 10 || accountAgeDays >= 60) {
    phase = "power";
  } else {
    phase = "active";
  }
  
  return {
    isEarlyStage,
    accountAgeDays,
    caseCount,
    phase,
  };
}

export interface PhaseAdjustments {
  aiTimeoutMs: number;
  maxRetries: number;
  queuePriority: number;
  messageStyle: "calm" | "standard" | "detailed";
  showWarnings: boolean;
}

export function getPhaseAdjustments(phase: UserPhase): PhaseAdjustments {
  switch (phase.phase) {
    case "intake":
      return {
        aiTimeoutMs: 90000,
        maxRetries: 5,
        queuePriority: 2,
        messageStyle: "calm",
        showWarnings: false,
      };
    
    case "power":
      return {
        aiTimeoutMs: 45000,
        maxRetries: 3,
        queuePriority: 1,
        messageStyle: "detailed",
        showWarnings: true,
      };
    
    case "active":
    default:
      return {
        aiTimeoutMs: 60000,
        maxRetries: 3,
        queuePriority: 1,
        messageStyle: "standard",
        showWarnings: true,
      };
  }
}

export function getCalmMessage(standardMessage: string, phase: UserPhase): string {
  if (!phase.isEarlyStage) {
    return standardMessage;
  }
  
  const calmMappings: Record<string, string> = {
    "Rate limit exceeded": "We're processing your request. This might take a moment.",
    "Processing failed": "We ran into a small hiccup. Let's try that again.",
    "Error": "Something didn't go as planned. We're on it.",
    "Timeout": "This is taking a bit longer than usual. Hang tight!",
    "Quota exceeded": "You've been busy! We're catching up with your requests.",
  };
  
  for (const [trigger, calm] of Object.entries(calmMappings)) {
    if (standardMessage.toLowerCase().includes(trigger.toLowerCase())) {
      return calm;
    }
  }
  
  return standardMessage;
}

export function shouldShowWarning(warningType: string, phase: UserPhase): boolean {
  if (!phase.isEarlyStage) {
    return true;
  }
  
  const suppressedWarnings = [
    "quota_warning",
    "usage_high",
    "rate_limit_approaching",
    "cost_warning",
  ];
  
  return !suppressedWarnings.includes(warningType);
}
