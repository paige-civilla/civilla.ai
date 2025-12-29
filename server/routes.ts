import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth } from "./auth";
import { testDbConnection } from "./db";
// Turnstile disabled - import commented out
// import { verifyTurnstile } from "./turnstile";
import oauthRouter from "./oauth";
import { insertCaseSchema, insertTimelineEventSchema, timelineEvents } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get("/api/health/db", async (_req, res) => {
    const result = await testDbConnection();
    if (result.ok) {
      res.json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: result.error });
    }
  });

  app.get("/api/health/session", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      hasUserId: !!req.session.userId,
    });
  });

  app.get("/api/turnstile/site-key", (_req, res) => {
    // CAPTCHA disabled
    res.json({ siteKey: "" });
  });

  app.get("/api/auth/turnstile-status", (_req, res) => {
    res.json({
      enabled: false,
      siteKeyPresent: false,
      isProduction: process.env.NODE_ENV === "production",
    });
  });

  app.use("/api/auth", oauthRouter);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash });

      req.session.userId = user.id;
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Registration failed" });
        }
        console.log(`register success: userId=${user.id}, sessionID=${req.sessionID}, hasUserId=${!!req.session.userId}`);
        res.json({ user: { id: user.id, email: user.email, casesAllowed: user.casesAllowed } });
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await comparePasswords(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        console.log(`login success: userId=${user.id}, sessionID=${req.sessionID}, hasUserId=${!!req.session.userId}`);
        res.json({ user: { id: user.id, email: user.email, casesAllowed: user.casesAllowed } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email, casesAllowed: user.casesAllowed } });
  });

  app.get("/api/cases", requireAuth, async (req, res) => {
    try {
      const cases = await storage.getCasesByUserId(req.session.userId!);
      res.json({ cases });
    } catch (error) {
      console.error("Get cases error:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  app.post("/api/cases", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const caseCount = await storage.getCaseCountByUserId(userId);
      if (caseCount >= user.casesAllowed) {
        return res.status(403).json({ 
          error: "Case limit reached", 
          message: `You can only create ${user.casesAllowed} case(s). Upgrade to create more.` 
        });
      }

      const parseResult = insertCaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid case data", details: parseResult.error.errors });
      }

      const newCase = await storage.createCase(userId, parseResult.data);
      res.status(201).json({ case: newCase });
    } catch (error) {
      console.error("Create case error:", error);
      res.status(500).json({ error: "Failed to create case" });
    }
  });

  app.get("/api/cases/:caseId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      res.json({ case: caseRecord });
    } catch (error) {
      console.error("Get case error:", error);
      res.status(500).json({ error: "Failed to get case" });
    }
  });

  app.patch("/api/cases/:caseId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const existingCase = await storage.getCase(caseId, userId);
      if (!existingCase) {
        return res.status(404).json({ error: "Case not found" });
      }

      const { title, state, county, caseType } = req.body;
      
      if (title !== undefined && typeof title !== "string") {
        return res.status(400).json({ error: "Invalid title" });
      }

      const updatedCase = await storage.updateCase(caseId, userId, {
        title: title || existingCase.title,
        state,
        county,
        caseType,
      });

      res.json({ case: updatedCase });
    } catch (error) {
      console.error("Update case error:", error);
      res.status(500).json({ error: "Failed to update case" });
    }
  });

  app.get("/api/health/timeline", async (_req, res) => {
    try {
      await db.select().from(timelineEvents).limit(1);
      res.json({ ok: true });
    } catch (error) {
      console.error("Timeline health check error:", error);
      res.status(500).json({ ok: false, error: "Timeline table unavailable" });
    }
  });

  app.get("/api/cases/:caseId/timeline", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const events = await storage.listTimelineEvents(caseId, userId);
      res.json({ events });
    } catch (error) {
      console.error("Get timeline events error:", error);
      res.status(500).json({ error: "Failed to fetch timeline events" });
    }
  });

  app.post("/api/cases/:caseId/timeline", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertTimelineEventSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid event data", details: parseResult.error.errors });
      }

      const event = await storage.createTimelineEvent(caseId, userId, parseResult.data);
      res.status(201).json({ event });
    } catch (error) {
      console.error("Create timeline event error:", error);
      res.status(500).json({ error: "Failed to create timeline event" });
    }
  });

  app.patch("/api/timeline/:eventId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { eventId } = req.params;

      const existingEvent = await storage.getTimelineEvent(eventId, userId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      const caseRecord = await storage.getCase(existingEvent.caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found or access denied" });
      }

      const { eventDate, title, category, notes } = req.body;
      
      if (title !== undefined && (typeof title !== "string" || title.length === 0 || title.length > 120)) {
        return res.status(400).json({ error: "Title must be 1-120 characters" });
      }

      const validCategories = ["court", "filing", "communication", "incident", "parenting_time", "expense", "medical", "school", "other"];
      if (category !== undefined && !validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const updatedEvent = await storage.updateTimelineEvent(eventId, userId, {
        eventDate: eventDate ? new Date(eventDate) : undefined,
        title,
        category,
        notes,
      });

      res.json({ event: updatedEvent });
    } catch (error) {
      console.error("Update timeline event error:", error);
      res.status(500).json({ error: "Failed to update timeline event" });
    }
  });

  app.delete("/api/timeline/:eventId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { eventId } = req.params;

      const existingEvent = await storage.getTimelineEvent(eventId, userId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      const caseRecord = await storage.getCase(existingEvent.caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found or access denied" });
      }

      const deleted = await storage.deleteTimelineEvent(eventId, userId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete event" });
      }

      res.json({ message: "Event deleted" });
    } catch (error) {
      console.error("Delete timeline event error:", error);
      res.status(500).json({ error: "Failed to delete timeline event" });
    }
  });

  return httpServer;
}
