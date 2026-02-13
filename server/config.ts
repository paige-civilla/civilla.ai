import { logger } from "./logger";

interface Config {
  server: {
    port: number;
    env: string;
    isProduction: boolean;
    isDevelopment: boolean;
  };
  database: {
    url: string;
  };
  session: {
    secret: string;
  };
  ai: {
    openaiKey: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
  };
  google: {
    visionKeyFile: string | undefined;
  };
  replit: {
    domains: string[];
  };
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue = ""): string {
  return process.env[key] || defaultValue;
}

// Validate and export config
export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
    env: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV !== "production",
  },
  database: {
    url: getRequiredEnv("DATABASE_URL"),
  },
  session: {
    secret: getRequiredEnv("SESSION_SECRET"),
  },
  ai: {
    openaiKey: getRequiredEnv("OPENAI_API_KEY"),
  },
  stripe: {
    secretKey: getOptionalEnv("STRIPE_SECRET_KEY"),
    webhookSecret: getOptionalEnv("STRIPE_WEBHOOK_SECRET"),
  },
  r2: {
    accountId: getOptionalEnv("R2_ACCOUNT_ID"),
    accessKeyId: getOptionalEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getOptionalEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: getOptionalEnv("R2_BUCKET_NAME"),
    endpoint: getOptionalEnv("R2_ENDPOINT"),
  },
  google: {
    visionKeyFile: process.env.GOOGLE_CLOUD_VISION_KEY_FILE,
  },
  replit: {
    domains: (process.env.REPLIT_DOMAINS || "").split(",").filter(Boolean),
  },
};

// Log configuration on startup (without sensitive values)
logger.info("Configuration loaded", {
  env: config.server.env,
  port: config.server.port,
  hasDatabase: !!config.database.url,
  hasOpenAI: !!config.ai.openaiKey,
  hasStripe: !!config.stripe.secretKey,
  hasR2: !!config.r2.accountId,
  hasGoogleVision: !!config.google.visionKeyFile,
  replitDomains: config.replit.domains.length,
});

// Validate required configs
export function validateConfig() {
  const required = ["DATABASE_URL", "SESSION_SECRET", "OPENAI_API_KEY"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error("Missing required environment variables:", { missing });
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  logger.info("✓ All required environment variables present");
}
