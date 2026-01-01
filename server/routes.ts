import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth } from "./auth";
import { testDbConnection, pool } from "./db";
import oauthRouter from "./oauth";
import { insertCaseSchema, insertTimelineEventSchema, timelineEvents, allowedEvidenceMimeTypes, evidenceFiles, updateEvidenceMetadataSchema, insertDocumentSchema, updateDocumentSchema, documentTemplateKeys, upsertUserProfileSchema, insertGeneratedDocumentSchema, generateDocumentPayloadSchema, generatedDocumentTemplateTypes, type GenerateDocumentPayload } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import multer from "multer";
import crypto from "crypto";
import { isR2Configured, uploadToR2, getSignedDownloadUrl, deleteFromR2 } from "./r2";
import { buildCourtDocx, type CourtDocxPayload } from "./courtDocx";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const DOCUMENT_TEMPLATES: Record<string, { title: string; content: string }> = {
  declaration: {
    title: "Declaration",
    content: `DECLARATION

I, [YOUR FULL NAME], declare under penalty of perjury under the laws of the State of [STATE] that the following is true and correct:

1. I am over the age of 18 years and competent to testify to the matters stated herein.

2. [Add your numbered statements of fact here]

3. [Each paragraph should contain one clear statement]

4. [Include dates, times, and specific details where relevant]

I declare under penalty of perjury that the foregoing is true and correct.

Executed on [DATE] at [CITY], [STATE].


_______________________________
[YOUR PRINTED NAME]
Declarant`,
  },
  motion: {
    title: "Motion",
    content: `[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[PHONE NUMBER]
[EMAIL ADDRESS]
Petitioner/Respondent, In Pro Per

SUPERIOR COURT OF THE STATE OF [STATE]
COUNTY OF [COUNTY]

In re the Matter of:

[PETITIONER NAME],
        Petitioner,
vs.
[RESPONDENT NAME],
        Respondent.

Case No.: [CASE NUMBER]

MOTION FOR [RELIEF SOUGHT]

COMES NOW [YOUR NAME], appearing in pro per, and respectfully moves this Honorable Court for an order [describe relief sought].

This motion is made on the following grounds:

1. [State your first reason or fact supporting this motion]

2. [State additional reasons or facts]

3. [Include all relevant information]

This motion is based upon this notice of motion, the attached memorandum of points and authorities, the declaration of [YOUR NAME], all pleadings and papers on file in this action, and such oral and documentary evidence as may be presented at the hearing of this motion.

WHEREFORE, [YOUR NAME] respectfully requests that this Court:
1. Grant this motion;
2. [List other specific relief requested];
3. Award such other and further relief as the Court deems just and proper.

Dated: [DATE]

Respectfully submitted,

_______________________________
[YOUR PRINTED NAME]
Petitioner/Respondent, In Pro Per`,
  },
  proposed_order: {
    title: "Proposed Order",
    content: `SUPERIOR COURT OF THE STATE OF [STATE]
COUNTY OF [COUNTY]

In re the Matter of:

[PETITIONER NAME],
        Petitioner,
vs.
[RESPONDENT NAME],
        Respondent.

Case No.: [CASE NUMBER]

[PROPOSED] ORDER ON [MOTION TYPE]

The Court, having considered [YOUR NAME]'s Motion for [RELIEF SOUGHT], filed on [DATE], and good cause appearing therefor;

IT IS HEREBY ORDERED:

1. [First order or finding]

2. [Second order or finding]

3. [Additional orders as needed]

This order is effective [immediately / as of DATE].


Dated: _______________

_______________________________
Judge of the Superior Court`,
  },
  certificate_of_service: {
    title: "Certificate of Service",
    content: `[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[PHONE NUMBER]
[EMAIL ADDRESS]
Petitioner/Respondent, In Pro Per

SUPERIOR COURT OF THE STATE OF [STATE]
COUNTY OF [COUNTY]

In re the Matter of:

[PETITIONER NAME],
        Petitioner,
vs.
[RESPONDENT NAME],
        Respondent.

Case No.: [CASE NUMBER]

CERTIFICATE OF SERVICE

I certify that on this ____ day of __________, 2025, I served a true and correct copy of the foregoing [Document Title] upon:

[Name]
[Address]
[City, State ZIP]

via:
[ ] U.S. Mail, postage prepaid
[ ] Hand Delivery
[ ] Email to: [email address]
[ ] Other: __________


DATED this ____ day of __________, 2025.


_______________________________
[YOUR FULL NAME]
Petitioner, Pro Se`,
  },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 100);
}

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

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const profile = await storage.getUserProfile(userId);

      if (profile) {
        res.json({
          profile: {
            fullName: profile.fullName,
            email: profile.email || user?.email || null,
            addressLine1: profile.addressLine1,
            addressLine2: profile.addressLine2,
            city: profile.city,
            state: profile.state,
            zip: profile.zip,
            phone: profile.phone,
            partyRole: profile.partyRole,
            isSelfRepresented: profile.isSelfRepresented,
            autoFillEnabled: profile.autoFillEnabled,
          },
        });
      } else {
        res.json({
          profile: {
            fullName: null,
            email: user?.email || null,
            addressLine1: null,
            addressLine2: null,
            city: null,
            state: null,
            zip: null,
            phone: null,
            partyRole: null,
            isSelfRepresented: true,
            autoFillEnabled: true,
          },
        });
      }
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parseResult = upsertUserProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid profile data", details: parseResult.error.errors });
      }

      const updatedProfile = await storage.upsertUserProfile(userId, parseResult.data);
      const user = await storage.getUser(userId);

      res.json({
        profile: {
          fullName: updatedProfile.fullName,
          email: updatedProfile.email || user?.email || null,
          addressLine1: updatedProfile.addressLine1,
          addressLine2: updatedProfile.addressLine2,
          city: updatedProfile.city,
          state: updatedProfile.state,
          zip: updatedProfile.zip,
          phone: updatedProfile.phone,
          partyRole: updatedProfile.partyRole,
          isSelfRepresented: updatedProfile.isSelfRepresented,
          autoFillEnabled: updatedProfile.autoFillEnabled,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
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
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      if (parseResult.data.notes && parseResult.data.notes.length > 10000) {
        return res.status(400).json({ error: "Validation failed", fields: { notes: "Notes must be 10,000 characters or less" } });
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
      const fields: Record<string, string> = {};
      
      if (title !== undefined) {
        if (typeof title !== "string" || title.length === 0) {
          fields.title = "Title is required";
        } else if (title.length > 120) {
          fields.title = "Title must be 120 characters or less";
        }
      }

      if (eventDate !== undefined) {
        const parsedDate = new Date(eventDate);
        if (isNaN(parsedDate.getTime())) {
          fields.eventDate = "Invalid date";
        }
      }

      const validCategories = ["court", "filing", "communication", "incident", "parenting_time", "expense", "medical", "school", "other"];
      if (category !== undefined && !validCategories.includes(category)) {
        fields.category = "Invalid category";
      }

      if (notes !== undefined && typeof notes === "string" && notes.length > 10000) {
        fields.notes = "Notes must be 10,000 characters or less";
      }

      if (Object.keys(fields).length > 0) {
        return res.status(400).json({ error: "Validation failed", fields });
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

  app.get("/api/health/evidence", async (_req, res) => {
    try {
      const result = await pool.query("SELECT 1 FROM evidence_files LIMIT 1");
      res.json({ ok: true, r2Configured: isR2Configured() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.get("/api/cases/:caseId/evidence", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const files = await storage.listEvidenceFiles(caseId, userId);
      res.json({ files, r2Configured: isR2Configured() });
    } catch (error) {
      console.error("List evidence error:", error);
      res.status(500).json({ error: "Failed to list evidence files" });
    }
  });

  app.post("/api/cases/:caseId/evidence", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!isR2Configured()) {
        return res.status(503).json({ error: "Uploads not configured" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Validation failed", fields: { file: "File is required" } });
      }

      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "Validation failed", fields: { file: "File must be 25MB or less" } });
      }

      const mimeType = req.file.mimetype;
      if (!allowedEvidenceMimeTypes.includes(mimeType as any)) {
        return res.status(400).json({ 
          error: "Validation failed", 
          fields: { file: "File type not allowed. Allowed: PDF, images, Word documents, text, CSV, ZIP" } 
        });
      }

      const fileId = crypto.randomUUID();
      const sanitizedName = sanitizeFileName(req.file.originalname);
      const storageKey = `${userId}/${caseId}/${fileId}-${sanitizedName}`;

      const sha256 = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

      await uploadToR2(storageKey, req.file.buffer, mimeType);

      const notes = typeof req.body.notes === "string" ? req.body.notes.slice(0, 10000) : undefined;

      const file = await storage.createEvidenceFile(caseId, userId, {
        originalName: req.file.originalname,
        storageKey,
        mimeType,
        sizeBytes: req.file.size,
        sha256,
        notes,
      });

      res.status(201).json({ file });
    } catch (error) {
      console.error("Upload evidence error:", error);
      res.status(500).json({ error: "Failed to upload evidence file" });
    }
  });

  app.get("/api/evidence/:evidenceId/download", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { evidenceId } = req.params;

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (!isR2Configured()) {
        return res.status(503).json({ error: "Downloads not configured" });
      }

      const signedUrl = await getSignedDownloadUrl(file.storageKey, 300);
      res.redirect(302, signedUrl);
    } catch (error) {
      console.error("Download evidence error:", error);
      res.status(500).json({ error: "Failed to download evidence file" });
    }
  });

  app.patch("/api/cases/:caseId/evidence/:evidenceId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, evidenceId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "File not found" });
      }

      const parseResult = updateEvidenceMetadataSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const updated = await storage.updateEvidenceMetadata(evidenceId, userId, parseResult.data);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update file metadata" });
      }

      res.json({ file: updated });
    } catch (error) {
      console.error("Update evidence metadata error:", error);
      res.status(500).json({ error: "Failed to update file metadata" });
    }
  });

  app.delete("/api/evidence/:evidenceId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { evidenceId } = req.params;

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (isR2Configured()) {
        try {
          await deleteFromR2(file.storageKey);
        } catch (r2Error) {
          console.error("R2 delete error:", r2Error);
          return res.status(500).json({ error: "Failed to delete file from storage" });
        }
      }

      const deleted = await storage.deleteEvidenceFile(evidenceId, userId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete file record" });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete evidence error:", error);
      res.status(500).json({ error: "Failed to delete evidence file" });
    }
  });

  app.get("/api/health/documents", async (_req, res) => {
    try {
      await pool.query("SELECT 1 FROM documents LIMIT 1");
      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.get("/api/health/docx", (_req, res) => {
    res.json({ ok: true, message: "DOCX generation available" });
  });

  app.get("/api/document-templates", requireAuth, (_req, res) => {
    const templates = documentTemplateKeys.map((key) => ({
      key,
      title: DOCUMENT_TEMPLATES[key]?.title || key,
    }));
    res.json({ templates });
  });

  app.get("/api/cases/:caseId/documents", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const docs = await storage.listDocuments(caseId, userId);
      res.json({ documents: docs });
    } catch (error) {
      console.error("List documents error:", error);
      res.status(500).json({ error: "Failed to list documents" });
    }
  });

  app.post("/api/cases/:caseId/documents", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const { title, templateKey } = parseResult.data;
      const templateContent = DOCUMENT_TEMPLATES[templateKey]?.content || "";

      const doc = await storage.createDocument(caseId, userId, {
        title,
        templateKey,
        content: templateContent,
      });

      res.status(201).json({ document: doc });
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/api/documents/:docId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const doc = await storage.getDocument(docId, userId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json({ document: doc });
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  app.patch("/api/documents/:docId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const existingDoc = await storage.getDocument(docId, userId);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const parseResult = updateDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const updated = await storage.updateDocument(docId, userId, parseResult.data);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update document" });
      }

      res.json({ document: updated });
    } catch (error) {
      console.error("Update document error:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.post("/api/documents/:docId/duplicate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const existingDoc = await storage.getDocument(docId, userId);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const dup = await storage.duplicateDocument(docId, userId);
      if (!dup) {
        return res.status(500).json({ error: "Failed to duplicate document" });
      }

      res.status(201).json({ document: dup });
    } catch (error) {
      console.error("Duplicate document error:", error);
      res.status(500).json({ error: "Failed to duplicate document" });
    }
  });

  app.delete("/api/documents/:docId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const existingDoc = await storage.getDocument(docId, userId);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const deleted = await storage.deleteDocument(docId, userId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete document" });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get("/api/documents/:docId/export/docx", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const doc = await storage.getDocument(docId, userId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const paragraphs = doc.content.split("\n").map((line) => {
        return new Paragraph({
          children: [new TextRun(line)],
        });
      });

      const docxDoc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const buffer = await Packer.toBuffer(docxDoc);

      const sanitizedTitle = doc.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").slice(0, 50);
      const filename = `${sanitizedTitle || "document"}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export DOCX error:", error);
      res.status(500).json({ error: "Failed to export document" });
    }
  });

  app.post("/api/templates/docx", requireAuth, async (req, res) => {
    try {
      const payload = req.body || {};
      const buf = await buildCourtDocx(payload);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=court-document.docx");
      return res.status(200).send(buf);
    } catch (err) {
      console.error("DOCX generation error:", err);
      return res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });

  app.get("/api/cases/:caseId/generated-documents", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const docs = await storage.listGeneratedDocuments(userId, caseId);
      res.json({ documents: docs });
    } catch (error) {
      console.error("List generated documents error:", error);
      res.status(500).json({ error: "Failed to list generated documents" });
    }
  });

  app.post("/api/cases/:caseId/documents/generate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertGeneratedDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path.join(".");
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const { templateType, title, payload } = parseResult.data;

      const doc = await storage.createGeneratedDocument(
        userId,
        caseId,
        templateType,
        title,
        payload
      );

      res.status(201).json({ document: doc });
    } catch (error) {
      console.error("Create generated document error:", error);
      res.status(500).json({ error: "Failed to create generated document" });
    }
  });

  app.get("/api/generated-documents/:docId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { docId } = req.params;

      const doc = await storage.getGeneratedDocument(userId, docId);
      if (!doc) {
        return res.status(404).json({ error: "Generated document not found" });
      }

      res.json({ document: doc });
    } catch (error) {
      console.error("Get generated document error:", error);
      res.status(500).json({ error: "Failed to get generated document" });
    }
  });

  return httpServer;
}
