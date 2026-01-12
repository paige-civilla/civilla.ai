/**
 * AI Feature Flags
 * 
 * Centralized feature flags for all AI-powered features.
 * Allows disabling features without code changes.
 * 
 * Usage:
 * ```typescript
 * import { isFeatureEnabled, AI_FEATURES } from "./ai/featureFlags";
 * 
 * if (!isFeatureEnabled(AI_FEATURES.LEXI_CHAT)) {
 *   return { status: "disabled", message: "This feature is temporarily unavailable" };
 * }
 * ```
 */

export const AI_FEATURES = {
  LEXI_CHAT: "lexi_chat",
  OCR_EXTRACTION: "ocr_extraction",
  AI_ANALYSIS: "ai_analysis",
  CLAIMS_SUGGESTION: "claims_suggestion",
  PATTERN_ANALYSIS: "pattern_analysis",
  DOCUMENT_COMPILE: "document_compile",
  DRAFT_READINESS: "draft_readiness",
  QUICK_SEARCH: "quick_search",
} as const;

export type AiFeature = typeof AI_FEATURES[keyof typeof AI_FEATURES];

const featureOverrides: Map<AiFeature, boolean> = new Map();

const ENV_FLAG_PREFIX = "AI_FEATURE_";

function getEnvFlag(feature: AiFeature): boolean | undefined {
  const envKey = `${ENV_FLAG_PREFIX}${feature.toUpperCase()}`;
  const value = process.env[envKey];
  
  if (value === undefined) return undefined;
  if (value === "0" || value === "false" || value === "disabled") return false;
  if (value === "1" || value === "true" || value === "enabled") return true;
  
  return undefined;
}

export function isFeatureEnabled(feature: AiFeature): boolean {
  if (featureOverrides.has(feature)) {
    return featureOverrides.get(feature)!;
  }
  
  const envFlag = getEnvFlag(feature);
  if (envFlag !== undefined) {
    return envFlag;
  }
  
  return true;
}

export function setFeatureEnabled(feature: AiFeature, enabled: boolean): void {
  featureOverrides.set(feature, enabled);
  console.log(`[Feature Flags] ${feature} set to ${enabled ? "enabled" : "disabled"}`);
}

export function clearFeatureOverride(feature: AiFeature): void {
  featureOverrides.delete(feature);
}

export function getAllFeatureStatus(): Record<AiFeature, boolean> {
  const status: Record<string, boolean> = {};
  
  for (const feature of Object.values(AI_FEATURES)) {
    status[feature] = isFeatureEnabled(feature);
  }
  
  return status as Record<AiFeature, boolean>;
}

export function featureDisabledResponse(feature: AiFeature): {
  status: "disabled";
  human_readable_message: string;
  retry_allowed: boolean;
} {
  return {
    status: "disabled",
    human_readable_message: "This feature is temporarily unavailable. Please try again later.",
    retry_allowed: false,
  };
}
