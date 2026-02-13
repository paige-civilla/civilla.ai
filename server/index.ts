import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool, initDbTables } from "./db";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { requeueStaleExtractions } from "./services/evidenceJobs";
import { logGcvStatus } from "./services/evidenceExtraction";
import { requestIdMiddleware } from "./middleware/requestId";
import helmet from "helmet";
import compression from "compression";
import { logger } from "./logger";
import cors from "cors";
import { config, validateConfig } from "./config";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Stripe webhook route MUST be registered BEFORE express.json() middleware
// This ensures req.body is the raw Buffer needed for signature verification
  // Stripe webhook IP whitelist for extra security
  const STRIPE_WEBHOOK_IPS = [
    '3.18.12.63',
    '3.130.192.231', 
    '13.235.14.237',
    '18.211.135.69',
    '3.33.155.40',
    '35.154.171.200',
    '52.15.183.38',
    '18.157.65.240',
    '3.68.177.215',
    '54.187.174.169',
    '54.187.205.235',
    '54.187.216.72',
  ]; 

app.post(
  '/api/stripe/webhook',
  (req, res, next) => {
    // Verify request is from Stripe IPs (optional but recommended)
    const clientIp = getClientIp(req);

    // In production, enforce IP whitelist
    if (process.env.NODE_ENV === 'production' && !STRIPE_WEBHOOK_IPS.includes(clientIp)) {
      logger.warn(`Blocked webhook from unauthorized IP: ${clientIp}`);
      return res.status(403).json({ error: 'Forbidden - Invalid source IP' });
    }

    next();
  },
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error:', { message: error.message });
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);
// Compress all responses
app.use(compression());
// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : [
      'http://localhost:5173', // Vite dev
      'http://localhost:5000', // Local server
    ];

// Add Replit domains if available
if (process.env.REPLIT_DOMAINS) {
  const replitDomains = process.env.REPLIT_DOMAINS.split(',').map(
    domain => `https://${domain.trim()}`
  );
  allowedOrigins.push(...replitDomains);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking Vite dev mode
  crossOriginEmbedderPolicy: false, // Disable for development compatibility
}));

const PgSession = connectPgSimple(session);

// Validate required session secret
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required. Please set it in Replit Secrets.",
  );
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

app.use(
  session({
    name: "civilla.sid",
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SEVEN_DAYS_MS,
    },
  }),
);

app.use(requestIdMiddleware);
// General API rate limiting - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for authentication endpoints - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

export const serverStartTime = Date.now();

export function log(message: string, source = "express") {
  logger.info(message, { source });
}

    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

          if (capturedJsonResponse) {
            const jsonStr = JSON.stringify(capturedJsonResponse);
            const MAX_LOG_SIZE = 1000; // Limit log size to prevent memory issues

            if (jsonStr.length > MAX_LOG_SIZE) {
              const preview = jsonStr.substring(0, MAX_LOG_SIZE);
              logLine += ` :: ${preview}...[truncated ${jsonStr.length - MAX_LOG_SIZE} chars]`;
            } else {
              logLine += ` :: ${jsonStr}`;
            }
          }

          log(logLine);
        }
      });

      next();
    });
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function initStripe() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  // Fix corrupted DATABASE_URL if it has prefix before postgresql://
  if (
    databaseUrl.includes("postgresql://") &&
    !databaseUrl.startsWith("postgresql://")
  ) {
    databaseUrl = databaseUrl.substring(databaseUrl.indexOf("postgresql://"));
    console.log("Fixed DATABASE_URL prefix corruption");
  }

  try {
    console.log("Step 1: Running Stripe migrations...");
    await runMigrations({ databaseUrl, schema: "stripe" } as any);
    console.log("Step 1 complete: Stripe schema ready");

    console.log("Step 2: Getting Stripe sync instance...");

    const stripeSync = await getStripeSync();

    console.log("Setting up managed webhook...");
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
    );
    if (webhookResult?.webhook?.url) {
      console.log(`Webhook configured: ${webhookResult.webhook.url}`);
    } else {
      console.log("Webhook setup returned:", JSON.stringify(webhookResult));
    }

    console.log("Syncing Stripe data...");
    stripeSync
      .syncBackfill()
      .then(() => console.log("Stripe data synced"))
      .catch((err: any) => console.error("Error syncing Stripe data:", err));
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
  }
}

async function runBackgroundInit() {
  // Validate configuration on startup
  validateConfig();
  try {
    await initDbTables();
  } catch (err) {
    console.error("Failed to initialize DB tables:", err);
  }

  try {
    await initStripe();
  } catch (err) {
    console.error("Failed to initialize Stripe:", err);
  }

  try {
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    // Log full error details server-side for debugging
    console.error(`[${req.method} ${req.path}] Error ${status}:`, {
      message: err.message,
      stack: err.stack,
      requestId: (req as any).requestId,
    });

    // Send sanitized error to client
    const message = process.env.NODE_ENV === 'production' 
      ? 'An error occurred. Please try again.' 
      : err.message || 'Internal Server Error';

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  log("Background initialization complete");
  } catch (err) {
    console.error("Background initialization failed:", err);
  }}

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      const lexiKeyPresent = !!(
        process.env.OPENAI_API_KEY ||
        process.env.OPEN_AI_KEY ||
        ""
      ).trim();
      log(
        `[Startup] Lexi provider: openai-direct | OPENAI_API_KEY present: ${lexiKeyPresent}`,
      );
      if (!lexiKeyPresent) {
        log("WARNING: OPENAI_API_KEY not set - Lexi will be unavailable");
      }
      logGcvStatus();

      // Run all async initialization in the background AFTER server is listening
      runBackgroundInit().catch((err) => {
        console.error("Background init error:", err);
      });
    },
  );
})();
