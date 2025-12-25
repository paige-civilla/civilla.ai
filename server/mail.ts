export interface MailProvider {
  sendMagicLink(email: string, token: string, baseUrl: string): Promise<void>;
}

class DevMailProvider implements MailProvider {
  async sendMagicLink(email: string, token: string, baseUrl: string): Promise<void> {
    const link = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
    console.log("\n========================================");
    console.log("DEV MODE: Magic Link Email");
    console.log("========================================");
    console.log(`To: ${email}`);
    console.log(`Link: ${link}`);
    console.log("========================================\n");
  }
}

class SmtpMailProvider implements MailProvider {
  async sendMagicLink(email: string, token: string, baseUrl: string): Promise<void> {
    const link = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;
    console.log(`SMTP: Would send magic link to ${email}: ${link}`);
  }
}

function createMailProvider(): MailProvider {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("Using SMTP mail provider");
    return new SmtpMailProvider();
  }
  console.log("Using DEV mail provider (logs to console)");
  return new DevMailProvider();
}

export const mailProvider = createMailProvider();
