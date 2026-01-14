import { apiRequest } from "./queryClient";

export interface IntakeStartResponse {
  ok: boolean;
  caseId?: string;
  intakeId?: string;
  intent?: string;
  confidence?: number;
  reasons?: string[];
  error?: string;
  note?: string;
}

export async function startIntake(params: {
  state?: string;
  rawIntakeText: string;
}): Promise<IntakeStartResponse> {
  const response = await apiRequest("POST", "/api/intake/start", params);
  return response.json();
}

export interface LiteOnboardingResponse {
  ok: boolean;
  caseId?: string;
  error?: string;
}

export async function completeLiteOnboarding(params: {
  state: string;
  tosAccepted: boolean;
  privacyAccepted: boolean;
  notLawFirmAccepted: boolean;
  commsConsent?: boolean;
}): Promise<LiteOnboardingResponse> {
  const response = await apiRequest("POST", "/api/onboarding/lite", params);
  return response.json();
}
