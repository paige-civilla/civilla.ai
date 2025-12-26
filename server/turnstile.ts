interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(token: string, ip?: string): Promise<{ ok: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log("Turnstile: dev bypass (no secret key)");
      return { ok: true };
    }
    return { ok: false, error: "captcha_not_configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const result: TurnstileResponse = await response.json();

    if (result.success) {
      return { ok: true };
    }

    console.log("Turnstile verification failed:", result["error-codes"]?.join(", ") || "unknown");
    return { ok: false, error: "captcha_failed" };
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return { ok: false, error: "captcha_failed" };
  }
}
