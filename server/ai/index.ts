/**
 * AI Infrastructure - Unified Exports
 * 
 * This module provides the complete AI hardening infrastructure:
 * - Execution Guard (timeouts, concurrency, retries)
 * - Feature Flags (enable/disable features)
 * - Rate Limits (soft limits with queuing)
 * - Phase Awareness (intake safe mode)
 * - Budget Tracking (cost protection)
 * - Alerts (Slack/email hooks)
 */

export {
  aiExecutionGuard,
  getRecentFailures,
  getQueueStats,
  isRateLimitError,
  isAuthError,
  classifyError,
  type AiGuardOptions,
  type AiGuardResult,
  type ConcurrencyKey,
  type QueueStats,
} from "./executionGuard";

export {
  AI_FEATURES,
  isFeatureEnabled,
  setFeatureEnabled,
  clearFeatureOverride,
  getAllFeatureStatus,
  featureDisabledResponse,
  type AiFeature,
} from "./featureFlags";

export {
  RATE_LIMITS,
  checkRateLimit,
  recordActionStart,
  recordActionEnd,
  getUserRateLimitStats,
  getGlobalUsageStats,
  type RateLimitConfig,
  type RateLimitCheck,
  type RateLimitStats,
} from "./rateLimits";

export {
  determineUserPhase,
  getPhaseAdjustments,
  getCalmMessage,
  shouldShowWarning,
  type UserPhase,
  type PhaseAdjustments,
} from "./phaseAwareness";

export {
  recordAiUsage,
  getUserDailyUsage,
  isUserOverBudget,
  getUserBudgetStatus,
  getGlobalUsageSummary,
  cleanupOldRecords,
  type AiUsageRecord,
  type AiOperationType,
} from "./budgetTracking";

export {
  createAlert,
  alertAiFailureSpike,
  alertOcrBacklog,
  alertAuthError,
  alertDatabaseLatency,
  alertCostAnomaly,
  getRecentAlerts,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  getAlertStats,
  registerAlertHook,
  createSlackHook,
  initializeAlertHooks,
  type Alert,
  type AlertSeverity,
  type AlertHook,
} from "./alerts";
