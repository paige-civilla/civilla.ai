import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
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
app.post(
  '/api/stripe/webhook',
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
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const PgSession = connectPgSimple(session);

app.use(
  session({
    name: "civilla.sid",
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(requestIdMiddleware);

export const serverStartTime = Date.now();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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
    console.log('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }
  
  // Fix corrupted DATABASE_URL if it has prefix before postgresql://
  if (databaseUrl.includes('postgresql://') && !databaseUrl.startsWith('postgresql://')) {
    databaseUrl = databaseUrl.substring(databaseUrl.indexOf('postgresql://'));
    console.log('Fixed DATABASE_URL prefix corruption');
  }

  try {
    console.log('Step 1: Running Stripe migrations...');
    await runMigrations({ databaseUrl, schema: 'stripe' } as any);
    console.log('Step 1 complete: Stripe schema ready');
    
    console.log('Step 2: Getting Stripe sync instance...');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    if (webhookResult?.webhook?.url) {
      console.log(`Webhook configured: ${webhookResult.webhook.url}`);
    } else {
      console.log('Webhook setup returned:', JSON.stringify(webhookResult));
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

async function runBackgroundInit() {
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
    const requeuedCount = await requeueStaleExtractions();
    if (requeuedCount > 0) {
      console.log(`Re-queued ${requeuedCount} stale evidence extractions`);
    }
  } catch (err) {
    console.error("Failed to re-queue stale extractions:", err);
  }

  log("Background initialization complete");
}

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
      const lexiKeyPresent = !!(process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || "").trim();
      log(`[Startup] Lexi provider: openai-direct | OPENAI_API_KEY present: ${lexiKeyPresent}`);
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
