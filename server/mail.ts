export interface MailResult {
  success: boolean;
  error?: string;
}

export interface MailProvider {
  sendMagicLink(email: string, token: string, baseUrl: string): Promise<MailResult>;
}

class DevMailProvider implements MailProvider {
  async sendMagicLink(email: string, token: string, baseUrl: string): Promise<MailResult> {
    try {
      const link = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
      console.log("\n========================================");
      console.log("DEV MODE: Magic Link Email");
      console.log("========================================");
      console.log(`To: ${email}`);
      console.log(`Link: ${link}`);
      console.log("========================================\n");
      return { success: true };
    } catch (error) {
      console.error("DevMailProvider error:", error);
      return { success: false, error: "Failed to log magic link" };
    }
  }
}

class SmtpMailProvider implements MailProvider {
  async sendMagicLink(email: string, token: string, baseUrl: string): Promise<MailResult> {
    try {
      const link = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
      console.log(`SMTP: Would send magic link to ${email}: ${link}`);
      return { success: true };
    } catch (error) {
      console.error("SmtpMailProvider error (fail-soft):", error instanceof Error ? error.message : "Unknown error");
      return { success: false, error: "Email service temporarily unavailable" };
    }
  }
}

function createMailProvider(): MailProvider {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS
  );
  
  console.log(`SMTP configured: ${smtpConfigured ? "yes" : "no"}`);
  
  if (smtpConfigured) {
    console.log("Using SMTP mail provider (fail-soft mode)");
    return new SmtpMailProvider();
  }
  
  console.log("Using DEV mail provider (logs to console)");
  return new DevMailProvider();
}

export const mailProvider = createMailProvider();
