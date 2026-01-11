const ERROR_CODE_MAP: Record<string, string> = {
  OPENAI_KEY_MISSING: "AI service not configured",
  OPENAI_KEY_INVALID: "AI authentication failed",
  OPENAI_RATE_LIMIT: "AI service temporarily busy",
  OPENAI_ERROR: "AI service error",
  VISION_KEY_MISSING: "OCR service not configured",
  VISION_KEY_INVALID: "OCR authentication failed",
  VISION_ERROR: "OCR service error",
  LEXI_TIMEOUT: "Response took too long",
  LEXI_FAILED: "Assistant error",
  DB_ERROR: "Database error",
  VALIDATION_ERROR: "Invalid input",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Not authorized",
};

export function redactSecrets(text: string): string {
  if (!text) return text;
  
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_OPENAI_KEY]")
    .replace(/AIza[a-zA-Z0-9_-]{35}/g, "[REDACTED_GOOGLE_KEY]")
    .replace(/[a-f0-9]{32}/gi, (match) => {
      if (match.length === 32) return "[REDACTED_KEY]";
      return match;
    })
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/password[=:]\s*["']?[^"'\s]+["']?/gi, "password=[REDACTED]")
    .replace(/secret[=:]\s*["']?[^"'\s]+["']?/gi, "secret=[REDACTED]");
}

export function shortenStackTrace(stack: string, maxLines: number = 5): string {
  if (!stack) return "";
  
  const lines = stack.split("\n");
  if (lines.length <= maxLines) return stack;
  
  return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} more lines)`;
}

export function humanizeErrorCode(code: string): string {
  return ERROR_CODE_MAP[code] || code;
}

export function normalizeError(err: any): {
  message: string;
  code: string;
  stack?: string;
} {
  const rawMessage = err?.message || String(err);
  const code = err?.code || "UNKNOWN";
  const stack = err?.stack ? shortenStackTrace(redactSecrets(err.stack)) : undefined;
  
  return {
    message: redactSecrets(rawMessage),
    code,
    stack,
  };
}

export function formatErrorForClient(err: any, requestId?: string): {
  error: string;
  code: string;
  requestId?: string;
} {
  const normalized = normalizeError(err);
  
  return {
    error: humanizeErrorCode(normalized.code) || normalized.message,
    code: normalized.code,
    requestId,
  };
}
