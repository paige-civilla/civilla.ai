import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth } from "./auth";
import { testDbConnection, pool } from "./db";
import oauthRouter from "./oauth";
import { insertCaseSchema, insertTimelineEventSchema, timelineEvents, allowedEvidenceMimeTypes, evidenceFiles, updateEvidenceMetadataSchema, insertDocumentSchema, updateDocumentSchema, documentTemplateKeys, upsertUserProfileSchema, insertGeneratedDocumentSchema, generateDocumentPayloadSchema, generatedDocumentTemplateTypes, type GenerateDocumentPayload, insertCaseChildSchema, updateCaseChildSchema, insertTaskSchema, updateTaskSchema, insertDeadlineSchema, updateDeadlineSchema, insertCalendarCategorySchema, insertCaseCalendarItemSchema, updateCaseCalendarItemSchema, insertContactSchema, updateContactSchema, insertCommunicationSchema, updateCommunicationSchema, insertExhibitListSchema, updateExhibitListSchema, insertExhibitSchema, updateExhibitSchema, attachEvidenceToExhibitSchema, createLexiThreadSchema, renameLexiThreadSchema, lexiChatRequestSchema, upsertCaseRuleTermSchema, upsertTrialBinderItemSchema, updateTrialBinderItemSchema, LEXI_GENERAL_CASE_ID, insertExhibitPacketSchema, updateExhibitPacketSchema, insertExhibitPacketItemSchema, updateExhibitPacketItemSchema, insertEvidenceNoteSchema, updateEvidenceNoteSchema } from "@shared/schema";
import { POLICY_VERSIONS, TOS_TEXT, PRIVACY_TEXT, NOT_LAW_FIRM_TEXT, RESPONSIBILITY_TEXT } from "./policyVersions";
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
import OpenAI from "openai";
import { buildLexiSystemPrompt } from "./lexi/systemPrompt";
import { SAFETY_TEMPLATES, detectUPLRequest, shouldBlockMessage } from "./lexi/safetyTemplates";
import { LEXI_BANNER_DISCLAIMER, LEXI_WELCOME_MESSAGE } from "./lexi/disclaimer";
import { classifyIntent, isDisallowed, DISALLOWED_RESPONSE, type LexiIntent } from "./lexi/policy";
import { prependDisclaimerIfNeeded } from "./lexi/format";
import { extractSourcesFromContent } from "./lexi/sources";
import { generateExhibitPacketZip } from "./exhibitPacketExport";

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
  affidavit: {
    title: "Affidavit",
    content: `STATE OF [STATE]
COUNTY OF [COUNTY]

AFFIDAVIT OF [YOUR FULL NAME]

I, [YOUR FULL NAME], being duly sworn, depose and state as follows:

1. I am over the age of 18 years and am competent to make this affidavit.

2. [State your first fact]

3. [State your second fact]

4. [Continue with additional facts as needed]

FURTHER AFFIANT SAYETH NOT.


_______________________________
[YOUR FULL NAME]
Affiant

Subscribed and sworn to before me this ____ day of __________, 20____.


_______________________________
Notary Public
My Commission Expires: __________`,
  },
  notice_of_appearance: {
    title: "Notice of Appearance",
    content: `[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[PHONE NUMBER]
[EMAIL ADDRESS]
Appearing Pro Se

SUPERIOR COURT OF THE STATE OF [STATE]
COUNTY OF [COUNTY]

In re the Matter of:

[PETITIONER NAME],
        Petitioner,
vs.
[RESPONDENT NAME],
        Respondent.

Case No.: [CASE NUMBER]

NOTICE OF APPEARANCE

TO THE CLERK OF THE COURT AND ALL PARTIES:

PLEASE TAKE NOTICE that [YOUR FULL NAME] hereby appears in the above-entitled action as [Petitioner/Respondent], appearing pro se (self-represented).

All future pleadings, notices, and correspondence should be served upon me at the following address:

[YOUR FULL NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[PHONE NUMBER]
[EMAIL ADDRESS]

I request that I be notified of all proceedings in this matter.

DATED this ____ day of __________, 20____.


_______________________________
[YOUR FULL NAME]
[Petitioner/Respondent], Pro Se`,
  },
  case_information_sheet: {
    title: "Case Information Sheet",
    content: `CASE INFORMATION SHEET

COURT: Superior Court of [STATE], County of [COUNTY]
CASE NUMBER: [CASE NUMBER]
CASE TYPE: [Family Law / Dissolution / Custody / etc.]

PETITIONER INFORMATION:
Name: [PETITIONER FULL NAME]
Address: [ADDRESS]
City, State, ZIP: [CITY, STATE ZIP]
Phone: [PHONE]
Email: [EMAIL]
Self-Represented: [ ] Yes  [ ] No
Attorney (if applicable): [ATTORNEY NAME]

RESPONDENT INFORMATION:
Name: [RESPONDENT FULL NAME]
Address: [ADDRESS]
City, State, ZIP: [CITY, STATE ZIP]
Phone: [PHONE]
Email: [EMAIL]
Self-Represented: [ ] Yes  [ ] No
Attorney (if applicable): [ATTORNEY NAME]

CASE DETAILS:
Date of Marriage/Partnership: [DATE]
Date of Separation: [DATE]
Date Petition Filed: [DATE]

CHILDREN (if applicable):
[ ] No minor children
[ ] Minor children:
  Child 1: [NAME], DOB: [DATE]
  Child 2: [NAME], DOB: [DATE]
  [Add additional children as needed]

PROPERTY:
[ ] Community/Marital property to be divided
[ ] Separate property claims
[ ] No property issues

SUPPORT ISSUES:
[ ] Child support
[ ] Spousal support/alimony
[ ] No support issues

ORDERS REQUESTED:
[ ] Dissolution/Divorce
[ ] Legal separation
[ ] Custody/Parenting plan
[ ] Child support
[ ] Spousal support
[ ] Property division
[ ] Other: [DESCRIBE]

Date: _______________

Signature: _______________________________
Printed Name: [YOUR FULL NAME]`,
  },
  response: {
    title: "Response",
    content: `[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[PHONE NUMBER]
[EMAIL ADDRESS]
Respondent, In Pro Per

SUPERIOR COURT OF THE STATE OF [STATE]
COUNTY OF [COUNTY]

In re the Matter of:

[PETITIONER NAME],
        Petitioner,
vs.
[RESPONDENT NAME],
        Respondent.

Case No.: [CASE NUMBER]

RESPONSE TO [DOCUMENT BEING RESPONDED TO]

COMES NOW the Respondent, [YOUR FULL NAME], appearing pro se, and in response to [Petitioner's Motion/Petition/etc.] filed on [DATE], states as follows:

GENERAL RESPONSE:

1. [Admit/Deny/Lack sufficient information to admit or deny] the allegations in paragraph 1 of the [Petition/Motion].

2. [Continue responding to each paragraph]

3. [State any additional facts relevant to your response]

AFFIRMATIVE DEFENSES (if applicable):

1. [State any affirmative defenses]

RELIEF REQUESTED:

WHEREFORE, Respondent respectfully requests that this Court:

1. [Deny the relief requested in the motion/petition];

2. [State any counter-relief you are requesting];

3. Award such other and further relief as the Court deems just and proper.

DATED this ____ day of __________, 20____.


_______________________________
[YOUR FULL NAME]
Respondent, Pro Se`,
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
            firmName: profile.firmName,
            barNumber: profile.barNumber,
            onboardingDeferred: profile.onboardingDeferred || {},
            onboardingStatus: profile.onboardingStatus,
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
            firmName: null,
            barNumber: null,
            onboardingDeferred: {},
            onboardingStatus: "incomplete",
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

      const { title, nickname, state, county, caseType, caseNumber, hasChildren } = req.body;
      
      if (title !== undefined && typeof title !== "string") {
        return res.status(400).json({ error: "Invalid title" });
      }

      if (nickname !== undefined && nickname !== null && typeof nickname !== "string") {
        return res.status(400).json({ error: "Invalid nickname" });
      }

      if (hasChildren !== undefined && typeof hasChildren !== "boolean") {
        return res.status(400).json({ error: "Invalid hasChildren value" });
      }

      const updatedCase = await storage.updateCase(caseId, userId, {
        title: title || existingCase.title,
        nickname: nickname !== undefined ? nickname : existingCase.nickname,
        state,
        county,
        caseType,
        caseNumber: caseNumber !== undefined ? caseNumber : existingCase.caseNumber,
        hasChildren: hasChildren !== undefined ? hasChildren : existingCase.hasChildren,
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

  app.get("/api/cases/:caseId/evidence/:fileId/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, fileId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(fileId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "File not found" });
      }

      const notes = await storage.listEvidenceNotes(userId, caseId, fileId);
      res.json({ notes });
    } catch (error) {
      console.error("List evidence notes error:", error);
      res.status(500).json({ error: "Failed to list evidence notes" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:fileId/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, fileId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(fileId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "File not found" });
      }

      const parseResult = insertEvidenceNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const note = await storage.createEvidenceNote(userId, caseId, fileId, parseResult.data);
      res.status(201).json({ note });
    } catch (error) {
      console.error("Create evidence note error:", error);
      res.status(500).json({ error: "Failed to create evidence note" });
    }
  });

  app.patch("/api/evidence-notes/:noteId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { noteId } = req.params;

      const existing = await storage.getEvidenceNote(userId, noteId);
      if (!existing) {
        return res.status(404).json({ error: "Note not found" });
      }

      const parseResult = updateEvidenceNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        parseResult.error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ error: "Validation failed", fields: fieldErrors });
      }

      const updated = await storage.updateEvidenceNote(userId, noteId, parseResult.data);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update note" });
      }

      res.json({ note: updated });
    } catch (error) {
      console.error("Update evidence note error:", error);
      res.status(500).json({ error: "Failed to update evidence note" });
    }
  });

  app.delete("/api/evidence-notes/:noteId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { noteId } = req.params;

      const existing = await storage.getEvidenceNote(userId, noteId);
      if (!existing) {
        return res.status(404).json({ error: "Note not found" });
      }

      const deleted = await storage.deleteEvidenceNote(userId, noteId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete note" });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete evidence note error:", error);
      res.status(500).json({ error: "Failed to delete evidence note" });
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

  app.get("/api/cases/:caseId/children", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const children = await storage.listCaseChildren(caseId, userId);
      res.json({ children });
    } catch (error) {
      console.error("List case children error:", error);
      res.status(500).json({ error: "Failed to list case children" });
    }
  });

  app.post("/api/cases/:caseId/children", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertCaseChildSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const child = await storage.createCaseChild(caseId, userId, parseResult.data);
      res.status(201).json({ child });
    } catch (error) {
      console.error("Create case child error:", error);
      res.status(500).json({ error: "Failed to create case child" });
    }
  });

  app.patch("/api/children/:childId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { childId } = req.params;

      const existing = await storage.getCaseChild(childId, userId);
      if (!existing) {
        return res.status(404).json({ error: "Child not found" });
      }

      const parseResult = updateCaseChildSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateCaseChild(childId, userId, parseResult.data);
      res.json({ child: updated });
    } catch (error) {
      console.error("Update case child error:", error);
      res.status(500).json({ error: "Failed to update case child" });
    }
  });

  app.delete("/api/children/:childId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { childId } = req.params;

      const existing = await storage.getCaseChild(childId, userId);
      if (!existing) {
        return res.status(404).json({ error: "Child not found" });
      }

      const deleted = await storage.deleteCaseChild(childId, userId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete child" });
      }

      res.json({ message: "Child deleted" });
    } catch (error) {
      console.error("Delete case child error:", error);
      res.status(500).json({ error: "Failed to delete case child" });
    }
  });

  app.get("/api/cases/:caseId/tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const tasks = await storage.listTasks(userId, caseId);
      res.json({ tasks });
    } catch (error) {
      console.error("List tasks error:", error);
      res.status(500).json({ error: "Failed to list tasks" });
    }
  });

  app.post("/api/cases/:caseId/tasks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertTaskSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const task = await storage.createTask(userId, caseId, parseResult.data);
      res.status(201).json({ task });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:taskId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { taskId } = req.params;

      const parseResult = updateTaskSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateTask(userId, taskId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task: updated });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:taskId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { taskId } = req.params;

      const deleted = await storage.deleteTask(userId, taskId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ message: "Task deleted" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  app.get("/api/cases/:caseId/deadlines", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const deadlines = await storage.listDeadlines(userId, caseId);
      res.json({ deadlines });
    } catch (error) {
      console.error("List deadlines error:", error);
      res.status(500).json({ error: "Failed to list deadlines" });
    }
  });

  app.post("/api/cases/:caseId/deadlines", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertDeadlineSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const deadline = await storage.createDeadline(userId, caseId, parseResult.data);
      res.status(201).json({ deadline });
    } catch (error) {
      console.error("Create deadline error:", error);
      res.status(500).json({ error: "Failed to create deadline" });
    }
  });

  app.patch("/api/deadlines/:deadlineId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { deadlineId } = req.params;

      const parseResult = updateDeadlineSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateDeadline(userId, deadlineId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Deadline not found" });
      }

      res.json({ deadline: updated });
    } catch (error) {
      console.error("Update deadline error:", error);
      res.status(500).json({ error: "Failed to update deadline" });
    }
  });

  app.delete("/api/deadlines/:deadlineId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { deadlineId } = req.params;

      const deleted = await storage.deleteDeadline(userId, deadlineId);
      if (!deleted) {
        return res.status(404).json({ error: "Deadline not found" });
      }

      res.json({ message: "Deadline deleted" });
    } catch (error) {
      console.error("Delete deadline error:", error);
      res.status(500).json({ error: "Failed to delete deadline" });
    }
  });

  app.get("/api/cases/:caseId/calendar", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { month } = req.query;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const monthStr = typeof month === "string" ? month : new Date().toISOString().slice(0, 7);
      const [yearStr, monthNumStr] = monthStr.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthNumStr, 10);

      if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
      }

      const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
      const startOfNextMonth = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));

      const [allDeadlines, allTasks, allTimeline] = await Promise.all([
        storage.listDeadlines(userId, caseId),
        storage.listTasks(userId, caseId),
        storage.listTimelineEvents(caseId, userId),
      ]);

      const items: Array<{
        id: string;
        type: "deadline" | "task" | "timeline";
        title: string;
        date: string;
        meta: Record<string, any>;
      }> = [];

      for (const d of allDeadlines) {
        const dueDate = new Date(d.dueDate);
        if (dueDate >= startOfMonth && dueDate < startOfNextMonth) {
          items.push({
            id: d.id,
            type: "deadline",
            title: d.title,
            date: dueDate.toISOString(),
            meta: { status: d.status, notes: d.notes },
          });
        }
      }

      for (const t of allTasks) {
        if (t.dueDate) {
          const dueDate = new Date(t.dueDate);
          if (dueDate >= startOfMonth && dueDate < startOfNextMonth) {
            items.push({
              id: t.id,
              type: "task",
              title: t.title,
              date: dueDate.toISOString(),
              meta: { status: t.status, priority: t.priority },
            });
          }
        }
      }

      for (const e of allTimeline) {
        const eventDate = new Date(e.eventDate);
        if (eventDate >= startOfMonth && eventDate < startOfNextMonth) {
          items.push({
            id: e.id,
            type: "timeline",
            title: e.title,
            date: eventDate.toISOString(),
            meta: { category: e.category },
          });
        }
      }

      res.json({ month: monthStr, items });
    } catch (error) {
      console.error("Calendar fetch error:", error);
      res.status(500).json({ error: "Failed to fetch calendar items" });
    }
  });

  app.get("/api/cases/:caseId/calendar/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const categories = await storage.listCalendarCategories(userId, caseId);
      res.json({ categories });
    } catch (error) {
      console.error("List calendar categories error:", error);
      res.status(500).json({ error: "Failed to list categories" });
    }
  });

  app.post("/api/cases/:caseId/calendar/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertCalendarCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const category = await storage.createCalendarCategory(userId, caseId, parseResult.data);
      res.status(201).json({ category });
    } catch (error) {
      console.error("Create calendar category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.get("/api/cases/:caseId/calendar/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const items = await storage.listCaseCalendarItems(userId, caseId);
      res.json({ items });
    } catch (error) {
      console.error("List calendar items error:", error);
      res.status(500).json({ error: "Failed to list calendar items" });
    }
  });

  app.post("/api/cases/:caseId/calendar/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertCaseCalendarItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const item = await storage.createCaseCalendarItem(userId, caseId, parseResult.data);
      res.status(201).json({ item });
    } catch (error) {
      console.error("Create calendar item error:", error);
      res.status(500).json({ error: "Failed to create calendar item" });
    }
  });

  app.patch("/api/calendar/items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { itemId } = req.params;

      const parseResult = updateCaseCalendarItemSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateCaseCalendarItem(userId, itemId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Calendar item not found" });
      }

      res.json({ item: updated });
    } catch (error) {
      console.error("Update calendar item error:", error);
      res.status(500).json({ error: "Failed to update calendar item" });
    }
  });

  app.delete("/api/calendar/items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { itemId } = req.params;

      const deleted = await storage.deleteCaseCalendarItem(userId, itemId);
      if (!deleted) {
        return res.status(404).json({ error: "Calendar item not found" });
      }

      res.json({ message: "Calendar item deleted" });
    } catch (error) {
      console.error("Delete calendar item error:", error);
      res.status(500).json({ error: "Failed to delete calendar item" });
    }
  });

  app.get("/api/cases/:caseId/dashboard/calendar", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { month } = req.query;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const monthStr = typeof month === "string" ? month : new Date().toISOString().slice(0, 7);
      const [yearStr, monthNumStr] = monthStr.split("-");
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthNumStr, 10);

      if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
      }

      const monthStart = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
      const monthEnd = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

      const [allDeadlines, allTasks, allCalendarItems, categories, allCommunications] = await Promise.all([
        storage.listDeadlines(userId, caseId),
        storage.listTasks(userId, caseId),
        storage.listCaseCalendarItems(userId, caseId),
        storage.listCalendarCategories(userId, caseId),
        storage.listCaseCommunications(userId, caseId),
      ]);

      const categoryMap = new Map(categories.map(c => [c.id, c]));

      const defaultDeadlineColor = "#E57373";
      const defaultTodoColor = "#64B5F6";
      const defaultCalendarColor = "#7BA3A8";
      const defaultCommunicationColor = "#9575CD";

      type CalendarEvent = {
        kind: "deadline" | "todo" | "calendar" | "communication";
        id: string;
        title: string;
        date: string;
        isDone: boolean;
        color: string;
        categoryName?: string;
      };

      const events: CalendarEvent[] = [];

      for (const d of allDeadlines) {
        const dueDate = new Date(d.dueDate);
        if (dueDate >= monthStart && dueDate <= monthEnd) {
          events.push({
            kind: "deadline",
            id: d.id,
            title: d.title,
            date: dueDate.toISOString(),
            isDone: d.status === "done",
            color: defaultDeadlineColor,
          });
        }
      }

      for (const t of allTasks) {
        if (t.dueDate) {
          const dueDate = new Date(t.dueDate);
          if (dueDate >= monthStart && dueDate <= monthEnd) {
            events.push({
              kind: "todo",
              id: t.id,
              title: t.title,
              date: dueDate.toISOString(),
              isDone: t.status === "completed",
              color: defaultTodoColor,
            });
          }
        }
      }

      for (const item of allCalendarItems) {
        const startDate = new Date(item.startDate);
        if (startDate >= monthStart && startDate <= monthEnd) {
          const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
          events.push({
            kind: "calendar",
            id: item.id,
            title: item.title,
            date: startDate.toISOString(),
            isDone: item.isDone,
            color: item.colorOverride ?? category?.color ?? defaultCalendarColor,
            categoryName: category?.name,
          });
        }
      }

      for (const comm of allCommunications) {
        if (comm.followUpDate && comm.status !== "resolved") {
          const followUpDate = new Date(comm.followUpDate);
          if (followUpDate >= monthStart && followUpDate <= monthEnd) {
            events.push({
              kind: "communication",
              id: comm.id,
              title: `Follow-up: ${comm.subject}`,
              date: followUpDate.toISOString(),
              isDone: comm.status === "resolved",
              color: defaultCommunicationColor,
            });
          }
        }
      }

      const now = new Date();

      const communicationUpcoming = allCommunications
        .filter(c => c.followUpDate && c.status !== "resolved")
        .map(c => ({
          kind: "communication" as const,
          id: c.id,
          title: `Follow-up: ${c.subject}`,
          date: new Date(c.followUpDate!).toISOString(),
          isDone: c.status === "resolved",
          color: defaultCommunicationColor,
        }));

      const upcoming = [...allDeadlines, ...allTasks, ...allCalendarItems]
        .map(item => {
          if ("dueDate" in item && "status" in item && item.status !== undefined) {
            if ("priority" in item) {
              const t = item as any;
              return t.dueDate ? {
                kind: "todo" as const,
                id: t.id,
                title: t.title,
                date: new Date(t.dueDate).toISOString(),
                isDone: t.status === "completed",
                color: defaultTodoColor,
              } : null;
            } else {
              const d = item as any;
              return {
                kind: "deadline" as const,
                id: d.id,
                title: d.title,
                date: new Date(d.dueDate).toISOString(),
                isDone: d.status === "done",
                color: defaultDeadlineColor,
              };
            }
          } else if ("startDate" in item) {
            const c = item as any;
            const category = c.categoryId ? categoryMap.get(c.categoryId) : null;
            return {
              kind: "calendar" as const,
              id: c.id,
              title: c.title,
              date: new Date(c.startDate).toISOString(),
              isDone: c.isDone,
              color: c.colorOverride ?? category?.color ?? defaultCalendarColor,
              categoryName: category?.name,
            };
          }
          return null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null && !e.isDone && new Date(e.date) >= now);

      const allUpcoming = [...upcoming, ...communicationUpcoming.filter(c => !c.isDone && new Date(c.date) >= now)]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 7);

      res.json({
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        events,
        upcoming: allUpcoming,
        categories,
      });
    } catch (error) {
      console.error("Dashboard calendar fetch error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard calendar" });
    }
  });

  app.get("/api/onboarding/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const profile = await storage.getUserProfile(userId);
      
      const onboardingComplete = profile?.onboardingCompleted === true;
      const versionsMatch = 
        profile?.tosVersion === POLICY_VERSIONS.tos &&
        profile?.privacyVersion === POLICY_VERSIONS.privacy &&
        profile?.disclaimersVersion === POLICY_VERSIONS.disclaimers;
      
      res.json({
        ok: true,
        onboardingComplete: onboardingComplete && versionsMatch,
        requiredVersions: POLICY_VERSIONS,
        accepted: {
          tosAcceptedAt: profile?.tosAcceptedAt,
          privacyAcceptedAt: profile?.privacyAcceptedAt,
          disclaimersAcceptedAt: profile?.disclaimersAcceptedAt,
          tosVersion: profile?.tosVersion,
          privacyVersion: profile?.privacyVersion,
          disclaimersVersion: profile?.disclaimersVersion,
        },
      });
    } catch (error) {
      console.error("Onboarding status error:", error);
      res.status(500).json({ error: "Failed to get onboarding status" });
    }
  });

  app.get("/api/onboarding/policies", requireAuth, async (req, res) => {
    try {
      res.json({
        tosText: TOS_TEXT,
        privacyText: PRIVACY_TEXT,
        notLawFirmText: NOT_LAW_FIRM_TEXT,
        responsibilityText: RESPONSIBILITY_TEXT,
        versions: POLICY_VERSIONS,
      });
    } catch (error) {
      console.error("Onboarding policies error:", error);
      res.status(500).json({ error: "Failed to get policies" });
    }
  });

  const onboardingCompleteSchema = z.object({
    profile: z.object({
      fullName: z.string().min(1, "Full name is required"),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      addressLine1: z.string().min(1, "Address is required"),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      partyRole: z.string().min(1, "Party role is required"),
      isSelfRepresented: z.boolean(),
      barNumber: z.string().optional(),
      firmName: z.string().optional(),
      petitionerName: z.string().min(1, "Petitioner name is required"),
      respondentName: z.string().min(1, "Respondent name is required"),
    }),
    case: z.object({
      title: z.string().min(1, "Case title is required"),
      state: z.string().min(1, "State is required"),
      county: z.string().min(1, "County is required"),
      caseNumber: z.string().optional(),
      caseType: z.string().optional(),
      hasChildren: z.boolean(),
    }),
    children: z.array(z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().optional(),
      dateOfBirth: z.string().min(1, "Date of birth is required"),
      notes: z.string().optional(),
    })).optional(),
    agreements: z.object({
      tosAccepted: z.boolean().refine(v => v === true, "Terms of Service must be accepted"),
      privacyAccepted: z.boolean().refine(v => v === true, "Privacy Policy must be accepted"),
      notLawFirmAccepted: z.boolean().refine(v => v === true, "Not a Law Firm disclosure must be accepted"),
      responsibilityAccepted: z.boolean().refine(v => v === true, "User Responsibility must be accepted"),
      scrolledTos: z.boolean().refine(v => v === true, "Must read Terms of Service"),
      scrolledPrivacy: z.boolean().refine(v => v === true, "Must read Privacy Policy"),
      scrolledNotLawFirm: z.boolean().refine(v => v === true, "Must read Not a Law Firm disclosure"),
      scrolledResponsibility: z.boolean().refine(v => v === true, "Must read User Responsibility"),
    }),
    versions: z.object({
      tos: z.string(),
      privacy: z.string(),
      disclaimers: z.string(),
    }),
    deferredFields: z.record(z.boolean()).optional(),
  });

  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      const parseResult = onboardingCompleteSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const path = err.path.join(".");
          fields[path] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const { profile, case: caseData, children, agreements, versions, deferredFields } = parseResult.data;

      const now = new Date();
      const hasDeferredFields = deferredFields && Object.keys(deferredFields).some(k => deferredFields[k]);

      await storage.upsertUserProfile(userId, {
        fullName: profile.fullName,
        email: profile.email,
        phone: deferredFields?.phone ? null : (profile.phone || null),
        addressLine1: profile.addressLine1,
        addressLine2: deferredFields?.addressLine2 ? null : (profile.addressLine2 || null),
        city: deferredFields?.city ? null : (profile.city || null),
        state: deferredFields?.state ? null : (profile.state || null),
        zip: deferredFields?.zip ? null : (profile.zip || null),
        partyRole: profile.partyRole,
        isSelfRepresented: profile.isSelfRepresented,
        barNumber: deferredFields?.barNumber ? null : (profile.barNumber || null),
        firmName: deferredFields?.firmName ? null : (profile.firmName || null),
        petitionerName: profile.petitionerName,
        respondentName: profile.respondentName,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        tosAcceptedAt: now,
        privacyAcceptedAt: now,
        disclaimersAcceptedAt: now,
        tosVersion: versions.tos,
        privacyVersion: versions.privacy,
        disclaimersVersion: versions.disclaimers,
        onboardingDeferred: deferredFields || {},
        onboardingStatus: hasDeferredFields ? "partial" : "complete",
      });

      const existingCases = await storage.getCasesByUserId(userId);
      let targetCase;
      
      const caseNumberValue = deferredFields?.caseNumber ? null : (caseData.caseNumber || null);
      
      if (existingCases.length > 0) {
        targetCase = await storage.updateCase(existingCases[0].id, userId, {
          title: caseData.title,
          state: caseData.state,
          county: caseData.county,
          caseNumber: caseNumberValue,
          caseType: caseData.caseType,
          hasChildren: caseData.hasChildren,
        });
      } else {
        targetCase = await storage.createCase(userId, {
          title: caseData.title,
          state: caseData.state,
          county: caseData.county,
          caseNumber: caseNumberValue,
          caseType: caseData.caseType,
          hasChildren: caseData.hasChildren,
        });
      }

      if (!targetCase) {
        return res.status(500).json({ error: "Failed to create/update case" });
      }

      if (caseData.hasChildren && children && children.length > 0) {
        await storage.deleteAllCaseChildren(targetCase.id, userId);
        for (const child of children) {
          await storage.createCaseChild(targetCase.id, userId, {
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth,
            notes: child.notes,
          });
        }
      }

      res.json({ ok: true, caseId: targetCase.id });
    } catch (error) {
      console.error("Onboarding complete error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.get("/api/cases/:caseId/contacts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const contacts = await storage.listContacts(userId, caseId);
      res.json({ contacts });
    } catch (error) {
      console.error("List contacts error:", error);
      res.status(500).json({ error: "Failed to list contacts" });
    }
  });

  app.post("/api/cases/:caseId/contacts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const contact = await storage.createContact(userId, caseId, parseResult.data);
      res.status(201).json({ contact });
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:contactId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { contactId } = req.params;

      const parseResult = updateContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateContact(userId, contactId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ contact: updated });
    } catch (error) {
      console.error("Update contact error:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:contactId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { contactId } = req.params;

      const deleted = await storage.deleteContact(userId, contactId);
      if (!deleted) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ message: "Contact deleted" });
    } catch (error) {
      console.error("Delete contact error:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.get("/api/cases/:caseId/communications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const communications = await storage.listCommunications(userId, caseId);
      res.json({ communications });
    } catch (error) {
      console.error("List communications error:", error);
      res.status(500).json({ error: "Failed to list communications" });
    }
  });

  app.post("/api/cases/:caseId/communications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertCommunicationSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const communication = await storage.createCommunication(userId, caseId, parseResult.data);
      res.status(201).json({ communication });
    } catch (error) {
      console.error("Create communication error:", error);
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  app.patch("/api/communications/:commId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { commId } = req.params;

      const parseResult = updateCommunicationSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateCommunication(userId, commId, parseResult.data);
      if (!updated) {
        return res.status(404).json({ error: "Communication not found" });
      }

      res.json({ communication: updated });
    } catch (error) {
      console.error("Update communication error:", error);
      res.status(500).json({ error: "Failed to update communication" });
    }
  });

  app.delete("/api/communications/:commId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { commId } = req.params;

      const deleted = await storage.deleteCommunication(userId, commId);
      if (!deleted) {
        return res.status(404).json({ error: "Communication not found" });
      }

      res.json({ message: "Communication deleted" });
    } catch (error) {
      console.error("Delete communication error:", error);
      res.status(500).json({ error: "Failed to delete communication" });
    }
  });

  app.post("/api/communications/:commId/push-to-timeline", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { commId } = req.params;

      const comm = await storage.getCommunication(userId, commId);
      if (!comm) {
        return res.status(404).json({ error: "Communication not found" });
      }

      if (comm.timelineEventId) {
        return res.status(400).json({ error: "Already added to timeline" });
      }

      let contactName = "Unknown Contact";
      if (comm.contactId) {
        const contact = await storage.getContact(userId, comm.contactId);
        if (contact) {
          contactName = contact.name;
        }
      }

      const notes = [
        comm.subject ? `Subject: ${comm.subject}` : null,
        comm.summary,
        `Channel: ${comm.channel} | Status: ${comm.status}`,
      ].filter(Boolean).join("\n\n");

      const timelineEvent = await storage.createTimelineEvent(comm.caseId, userId, {
        eventDate: comm.occurredAt,
        title: `Communication: ${contactName}`,
        category: "communication",
        notes,
      });

      await storage.updateCommunication(userId, commId, {
        timelineEventId: timelineEvent.id,
      });

      res.json({ timelineEvent });
    } catch (error) {
      console.error("Push to timeline error:", error);
      res.status(500).json({ error: "Failed to push to timeline" });
    }
  });

  app.post("/api/communications/:commId/push-to-calendar", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { commId } = req.params;

      const comm = await storage.getCommunication(userId, commId);
      if (!comm) {
        return res.status(404).json({ error: "Communication not found" });
      }

      if (comm.calendarItemId) {
        return res.status(400).json({ error: "Already added to calendar" });
      }

      if (!comm.followUpAt && !comm.needsFollowUp) {
        return res.status(400).json({ error: "No follow-up date set" });
      }

      let contactName = "Unknown Contact";
      if (comm.contactId) {
        const contact = await storage.getContact(userId, comm.contactId);
        if (contact) {
          contactName = contact.name;
        }
      }

      const calendarItem = await storage.createCaseCalendarItem(userId, comm.caseId, {
        title: `Follow up: ${contactName}`,
        startDate: comm.followUpAt || new Date(),
        notes: comm.subject || comm.summary.slice(0, 200),
      });

      await storage.updateCommunication(userId, commId, {
        calendarItemId: calendarItem.id,
      });

      res.json({ calendarItem });
    } catch (error) {
      console.error("Push to calendar error:", error);
      res.status(500).json({ error: "Failed to push to calendar" });
    }
  });

  app.post("/api/communications/:commId/mark-resolved", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { commId } = req.params;

      const comm = await storage.getCommunication(userId, commId);
      if (!comm) {
        return res.status(404).json({ error: "Communication not found" });
      }

      const updated = await storage.updateCommunication(userId, commId, {
        status: "resolved",
        needsFollowUp: false,
      });

      if (comm.calendarItemId) {
        await storage.updateCaseCalendarItem(userId, comm.calendarItemId, {
          isDone: true,
        });
      }

      res.json({ communication: updated });
    } catch (error) {
      console.error("Mark resolved error:", error);
      res.status(500).json({ error: "Failed to mark resolved" });
    }
  });

  app.get("/api/cases/:caseId/exhibit-lists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const lists = await storage.listExhibitLists(userId, caseId);
      res.json({ exhibitLists: lists });
    } catch (error) {
      console.error("List exhibit lists error:", error);
      res.status(500).json({ error: "Failed to list exhibit lists" });
    }
  });

  app.post("/api/cases/:caseId/exhibit-lists", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parseResult = insertExhibitListSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const list = await storage.createExhibitList(userId, caseId, parseResult.data);
      res.status(201).json({ exhibitList: list });
    } catch (error) {
      console.error("Create exhibit list error:", error);
      res.status(500).json({ error: "Failed to create exhibit list" });
    }
  });

  app.patch("/api/exhibit-lists/:listId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const existing = await storage.getExhibitList(userId, listId);
      if (!existing) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const parseResult = updateExhibitListSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateExhibitList(userId, listId, parseResult.data);
      res.json({ exhibitList: updated });
    } catch (error) {
      console.error("Update exhibit list error:", error);
      res.status(500).json({ error: "Failed to update exhibit list" });
    }
  });

  app.delete("/api/exhibit-lists/:listId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const deleted = await storage.deleteExhibitList(userId, listId);
      if (!deleted) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      res.json({ message: "Exhibit list deleted" });
    } catch (error) {
      console.error("Delete exhibit list error:", error);
      res.status(500).json({ error: "Failed to delete exhibit list" });
    }
  });

  app.get("/api/exhibit-lists/:listId/exhibits", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const list = await storage.getExhibitList(userId, listId);
      if (!list) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const exhibitItems = await storage.listExhibits(userId, listId);
      res.json({ exhibits: exhibitItems });
    } catch (error) {
      console.error("List exhibits error:", error);
      res.status(500).json({ error: "Failed to list exhibits" });
    }
  });

  app.post("/api/exhibit-lists/:listId/exhibits", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const list = await storage.getExhibitList(userId, listId);
      if (!list) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const parseResult = insertExhibitSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const exhibit = await storage.createExhibit(userId, list.caseId, listId, parseResult.data);
      res.status(201).json({ exhibit });
    } catch (error) {
      console.error("Create exhibit error:", error);
      res.status(500).json({ error: "Failed to create exhibit" });
    }
  });

  app.patch("/api/exhibits/:exhibitId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { exhibitId } = req.params;

      const existing = await storage.getExhibit(userId, exhibitId);
      if (!existing) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      const parseResult = updateExhibitSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const updated = await storage.updateExhibit(userId, exhibitId, parseResult.data);
      res.json({ exhibit: updated });
    } catch (error) {
      console.error("Update exhibit error:", error);
      res.status(500).json({ error: "Failed to update exhibit" });
    }
  });

  app.delete("/api/exhibits/:exhibitId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { exhibitId } = req.params;

      const deleted = await storage.deleteExhibit(userId, exhibitId);
      if (!deleted) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      res.json({ message: "Exhibit deleted" });
    } catch (error) {
      console.error("Delete exhibit error:", error);
      res.status(500).json({ error: "Failed to delete exhibit" });
    }
  });

  app.post("/api/exhibit-lists/:listId/exhibits/reorder", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;
      const { orderedIds } = req.body;

      const list = await storage.getExhibitList(userId, listId);
      if (!list) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds must be an array" });
      }

      await storage.reorderExhibits(userId, listId, orderedIds);
      const exhibitItems = await storage.listExhibits(userId, listId);
      res.json({ exhibits: exhibitItems });
    } catch (error) {
      console.error("Reorder exhibits error:", error);
      res.status(500).json({ error: "Failed to reorder exhibits" });
    }
  });

  app.get("/api/exhibits/:exhibitId/evidence", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { exhibitId } = req.params;

      const exhibit = await storage.getExhibit(userId, exhibitId);
      if (!exhibit) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      const files = await storage.listExhibitEvidence(userId, exhibitId);
      res.json({ evidence: files });
    } catch (error) {
      console.error("List exhibit evidence error:", error);
      res.status(500).json({ error: "Failed to list exhibit evidence" });
    }
  });

  app.post("/api/exhibits/:exhibitId/evidence/attach", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { exhibitId } = req.params;

      const exhibit = await storage.getExhibit(userId, exhibitId);
      if (!exhibit) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      const parseResult = attachEvidenceToExhibitSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        return res.status(400).json({ error: "Validation failed", fields });
      }

      const { evidenceId } = parseResult.data;

      const evidenceFile = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidenceFile) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const link = await storage.attachEvidence(userId, exhibit.caseId, exhibitId, evidenceId);
      if (!link) {
        return res.status(400).json({ error: "Evidence already attached to this exhibit" });
      }

      res.status(201).json({ attached: true });
    } catch (error) {
      console.error("Attach evidence error:", error);
      res.status(500).json({ error: "Failed to attach evidence" });
    }
  });

  app.post("/api/exhibits/:exhibitId/evidence/detach", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { exhibitId } = req.params;
      const { evidenceId } = req.body;

      const exhibit = await storage.getExhibit(userId, exhibitId);
      if (!exhibit) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      if (!evidenceId) {
        return res.status(400).json({ error: "evidenceId is required" });
      }

      const detached = await storage.detachEvidence(userId, exhibitId, evidenceId);
      if (!detached) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json({ detached: true });
    } catch (error) {
      console.error("Detach evidence error:", error);
      res.status(500).json({ error: "Failed to detach evidence" });
    }
  });

  app.post("/api/evidence/:evidenceId/add-to-exhibit", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { evidenceId } = req.params;
      const { exhibitListId, exhibitId, createNewExhibitTitle } = req.body;

      const evidenceFile = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidenceFile) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      if (!exhibitListId) {
        return res.status(400).json({ error: "exhibitListId is required" });
      }

      const list = await storage.getExhibitList(userId, exhibitListId);
      if (!list) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      let targetExhibitId = exhibitId;

      if (createNewExhibitTitle) {
        const newExhibit = await storage.createExhibit(userId, list.caseId, exhibitListId, {
          title: createNewExhibitTitle,
        });
        targetExhibitId = newExhibit.id;
      }

      if (!targetExhibitId) {
        return res.status(400).json({ error: "exhibitId or createNewExhibitTitle is required" });
      }

      const exhibit = await storage.getExhibit(userId, targetExhibitId);
      if (!exhibit) {
        return res.status(404).json({ error: "Exhibit not found" });
      }

      const link = await storage.attachEvidence(userId, list.caseId, targetExhibitId, evidenceId);
      if (!link) {
        return res.status(400).json({ error: "Evidence already attached to this exhibit" });
      }

      res.status(201).json({ attached: true, exhibitId: targetExhibitId });
    } catch (error) {
      console.error("Add to exhibit error:", error);
      res.status(500).json({ error: "Failed to add to exhibit" });
    }
  });

  app.get("/api/evidence/:evidenceId/exhibits", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { evidenceId } = req.params;

      const evidenceFile = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidenceFile) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const exhibitItems = await storage.getExhibitsForEvidence(userId, evidenceId);
      res.json({ exhibits: exhibitItems });
    } catch (error) {
      console.error("Get exhibits for evidence error:", error);
      res.status(500).json({ error: "Failed to get exhibits" });
    }
  });

  app.get("/api/cases/:caseId/rule-terms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const moduleKey = req.query.moduleKey as string | undefined;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const terms = await storage.getCaseRuleTerms(userId, caseId, moduleKey);
      res.json({ terms });
    } catch (error) {
      console.error("Get rule terms error:", error);
      res.status(500).json({ error: "Failed to get rule terms" });
    }
  });

  app.post("/api/cases/:caseId/rule-terms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parsed = upsertCaseRuleTermSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const term = await storage.upsertCaseRuleTerm(userId, caseId, parsed.data);
      res.status(201).json({ term });
    } catch (error) {
      console.error("Upsert rule term error:", error);
      res.status(500).json({ error: "Failed to save rule term" });
    }
  });

  const lexiApiKeyConfigured = !!process.env.OPENAI_API_KEY;
  const openai = lexiApiKeyConfigured 
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  app.get("/api/lexi/health", requireAuth, (_req, res) => {
    if (lexiApiKeyConfigured) {
      res.json({ ok: true, provider: "openai-direct" });
    } else {
      res.status(503).json({ ok: false, error: "missing OPENAI_API_KEY" });
    }
  });

  app.get("/api/lexi/disclaimer", requireAuth, (_req, res) => {
    res.json({ disclaimer: LEXI_BANNER_DISCLAIMER, welcome: LEXI_WELCOME_MESSAGE });
  });

  app.get("/api/lexi/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const threads = await storage.listLexiThreads(userId, LEXI_GENERAL_CASE_ID);
      res.json({ threads });
    } catch (error) {
      console.error("List general lexi threads error:", error);
      res.status(500).json({ error: "Failed to list threads" });
    }
  });

  app.post("/api/lexi/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const parsed = createLexiThreadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }
      const thread = await storage.createLexiThread(userId, LEXI_GENERAL_CASE_ID, parsed.data.title);
      res.status(201).json({ thread });
    } catch (error) {
      console.error("Create general lexi thread error:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.get("/api/cases/:caseId/lexi/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const threads = await storage.listLexiThreads(userId, caseId);
      res.json({ threads });
    } catch (error) {
      console.error("List lexi threads error:", error);
      res.status(500).json({ error: "Failed to list threads" });
    }
  });

  app.post("/api/cases/:caseId/lexi/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const parsed = createLexiThreadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const thread = await storage.createLexiThread(userId, caseId, parsed.data.title);
      res.status(201).json({ thread });
    } catch (error) {
      console.error("Create lexi thread error:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.patch("/api/lexi/threads/:threadId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { threadId } = req.params;

      const parsed = renameLexiThreadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const thread = await storage.renameLexiThread(userId, threadId, parsed.data.title);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      res.json({ thread });
    } catch (error) {
      console.error("Rename lexi thread error:", error);
      res.status(500).json({ error: "Failed to rename thread" });
    }
  });

  app.delete("/api/lexi/threads/:threadId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { threadId } = req.params;

      const deleted = await storage.deleteLexiThread(userId, threadId);
      if (!deleted) {
        return res.status(404).json({ error: "Thread not found" });
      }
      res.json({ deleted: true });
    } catch (error) {
      console.error("Delete lexi thread error:", error);
      res.status(500).json({ error: "Failed to delete thread" });
    }
  });

  app.get("/api/lexi/threads/:threadId/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { threadId } = req.params;

      const thread = await storage.getLexiThread(userId, threadId);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      const messages = await storage.listLexiMessages(userId, threadId);
      res.json({ messages });
    } catch (error) {
      console.error("List lexi messages error:", error);
      res.status(500).json({ error: "Failed to list messages" });
    }
  });

  app.post("/api/lexi/chat", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const parsed = lexiChatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }

      const { threadId, message, stateOverride } = parsed.data;
      const effectiveCaseId = parsed.data.caseId || LEXI_GENERAL_CASE_ID;

      let caseRecord = null;
      if (effectiveCaseId !== LEXI_GENERAL_CASE_ID) {
        caseRecord = await storage.getCase(effectiveCaseId, userId);
        if (!caseRecord) {
          return res.status(404).json({ error: "Case not found" });
        }
      }

      const thread = await storage.getLexiThread(userId, threadId);
      if (!thread || thread.caseId !== effectiveCaseId) {
        return res.status(404).json({ error: "Thread not found" });
      }

      const intent: LexiIntent = classifyIntent(message);
      const disclaimerShown = thread.disclaimerShown;

      if (isDisallowed(message)) {
        const userMsg = await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "user", message, 
          { disallowed: true }, null, { intent, refused: true }
        );
        
        const { content: responseContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, DISALLOWED_RESPONSE);
        if (wasAdded) {
          await storage.markLexiThreadDisclaimerShown(userId, threadId);
        }
        
        const assistantMsg = await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "assistant", responseContent, 
          { safety_template: true }, null, { intent, refused: true, hadSources: false }
        );
        return res.json({ userMessage: userMsg, assistantMessage: assistantMsg, intent, refused: true });
      }

      const uplTemplate = detectUPLRequest(message);
      if (uplTemplate) {
        const userMsg = await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "user", message, 
          { upl_detected: true }, null, { intent, refused: true }
        );
        
        const { content: responseContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, SAFETY_TEMPLATES[uplTemplate]);
        if (wasAdded) {
          await storage.markLexiThreadDisclaimerShown(userId, threadId);
        }
        
        const assistantMsg = await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "assistant", responseContent, 
          { safety_template: true }, null, { intent, refused: true, hadSources: false }
        );
        return res.json({ userMessage: userMsg, assistantMessage: assistantMsg, intent, refused: true });
      }

      if (!openai) {
        return res.status(503).json({ error: "Lexi is unavailable - OPENAI_API_KEY not configured" });
      }

      await storage.createLexiMessage(
        userId, effectiveCaseId, threadId, "user", message, 
        null, null, { intent }
      );

      const existingMessages = await storage.listLexiMessages(userId, threadId);
      const systemPrompt = buildLexiSystemPrompt({
        state: stateOverride || caseRecord?.state || undefined,
        county: caseRecord?.county || undefined,
        caseType: caseRecord?.caseType || undefined,
      });

      const chatHistory: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      for (const msg of existingMessages.slice(-20)) {
        if (msg.role === "user" || msg.role === "assistant") {
          chatHistory.push({ role: msg.role, content: msg.content });
        }
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: chatHistory,
        max_completion_tokens: 2048,
      });

      let assistantContent = completion.choices[0]?.message?.content || "I apologize, but I was unable to generate a response. Please try again.";
      
      const { hasSources } = extractSourcesFromContent(assistantContent);
      
      const { content: finalContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, assistantContent);
      if (wasAdded) {
        await storage.markLexiThreadDisclaimerShown(userId, threadId);
      }
      
      const assistantMsg = await storage.createLexiMessage(
        userId, effectiveCaseId, threadId, "assistant", finalContent, 
        null, "gpt-4.1", { intent, refused: false, hadSources: hasSources }
      );

      res.json({ assistantMessage: assistantMsg, intent, refused: false, hadSources: hasSources });
    } catch (error) {
      console.error("Lexi chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/cases/:caseId/trial-prep/sections", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const sections = await storage.seedDefaultTrialBinderSectionsIfMissing(userId, caseId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching trial prep sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.get("/api/cases/:caseId/trial-prep/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const items = await storage.listTrialBinderItems(userId, caseId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching trial prep items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/cases/:caseId/trial-prep/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const parsed = upsertTrialBinderItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const item = await storage.upsertTrialBinderItem(userId, caseId, parsed.data);
      res.json(item);
    } catch (error) {
      console.error("Error upserting trial prep item:", error);
      res.status(500).json({ error: "Failed to save item" });
    }
  });

  app.patch("/api/cases/:caseId/trial-prep/items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, itemId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const parsed = updateTrialBinderItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const item = await storage.updateTrialBinderItem(userId, itemId, parsed.data);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating trial prep item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/cases/:caseId/trial-prep/items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, itemId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const deleted = await storage.deleteTrialBinderItem(userId, itemId);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trial prep item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.get("/api/cases/:caseId/exhibit-packets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const packets = await storage.listExhibitPackets(userId, caseId);
      res.json({ packets });
    } catch (error) {
      console.error("List exhibit packets error:", error);
      res.status(500).json({ error: "Failed to list packets" });
    }
  });

  app.post("/api/cases/:caseId/exhibit-packets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const parsed = insertExhibitPacketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const packet = await storage.createExhibitPacket(userId, caseId, parsed.data);
      res.status(201).json({ packet });
    } catch (error) {
      console.error("Create exhibit packet error:", error);
      res.status(500).json({ error: "Failed to create packet" });
    }
  });

  app.get("/api/exhibit-packets/:packetId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const packet = await storage.getExhibitPacket(userId, packetId);
      if (!packet) {
        return res.status(404).json({ error: "Packet not found" });
      }
      res.json({ packet });
    } catch (error) {
      console.error("Get exhibit packet error:", error);
      res.status(500).json({ error: "Failed to get packet" });
    }
  });

  app.patch("/api/exhibit-packets/:packetId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const parsed = updateExhibitPacketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const packet = await storage.updateExhibitPacket(userId, packetId, parsed.data);
      if (!packet) {
        return res.status(404).json({ error: "Packet not found" });
      }
      res.json({ packet });
    } catch (error) {
      console.error("Update exhibit packet error:", error);
      res.status(500).json({ error: "Failed to update packet" });
    }
  });

  app.delete("/api/exhibit-packets/:packetId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const deleted = await storage.deleteExhibitPacket(userId, packetId);
      if (!deleted) {
        return res.status(404).json({ error: "Packet not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exhibit packet error:", error);
      res.status(500).json({ error: "Failed to delete packet" });
    }
  });

  app.get("/api/exhibit-packets/:packetId/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const packet = await storage.getExhibitPacket(userId, packetId);
      if (!packet) {
        return res.status(404).json({ error: "Packet not found" });
      }
      const items = await storage.listPacketItems(userId, packetId);
      res.json({ items });
    } catch (error) {
      console.error("List packet items error:", error);
      res.status(500).json({ error: "Failed to list items" });
    }
  });

  app.post("/api/exhibit-packets/:packetId/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const packet = await storage.getExhibitPacket(userId, packetId);
      if (!packet) {
        return res.status(404).json({ error: "Packet not found" });
      }
      const parsed = insertExhibitPacketItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const item = await storage.createPacketItem(userId, packetId, packet.caseId, parsed.data);
      res.status(201).json({ item });
    } catch (error) {
      console.error("Create packet item error:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.patch("/api/packet-items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const parsed = updateExhibitPacketItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const item = await storage.updatePacketItem(userId, itemId, parsed.data);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ item });
    } catch (error) {
      console.error("Update packet item error:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/packet-items/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const deleted = await storage.deletePacketItem(userId, itemId);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete packet item error:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.post("/api/exhibit-packets/:packetId/items/reorder", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds must be an array" });
      }
      await storage.reorderPacketItems(userId, packetId, orderedIds);
      const items = await storage.listPacketItems(userId, packetId);
      res.json({ items });
    } catch (error) {
      console.error("Reorder packet items error:", error);
      res.status(500).json({ error: "Failed to reorder items" });
    }
  });

  app.get("/api/packet-items/:itemId/evidence", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const item = await storage.getPacketItem(userId, itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      const files = await storage.listPacketItemEvidence(userId, itemId);
      res.json({ evidence: files });
    } catch (error) {
      console.error("List packet item evidence error:", error);
      res.status(500).json({ error: "Failed to list evidence" });
    }
  });

  app.post("/api/packet-items/:itemId/evidence/attach", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const { evidenceId } = req.body;
      if (!evidenceId) {
        return res.status(400).json({ error: "evidenceId is required" });
      }
      const item = await storage.getPacketItem(userId, itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      const link = await storage.addEvidenceToPacketItem(userId, item.caseId, itemId, evidenceId);
      res.status(201).json({ link });
    } catch (error) {
      console.error("Attach packet item evidence error:", error);
      res.status(500).json({ error: "Failed to attach evidence" });
    }
  });

  app.post("/api/packet-items/:itemId/evidence/detach", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const { evidenceId } = req.body;
      if (!evidenceId) {
        return res.status(400).json({ error: "evidenceId is required" });
      }
      const detached = await storage.removeEvidenceFromPacketItem(userId, itemId, evidenceId);
      res.json({ success: detached });
    } catch (error) {
      console.error("Detach packet item evidence error:", error);
      res.status(500).json({ error: "Failed to detach evidence" });
    }
  });

  app.post("/api/packet-items/:itemId/evidence/reorder", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      const { orderedEvidenceIds } = req.body;
      if (!Array.isArray(orderedEvidenceIds)) {
        return res.status(400).json({ error: "orderedEvidenceIds must be an array" });
      }
      await storage.reorderPacketItemEvidence(userId, itemId, orderedEvidenceIds);
      const files = await storage.listPacketItemEvidence(userId, itemId);
      res.json({ evidence: files });
    } catch (error) {
      console.error("Reorder packet item evidence error:", error);
      res.status(500).json({ error: "Failed to reorder evidence" });
    }
  });

  app.get("/api/cases/:caseId/generated-exhibit-packets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const generated = await storage.listGeneratedExhibitPackets(userId, caseId);
      res.json({ generated });
    } catch (error) {
      console.error("List generated exhibit packets error:", error);
      res.status(500).json({ error: "Failed to list generated packets" });
    }
  });

  app.post("/api/exhibit-packets/:packetId/generate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { packetId } = req.params;
      const packet = await storage.getExhibitPacket(userId, packetId);
      if (!packet) {
        return res.status(404).json({ error: "Packet not found" });
      }
      const result = await generateExhibitPacketZip(userId, packetId);
      if (!result) {
        return res.status(500).json({ error: "Failed to generate packet" });
      }
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      res.setHeader("Content-Length", result.zipBuffer.length);
      res.send(result.zipBuffer);
    } catch (error) {
      console.error("Generate exhibit packet error:", error);
      res.status(500).json({ error: "Failed to generate packet" });
    }
  });

  return httpServer;
}
