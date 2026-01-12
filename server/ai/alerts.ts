/**
 * Admin Alerts System
 * 
 * Provides hooks for Slack and email alerts.
 * Alerts are triggered by:
 * - AI failure spikes
 * - OCR backlog > threshold
 * - OpenAI/Vision auth errors
 * - Database latency spikes
 * - Cost anomalies
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  acknowledged: boolean;
}

const alerts: Alert[] = [];
const MAX_ALERTS = 500;

let alertCounter = 0;

export interface AlertHook {
  name: string;
  fn: (alert: Alert) => Promise<void>;
}

const hooks: AlertHook[] = [];

export function registerAlertHook(name: string, fn: AlertHook["fn"]): void {
  hooks.push({ name, fn });
  console.log(`[Alerts] Registered hook: ${name}`);
}

export function createAlert(
  severity: AlertSeverity,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Alert {
  const alert: Alert = {
    id: `alert_${++alertCounter}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity,
    type,
    title,
    message,
    data,
    acknowledged: false,
  };
  
  alerts.push(alert);
  
  if (alerts.length > MAX_ALERTS) {
    alerts.shift();
  }
  
  console[severity === "critical" ? "error" : severity === "warning" ? "warn" : "log"](
    `[Alert:${severity.toUpperCase()}] ${type}: ${title} - ${message}`
  );
  
  for (const hook of hooks) {
    hook.fn(alert).catch(err => {
      console.error(`[Alerts] Hook ${hook.name} failed:`, err);
    });
  }
  
  return alert;
}

export function alertAiFailureSpike(failureCount: number, windowMs: number): void {
  createAlert(
    "warning",
    "ai_failure_spike",
    "AI Failure Rate Elevated",
    `${failureCount} AI failures in the last ${Math.round(windowMs / 60000)} minutes`,
    { failureCount, windowMs }
  );
}

export function alertOcrBacklog(queueDepth: number, threshold: number): void {
  createAlert(
    "warning",
    "ocr_backlog",
    "OCR Queue Growing",
    `OCR backlog at ${queueDepth} items (threshold: ${threshold})`,
    { queueDepth, threshold }
  );
}

export function alertAuthError(service: string, errorMessage: string): void {
  createAlert(
    "critical",
    "auth_error",
    `${service} Authentication Failed`,
    errorMessage,
    { service }
  );
}

export function alertDatabaseLatency(latencyMs: number, threshold: number): void {
  createAlert(
    "warning",
    "db_latency",
    "Database Latency Elevated",
    `Database query took ${latencyMs}ms (threshold: ${threshold}ms)`,
    { latencyMs, threshold }
  );
}

export function alertCostAnomaly(
  currentCost: number,
  expectedCost: number,
  variancePercent: number
): void {
  createAlert(
    "warning",
    "cost_anomaly",
    "Unusual AI Cost Detected",
    `Current cost ${currentCost}¢ is ${variancePercent}% above expected ${expectedCost}¢`,
    { currentCost, expectedCost, variancePercent }
  );
}

export function getRecentAlerts(limit: number = 50): Alert[] {
  return alerts.slice(-limit);
}

export function getUnacknowledgedAlerts(): Alert[] {
  return alerts.filter(a => !a.acknowledged);
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function getAlertStats(): {
  total: number;
  unacknowledged: number;
  bySeverity: Record<AlertSeverity, number>;
  byType: Record<string, number>;
} {
  const bySeverity: Record<AlertSeverity, number> = { info: 0, warning: 0, critical: 0 };
  const byType: Record<string, number> = {};
  
  for (const alert of alerts) {
    bySeverity[alert.severity]++;
    byType[alert.type] = (byType[alert.type] || 0) + 1;
  }
  
  return {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    bySeverity,
    byType,
  };
}

export function createSlackHook(webhookUrl: string): void {
  registerAlertHook("slack", async (alert) => {
    if (alert.severity === "info") return;
    
    const color = alert.severity === "critical" ? "#dc2626" : "#f59e0b";
    
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: [{
            color,
            title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
            text: alert.message,
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    } catch (err) {
      console.error("[Alerts] Slack webhook failed:", err);
    }
  });
}

export function initializeAlertHooks(): void {
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    createSlackHook(slackUrl);
  }
}
