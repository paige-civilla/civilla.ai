interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(token: string, ip?: string): Promise<{ ok: boolean; error?: string }> {
  // CAPTCHA disabled - always allow
  return { ok: true };
}
