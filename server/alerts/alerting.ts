type AlertType = 
  | "backlog_high"
  | "failures_spike" 
  | "auth_error"
  | "rate_limit_global"
  | "quota_exceeded"
  | "system_error";

interface AlertPayload {
  type: AlertType;
  message: string;
  details?: Record<string, any>;
  severity: "warning" | "error" | "critical";
  timestamp: Date;
}

const THROTTLE_MINUTES = 15;
const recentAlerts = new Map<string, Date>();

function shouldThrottle(type: AlertType, key: string): boolean {
  const fullKey = `${type}:${key}`;
  const lastSent = recentAlerts.get(fullKey);
  
  if (lastSent) {
    const elapsed = Date.now() - lastSent.getTime();
    if (elapsed < THROTTLE_MINUTES * 60 * 1000) {
      return true;
    }
  }
  
  return false;
}

function markSent(type: AlertType, key: string): void {
  const fullKey = `${type}:${key}`;
  recentAlerts.set(fullKey, new Date());
  
  if (recentAlerts.size > 1000) {
    const entries = Array.from(recentAlerts.entries());
    const oldest = entries.sort((a, b) => a[1].getTime() - b[1].getTime()).slice(0, 500);
    for (const [k] of oldest) {
      recentAlerts.delete(k);
    }
  }
}

async function sendSlackAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;
  
  try {
    const color = payload.severity === "critical" ? "#FF0000" : 
                  payload.severity === "error" ? "#FF6600" : "#FFCC00";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `[${payload.severity.toUpperCase()}] ${payload.type}`,
          text: payload.message,
          fields: Object.entries(payload.details || {}).map(([k, v]) => ({
            title: k,
            value: String(v),
            short: true,
          })),
          ts: Math.floor(payload.timestamp.getTime() / 1000),
        }],
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error("[Alerting] Slack send failed:", error);
    return false;
  }
}

async function logAlertFallback(payload: AlertPayload): Promise<void> {
  const prefix = payload.severity === "critical" ? "🚨" : 
                 payload.severity === "error" ? "❌" : "⚠️";
  
  console.log(`${prefix} [ALERT:${payload.type}] ${payload.message}`, payload.details || {});
}

export async function sendAlert(
  type: AlertType,
  message: string,
  options: {
    details?: Record<string, any>;
    severity?: "warning" | "error" | "critical";
    throttleKey?: string;
    skipThrottle?: boolean;
  } = {}
): Promise<void> {
  const severity = options.severity || "warning";
  const throttleKey = options.throttleKey || "default";
  
  if (!options.skipThrottle && shouldThrottle(type, throttleKey)) {
    console.log(`[Alerting] Throttled alert: ${type} (${throttleKey})`);
    return;
  }
  
  const payload: AlertPayload = {
    type,
    message,
    details: options.details,
    severity,
    timestamp: new Date(),
  };
  
  const slackSent = await sendSlackAlert(payload);
  
  if (!slackSent) {
    await logAlertFallback(payload);
  }
  
  markSent(type, throttleKey);
}

export async function checkBacklogThreshold(queuedCount: number, threshold: number = 20): Promise<void> {
  if (queuedCount > threshold) {
    await sendAlert("backlog_high", `AI job backlog is high: ${queuedCount} jobs queued`, {
      details: { queuedCount, threshold },
      severity: queuedCount > threshold * 2 ? "error" : "warning",
      throttleKey: "backlog",
    });
  }
}

const failureWindow: { timestamp: Date; type: string }[] = [];
const FAILURE_SPIKE_THRESHOLD = 10;
const FAILURE_WINDOW_MINUTES = 10;

export async function recordFailureForAlerting(errorType: string): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - FAILURE_WINDOW_MINUTES * 60 * 1000);
  
  while (failureWindow.length > 0 && failureWindow[0].timestamp < windowStart) {
    failureWindow.shift();
  }
  
  failureWindow.push({ timestamp: now, type: errorType });
  
  if (failureWindow.length >= FAILURE_SPIKE_THRESHOLD) {
    const typeCounts: Record<string, number> = {};
    for (const f of failureWindow) {
      typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
    }
    
    await sendAlert("failures_spike", `Failure spike detected: ${failureWindow.length} failures in ${FAILURE_WINDOW_MINUTES} minutes`, {
      details: { failureCount: failureWindow.length, typeCounts },
      severity: "error",
      throttleKey: "failures",
    });
  }
}

export async function alertAuthError(service: string, error: string): Promise<void> {
  await sendAlert("auth_error", `Authentication error for ${service}`, {
    details: { service, error: error.slice(0, 200) },
    severity: "critical",
    throttleKey: service,
    skipThrottle: true,
  });
}

export async function alertRateLimitGlobal(service: string): Promise<void> {
  await sendAlert("rate_limit_global", `Global rate limit hit for ${service}`, {
    details: { service },
    severity: "error",
    throttleKey: `ratelimit:${service}`,
  });
}

export function getAlertStats(): { recentAlertCount: number; oldestAlert: Date | null } {
  const alerts = Array.from(recentAlerts.values());
  return {
    recentAlertCount: alerts.length,
    oldestAlert: alerts.length > 0 ? new Date(Math.min(...alerts.map(d => d.getTime()))) : null,
  };
}
