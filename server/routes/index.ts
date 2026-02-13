import { Express } from "express";
import { Server } from "http";
import { authRouter } from "./auth.routes";
import { casesRouter } from "./cases.routes";
import { lexiRouter } from "./lexi.routes";
import { evidenceRouter } from "./evidence.routes";
import { documentsRouter } from "./documents.routes";
import { billingRouter } from "./billing.routes";
import { adminRouter } from "./admin.routes";
import oauthRouter from "../oauth";
import { logger } from "../logger";

/**
 * Register all application routes
 */
export async function registerRoutes(httpServer: Server, app: Express) {
  logger.info("Registering application routes...");

  // Auth routes
  app.use("/api", authRouter);
  logger.info("✓ Auth routes registered");

  // OAuth routes
  app.use("/api/auth", oauthRouter);
  logger.info("✓ OAuth routes registered");

  // Case routes
  app.use("/api/cases", casesRouter);
  logger.info("✓ Case routes registered");

  // Lexi AI routes
  app.use("/api/lexi", lexiRouter);
  logger.info("✓ Lexi routes registered");

  // Evidence routes
  app.use("/api", evidenceRouter);
  logger.info("✓ Evidence routes registered");

  // Document routes
  app.use("/api", documentsRouter);
  logger.info("✓ Document routes registered");

  // Billing routes
  app.use("/api/billing", billingRouter);
  logger.info("✓ Billing routes registered");

  // Admin routes
  app.use("/api/admin", adminRouter);
  logger.info("✓ Admin routes registered");

  logger.info("All routes registered successfully");
}
