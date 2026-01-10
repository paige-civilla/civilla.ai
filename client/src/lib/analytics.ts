export interface AnalyticsEventPayload {
  eventType: string;
  caseId?: string;
  moduleKey?: string;
  entityType?: string;
  entityId?: string;
  durationMs?: number;
  success?: boolean;
  errorCode?: string;
  meta?: Record<string, unknown>;
}

export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow errors - don't break UX for analytics
  }
}

export function trackModuleView(moduleKey: string, caseId?: string): void {
  trackEvent({ eventType: "module_view", moduleKey, caseId });
}

export function trackOnboardingComplete(): void {
  trackEvent({ eventType: "onboarding_complete", success: true });
}

export function trackCaseCreated(caseId: string): void {
  trackEvent({ eventType: "case_created", caseId, success: true });
}

export function trackEvidenceUploaded(caseId: string, entityId: string): void {
  trackEvent({ eventType: "evidence_uploaded", caseId, entityType: "evidence_file", entityId, success: true });
}

export function trackClaimAccepted(caseId: string, entityId: string): void {
  trackEvent({ eventType: "claim_accepted", caseId, entityType: "claim", entityId, success: true });
}

export function trackDocCompiled(caseId: string, moduleKey: string): void {
  trackEvent({ eventType: "doc_compiled", caseId, moduleKey, success: true });
}

export function trackExport(caseId: string, exportType: "doc_export" | "docx_export" | "pattern_export" | "trial_binder_export" | "export_zip"): void {
  trackEvent({ eventType: exportType, caseId, success: true });
}
