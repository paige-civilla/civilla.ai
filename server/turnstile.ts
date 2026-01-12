/**
 * Cloudflare Turnstile CAPTCHA Verification
 * 
 * Used to protect:
 * - Account registration
 * - Bulk uploads (>5 files)
 * - High-cost AI operations
 * 
 * When TURNSTILE_SECRET_KEY is not set, verification is bypassed (dev mode).
 */

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return !!(process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string
): Promise<{ ok: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // If Turnstile is not configured, allow all requests (dev mode)
  if (!secretKey) {
    console.log("[Turnstile] Not configured - bypassing verification");
    return { ok: true };
  }
  
  // If no token provided when Turnstile is configured, fail
  if (!token) {
    console.log("[Turnstile] No token provided");
    return { ok: false, error: "CAPTCHA verification required" };
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }
    
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    
    if (!response.ok) {
      console.error("[Turnstile] API error:", response.status);
      return { ok: false, error: "CAPTCHA verification failed" };
    }
    
    const result: TurnstileResponse = await response.json();
    
    if (result.success) {
      console.log("[Turnstile] Verification successful");
      return { ok: true };
    }
    
    const errorCodes = result["error-codes"] || [];
    console.log("[Turnstile] Verification failed:", errorCodes);
    
    // Map error codes to user-friendly messages
    if (errorCodes.includes("timeout-or-duplicate")) {
      return { ok: false, error: "CAPTCHA expired, please try again" };
    }
    if (errorCodes.includes("invalid-input-response")) {
      return { ok: false, error: "Invalid CAPTCHA response" };
    }
    
    return { ok: false, error: "CAPTCHA verification failed" };
  } catch (error) {
    console.error("[Turnstile] Error:", error);
    // On error, allow the request in production to not block users
    // but log for monitoring
    return { ok: true };
  }
}

/**
 * Check if bulk upload protection should be applied
 * Triggered when uploading more than 5 files at once
 */
export function shouldRequireTurnstileForBulkUpload(fileCount: number): boolean {
  if (!isTurnstileConfigured()) return false;
  return fileCount > 5;
}

/**
 * Middleware helper to extract client IP
 */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): string | undefined {
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string") return cfIp;
  
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  
  return req.ip;
}
