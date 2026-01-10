import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth } from "./auth";
import { testDbConnection, pool, checkAiTableColumns } from "./db";
import oauthRouter from "./oauth";
import { insertCaseSchema, insertTimelineEventSchema, timelineEvents, allowedEvidenceMimeTypes, evidenceFiles, updateEvidenceMetadataSchema, insertDocumentSchema, updateDocumentSchema, documentTemplateKeys, upsertUserProfileSchema, insertGeneratedDocumentSchema, generateDocumentPayloadSchema, generatedDocumentTemplateTypes, type GenerateDocumentPayload, insertCaseChildSchema, updateCaseChildSchema, insertTaskSchema, updateTaskSchema, insertDeadlineSchema, updateDeadlineSchema, insertCalendarCategorySchema, insertCaseCalendarItemSchema, updateCaseCalendarItemSchema, insertContactSchema, updateContactSchema, insertCommunicationSchema, updateCommunicationSchema, insertExhibitListSchema, updateExhibitListSchema, insertExhibitSchema, updateExhibitSchema, attachEvidenceToExhibitSchema, createLexiThreadSchema, renameLexiThreadSchema, lexiChatRequestSchema, upsertCaseRuleTermSchema, upsertTrialBinderItemSchema, updateTrialBinderItemSchema, insertExhibitPacketSchema, updateExhibitPacketSchema, insertExhibitPacketItemSchema, updateExhibitPacketItemSchema, insertEvidenceNoteSchema, updateEvidenceNoteSchema, insertCaseFactSchema, updateCaseFactSchema, listCaseFactsSchema, type FactStatus, factStatuses } from "@shared/schema";
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
import { getLexiPersonalization, buildPersonalizationPrompt } from "./lexi/lexiMemory";
import { SAFETY_TEMPLATES, detectUPLRequest, shouldBlockMessage } from "./lexi/safetyTemplates";
import { LEXI_BANNER_DISCLAIMER, LEXI_WELCOME_MESSAGE } from "./lexi/disclaimer";
import { classifyIntent, isDisallowed, DISALLOWED_RESPONSE, type LexiIntent } from "./lexi/policy";
import { prependDisclaimerIfNeeded } from "./lexi/format";
import { extractSourcesFromContent, normalizeUrlsInContent, normalizeAndValidateSources, type LexiSource } from "./lexi/sources";
import { scheduleMemoryRebuild } from "./lexi/memoryDebounce";
import { rebuildCaseMemory } from "./lexi/rebuildMemory";
import { triggerCaseMemoryRebuild } from "./lexi/triggerCaseMemory";
import { generateExhibitPacketZip } from "./exhibitPacketExport";
import archiver from "archiver";
import { enqueueEvidenceExtraction, isExtractionRunning } from "./services/evidenceJobs";
import { isGcvConfigured, checkVisionHealth } from "./services/evidenceExtraction";
import { createLimiter } from "./utils/concurrency";
import { buildLexiContext, formatContextForPrompt } from "./services/lexiContext";
import { searchCaseWide } from "./services/search";
import { isAutoSuggestPending, getAutoSuggestStats, triggerClaimsSuggestionForEvidence } from "./claims/autoSuggest";

const DEFAULT_THREAD_TITLES: Record<string, string> = {
  "start-here": "Start Here",
  "dashboard": "Dashboard",
  "cases": "Cases",
  "evidence": "Evidence",
  "timeline": "Timeline",
  "messages": "Messages & Call Log",
  "document-library": "Document Library",
  "documents": "Document Creator",
  "deadlines": "Deadlines",
  "case-todo": "Case To-Do",
  "disclosures": "Disclosures & Discovery",
  "exhibits": "Exhibits",
  "trial-prep": "Trial Prep",
  "parenting-plan": "Parenting Plan",
  "children": "Children",
  "child-support": "Child Support",
  "pattern-analysis": "Pattern Analysis",
};

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

  app.get("/api/vision/health", requireAuth, async (_req, res) => {
    try {
      const result = await checkVisionHealth();
      res.json(result);
    } catch (error) {
      res.json({ ok: false, error: "Health check failed" });
    }
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
    const userId = req.session.userId!;
    if (process.env.NODE_ENV !== "production") {
      console.log("[CreateCase] auth sanity check", {
        hasUser: !!userId,
        userId: userId,
      });
    }
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("[CreateCase] SESSION_INVALID - userId not in DB", { userId });
        return res.status(401).json({ error: "Session expired. Please sign in again.", code: "SESSION_INVALID" });
      }

      const caseCount = await storage.getCaseCountByUserId(userId);
      if (caseCount >= user.casesAllowed) {
        return res.status(403).json({ 
          error: "Case limit reached", 
          message: `You can only create ${user.casesAllowed} case(s). Upgrade to create more.`,
          code: "CASE_LIMIT_REACHED"
        });
      }

      const parseResult = insertCaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fields: Record<string, string> = {};
        for (const err of parseResult.error.errors) {
          const field = err.path[0]?.toString() || "unknown";
          fields[field] = err.message;
        }
        console.error("[CreateCase] validation failed", { userId, body: req.body, errors: parseResult.error.errors });
        return res.status(400).json({ error: "Invalid case data", fields, code: "VALIDATION_FAILED" });
      }

      const newCase = await storage.createCase(userId, parseResult.data);
      res.status(201).json({ case: newCase });
    } catch (error) {
      console.error("[CreateCase] failed", { userId, body: req.body }, error);
      res.status(500).json({ error: "Failed to create case", code: "CREATE_CASE_FAILED" });
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

  app.get("/api/cases/:caseId/search", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const caseId = req.params.caseId;
      const q = String(req.query.q || "").trim();
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 5)));

      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const results = await storage.searchCase(userId, caseId, q, limit);
      return res.json({ results });
    } catch (error) {
      console.error("Case search error:", error);
      res.status(500).json({ error: "Failed to search case" });
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
      
      const caseIdNum = parseInt(caseId, 10);
      if (!isNaN(caseIdNum)) {
        scheduleMemoryRebuild(caseIdNum, () => rebuildCaseMemory(userId, caseId));
      }
      
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

      enqueueEvidenceExtraction({
        userId,
        caseId,
        evidenceId: file.id,
        storageKey,
        mimeType,
        originalFilename: req.file.originalname,
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

  app.get("/api/cases/:caseId/evidence/:evidenceId/extraction", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, evidenceId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      if (!extraction) {
        const isProcessing = isExtractionRunning(evidenceId);
        return res.json({
          status: isProcessing ? "processing" : "not_started",
          extractedTextPreview: null,
          meta: null,
          errorMessage: null,
          updatedAt: null,
        });
      }

      const textPreview = extraction.extractedText
        ? extraction.extractedText.slice(0, 2000)
        : null;

      res.json({
        status: extraction.status,
        extractedTextPreview: textPreview,
        extractedTextFull: extraction.extractedText,
        meta: extraction.metadata,
        errorMessage: extraction.error,
        updatedAt: extraction.updatedAt,
      });
    } catch (error) {
      console.error("Get extraction error:", error);
      res.status(500).json({ error: "Failed to get extraction" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/extraction/run", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, evidenceId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found", code: "CASE_NOT_FOUND" });
      }

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(400).json({ error: "Evidence file not found", code: "EVIDENCE_NOT_FOUND" });
      }

      if (!file.storageKey) {
        return res.status(400).json({ error: "Evidence file has no storage key", code: "NO_STORAGE_KEY" });
      }

      const requiresOcr = file.mimeType.startsWith("image/") || file.mimeType === "application/pdf";
      if (requiresOcr && !isGcvConfigured()) {
        return res.status(503).json({ 
          error: "OCR not configured. Add GOOGLE_CLOUD_VISION_API_KEY in Replit Secrets.",
          code: "VISION_NOT_CONFIGURED"
        });
      }

      if (!isR2Configured()) {
        return res.status(503).json({ 
          error: "File storage not configured",
          code: "R2_NOT_CONFIGURED"
        });
      }

      if (isExtractionRunning(evidenceId)) {
        return res.json({ ok: true, message: "Extraction already in progress" });
      }

      enqueueEvidenceExtraction({
        userId,
        caseId,
        evidenceId,
        storageKey: file.storageKey,
        mimeType: file.mimeType,
        originalFilename: file.originalName,
      });

      res.json({ ok: true, message: "Extraction started" });
    } catch (error) {
      console.error("Run extraction error:", error);
      const message = error instanceof Error ? error.message : "Failed to start extraction";
      res.status(500).json({ error: message, code: "EXTRACTION_ERROR" });
    }
  });

  app.get("/api/cases/:caseId/background-ai-status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const claimsSuggestionPending = isAutoSuggestPending(caseId);
      const stats = getAutoSuggestStats();

      const recentLogs = await storage.listActivityLogs(userId, 10, 0);
      const backgroundLogs = recentLogs.filter(
        (log) =>
          log.caseId === caseId &&
          (log.eventType === "claims_suggesting" || log.eventType === "claims_suggested")
      );
      const latestBackgroundLog = backgroundLogs[0] || null;

      res.json({
        claimsSuggestionPending,
        globalStats: stats,
        latestActivity: latestBackgroundLog
          ? {
              eventType: latestBackgroundLog.eventType,
              description: latestBackgroundLog.description,
              metadata: latestBackgroundLog.metadata,
              createdAt: latestBackgroundLog.createdAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Background AI status error:", error);
      res.status(500).json({ error: "Failed to get background AI status" });
    }
  });

  app.get("/api/cases/:caseId/ai-jobs/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const { getAiJobsStatus } = await import("./services/aiJobsStatus");
      const status = await getAiJobsStatus(userId, caseId);
      res.json(status);
    } catch (error) {
      console.error("AI jobs status error:", error);
      res.status(500).json({ error: "Failed to get AI jobs status" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/extraction/retry", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, evidenceId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const extraction = await storage.getExtractionByEvidenceId(userId, caseId, evidenceId);
      if (!extraction) {
        return res.status(404).json({ error: "No extraction found for this evidence" });
      }

      if (extraction.status !== "failed") {
        return res.status(400).json({ error: "Can only retry failed extractions" });
      }

      const retried = await storage.retryExtraction(userId, extraction.id);
      if (!retried) {
        return res.status(400).json({ error: "Failed to queue retry" });
      }

      if (file.storageKey) {
        enqueueEvidenceExtraction({
          userId,
          caseId,
          evidenceId,
          storageKey: file.storageKey,
          mimeType: file.mimeType,
          originalFilename: file.originalName,
        });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Retry extraction error:", error);
      res.status(500).json({ error: "Failed to retry extraction" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/ai-analyses/retry", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, evidenceId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const file = await storage.getEvidenceFile(evidenceId, userId);
      if (!file || file.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const analyses = await storage.listEvidenceAiAnalyses(userId, caseId, evidenceId);
      const latestAnalysis = analyses[0];
      
      if (latestAnalysis && latestAnalysis.status !== "failed") {
        return res.status(400).json({ error: "Can only retry failed analyses or run new ones" });
      }

      const extraction = await storage.getExtractionByEvidenceId(userId, caseId, evidenceId);
      if (!extraction || extraction.status !== "complete" || !extraction.extractedText) {
        return res.status(400).json({ error: "Extraction must be complete before running analysis" });
      }

      const analysis = await storage.createEvidenceAiAnalysis(userId, caseId, {
        evidenceId,
        analysisType: "summary_findings",
        content: "",
        status: "processing",
        model: "gpt-4o",
      });

      res.json({ ok: true, analysisId: analysis.id });

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const textToAnalyze = extraction.extractedText.slice(0, 15000);

      const systemPrompt = `You are a legal document analysis assistant for family court cases. Analyze the provided document text and extract key information. Be factual and objective. Do not provide legal advice.

Return a JSON object with this structure:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "documentType": "e.g., Court Order, Financial Statement, etc.",
  "keyDates": ["Array of important dates mentioned"],
  "keyParties": ["Array of people mentioned"],
  "keyFindings": ["Array of 3-5 most important facts or claims"]
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this document:\n\n${textToAnalyze}` }
          ],
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);

        await storage.updateEvidenceAiAnalysis(userId, analysis.id, {
          status: "complete",
          content,
          summary: parsed.summary || null,
          findings: parsed,
          error: null,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        await storage.updateEvidenceAiAnalysis(userId, analysis.id, {
          status: "failed",
          error: errorMsg.slice(0, 500),
        });
      }
    } catch (error) {
      console.error("Retry AI analysis error:", error);
      res.status(500).json({ error: "Failed to retry analysis" });
    }
  });

  app.post("/api/cases/:caseId/claims/retry", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (isAutoSuggestPending(caseId)) {
        return res.json({ ok: true, message: "Claims suggestion already pending" });
      }

      const extractions = await storage.listEvidenceExtractions(userId, caseId);
      const completeExtraction = extractions.find(e => e.status === "complete" && e.extractedText);
      
      if (!completeExtraction) {
        return res.status(400).json({ error: "No completed extractions available for claims suggestion" });
      }

      triggerClaimsSuggestionForEvidence({
        userId,
        caseId,
        evidenceId: completeExtraction.evidenceId,
        extractedText: completeExtraction.extractedText!,
      });

      res.json({ ok: true, message: "Claims suggestion scheduled" });
    } catch (error) {
      console.error("Retry claims error:", error);
      res.status(500).json({ error: "Failed to retry claims suggestion" });
    }
  });

  app.get("/api/cases/:caseId/evidence-notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const notes = await storage.listAllCaseEvidenceNotes(userId, caseId);
      res.json({ notes });
    } catch (error) {
      console.error("List all case evidence notes error:", error);
      res.status(500).json({ error: "Failed to list evidence notes" });
    }
  });

  app.post("/api/evidence-notes/:noteId/link-exhibit", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { noteId } = req.params;
      const { exhibitListId, label } = req.body;

      if (!exhibitListId) {
        return res.status(400).json({ error: "exhibitListId is required" });
      }

      const note = await storage.getEvidenceNote(userId, noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const exhibitList = await storage.getExhibitList(userId, exhibitListId);
      if (!exhibitList) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const link = await storage.linkEvidenceNoteToExhibitList(
        userId,
        note.caseId,
        noteId,
        exhibitListId,
        { label }
      );

      res.status(201).json({ link });
    } catch (error) {
      console.error("Link note to exhibit error:", error);
      res.status(500).json({ error: "Failed to link note to exhibit" });
    }
  });

  app.delete("/api/evidence-notes/:noteId/unlink-exhibit/:exhibitListId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { noteId, exhibitListId } = req.params;

      const unlinked = await storage.unlinkEvidenceNoteFromExhibitList(userId, exhibitListId, noteId);
      res.json({ ok: unlinked });
    } catch (error) {
      console.error("Unlink note from exhibit error:", error);
      res.status(500).json({ error: "Failed to unlink note from exhibit" });
    }
  });

  app.post("/api/evidence-notes/:noteId/create-timeline-event", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { noteId } = req.params;
      const { date, categoryId } = req.body;

      const note = await storage.getEvidenceNote(userId, noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      if (!date) {
        return res.status(400).json({ error: "date is required" });
      }

      const event = await storage.createTimelineEvent(note.caseId, userId, {
        date,
        title: note.label || "Evidence Note",
        description: note.note,
        categoryId: categoryId || null,
      });

      res.status(201).json({ event });
    } catch (error) {
      console.error("Create timeline event from note error:", error);
      res.status(500).json({ error: "Failed to create timeline event" });
    }
  });

  app.get("/api/exhibit-lists/:listId/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const exhibitList = await storage.getExhibitList(userId, listId);
      if (!exhibitList) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const evidenceLinks = await storage.listExhibitListEvidence(userId, listId);
      const noteLinks = await storage.listExhibitNoteLinks(userId, listId);
      const snippets = await storage.listExhibitSnippets(userId, exhibitList.caseId, listId);

      res.json({ evidenceLinks, noteLinks, snippets });
    } catch (error) {
      console.error("List exhibit list items error:", error);
      res.status(500).json({ error: "Failed to list exhibit list items" });
    }
  });

  app.post("/api/exhibit-lists/:listId/evidence", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;
      const { evidenceFileId, label, notes } = req.body;

      if (!evidenceFileId) {
        return res.status(400).json({ error: "evidenceFileId is required" });
      }

      const exhibitList = await storage.getExhibitList(userId, listId);
      if (!exhibitList) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const evidenceFile = await storage.getEvidenceFile(evidenceFileId, userId);
      if (!evidenceFile) {
        return res.status(404).json({ error: "Evidence file not found" });
      }

      const link = await storage.addEvidenceToExhibitList(
        userId,
        exhibitList.caseId,
        listId,
        evidenceFileId,
        { label, notes }
      );

      res.status(201).json({ link });
    } catch (error) {
      console.error("Add evidence to exhibit list error:", error);
      res.status(500).json({ error: "Failed to add evidence to exhibit list" });
    }
  });

  app.delete("/api/exhibit-lists/:listId/evidence/:evidenceFileId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId, evidenceFileId } = req.params;

      const removed = await storage.removeEvidenceFromExhibitList(userId, listId, evidenceFileId);
      res.json({ ok: removed });
    } catch (error) {
      console.error("Remove evidence from exhibit list error:", error);
      res.status(500).json({ error: "Failed to remove evidence from exhibit list" });
    }
  });

  app.post("/api/exhibit-lists/:listId/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;
      const { evidenceNoteId, label } = req.body;

      if (!evidenceNoteId) {
        return res.status(400).json({ error: "evidenceNoteId is required" });
      }

      const exhibitList = await storage.getExhibitList(userId, listId);
      if (!exhibitList) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const note = await storage.getEvidenceNote(userId, evidenceNoteId);
      if (!note) {
        return res.status(404).json({ error: "Evidence note not found" });
      }

      const link = await storage.linkEvidenceNoteToExhibitList(
        userId,
        exhibitList.caseId,
        evidenceNoteId,
        listId,
        { label }
      );

      res.status(201).json({ link });
    } catch (error) {
      console.error("Add note to exhibit list error:", error);
      res.status(500).json({ error: "Failed to add note to exhibit list" });
    }
  });

  app.delete("/api/exhibit-lists/:listId/notes/:evidenceNoteId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId, evidenceNoteId } = req.params;

      const removed = await storage.unlinkEvidenceNoteFromExhibitList(userId, listId, evidenceNoteId);
      res.json({ ok: removed });
    } catch (error) {
      console.error("Remove note from exhibit list error:", error);
      res.status(500).json({ error: "Failed to remove note from exhibit list" });
    }
  });

  app.post("/api/exhibit-lists/:listId/reorder", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;
      const { evidenceOrder, noteOrder } = req.body;

      const exhibitList = await storage.getExhibitList(userId, listId);
      if (!exhibitList) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      if (Array.isArray(evidenceOrder)) {
        await storage.reorderExhibitListEvidence(userId, listId, evidenceOrder);
      }

      if (Array.isArray(noteOrder)) {
        await storage.reorderExhibitNoteLinks(userId, listId, noteOrder);
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Reorder exhibit list items error:", error);
      res.status(500).json({ error: "Failed to reorder exhibit list items" });
    }
  });

  app.get("/api/cases/:caseId/timeline/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const categories = await storage.listTimelineCategories(userId, caseId);
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => ({
          ...cat,
          eventCount: await storage.getEventCountByCategory(userId, caseId, cat.id),
        }))
      );
      res.json({ categories: categoriesWithCounts });
    } catch (error) {
      console.error("List timeline categories error:", error);
      res.status(500).json({ error: "Failed to list timeline categories" });
    }
  });

  app.post("/api/cases/:caseId/timeline/categories", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { name, color } = req.body;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      if (!name || !color) {
        return res.status(400).json({ error: "name and color are required" });
      }

      const category = await storage.createTimelineCategory(userId, caseId, { name, color });
      res.status(201).json({ category });
    } catch (error) {
      console.error("Create timeline category error:", error);
      res.status(500).json({ error: "Failed to create timeline category" });
    }
  });

  app.patch("/api/cases/:caseId/timeline/categories/:categoryId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, categoryId } = req.params;
      const { name, color } = req.body;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const updated = await storage.updateTimelineCategory(userId, caseId, categoryId, { name, color });
      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ category: updated });
    } catch (error) {
      console.error("Update timeline category error:", error);
      res.status(500).json({ error: "Failed to update timeline category" });
    }
  });

  app.delete("/api/cases/:caseId/timeline/categories/:categoryId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId, categoryId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const result = await storage.deleteTimelineCategory(userId, caseId, categoryId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete timeline category error:", error);
      res.status(500).json({ error: "Failed to delete timeline category" });
    }
  });

  app.post("/api/cases/:caseId/timeline/categories/seed", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const categories = await storage.seedSystemTimelineCategories(userId, caseId);
      res.json({ categories });
    } catch (error) {
      console.error("Seed timeline categories error:", error);
      res.status(500).json({ error: "Failed to seed timeline categories" });
    }
  });

  app.get("/api/cases/:caseId/parenting-plan", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const plan = await storage.getOrCreateParentingPlan(userId, caseId);
      const sections = await storage.listParentingPlanSections(userId, plan.id);

      res.json({ plan, sections });
    } catch (error) {
      console.error("Get parenting plan error:", error);
      res.status(500).json({ error: "Failed to get parenting plan" });
    }
  });

  app.post("/api/cases/:caseId/parenting-plan", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const plan = await storage.getOrCreateParentingPlan(userId, caseId);
      res.status(201).json({ plan });
    } catch (error) {
      console.error("Create parenting plan error:", error);
      res.status(500).json({ error: "Failed to create parenting plan" });
    }
  });

  app.patch("/api/parenting-plan/:planId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { planId } = req.params;
      const { status } = req.body;

      const updated = await storage.updateParentingPlan(userId, planId, { status });
      if (!updated) {
        return res.status(404).json({ error: "Parenting plan not found" });
      }

      res.json({ plan: updated });
    } catch (error) {
      console.error("Update parenting plan error:", error);
      res.status(500).json({ error: "Failed to update parenting plan" });
    }
  });

  app.put("/api/parenting-plan/:planId/sections/:sectionKey", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { planId, sectionKey } = req.params;
      const { data } = req.body;

      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "data object is required" });
      }

      const section = await storage.upsertParentingPlanSection(userId, planId, sectionKey, data);
      await storage.updateParentingPlan(userId, planId, {});

      res.json({ section });
    } catch (error) {
      console.error("Upsert parenting plan section error:", error);
      res.status(500).json({ error: "Failed to save section" });
    }
  });

  app.delete("/api/parenting-plan/:planId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { planId } = req.params;

      const deleted = await storage.deleteParentingPlan(userId, planId);
      if (!deleted) {
        return res.status(404).json({ error: "Parenting plan not found" });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete parenting plan error:", error);
      res.status(500).json({ error: "Failed to delete parenting plan" });
    }
  });

  app.post("/api/parenting-plan/:planId/export-docx", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { planId } = req.params;

      const plan = await storage.getParentingPlan(userId, planId);
      if (!plan) {
        return res.status(404).json({ error: "Parenting plan not found" });
      }

      const sections = await storage.listParentingPlanSections(userId, planId);
      const caseRecord = await storage.getCase(plan.caseId, userId);

      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");

      const FONT = "Times New Roman";
      const FONT_SIZE = 24;

      const docChildren: (typeof Paragraph.prototype)[] = [];

      docChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({
          text: "EDUCATIONAL DRAFT TEMPLATE",
          bold: true,
          font: FONT,
          size: FONT_SIZE,
        })],
      }));

      docChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({
          text: "This is a draft template for organizational purposes only. It does NOT constitute legal advice or a court-ready document. Consult with a licensed attorney before filing any court documents.",
          italics: true,
          font: FONT,
          size: 20,
        })],
      }));

      docChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({
          text: "PARENTING PLAN DRAFT",
          bold: true,
          font: FONT,
          size: 32,
        })],
      }));

      if (caseRecord) {
        if (caseRecord.caseNumber) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({
              text: `Case No.: ${caseRecord.caseNumber}`,
              font: FONT,
              size: FONT_SIZE,
            })],
          }));
        }
      }

      docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));

      const sectionTitles: Record<string, string> = {
        "decision-making": "Decision-Making",
        "parenting-time": "Parenting Time",
        "holidays": "Holidays & Special Days",
        "medical": "Medical & Healthcare",
        "education": "Education",
        "communication": "Communication",
        "extracurriculars": "Extracurricular Activities",
        "travel": "Travel",
        "childcare": "Childcare",
        "safety": "Safety & Special Concerns",
        "financial": "Financial Responsibilities",
        "modification": "Modification & Dispute Resolution",
      };

      for (const section of sections) {
        const title = sectionTitles[section.sectionKey] || section.sectionKey;
        const data = section.data as Record<string, unknown>;

        docChildren.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({
            text: title,
            bold: true,
            font: FONT,
            size: 28,
          })],
        }));

        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === "string" && value.trim()) {
            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
            docChildren.push(new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `${label}: `, bold: true, font: FONT, size: FONT_SIZE }),
                new TextRun({ text: value, font: FONT, size: FONT_SIZE }),
              ],
            }));
          } else if (typeof value === "boolean" && value) {
            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
            docChildren.push(new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: `${label}: Yes`, font: FONT, size: FONT_SIZE })],
            }));
          }
        }
      }

      docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));
      docChildren.push(new Paragraph({
        children: [new TextRun({
          text: "Generated by Civilla.ai - Educational Draft Template",
          italics: true,
          font: FONT,
          size: 18,
        })],
      }));

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const filename = `parenting-plan-draft-${new Date().toISOString().split('T')[0]}.docx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export parenting plan DOCX error:", error);
      res.status(500).json({ error: "Failed to export parenting plan" });
    }
  });

  app.get("/api/cases/:caseId/parenting-plan/research", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const state = req.query.state as string;

      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const termKey = `parenting_plan_${state.toLowerCase().replace(/\s+/g, '_')}`;
      const terms = await storage.getCaseRuleTerms(userId, caseId, "parenting-plan");
      const cached = terms.find(t => t.termKey === termKey);

      if (cached) {
        return res.json({ ok: true, content: cached.summary, cached: true, lastCheckedAt: cached.lastCheckedAt });
      }

      res.json({ ok: true, content: null, cached: false });
    } catch (error) {
      console.error("Get parenting plan research error:", error);
      res.status(500).json({ error: "Failed to get parenting plan research" });
    }
  });

  app.post("/api/cases/:caseId/parenting-plan/research", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { state, refresh } = req.body;

      if (!state || typeof state !== "string") {
        return res.status(400).json({ error: "State is required" });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const termKey = `parenting_plan_${state.toLowerCase().replace(/\s+/g, '_')}`;
      const moduleKey = "parenting-plan";

      if (!refresh) {
        const terms = await storage.getCaseRuleTerms(userId, caseId, moduleKey);
        const cached = terms.find(t => t.termKey === termKey);
        if (cached && cached.summary) {
          return res.json({ ok: true, content: cached.summary, cached: true });
        }
      }

      const lexiApiKeyConfigured = !!process.env.OPENAI_API_KEY;
      if (!lexiApiKeyConfigured) {
        return res.status(503).json({ error: "AI integration not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are Lexi, an EDUCATIONAL and RESEARCH assistant for civilla.ai, a self-help legal organization platform. You are NOT an attorney. You do NOT provide legal advice, strategy, or case-specific recommendations.

Your task: Research and provide general educational information about parenting plans in ${state}.

STRICT RULES:
1. Be EDUCATIONAL + ORGANIZATIONAL + RESEARCH focused only.
2. Do NOT provide legal advice, strategy, or likelihood of outcomes.
3. Do NOT recommend specific schedules or custody arrangements.
4. Do NOT invent citations or URLs. If you cannot confidently name an official source URL, say "I couldn't verify the official page" and provide step-by-step instructions to find it on official sites.
5. Focus on what the state calls its parenting plan requirements, what topics are commonly required, and where to find official resources.

You MUST format your response EXACTLY like this:

## Parenting Plans in ${state}

### What It's Commonly Called
[What the state calls its parenting plan, custody agreement, residential schedule, or similar document]

### Official Sources to Verify
[List known official sources like state judiciary website, family court forms, or statute references. If you can't verify a specific URL, say so and provide instructions on how to find it]

### Commonly Required Topics
[List typical required or recommended sections: legal custody, physical custody, parenting time schedule, holidays, decision-making, transportation, communication, etc.]

### How to Find Official Forms
[Step-by-step instructions to find official parenting plan forms on state judiciary or court websites]

### Important Disclaimer
This is educational and research information only. It is NOT legal advice. Parenting plan requirements vary significantly by jurisdiction and individual circumstances. For court-accurate documents, consult with a family law attorney. civilla does not provide legal advice or representation.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please research and provide educational information about parenting plan requirements in ${state}.` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || "Unable to generate research content.";

      await storage.upsertCaseRuleTerm(userId, caseId, {
        moduleKey,
        jurisdictionState: state,
        termKey,
        officialLabel: `Parenting Plan Requirements - ${state}`,
        summary: content,
        sourcesJson: [],
      });

      res.json({ ok: true, content, cached: false });
    } catch (error) {
      console.error("Parenting plan research error:", error);
      res.status(500).json({ error: "Failed to research parenting plan requirements" });
    }
  });

// Child Support Research endpoints
  app.get("/api/cases/:caseId/child-support/research", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const state = req.query.state as string;

      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const termKey = `child_support_${state.toLowerCase().replace(/\s+/g, '_')}`;
      const terms = await storage.getCaseRuleTerms(userId, caseId, "child-support");
      const cached = terms.find(t => t.termKey === termKey);

      if (cached) {
        return res.json({ ok: true, content: cached.summary, cached: true, lastCheckedAt: cached.lastCheckedAt });
      }

      res.json({ ok: true, content: null, cached: false });
    } catch (error) {
      console.error("Get child support research error:", error);
      res.status(500).json({ error: "Failed to get child support research" });
    }
  });

  app.post("/api/cases/:caseId/child-support/research", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { state, refresh } = req.body;

      if (!state || typeof state !== "string") {
        return res.status(400).json({ error: "State is required" });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const termKey = `child_support_${state.toLowerCase().replace(/\s+/g, '_')}`;
      const moduleKey = "child-support";

      // Check for cached result first (unless refresh requested)
      if (!refresh) {
        const terms = await storage.getCaseRuleTerms(userId, caseId, moduleKey);
        const cached = terms.find(t => t.termKey === termKey);
        if (cached && cached.summary) {
          return res.json({ ok: true, content: cached.summary, cached: true });
        }
      }

      // Check if OpenAI is configured
      const lexiApiKeyConfigured = !!process.env.OPENAI_API_KEY;
      if (!lexiApiKeyConfigured) {
        return res.status(503).json({ error: "AI integration not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are Lexi, an EDUCATIONAL and RESEARCH assistant for civilla.ai, a self-help legal organization platform. You are NOT an attorney. You do NOT provide legal advice, strategy, or case-specific recommendations.

Your task: Research and provide general educational information about child support in ${state}.

STRICT RULES:
1. Be EDUCATIONAL + ORGANIZATIONAL + RESEARCH focused only.
2. Do NOT provide legal advice, strategy, or likelihood of outcomes.
3. Do NOT invent citations or URLs. If you cannot confidently name an official source URL, say "I couldn't verify the official page" and provide step-by-step instructions to find it on official sites.
4. Focus on what the state calls its child support guidelines/worksheet, what inputs are typically required, and where to find official resources.

You MUST format your response EXACTLY like this:

## Child Support in ${state}

### What It's Called
[What the state calls its child support guidelines, worksheet, or schedule]

### Official Sources to Verify
[List known official sources like state judiciary website, forms page, or legislature site. If you can't verify a specific URL, say so and provide instructions on how to find it]

### Inputs Commonly Required
[List typical inputs: gross income, number of children, overnights/parenting time, childcare costs, health insurance, etc.]

### How to Double-Check
[Step-by-step instructions to find the official worksheet on state judiciary or court websites]

### Important Disclaimer
This is educational and research information only. It is NOT legal advice. Child support calculations vary significantly by individual circumstances. For court-accurate amounts, use your state's official calculator and consult with a family law attorney. civilla does not provide legal advice or representation.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please research and provide educational information about child support guidelines in ${state}.` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || "Unable to generate research content.";

      // Save to case_rule_terms
      await storage.upsertCaseRuleTerm(userId, caseId, {
        moduleKey,
        jurisdictionState: state,
        termKey,
        officialLabel: `Child Support Guidelines - ${state}`,
        summary: content,
        sourcesJson: [],
      });

      res.json({ ok: true, content, cached: false });
    } catch (error) {
      console.error("Child support research error:", error);
      res.status(500).json({ error: "Failed to research child support guidelines" });
    }
  });

  // Child Support Educational Estimate endpoint
  app.post("/api/cases/:caseId/child-support/estimate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { state, inputs, refresh } = req.body;

      if (!state || typeof state !== "string") {
        return res.status(400).json({ error: "State is required" });
      }

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      // Build a stable cache key from inputs
      const moduleKey = "child-support";
      const inputsForKey = {
        parentAIncome: inputs?.parentAIncome ?? null,
        parentBIncome: inputs?.parentBIncome ?? null,
        children: inputs?.children ?? null,
        overnights: inputs?.overnights ?? null,
        childcare: inputs?.childcare ?? null,
        healthInsurance: inputs?.healthInsurance ?? null,
      };
      const inputHash = Buffer.from(JSON.stringify(inputsForKey)).toString('base64').replace(/[+/=]/g, '').slice(0, 16);
      const termKey = `child_support_estimate_${state}_${inputHash}`;

      // Check for cached estimate (unless refresh=true)
      if (!refresh) {
        const cachedTerms = await storage.getCaseRuleTerms(userId, caseId, moduleKey);
        const cached = cachedTerms.find(t => t.termKey === termKey);
        if (cached && cached.summary) {
          // Parse didCompute from the content (check if it contains "Educational Estimate" header)
          const didCompute = cached.summary.includes("## Educational Estimate");
          return res.json({ ok: true, content: cached.summary, didCompute, cached: true });
        }
      }

      // Check if OpenAI is configured
      const lexiApiKeyConfigured = !!process.env.OPENAI_API_KEY;
      if (!lexiApiKeyConfigured) {
        return res.status(503).json({ error: "AI integration not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build input summary for the prompt
      const inputParts: string[] = [];
      if (inputs?.parentAIncome !== undefined && inputs.parentAIncome !== null) {
        inputParts.push(`Parent A gross monthly income: $${inputs.parentAIncome}`);
      }
      if (inputs?.parentBIncome !== undefined && inputs.parentBIncome !== null) {
        inputParts.push(`Parent B gross monthly income: $${inputs.parentBIncome}`);
      }
      if (inputs?.children !== undefined && inputs.children !== null) {
        inputParts.push(`Number of children: ${inputs.children}`);
      }
      if (inputs?.overnights !== undefined && inputs.overnights !== null) {
        inputParts.push(`Overnights with non-custodial parent: ${inputs.overnights} per year`);
      }
      if (inputs?.childcare !== undefined && inputs.childcare !== null) {
        inputParts.push(`Monthly childcare costs: $${inputs.childcare}`);
      }
      if (inputs?.healthInsurance !== undefined && inputs.healthInsurance !== null) {
        inputParts.push(`Monthly health insurance for children: $${inputs.healthInsurance}`);
      }

      const inputSummary = inputParts.length > 0 
        ? inputParts.join('\n') 
        : "No specific inputs provided";

      const systemPrompt = `You are Lexi, an EDUCATIONAL and RESEARCH assistant for civilla.ai, a self-help legal organization platform. You are NOT an attorney. You do NOT provide legal advice, strategy, or case-specific recommendations.

Your task: Attempt to provide an EDUCATIONAL estimate of child support for ${state} based on the provided inputs.

CRITICAL RULES:
1. You are EDUCATIONAL + ORGANIZATIONAL + RESEARCH focused only.
2. You do NOT provide legal advice.
3. You must FIRST identify what ${state} calls its child support guidelines/worksheet and the official source.
4. ONLY attempt a calculation if:
   - The state uses a straightforward income shares or percentage-of-income model
   - You have enough inputs to apply the basic formula
   - You are CONFIDENT in the calculation methodology
5. If the state has a complex formula (deviations, multiple worksheets, sliding scales, or requires specific software), you MUST:
   - Set didCompute = false
   - Explain WHY you cannot compute it reliably
   - Provide the official calculator/worksheet link
   - Give step-by-step instructions on how to enter the inputs into the official tool

RESPONSE FORMAT (use this exact JSON structure):
{
  "didCompute": true or false,
  "officialName": "What the state calls its child support guidelines/worksheet",
  "officialLink": "URL to official calculator or worksheet, or null if you cannot confidently provide one",
  "estimate": {
    "monthlyAmount": number or null,
    "range": { "low": number, "high": number } or null,
    "methodology": "Brief explanation of how you calculated this",
    "assumptions": ["List of assumptions made"]
  },
  "guidance": "If didCompute is false, explain why and provide step-by-step instructions for using the official tool",
  "disclaimer": "This is an educational estimate only. It is NOT court-accurate and should NOT be relied upon for legal decisions. Child support calculations vary based on many factors not captured here. Always verify with your state's official calculator and consult with a family law attorney for accurate figures. civilla does not provide legal advice."
}

STATES WHERE YOU SHOULD SET didCompute=false:
- States with complex deviation factors or multiple worksheet types
- If any required input is missing (both incomes + number of children minimum)
- If the state requires software or detailed worksheets you cannot replicate
- If you are uncertain about the current formula or thresholds

When in doubt, set didCompute=false and provide guidance instead.`;

      const userMessage = `Please analyze and attempt to compute an educational child support estimate for ${state}.

User-provided inputs:
${inputSummary}

Remember: Only compute if you're confident in the methodology. If not, provide the official worksheet/calculator link and step-by-step guidance instead.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const rawContent = completion.choices[0]?.message?.content || "{}";
      
      let parsed: {
        didCompute?: boolean;
        officialName?: string;
        officialLink?: string | null;
        estimate?: {
          monthlyAmount?: number | null;
          range?: { low: number; high: number } | null;
          methodology?: string;
          assumptions?: string[];
        };
        guidance?: string;
        disclaimer?: string;
      };

      try {
        parsed = JSON.parse(rawContent);
      } catch {
        parsed = { didCompute: false, guidance: "Unable to parse response. Please try again." };
      }

      // Format the response into readable content
      const didCompute = parsed.didCompute === true;
      let formattedContent = "";

      formattedContent += `## ${didCompute ? "Educational Estimate" : "Worksheet Guidance"}\n\n`;

      if (parsed.officialName) {
        formattedContent += `### Official Name\n${parsed.officialName}\n\n`;
      }

      if (parsed.officialLink) {
        formattedContent += `### Official Source\n${parsed.officialLink}\n\n`;
      }

      if (didCompute && parsed.estimate) {
        if (parsed.estimate.monthlyAmount !== null && parsed.estimate.monthlyAmount !== undefined) {
          formattedContent += `### Estimated Amount\n**$${parsed.estimate.monthlyAmount.toLocaleString()} per month**\n\n`;
        } else if (parsed.estimate.range) {
          formattedContent += `### Estimated Range\n**$${parsed.estimate.range.low.toLocaleString()} - $${parsed.estimate.range.high.toLocaleString()} per month**\n\n`;
        }

        if (parsed.estimate.methodology) {
          formattedContent += `### How This Was Calculated\n${parsed.estimate.methodology}\n\n`;
        }

        if (parsed.estimate.assumptions && parsed.estimate.assumptions.length > 0) {
          formattedContent += `### Assumptions Made\n`;
          parsed.estimate.assumptions.forEach((a: string) => {
            formattedContent += `- ${a}\n`;
          });
          formattedContent += "\n";
        }
      }

      if (parsed.guidance) {
        formattedContent += `### ${didCompute ? "Additional Guidance" : "How to Use the Official Calculator"}\n${parsed.guidance}\n\n`;
      }

      formattedContent += `### Important Disclaimer\n${parsed.disclaimer || "This is an educational estimate only. It is NOT court-accurate. Always verify with your state's official calculator and consult a family law attorney."}\n`;

      // Cache the estimate result
      await storage.upsertCaseRuleTerm(userId, caseId, {
        moduleKey,
        jurisdictionState: state,
        termKey,
        officialLabel: `Child Support Estimate - ${state}`,
        summary: formattedContent,
        sourcesJson: [],
      });

      res.json({ ok: true, content: formattedContent, didCompute, cached: false });
    } catch (error) {
      console.error("Child support estimate error:", error);
      res.status(500).json({ error: "Failed to generate child support estimate" });
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

  app.get("/api/cases/:caseId/documents/compile-claims/preflight", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const preflight = await storage.getClaimsCompilePreflight(caseId, userId);
      const { acceptedClaims, claimCitationCounts } = preflight;

      const acceptedClaimsWithCitations = acceptedClaims.filter(c => (claimCitationCounts[c.id] || 0) > 0).length;
      const acceptedClaimsMissingCitations = acceptedClaims.filter(c => (claimCitationCounts[c.id] || 0) === 0).length;
      const acceptedClaimsMissingInfoFlagged = acceptedClaims.filter(c => c.missingInfoFlag).length;

      const claimIdsMissingCitations = acceptedClaims
        .filter(c => (claimCitationCounts[c.id] || 0) === 0)
        .map(c => c.id);
      const claimIdsMissingInfoFlagged = acceptedClaims
        .filter(c => c.missingInfoFlag)
        .map(c => c.id);

      const canCompile = acceptedClaimsWithCitations >= 1 && acceptedClaimsMissingCitations === 0;

      const evidence = await storage.getEvidenceByCase(caseId);
      const extractedCount = evidence.filter(e => e.extractionJobId && e.extractionStatus === "completed").length;
      const extractionCoverage = evidence.length > 0 ? Math.round((extractedCount / evidence.length) * 100) : 0;

      let readinessPercent = 0;
      if (acceptedClaims.length > 0) {
        const citationScore = acceptedClaimsMissingCitations === 0 ? 50 : Math.round((acceptedClaimsWithCitations / acceptedClaims.length) * 50);
        const extractionScore = Math.round((extractionCoverage / 100) * 30);
        const claimScore = Math.min(20, acceptedClaims.length * 2);
        readinessPercent = Math.min(100, citationScore + extractionScore + claimScore);
      }

      let message = "";
      if (acceptedClaims.length === 0) {
        message = "No accepted claims. Review and accept claims from your evidence files first.";
      } else if (acceptedClaimsMissingCitations > 0) {
        message = `Blocked until citations are attached. ${acceptedClaimsMissingCitations} claim(s) missing citations.`;
      } else if (acceptedClaimsMissingInfoFlagged > 0) {
        message = `Ready to compile. Note: ${acceptedClaimsMissingInfoFlagged} claim(s) flagged as missing info.`;
      } else {
        message = "Ready to compile.";
      }

      res.json({
        ok: true,
        canCompile,
        totals: {
          acceptedClaims: acceptedClaims.length,
          acceptedClaimsWithCitations,
          acceptedClaimsMissingCitations,
          acceptedClaimsMissingInfoFlagged,
          extractionCoverage,
        },
        missing: {
          claimIdsMissingCitations,
          claimIdsMissingInfoFlagged,
        },
        message,
        readinessPercent,
      });
    } catch (error) {
      console.error("Compile preflight error:", error);
      res.status(500).json({ error: "Failed to check compile readiness" });
    }
  });

  app.post("/api/cases/:caseId/documents/compile-claims", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;
      const { title: providedTitle, draftTopic } = req.body as { title?: string; draftTopic?: string };

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const today = new Date().toISOString().split("T")[0];
      const topicPart = (draftTopic?.trim() || "Compiled Summary").substring(0, 40);
      const casePart = (caseRecord.title || "Case").substring(0, 40);
      const autoTitle = `${topicPart} — ${casePart} — ${today}`.substring(0, 120);
      const title = providedTitle?.trim() || autoTitle;

      const preflight = await storage.getClaimsCompilePreflight(caseId, userId);
      const { acceptedClaims, claimCitationCounts } = preflight;

      if (acceptedClaims.length === 0) {
        return res.status(409).json({
          error: "No accepted claims to compile",
          code: "NO_ACCEPTED_CLAIMS",
        });
      }

      const claimsMissingCitations = acceptedClaims.filter(c => (claimCitationCounts[c.id] || 0) === 0);
      if (claimsMissingCitations.length > 0) {
        return res.status(409).json({
          error: "Some accepted claims are missing citations",
          code: "ACCEPTED_CLAIMS_MISSING_CITATIONS",
          missingClaimIds: claimsMissingCitations.map(c => c.id),
        });
      }

      const claims = await storage.listCaseClaims(userId, caseId, { status: "accepted" });
      const evidenceFiles = await storage.getEvidenceFiles(caseId, userId);
      const evidenceMap = new Map(evidenceFiles.map(e => [e.id, e.originalName]));

      type TraceEntry = {
        claimId: string;
        claimText: string;
        citations: Array<{
          citationId: string;
          evidenceId: string;
          evidenceName: string;
          pointer: {
            pageNumber?: number;
            timestampSeconds?: number;
            quote?: string;
          };
        }>;
        linkedTimelineEvents: Array<{
          eventId: string;
          eventDate: string;
          eventTitle: string;
        }>;
      };

      const trace: TraceEntry[] = [];
      const sourceSet = new Set<string>();
      
      const claimsByType: Record<string, typeof claims> = {};
      for (const claim of claims) {
        const typeKey = claim.claimType || "general";
        if (!claimsByType[typeKey]) claimsByType[typeKey] = [];
        claimsByType[typeKey].push(claim);
      }

      const typeLabels: Record<string, string> = {
        factual: "Factual Claims",
        behavioral: "Behavioral Observations",
        financial: "Financial Matters",
        custodial: "Custody & Parenting",
        legal: "Legal Issues",
        general: "General Claims",
      };

      let markdown = `# ${title}\n\n`;
      markdown += `*Compiled from ${claims.length} evidence-backed claims.*\n\n`;
      markdown += `---\n\n`;

      let globalIndex = 0;
      for (const [typeKey, typeClaims] of Object.entries(claimsByType)) {
        const sectionLabel = typeLabels[typeKey] || typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
        markdown += `## ${sectionLabel}\n\n`;

        for (const claim of typeClaims) {
          globalIndex++;
          const citationPointers = await storage.listClaimCitations(userId, claim.id);
          const linkedEvents = await storage.getTimelineEventsLinkedToClaim(userId, caseId, claim.id);
          const traceEntry: TraceEntry = {
            claimId: claim.id,
            claimText: claim.claimText,
            citations: [],
            linkedTimelineEvents: linkedEvents.map(e => ({
              eventId: e.eventId,
              eventDate: e.eventDate,
              eventTitle: e.eventTitle,
            })),
          };

          const citationBrackets: string[] = [];
          for (const cit of citationPointers) {
            const ptr = cit.citationPointer;
            if (ptr) {
              const evidenceName = ptr.evidenceFileId ? (evidenceMap.get(ptr.evidenceFileId) || "Unknown file") : "Unknown file";
              traceEntry.citations.push({
                citationId: cit.id,
                evidenceId: ptr.evidenceFileId || "",
                evidenceName,
                pointer: {
                  pageNumber: ptr.pageNumber ?? undefined,
                  timestampSeconds: ptr.timestampSeconds ?? undefined,
                  quote: ptr.quote ?? undefined,
                },
              });

              sourceSet.add(evidenceName);
              if (ptr.pageNumber) {
                citationBrackets.push(`[EVID: ${evidenceName}, p.${ptr.pageNumber}]`);
              } else if (ptr.timestampSeconds) {
                const mins = Math.floor(ptr.timestampSeconds / 60);
                const secs = ptr.timestampSeconds % 60;
                citationBrackets.push(`[EVID: ${evidenceName}, ${mins}:${secs.toString().padStart(2, "0")}]`);
              } else {
                citationBrackets.push(`[EVID: ${evidenceName}]`);
              }
            }
          }

          const citationSuffix = citationBrackets.length > 0 ? ` ${citationBrackets.join(" ")}` : "";
          markdown += `${globalIndex}. ${claim.claimText}${citationSuffix}\n\n`;
          trace.push(traceEntry);
        }
      }

      if (sourceSet.size > 0) {
        markdown += `---\n\n## Sources\n\n`;
        const sortedSources = Array.from(sourceSet).sort();
        for (const source of sortedSources) {
          markdown += `- ${source}\n`;
        }
      }

      const document = await storage.createDocument(userId, caseId, {
        title: title.trim(),
        templateKey: "declaration",
        content: markdown,
      });

      await storage.createLexiFeedbackEvent(userId, caseId, "doc_compile_claims", {
        documentId: document.id,
        claimCount: claims.length,
      });
      
      await storage.createActivityLog(userId, caseId, "document_compiled", `Compiled ${claims.length} claims into document`, {
        documentId: document.id,
        claimCount: claims.length,
      });
      
      await triggerCaseMemoryRebuild(userId, caseId, "doc_compile_claims", {
        documentId: document.id,
        acceptedClaimCount: claims.length,
      });

      res.status(201).json({
        ok: true,
        document,
        markdown,
        trace,
      });
    } catch (error) {
      console.error("Compile claims error:", error);
      res.status(500).json({ error: "Failed to compile claims into document" });
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

  app.get("/api/exhibit-lists/:listId/export", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { listId } = req.params;

      const list = await storage.getExhibitList(userId, listId);
      if (!list) {
        return res.status(404).json({ error: "Exhibit list not found" });
      }

      const evidenceLinks = await storage.listExhibitListEvidence(userId, listId);
      const snippets = await storage.listExhibitSnippets(userId, list.caseId, listId);
      
      if (evidenceLinks.length === 0 && snippets.length === 0) {
        return res.status(400).json({ error: "No items to export. Add evidence or snippets first." });
      }

      const archive = archiver("zip", { zlib: { level: 9 } });
      const buffers: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => buffers.push(chunk));
      archive.on("error", (err: Error) => {
        console.error("Archive error:", err);
        throw err;
      });

      const finishPromise = new Promise<void>((resolve, reject) => {
        archive.on("end", resolve);
        archive.on("error", reject);
      });

      let coverPageContent = "";
      coverPageContent += `================================================================================\n`;
      coverPageContent += `${list.coverPageTitle || list.title}\n`;
      coverPageContent += `================================================================================\n\n`;
      if (list.coverPageSubtitle) {
        coverPageContent += `${list.coverPageSubtitle}\n\n`;
      }
      if (list.isUsedForFiling) {
        coverPageContent += `USED FOR COURT FILING\n`;
        if (list.usedForFilingDate) {
          coverPageContent += `Filing Date: ${new Date(list.usedForFilingDate).toLocaleDateString()}\n`;
        }
        coverPageContent += `\n`;
      }
      if (list.notes) {
        coverPageContent += `Notes:\n${list.notes}\n\n`;
      }
      coverPageContent += `Generated: ${new Date().toLocaleString()}\n`;
      coverPageContent += `================================================================================\n`;
      archive.append(coverPageContent, { name: "00_Cover_Page.txt" });

      let snippetsContent = "";
      if (snippets.length > 0) {
        snippetsContent += `================================================================================\n`;
        snippetsContent += `SNIPPETS\n`;
        snippetsContent += `================================================================================\n\n`;
        for (let i = 0; i < snippets.length; i++) {
          const snip = snippets[i];
          snippetsContent += `--- Snippet ${i + 1}: ${snip.title} ---\n`;
          if (snip.pageNumber) {
            snippetsContent += `Page: ${snip.pageNumber}\n`;
          }
          if (snip.snippetText) {
            snippetsContent += `\n${snip.snippetText}\n`;
          }
          snippetsContent += `\n`;
        }
        archive.append(snippetsContent, { name: "01_Snippets.txt" });
      }

      const manifest: { title: string; generatedAt: string; items: unknown[] } = {
        title: list.title,
        generatedAt: new Date().toISOString(),
        items: [],
      };

      for (let i = 0; i < evidenceLinks.length; i++) {
        const link = evidenceLinks[i];
        const evidenceFile = await storage.getEvidenceFile(link.evidenceFileId, userId);
        if (!evidenceFile) continue;

        const paddedIndex = String(i + 1).padStart(2, "0");
        const safeFileName = evidenceFile.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const archivePath = `Evidence/${paddedIndex}_${safeFileName}`;
        
        manifest.items.push({
          index: i + 1,
          evidenceId: evidenceFile.id,
          fileName: evidenceFile.originalName,
          archivePath,
          label: link.label || null,
        });

        try {
          if (evidenceFile.storageKey && isR2Configured()) {
            const downloadUrl = await getSignedDownloadUrl(evidenceFile.storageKey);
            const response = await fetch(downloadUrl);
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              archive.append(buffer, { name: archivePath });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch evidence file ${evidenceFile.id}:`, err);
        }
      }

      archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
      archive.finalize();

      await finishPromise;
      const zipBuffer = Buffer.concat(buffers);

      const fileName = `exhibit_packet_${list.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", zipBuffer.length);
      res.send(zipBuffer);
    } catch (error) {
      console.error("Export exhibit list error:", error);
      res.status(500).json({ error: "Failed to export exhibit list" });
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

  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || "").trim();
  const lexiApiKeyConfigured = !!OPENAI_API_KEY;
  const openai = lexiApiKeyConfigured 
    ? new OpenAI({ apiKey: OPENAI_API_KEY })
    : null;

  app.get("/api/lexi/health", requireAuth, async (_req, res) => {
    if (!OPENAI_API_KEY) {
      return res.status(200).json({ ok: false, provider: "openai-direct", error: "missing OPENAI_API_KEY" });
    }

    try {
      const testClient = new OpenAI({ apiKey: OPENAI_API_KEY });
      await testClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });

      return res.status(200).json({ ok: true, provider: "openai-direct" });
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code;

      if (status === 401 || code === "invalid_api_key") {
        return res.status(200).json({
          ok: false,
          provider: "openai-direct",
          error: "invalid OPENAI_API_KEY (OpenAI returned 401)",
        });
      }

      return res.status(200).json({
        ok: false,
        provider: "openai-direct",
        error: "OpenAI health check failed",
      });
    }
  });

  app.get("/api/ai/health", requireAuth, async (_req, res) => {
    try {
      const openaiStatus: { ok: boolean; error?: string; code?: string } = { ok: false };
      if (!process.env.OPENAI_API_KEY) {
        openaiStatus.error = "OPENAI_API_KEY not configured";
        openaiStatus.code = "OPENAI_KEY_MISSING";
      } else {
        try {
          const testClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          await testClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          });
          openaiStatus.ok = true;
        } catch (err: unknown) {
          const errAny = err as { status?: number; code?: string; message?: string };
          if (errAny?.status === 401 || errAny?.code === "invalid_api_key") {
            openaiStatus.error = "Invalid OpenAI API key";
            openaiStatus.code = "OPENAI_KEY_INVALID";
          } else if (errAny?.status === 429) {
            openaiStatus.error = "OpenAI rate limit exceeded";
            openaiStatus.code = "OPENAI_RATE_LIMIT";
          } else {
            openaiStatus.error = errAny?.message || "OpenAI call failed";
            openaiStatus.code = "OPENAI_ERROR";
          }
        }
      }

      const visionStatus = await checkVisionHealth();

      const dbStatus = await checkAiTableColumns();

      const allOk = openaiStatus.ok && visionStatus.ok && dbStatus.ok;
      res.json({
        ok: allOk,
        openai: openaiStatus,
        vision: visionStatus,
        db: {
          ok: dbStatus.ok,
          evidence_extractions_status: dbStatus.ok,
          evidence_ai_analyses_status: dbStatus.ok,
        },
      });
    } catch (error) {
      console.error("AI health check error:", error);
      res.status(500).json({ ok: false, error: "Health check failed", code: "INTERNAL_ERROR" });
    }
  });

  app.get("/api/system/health-ai", requireAuth, async (_req, res) => {
    try {
      const openaiStatus: { ok: boolean; error?: string } = { ok: false };
      if (!process.env.OPENAI_API_KEY) {
        openaiStatus.error = "OPENAI_API_KEY not configured";
      } else {
        try {
          const testClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          await testClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          });
          openaiStatus.ok = true;
        } catch (err: any) {
          openaiStatus.error = err?.message || "OpenAI call failed";
        }
      }

      const visionStatus = await checkVisionHealth();

      const r2Status: { ok: boolean; error?: string } = { ok: false };
      if (!isR2Configured()) {
        r2Status.error = "R2 storage not configured";
      } else {
        r2Status.ok = true;
      }

      const dbStatus = await checkAiTableColumns();

      const allOk = openaiStatus.ok && visionStatus.ok && r2Status.ok && dbStatus.ok;
      res.json({
        ok: allOk,
        openai: openaiStatus,
        vision: visionStatus,
        r2: r2Status,
        db: {
          evidence_extractions_status: dbStatus.ok,
          evidence_ai_analyses_status: dbStatus.ok,
        },
      });
    } catch (error) {
      console.error("System health-ai check error:", error);
      res.status(500).json({ ok: false, error: "Health check failed" });
    }
  });

  app.get("/api/lexi/disclaimer", requireAuth, (_req, res) => {
    res.json({ disclaimer: LEXI_BANNER_DISCLAIMER, welcome: LEXI_WELCOME_MESSAGE });
  });

  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const q = (req.query.q as string || "").trim();
      const caseId = (req.query.caseId as string) || null;

      if (q.length < 2) {
        return res.json({ ok: true, results: [] });
      }

      const results = await searchCaseWide({ userId, caseId, q, limit: 5 });
      res.json({ ok: true, results });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/lexi/context", requireAuth, async (_req, res) => {
    res.json({ ok: true, context: null });
  });

  app.get("/api/cases/:caseId/lexi/context", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { caseId } = req.params;

      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const context = await buildLexiContext({ userId, caseId });
      res.json({ ok: true, context });
    } catch (error) {
      console.error("Get lexi context error:", error);
      res.status(500).json({ error: "Failed to get context" });
    }
  });

  app.get("/api/lexi/threads", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const threads = await storage.listLexiThreads(userId, null);
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
      const requestedTitle = (parsed.data.title ?? "").trim();
      const moduleKey = (parsed.data.moduleKey ?? "").trim();
      const defaultTitle = DEFAULT_THREAD_TITLES[moduleKey] ?? "General";
      const titleToSave = requestedTitle.length ? requestedTitle : defaultTitle;
      const thread = await storage.createLexiThread(userId, null, titleToSave);
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

      const requestedTitle = (parsed.data.title ?? "").trim();
      const moduleKey = (parsed.data.moduleKey ?? "").trim();
      const defaultTitle = DEFAULT_THREAD_TITLES[moduleKey] ?? "General";
      const titleToSave = requestedTitle.length ? requestedTitle : defaultTitle;
      const thread = await storage.createLexiThread(userId, caseId, titleToSave);
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

      const { threadId, message, stateOverride, stylePreset, fastMode } = parsed.data;
      const effectiveCaseId = parsed.data.caseId || null;

      let caseRecord = null;
      if (effectiveCaseId) {
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
        return res.status(503).json({ error: "Lexi is not configured. Add OPENAI_API_KEY in Replit Secrets and restart the app." });
      }

      await storage.createLexiMessage(
        userId, effectiveCaseId, threadId, "user", message, 
        null, null, { intent }
      );

      const existingMessages = await storage.listLexiMessages(userId, threadId);
      const baseSystemPrompt = buildLexiSystemPrompt({
        state: stateOverride || caseRecord?.state || undefined,
        county: caseRecord?.county || undefined,
        caseType: caseRecord?.caseType || undefined,
      });

      const personalization = await getLexiPersonalization(userId, effectiveCaseId);
      const personalizationBlock = buildPersonalizationPrompt(personalization);

      let caseContextBlock = "";
      if (effectiveCaseId) {
        const lexiContext = await buildLexiContext({ userId, caseId: effectiveCaseId });
        if (lexiContext) {
          caseContextBlock = `\n\n${formatContextForPrompt(lexiContext)}\n`;
        }
      }

      const formattingPolicies: Record<string, string> = {
        bullets: `FORMATTING POLICY (MUST FOLLOW):
- Use short paragraphs (max 2-3 sentences each).
- Prefer headings + bullet points.
- Never output a single paragraph longer than 5 lines.
- Always end with a "Next options" section (2-4 bullets) that are SAFE actions:
  - "Add this as a note"
  - "Add to Trial Prep"
  - "Ask me to research your state's rule"
  - "Summarize what you already uploaded"`,
        steps: `FORMATTING POLICY (MUST FOLLOW):
- Start with a brief summary (1-2 sentences).
- Then "Steps:" as a numbered list (1-8 steps max).
- Include brief bullets under a step only if necessary.
- Keep each step to 1-2 sentences.
- End with "Next options" (2-4 safe action bullets).`,
        short: `FORMATTING POLICY (MUST FOLLOW):
- Respond in 5 bullets max.
- No extra sections unless asked.
- Be direct. No long explanations.
- End with 1-2 "Next options" bullets.`,
        detailed: `FORMATTING POLICY (MUST FOLLOW):
- Start with a brief summary (1-2 sentences).
- Use headings: "Key points", "Examples", "Next steps".
- Use bullets heavily.
- Keep paragraphs short (2-3 sentences max).
- End with "Next options" section (2-4 safe action bullets).`,
      };

      const intentTemplates: Record<string, string> = {
        research: `RESPONSE STRUCTURE FOR RESEARCH:
- "What this is" (brief definition)
- "What it's called in your state" (if known)
- "Where to verify" (official sources)
- "Common terms or inputs"
- "Sources" (bullet list of official links/rules)`,
        organization: `RESPONSE STRUCTURE FOR ORGANIZATION:
- "What you already have in Civilla" (reference counts from context)
- "How it connects" (relationships between items)
- "Suggested next step inside Civilla"`,
        analysis: `RESPONSE STRUCTURE FOR ANALYSIS:
- "Summary" (1-2 sentences)
- "What stands out" (key observations)
- "Possible gaps / what to verify"
- "Next options" (safe actions)`,
      };

      const activeStyle = stylePreset || "bullets";
      const formattingPolicy = formattingPolicies[activeStyle] || formattingPolicies.bullets;
      const intentTemplate = intentTemplates[intent] || "";
      const systemPrompt = `${baseSystemPrompt}${personalizationBlock}${caseContextBlock}\n\n${formattingPolicy}${intentTemplate ? `\n\n${intentTemplate}` : ""}`;

      const chatHistory: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      const messageLimit = fastMode ? 10 : 20;
      for (const msg of existingMessages.slice(-messageLimit)) {
        if (msg.role === "user" || msg.role === "assistant") {
          chatHistory.push({ role: msg.role, content: msg.content });
        }
      }

      const temperature = fastMode ? 0.2 : 0.3;
      const maxTokens = fastMode ? 450 : 1024;
      const model = "gpt-4.1";
      const timeoutMs = fastMode ? 25000 : 45000;

      if (process.env.NODE_ENV === "development") {
        console.log("[Lexi] fastMode:", fastMode, "model:", model, "timeout:", timeoutMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: chatHistory,
          temperature,
          max_completion_tokens: maxTokens,
        }, { signal: controller.signal });
      } catch (abortErr: any) {
        clearTimeout(timeoutId);
        if (abortErr.name === "AbortError" || controller.signal.aborted) {
          return res.status(504).json({ 
            error: "Lexi timed out. Try again.", 
            code: "LEXI_TIMEOUT" 
          });
        }
        throw abortErr;
      }
      clearTimeout(timeoutId);

      let assistantContent = completion.choices[0]?.message?.content || "I apologize, but I was unable to generate a response. Please try again.";
      
      assistantContent = normalizeUrlsInContent(assistantContent);
      
      const { sources, hasSources } = extractSourcesFromContent(assistantContent);
      
      let validatedSources: LexiSource[] = [];
      if (hasSources && sources.length > 0) {
        validatedSources = await normalizeAndValidateSources(sources);
      }
      
      const { content: finalContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, assistantContent);
      if (wasAdded) {
        await storage.markLexiThreadDisclaimerShown(userId, threadId);
      }
      
      const assistantMsg = await storage.createLexiMessage(
        userId, effectiveCaseId, threadId, "assistant", finalContent, 
        null, "gpt-4.1", { intent, refused: false, hadSources: hasSources, sources: validatedSources }
      );

      res.json({ assistantMessage: assistantMsg, intent, refused: false, hadSources: hasSources, sources: validatedSources });
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code;

      if (status === 401 || code === "invalid_api_key") {
        return res.status(401).json({
          error: "Lexi cannot authenticate to OpenAI (invalid API key). Update OPENAI_API_KEY in Replit Secrets and restart.",
        });
      }

      if (status === 429) {
        return res.status(429).json({ error: "Lexi is temporarily rate-limited. Please try again in a moment." });
      }

      console.error("Lexi chat error:", err);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.post("/api/lexi/chat/stream", requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendSSE = (event: string, data: object) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const parsed = lexiChatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        sendSSE("error", { code: "INVALID_REQUEST", message: "Invalid request format" });
        return res.end();
      }

      const { threadId: providedThreadId, message, stateOverride, stylePreset, fastMode } = parsed.data;
      const effectiveCaseId = parsed.data.caseId || null;

      let caseRecord = null;
      if (effectiveCaseId) {
        caseRecord = await storage.getCase(effectiveCaseId, userId);
        if (!caseRecord) {
          sendSSE("error", { code: "CASE_NOT_FOUND", message: "Case not found" });
          return res.end();
        }
      }

      let thread;
      let threadId = providedThreadId;
      
      if (providedThreadId) {
        thread = await storage.getLexiThread(userId, providedThreadId);
        if (!thread || thread.caseId !== effectiveCaseId) {
          sendSSE("error", { code: "THREAD_NOT_FOUND", message: "Thread not found" });
          return res.end();
        }
      } else {
        const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        const title = `New conversation - ${timestamp}`;
        thread = await storage.createLexiThread(userId, effectiveCaseId, title);
        threadId = thread.id;
        sendSSE("thread_created", { threadId: thread.id, title: thread.title });
      }

      const intent: LexiIntent = classifyIntent(message);
      const disclaimerShown = thread.disclaimerShown;

      if (isDisallowed(message)) {
        await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "user", message, 
          { disallowed: true }, null, { intent, refused: true }
        );
        
        const { content: responseContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, DISALLOWED_RESPONSE);
        if (wasAdded) await storage.markLexiThreadDisclaimerShown(userId, threadId);
        
        for (const chunk of responseContent.split(" ")) {
          sendSSE("token", { delta: chunk + " " });
        }
        
        await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "assistant", responseContent, 
          { safety_template: true }, null, { intent, refused: true, hadSources: false }
        );
        
        sendSSE("done", { ok: true });
        return res.end();
      }

      const uplTemplate = detectUPLRequest(message);
      if (uplTemplate) {
        await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "user", message, 
          { upl_detected: true }, null, { intent, refused: true }
        );
        
        const { content: responseContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, SAFETY_TEMPLATES[uplTemplate]);
        if (wasAdded) await storage.markLexiThreadDisclaimerShown(userId, threadId);
        
        for (const chunk of responseContent.split(" ")) {
          sendSSE("token", { delta: chunk + " " });
        }
        
        await storage.createLexiMessage(
          userId, effectiveCaseId, threadId, "assistant", responseContent, 
          { safety_template: true }, null, { intent, refused: true, hadSources: false }
        );
        
        sendSSE("done", { ok: true });
        return res.end();
      }

      if (!openai) {
        sendSSE("error", { code: "OPENAI_KEY_MISSING", message: "Lexi isn't configured yet. Add OPENAI_API_KEY in Secrets." });
        return res.end();
      }

      await storage.createLexiMessage(
        userId, effectiveCaseId, threadId, "user", message, 
        null, null, { intent }
      );

      const existingMessages = await storage.listLexiMessages(userId, threadId);
      const baseSystemPrompt = buildLexiSystemPrompt({
        state: stateOverride || caseRecord?.state || undefined,
        county: caseRecord?.county || undefined,
        caseType: caseRecord?.caseType || undefined,
      });

      const personalization = await getLexiPersonalization(userId, effectiveCaseId);
      const personalizationBlock = buildPersonalizationPrompt(personalization);

      let caseContextBlock = "";
      if (effectiveCaseId) {
        const lexiContext = await buildLexiContext({ userId, caseId: effectiveCaseId });
        if (lexiContext) {
          caseContextBlock = `\n\n${formatContextForPrompt(lexiContext)}\n`;
        }
      }

      const formattingPolicies: Record<string, string> = {
        bullets: `FORMATTING POLICY (MUST FOLLOW):
- Use short paragraphs (max 2-3 sentences each).
- Prefer headings + bullet points.
- Never output a single paragraph longer than 5 lines.
- Always end with a "Next options" section (2-4 bullets) that are SAFE actions.`,
        steps: `FORMATTING POLICY (MUST FOLLOW):
- Start with a brief summary (1-2 sentences).
- Then "Steps:" as a numbered list (1-8 steps max).
- Keep each step to 1-2 sentences.
- End with "Next options" (2-4 safe action bullets).`,
        short: `FORMATTING POLICY (MUST FOLLOW):
- Respond in 5 bullets max.
- No extra sections unless asked.
- Be direct. No long explanations.`,
        detailed: `FORMATTING POLICY (MUST FOLLOW):
- Start with a brief summary (1-2 sentences).
- Use headings: "Key points", "Examples", "Next steps".
- Use bullets heavily.
- Keep paragraphs short (2-3 sentences max).`,
      };

      const activeStyle = stylePreset || "bullets";
      const formattingPolicy = formattingPolicies[activeStyle] || formattingPolicies.bullets;
      const systemPrompt = `${baseSystemPrompt}${personalizationBlock}${caseContextBlock}\n\n${formattingPolicy}`;

      const chatHistory: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      const messageLimit = fastMode ? 10 : 20;
      for (const msg of existingMessages.slice(-messageLimit)) {
        if (msg.role === "user" || msg.role === "assistant") {
          chatHistory.push({ role: msg.role, content: msg.content });
        }
      }

      const temperature = fastMode ? 0.2 : 0.3;
      const maxTokens = fastMode ? 450 : 1024;
      const model = "gpt-4.1";
      const timeoutMs = fastMode ? 25000 : 45000;

      if (process.env.NODE_ENV === "development") {
        console.log("[LexiStream] fastMode:", fastMode, "model:", model, "timeout:", timeoutMs);
      }

      let clientDisconnected = false;
      req.on("close", () => {
        clientDisconnected = true;
      });

      const controller = new AbortController();
      const stream = await openai.chat.completions.create({
        model,
        messages: chatHistory,
        temperature,
        max_completion_tokens: maxTokens,
        stream: true,
      }, { signal: controller.signal });

      let fullContent = "";
      const timeout = setTimeout(() => {
        if (!clientDisconnected) {
          controller.abort();
          sendSSE("error", { code: "LEXI_TIMEOUT", message: "Lexi took too long. Try again (or turn on Faster mode)." });
          res.end();
        }
      }, timeoutMs);

      for await (const chunk of stream) {
        if (clientDisconnected) {
          console.log("[LexiStream] Client disconnected, aborting stream");
          break;
        }
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullContent += delta;
          sendSSE("token", { delta });
        }
      }

      clearTimeout(timeout);

      if (clientDisconnected) {
        console.log("[LexiStream] Not persisting partial response due to client disconnect");
        return res.end();
      }

      let assistantContent = fullContent || "I apologize, but I was unable to generate a response. Please try again.";
      assistantContent = normalizeUrlsInContent(assistantContent);
      
      const { sources, hasSources } = extractSourcesFromContent(assistantContent);
      let validatedSources: LexiSource[] = [];
      if (hasSources && sources.length > 0) {
        validatedSources = await normalizeAndValidateSources(sources);
      }
      
      const { content: finalContent, wasAdded } = prependDisclaimerIfNeeded(disclaimerShown, assistantContent);
      if (wasAdded) {
        await storage.markLexiThreadDisclaimerShown(userId, threadId!);
      }
      
      const assistantMessage = await storage.createLexiMessage(
        userId, effectiveCaseId, threadId!, "assistant", finalContent, 
        null, "gpt-4.1", { intent, refused: false, hadSources: hasSources, sources: validatedSources }
      );

      if (hasSources && validatedSources.length > 0) {
        sendSSE("sources", { sources: validatedSources });
      }

      sendSSE("done", { ok: true, threadId, messageId: assistantMessage.id });
      res.end();
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code;

      if (status === 401 || code === "invalid_api_key") {
        sendSSE("error", { code: "OPENAI_KEY_INVALID", message: "Lexi cannot authenticate to OpenAI. Update OPENAI_API_KEY in Secrets." });
      } else if (status === 429) {
        sendSSE("error", { code: "OPENAI_RATE_LIMIT", message: "Rate limit hit. Try again in a minute." });
      } else {
        console.error("Lexi stream error:", err);
        sendSSE("error", { code: "UNKNOWN", message: "Something went wrong. Please try again." });
      }
      res.end();
    }
  });

  app.get("/api/lexi/prefs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const prefs = await storage.getLexiUserPrefs(userId);
      res.json({ prefs: prefs || null });
    } catch (err) {
      console.error("Get Lexi prefs error:", err);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/lexi/prefs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { responseStyle, verbosity, citationStrictness, defaultMode, streamingEnabled, fasterMode } = req.body;
      const prefs = await storage.upsertLexiUserPrefs(userId, {
        responseStyle: responseStyle ?? undefined,
        verbosity: verbosity ?? undefined,
        citationStrictness: citationStrictness ?? undefined,
        defaultMode: defaultMode ?? undefined,
        streamingEnabled: streamingEnabled ?? undefined,
        fasterMode: fasterMode ?? undefined,
      });
      res.json({ prefs });
    } catch (err) {
      console.error("Upsert Lexi prefs error:", err);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  app.get("/api/cases/:caseId/lexi/memory", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const memory = await storage.getLexiCaseMemory(userId, caseId);
      res.json({ memory: memory || null });
    } catch (err) {
      console.error("Get Lexi case memory error:", err);
      res.status(500).json({ error: "Failed to fetch case memory" });
    }
  });

  app.patch("/api/cases/:caseId/lexi/memory", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const { memoryMarkdown, preferencesJson } = req.body;
      const memory = await storage.upsertLexiCaseMemory(userId, caseId, {
        memoryMarkdown: memoryMarkdown ?? undefined,
        preferencesJson: preferencesJson ?? undefined,
      });
      res.json({ ok: true, memory });
    } catch (err) {
      console.error("Upsert Lexi case memory error:", err);
      res.status(500).json({ error: "Failed to save case memory" });
    }
  });

  app.post("/api/cases/:caseId/lexi/memory/rebuild", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const memoryMarkdown = await rebuildCaseMemory(userId, caseId);
      res.json({ ok: true, memoryMarkdown, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Rebuild Lexi case memory error:", err);
      res.status(500).json({ error: "Failed to rebuild case memory" });
    }
  });

  app.post("/api/lexi/feedback", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, eventType, payload } = req.body;
      if (!eventType || typeof eventType !== "string") {
        return res.status(400).json({ error: "eventType is required" });
      }
      const event = await storage.createLexiFeedbackEvent(userId, caseId || null, eventType, payload || {});
      res.status(201).json({ event });
    } catch (err) {
      console.error("Create Lexi feedback event error:", err);
      res.status(500).json({ error: "Failed to create feedback event" });
    }
  });

  app.get("/api/lexi/feedback", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const caseId = (req.query.caseId as string) || null;
      const limit = parseInt((req.query.limit as string) || "50", 10);
      const events = await storage.listLexiFeedbackEvents(userId, caseId, limit);
      res.json({ events });
    } catch (err) {
      console.error("List Lexi feedback events error:", err);
      res.status(500).json({ error: "Failed to fetch feedback events" });
    }
  });

  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const limit = parseInt((req.query.limit as string) || "50", 10);
      const offset = parseInt((req.query.offset as string) || "0", 10);
      const logs = await storage.listActivityLogs(userId, limit, offset);
      res.json({ logs });
    } catch (err) {
      console.error("List activity logs error:", err);
      res.status(500).json({ error: "Failed to fetch activity logs" });
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
      
      const existingItem = await storage.getTrialBinderItem(userId, itemId);
      const item = await storage.updateTrialBinderItem(userId, itemId, parsed.data);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (parsed.data.pinnedRank !== undefined) {
        const wasPinned = existingItem?.pinnedRank !== null;
        const isPinned = parsed.data.pinnedRank !== null;
        if (wasPinned !== isPinned) {
          await storage.createLexiFeedbackEvent(userId, caseId, isPinned ? "trial_prep_pin" : "trial_prep_unpin", {
            itemId: item.id,
            sectionKey: item.sectionKey,
          });
          
          const caseIdNum = parseInt(caseId, 10);
          if (!isNaN(caseIdNum)) {
            scheduleMemoryRebuild(caseIdNum, () => rebuildCaseMemory(userId, caseId));
          }
        }
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

  app.post("/api/cases/:caseId/evidence/:evidenceId/process", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const { isGcvConfigured } = await import("./services/ocr");
      if (!isGcvConfigured()) {
        return res.status(503).json({ 
          error: "Text extraction is not configured. Please add Google Cloud Vision credentials." 
        });
      }
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const evidence = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidence || evidence.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence not found" });
      }
      
      const existingJob = await storage.getEvidenceProcessingJobByEvidence(userId, evidenceId);
      if (existingJob && (existingJob.status === "queued" || existingJob.status === "processing")) {
        return res.json({ ok: true, jobId: existingJob.id, status: existingJob.status });
      }
      
      const job = await storage.createEvidenceProcessingJob(userId, caseId, evidenceId);
      
      const filePath = evidence.storageKey;
      const { processEvidenceFile } = await import("./services/ocr");
      processEvidenceFile(userId, caseId, evidenceId, job.id, filePath, evidence.mimeType);
      
      res.json({ ok: true, jobId: job.id, status: "queued" });
    } catch (error) {
      console.error("Start OCR processing error:", error);
      res.status(500).json({ error: "Failed to start text extraction" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/process", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const job = await storage.getEvidenceProcessingJobByEvidence(userId, evidenceId);
      if (!job) {
        return res.json({ job: null });
      }
      
      res.json({ job });
    } catch (error) {
      console.error("Get OCR job status error:", error);
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/ocr-pages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const pages = await storage.listEvidenceOcrPages(userId, caseId, evidenceId);
      res.json({ pages });
    } catch (error) {
      console.error("List OCR pages error:", error);
      res.status(500).json({ error: "Failed to list OCR pages" });
    }
  });

  app.patch("/api/ocr-pages/:ocrPageId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { ocrPageId } = req.params;
      const { needsReview } = req.body;
      
      const updated = await storage.markOcrPageReviewed(userId, ocrPageId, needsReview ?? false);
      if (!updated) {
        return res.status(404).json({ error: "OCR page not found" });
      }
      
      res.json({ page: updated });
    } catch (error) {
      console.error("Update OCR page error:", error);
      res.status(500).json({ error: "Failed to update OCR page" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/anchors", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const anchors = await storage.listEvidenceAnchors(userId, caseId, evidenceId);
      res.json({ anchors });
    } catch (error) {
      console.error("List evidence anchors error:", error);
      res.status(500).json({ error: "Failed to list anchors" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/anchors", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertEvidenceAnchorSchema } = await import("@shared/schema");
      const parsed = insertEvidenceAnchorSchema.safeParse({ ...req.body, evidenceId });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const anchor = await storage.createEvidenceAnchor(userId, caseId, parsed.data);
      res.status(201).json({ anchor });
    } catch (error) {
      console.error("Create evidence anchor error:", error);
      res.status(500).json({ error: "Failed to create anchor" });
    }
  });

  app.patch("/api/anchors/:anchorId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { anchorId } = req.params;
      
      const { updateEvidenceAnchorSchema } = await import("@shared/schema");
      const parsed = updateEvidenceAnchorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const anchor = await storage.updateEvidenceAnchor(userId, anchorId, parsed.data);
      if (!anchor) {
        return res.status(404).json({ error: "Anchor not found" });
      }
      
      res.json({ anchor });
    } catch (error) {
      console.error("Update evidence anchor error:", error);
      res.status(500).json({ error: "Failed to update anchor" });
    }
  });

  app.delete("/api/anchors/:anchorId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { anchorId } = req.params;
      
      const deleted = await storage.deleteEvidenceAnchor(userId, anchorId);
      if (!deleted) {
        return res.status(404).json({ error: "Anchor not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete evidence anchor error:", error);
      res.status(500).json({ error: "Failed to delete anchor" });
    }
  });

  app.get("/api/cases/:caseId/pattern-analysis/input", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const anchors = await storage.listEvidenceAnchors(userId, caseId);
      
      const evidenceFiles = await storage.getEvidenceFilesByCase(caseId, userId);
      const evidenceMap = new Map(evidenceFiles.map(e => [e.id, e]));
      
      const enrichedAnchors = anchors.map(anchor => ({
        ...anchor,
        evidenceName: evidenceMap.get(anchor.evidenceId)?.originalName || "Unknown",
      }));
      
      res.json({ anchors: enrichedAnchors });
    } catch (error) {
      console.error("Get pattern analysis input error:", error);
      res.status(500).json({ error: "Failed to get pattern analysis input" });
    }
  });

  app.get("/api/cases/:caseId/pattern-analysis", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const [
        evidenceFiles,
        aiAnalyses,
        notesFull,
        timelineEvents,
        communications,
        exhibitSnippets,
        trialPrepItems,
      ] = await Promise.all([
        storage.listEvidenceFiles(caseId, userId),
        storage.listEvidenceAiAnalyses(userId, caseId),
        storage.listEvidenceNotesFull(userId, caseId),
        storage.listTimelineEvents(caseId, userId),
        storage.listCommunications(userId, caseId),
        storage.listExhibitSnippets(userId, caseId),
        storage.listTrialPrepShortlist(userId, caseId),
      ]);

      const evidenceMap = new Map(evidenceFiles.map(e => [e.id, e]));
      const pinnedSourceIds = new Set(trialPrepItems.filter(t => t.isPinned).map(t => t.sourceId));

      const status = {
        evidenceTotal: evidenceFiles.length,
        extractedComplete: aiAnalyses.filter(a => a.status === "complete").length,
        extractedProcessing: aiAnalyses.filter(a => a.status === "processing").length,
        extractedFailed: aiAnalyses.filter(a => a.status === "failed").length,
        analysesComplete: aiAnalyses.filter(a => a.status === "complete").length,
        analysesProcessing: aiAnalyses.filter(a => a.status === "processing").length,
        analysesFailed: aiAnalyses.filter(a => a.status === "failed").length,
        notesTotal: notesFull.length,
        timelineTotal: timelineEvents.length,
        communicationsTotal: communications.length,
      };

      type ExampleItem = {
        sourceType: string;
        sourceId: string;
        title: string;
        excerpt: string;
        occurredAt?: string;
        evidenceId?: string;
        fileName?: string;
        pageNumber?: number;
        tags?: string[];
        importance?: number;
      };

      const themeKeywords = [
        "missed exchanges", "medical obstruction", "unilateral decisions",
        "hostile language", "withheld communication", "deadline pressure",
        "inconsistency", "gatekeeping", "schedule changes", "conflict",
        "coparenting", "custody", "visitation", "support", "agreement"
      ];

      const themeCounts: Record<string, ExampleItem[]> = {};
      const patternCounts: Record<string, ExampleItem[]> = {};
      const keyDatesMap: Record<string, ExampleItem[]> = {};
      const keyNamesMap: Record<string, ExampleItem[]> = {};
      const conflictsAndGaps: ExampleItem[] = [];

      for (const analysis of aiAnalyses) {
        if (analysis.status !== "complete") continue;
        const findings = analysis.findings as Record<string, unknown> | null;
        const summary = analysis.summary || "";
        const evidenceFile = evidenceMap.get(analysis.evidenceId);
        
        const baseItem: ExampleItem = {
          sourceType: "evidence_analysis",
          sourceId: analysis.id,
          title: evidenceFile?.originalName || "AI Analysis",
          excerpt: summary.slice(0, 200),
          evidenceId: analysis.evidenceId,
          fileName: evidenceFile?.originalName,
          importance: pinnedSourceIds.has(analysis.id) ? 10 : 5,
        };

        for (const keyword of themeKeywords) {
          if (summary.toLowerCase().includes(keyword.toLowerCase())) {
            const label = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            if (!themeCounts[label]) themeCounts[label] = [];
            themeCounts[label].push(baseItem);
          }
        }

        if (findings && typeof findings === "object") {
          const findingsThemes = (findings as { themes?: string[] }).themes;
          if (Array.isArray(findingsThemes)) {
            for (const theme of findingsThemes) {
              const label = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
              if (!themeCounts[label]) themeCounts[label] = [];
              themeCounts[label].push(baseItem);
            }
          }
        }
      }

      for (const note of notesFull) {
        const evidenceFile = evidenceMap.get(note.evidenceId);
        const noteItem: ExampleItem = {
          sourceType: "evidence_note",
          sourceId: note.id,
          title: note.noteTitle || "Note",
          excerpt: (note.noteText || "").slice(0, 200),
          evidenceId: note.evidenceId,
          fileName: evidenceFile?.originalName,
          pageNumber: note.pageNumber ?? undefined,
          tags: Array.isArray(note.tags) ? note.tags as string[] : [],
          importance: pinnedSourceIds.has(note.id) ? 10 : (note.isResolved ? 2 : 5),
        };

        if (note.tags && Array.isArray(note.tags)) {
          for (const tag of note.tags as string[]) {
            const label = String(tag).charAt(0).toUpperCase() + String(tag).slice(1);
            if (!themeCounts[label]) themeCounts[label] = [];
            themeCounts[label].push(noteItem);
          }
        }
      }

      for (const event of timelineEvents) {
        const eventItem: ExampleItem = {
          sourceType: "timeline_event",
          sourceId: event.id,
          title: event.title,
          excerpt: (event.notes || "").slice(0, 200),
          occurredAt: event.eventDate?.toISOString(),
          importance: pinnedSourceIds.has(event.id) ? 10 : 4,
        };

        if (event.eventDate) {
          const dateKey = event.eventDate.toISOString().split("T")[0];
          if (!keyDatesMap[dateKey]) keyDatesMap[dateKey] = [];
          keyDatesMap[dateKey].push(eventItem);
        }

        const category = event.title.toLowerCase();
        if (category.includes("hearing") || category.includes("court") || category.includes("filing")) {
          if (!patternCounts["Court Events"]) patternCounts["Court Events"] = [];
          patternCounts["Court Events"].push(eventItem);
        }
        if (category.includes("exchange") || category.includes("pickup") || category.includes("dropoff")) {
          if (!patternCounts["Custody Exchanges"]) patternCounts["Custody Exchanges"] = [];
          patternCounts["Custody Exchanges"].push(eventItem);
        }
      }

      for (const comm of communications) {
        const resolved = comm.status === "resolved";
        const commItem: ExampleItem = {
          sourceType: "communication",
          sourceId: comm.id,
          title: `${comm.direction === "incoming" ? "From" : "To"}: ${comm.contactId || "Unknown"}`,
          excerpt: (comm.summary || "").slice(0, 200),
          occurredAt: comm.occurredAt?.toISOString(),
          importance: pinnedSourceIds.has(comm.id) ? 10 : (resolved ? 2 : 5),
        };

        if (comm.followUpAt && !resolved) {
          const dueDate = new Date(comm.followUpAt);
          if (dueDate < new Date()) {
            conflictsAndGaps.push({
              ...commItem,
              title: `Overdue follow-up: ${comm.contactId || "Unknown"}`,
            });
          }
        }

        if (comm.channel) {
          const typeLabel = comm.channel.charAt(0).toUpperCase() + comm.channel.slice(1) + " communications";
          if (!patternCounts[typeLabel]) patternCounts[typeLabel] = [];
          patternCounts[typeLabel].push(commItem);
        }
      }

      for (const snippet of exhibitSnippets) {
        const snippetItem: ExampleItem = {
          sourceType: "exhibit_snippet",
          sourceId: snippet.id,
          title: snippet.title,
          excerpt: (snippet.snippetText || "").slice(0, 200),
          pageNumber: snippet.pageNumber ?? undefined,
          importance: pinnedSourceIds.has(snippet.id) ? 10 : 4,
        };

        if (!patternCounts["Exhibit Highlights"]) patternCounts["Exhibit Highlights"] = [];
        patternCounts["Exhibit Highlights"].push(snippetItem);
      }

      const sortByImportance = (items: ExampleItem[]) =>
        [...items].sort((a, b) => (b.importance || 0) - (a.importance || 0));

      const themes = Object.entries(themeCounts)
        .map(([label, examples]) => ({ label, count: examples.length, examples: sortByImportance(examples).slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const patterns = Object.entries(patternCounts)
        .map(([label, examples]) => ({ label, count: examples.length, examples: sortByImportance(examples).slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const keyDates = Object.entries(keyDatesMap)
        .map(([date, sources]) => ({ date, label: `${sources.length} event(s)`, sources: sortByImportance(sources).slice(0, 3) }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      const keyNames = Object.entries(keyNamesMap)
        .map(([name, examples]) => ({ name, count: examples.length, examples: sortByImportance(examples).slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      res.json({
        ok: true,
        status,
        themes,
        patterns,
        keyDates,
        conflictsAndGaps: sortByImportance(conflictsAndGaps).slice(0, 10),
        keyNames,
        topExamples: {
          themes: themes.flatMap(t => t.examples).slice(0, 3),
          patterns: patterns.flatMap(p => p.examples).slice(0, 3),
          dates: keyDates.flatMap(d => d.sources).slice(0, 3),
        },
      });
    } catch (error) {
      console.error("Get pattern analysis error:", error);
      res.status(500).json({ error: "Failed to get pattern analysis" });
    }
  });

  app.get("/api/cases/:caseId/pattern-analysis/export", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const [
        evidenceFiles,
        aiAnalyses,
        notesFull,
        timelineEvents,
        communications,
        exhibitSnippets,
        trialPrepItems,
      ] = await Promise.all([
        storage.listEvidenceFiles(caseId, userId),
        storage.listEvidenceAiAnalyses(userId, caseId),
        storage.listEvidenceNotesFull(userId, caseId),
        storage.listTimelineEvents(caseId, userId),
        storage.listCommunications(userId, caseId),
        storage.listExhibitSnippets(userId, caseId),
        storage.listTrialPrepShortlist(userId, caseId),
      ]);

      const evidenceMap = new Map(evidenceFiles.map(e => [e.id, e]));
      const pinnedSourceIds = new Set(trialPrepItems.filter(t => t.isPinned).map(t => t.sourceId));

      type ExampleItem = {
        sourceType: string;
        sourceId: string;
        title: string;
        excerpt: string;
        occurredAt?: string;
        evidenceId?: string;
        fileName?: string;
        pageNumber?: number;
        tags?: string[];
        importance?: number;
      };

      const themeKeywords = [
        "missed exchanges", "medical obstruction", "unilateral decisions",
        "hostile language", "withheld communication", "deadline pressure",
        "inconsistency", "gatekeeping", "schedule changes", "conflict",
        "coparenting", "custody", "visitation", "support", "agreement"
      ];

      const themeCounts: Record<string, ExampleItem[]> = {};
      const patternCounts: Record<string, ExampleItem[]> = {};
      const keyDatesMap: Record<string, ExampleItem[]> = {};
      const conflictsAndGaps: ExampleItem[] = [];

      for (const analysis of aiAnalyses) {
        if (analysis.status !== "complete") continue;
        const findings = analysis.findings as Record<string, unknown> | null;
        const summary = analysis.summary || "";
        const evidenceFile = evidenceMap.get(analysis.evidenceId);
        
        const baseItem: ExampleItem = {
          sourceType: "evidence_analysis",
          sourceId: analysis.id,
          title: evidenceFile?.originalName || "AI Analysis",
          excerpt: summary.slice(0, 200),
          evidenceId: analysis.evidenceId,
          fileName: evidenceFile?.originalName,
          importance: pinnedSourceIds.has(analysis.id) ? 10 : 5,
        };

        for (const keyword of themeKeywords) {
          if (summary.toLowerCase().includes(keyword.toLowerCase())) {
            const label = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            if (!themeCounts[label]) themeCounts[label] = [];
            themeCounts[label].push(baseItem);
          }
        }

        if (findings && typeof findings === "object") {
          const findingsThemes = (findings as { themes?: string[] }).themes;
          if (Array.isArray(findingsThemes)) {
            for (const theme of findingsThemes) {
              const label = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
              if (!themeCounts[label]) themeCounts[label] = [];
              themeCounts[label].push(baseItem);
            }
          }
        }
      }

      for (const note of notesFull) {
        const evidenceFile = evidenceMap.get(note.evidenceId);
        const noteItem: ExampleItem = {
          sourceType: "evidence_note",
          sourceId: note.id,
          title: note.noteTitle || "Note",
          excerpt: (note.noteText || "").slice(0, 200),
          evidenceId: note.evidenceId,
          fileName: evidenceFile?.originalName,
          pageNumber: note.pageNumber ?? undefined,
          tags: Array.isArray(note.tags) ? note.tags as string[] : [],
          importance: pinnedSourceIds.has(note.id) ? 10 : (note.isResolved ? 2 : 5),
        };

        if (note.tags && Array.isArray(note.tags)) {
          for (const tag of note.tags as string[]) {
            const label = String(tag).charAt(0).toUpperCase() + String(tag).slice(1);
            if (!themeCounts[label]) themeCounts[label] = [];
            themeCounts[label].push(noteItem);
          }
        }
      }

      for (const event of timelineEvents) {
        const eventItem: ExampleItem = {
          sourceType: "timeline_event",
          sourceId: event.id,
          title: event.title,
          excerpt: (event.notes || "").slice(0, 200),
          occurredAt: event.eventDate?.toISOString(),
          importance: pinnedSourceIds.has(event.id) ? 10 : 4,
        };

        if (event.eventDate) {
          const dateKey = event.eventDate.toISOString().split("T")[0];
          if (!keyDatesMap[dateKey]) keyDatesMap[dateKey] = [];
          keyDatesMap[dateKey].push(eventItem);
        }

        const category = event.title.toLowerCase();
        if (category.includes("hearing") || category.includes("court") || category.includes("filing")) {
          if (!patternCounts["Court Events"]) patternCounts["Court Events"] = [];
          patternCounts["Court Events"].push(eventItem);
        }
        if (category.includes("exchange") || category.includes("pickup") || category.includes("dropoff")) {
          if (!patternCounts["Custody Exchanges"]) patternCounts["Custody Exchanges"] = [];
          patternCounts["Custody Exchanges"].push(eventItem);
        }
      }

      for (const comm of communications) {
        const resolved = comm.status === "resolved";
        const commItem: ExampleItem = {
          sourceType: "communication",
          sourceId: comm.id,
          title: `${comm.direction === "incoming" ? "From" : "To"}: ${comm.contactId || "Unknown"}`,
          excerpt: (comm.summary || "").slice(0, 200),
          occurredAt: comm.occurredAt?.toISOString(),
          importance: pinnedSourceIds.has(comm.id) ? 10 : (resolved ? 2 : 5),
        };

        if (comm.followUpAt && !resolved) {
          const dueDate = new Date(comm.followUpAt);
          if (dueDate < new Date()) {
            conflictsAndGaps.push({
              ...commItem,
              title: `Overdue follow-up: ${comm.contactId || "Unknown"}`,
            });
          }
        }

        if (comm.channel) {
          const typeLabel = comm.channel.charAt(0).toUpperCase() + comm.channel.slice(1) + " communications";
          if (!patternCounts[typeLabel]) patternCounts[typeLabel] = [];
          patternCounts[typeLabel].push(commItem);
        }
      }

      for (const snippet of exhibitSnippets) {
        const snippetItem: ExampleItem = {
          sourceType: "exhibit_snippet",
          sourceId: snippet.id,
          title: snippet.title,
          excerpt: (snippet.snippetText || "").slice(0, 200),
          pageNumber: snippet.pageNumber ?? undefined,
          importance: pinnedSourceIds.has(snippet.id) ? 10 : 4,
        };

        if (!patternCounts["Exhibit Highlights"]) patternCounts["Exhibit Highlights"] = [];
        patternCounts["Exhibit Highlights"].push(snippetItem);
      }

      const sortByImportance = (items: ExampleItem[]) =>
        [...items].sort((a, b) => (b.importance || 0) - (a.importance || 0));

      const themes = Object.entries(themeCounts)
        .map(([label, examples]) => ({ label, count: examples.length, examples: sortByImportance(examples).slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const patterns = Object.entries(patternCounts)
        .map(([label, examples]) => ({ label, count: examples.length, examples: sortByImportance(examples).slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const keyDates = Object.entries(keyDatesMap)
        .map(([date, sources]) => ({ date, label: `${sources.length} event(s)`, sources: sortByImportance(sources).slice(0, 3) }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      
      let markdown = `# Pattern Analysis Summary\n\n`;
      markdown += `**Case:** ${caseRecord.title}\n`;
      markdown += `**Generated:** ${dateStr}\n\n`;
      markdown += `---\n\n`;
      markdown += `> **Disclaimer:** This is an organizational summary and may be incomplete or incorrect. Verify against your documents. This is not legal advice.\n\n`;
      markdown += `---\n\n`;

      markdown += `## Coverage & Status\n\n`;
      markdown += `- **Evidence Files:** ${evidenceFiles.length}\n`;
      markdown += `- **AI Analyses Complete:** ${aiAnalyses.filter(a => a.status === "complete").length}\n`;
      markdown += `- **Notes:** ${notesFull.length}\n`;
      markdown += `- **Timeline Events:** ${timelineEvents.length}\n`;
      markdown += `- **Communications:** ${communications.length}\n\n`;

      if (themes.length > 0) {
        markdown += `## Themes Detected\n\n`;
        for (const theme of themes) {
          markdown += `### ${theme.label} (${theme.count} occurrence${theme.count !== 1 ? "s" : ""})\n\n`;
          for (const ex of theme.examples) {
            markdown += `- **${ex.title}**${ex.fileName ? ` (${ex.fileName})` : ""}\n`;
            markdown += `  ${ex.excerpt}\n\n`;
          }
        }
      }

      if (patterns.length > 0) {
        markdown += `## Patterns Found\n\n`;
        for (const pattern of patterns) {
          markdown += `### ${pattern.label} (${pattern.count} item${pattern.count !== 1 ? "s" : ""})\n\n`;
          for (const ex of pattern.examples) {
            markdown += `- **${ex.title}**${ex.fileName ? ` (${ex.fileName})` : ""}\n`;
            markdown += `  ${ex.excerpt}\n\n`;
          }
        }
      }

      if (keyDates.length > 0) {
        markdown += `## Key Dates\n\n`;
        for (const entry of keyDates) {
          const formattedDate = new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          markdown += `### ${formattedDate} - ${entry.label}\n\n`;
          for (const src of entry.sources) {
            markdown += `- **${src.title}**: ${src.excerpt}\n\n`;
          }
        }
      }

      if (conflictsAndGaps.length > 0) {
        markdown += `## Conflicts & Gaps\n\n`;
        for (const item of sortByImportance(conflictsAndGaps).slice(0, 10)) {
          markdown += `- **${item.title}**: ${item.excerpt}\n\n`;
        }
      }

      markdown += `---\n\n`;
      markdown += `## Sources Appendix\n\n`;
      markdown += `| Type | ID | Title |\n`;
      markdown += `|------|-----|-------|\n`;
      
      const allExamples = [
        ...themes.flatMap(t => t.examples),
        ...patterns.flatMap(p => p.examples),
        ...keyDates.flatMap(d => d.sources),
        ...conflictsAndGaps,
      ];
      const seenIds = new Set<string>();
      for (const ex of allExamples) {
        if (seenIds.has(ex.sourceId)) continue;
        seenIds.add(ex.sourceId);
        markdown += `| ${ex.sourceType} | ${ex.sourceId.slice(0, 8)}... | ${ex.title.replace(/\|/g, "\\|")} |\n`;
      }

      const archiver = require("archiver");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="PatternAnalysis_${caseRecord.title.replace(/[^a-zA-Z0-9]/g, "_")}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (err: Error) => {
        console.error("Archive error:", err);
        res.status(500).json({ error: "Failed to create export" });
      });
      archive.pipe(res);
      archive.append(markdown, { name: "PatternAnalysisSummary.md" });
      await archive.finalize();
      
      await triggerCaseMemoryRebuild(userId, caseId, "export_pattern_analysis", {});
    } catch (error) {
      console.error("Export pattern analysis error:", error);
      res.status(500).json({ error: "Failed to export pattern analysis" });
    }
  });

  app.get("/api/cases/:caseId/anchors", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const anchors = await storage.listEvidenceAnchors(userId, caseId);
      res.json({ anchors });
    } catch (error) {
      console.error("List case anchors error:", error);
      res.status(500).json({ error: "Failed to list anchors" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/extraction", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      res.json({ extraction });
    } catch (error) {
      console.error("Get evidence extraction error:", error);
      res.status(500).json({ error: "Failed to get extraction" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/extraction", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const evidenceFile = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidenceFile) {
        return res.status(404).json({ error: "Evidence file not found" });
      }
      
      const { insertEvidenceExtractionSchema } = await import("@shared/schema");
      const parsed = insertEvidenceExtractionSchema.safeParse({ 
        evidenceId, 
        provider: req.body.provider || "internal",
        mimeType: evidenceFile.mimeType 
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const extraction = await storage.createEvidenceExtraction(userId, caseId, parsed.data);
      res.status(201).json({ extraction });
    } catch (error) {
      console.error("Create evidence extraction error:", error);
      res.status(500).json({ error: "Failed to create extraction" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/notes-full", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const notes = await storage.listEvidenceNotesFull(userId, caseId, evidenceId);
      res.json({ notes });
    } catch (error) {
      console.error("List evidence notes error:", error);
      res.status(500).json({ error: "Failed to list notes" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/notes-full", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertEvidenceNoteFullSchema } = await import("@shared/schema");
      const parsed = insertEvidenceNoteFullSchema.safeParse({ ...req.body, evidenceId });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const note = await storage.createEvidenceNoteFull(userId, caseId, parsed.data);
      res.status(201).json({ note });
    } catch (error) {
      console.error("Create evidence note error:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes-full/:noteId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { noteId } = req.params;
      
      const { updateEvidenceNoteFullSchema } = await import("@shared/schema");
      const parsed = updateEvidenceNoteFullSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const note = await storage.updateEvidenceNoteFull(userId, noteId, parsed.data);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json({ note });
    } catch (error) {
      console.error("Update evidence note error:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes-full/:noteId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { noteId } = req.params;
      
      const deleted = await storage.deleteEvidenceNoteFull(userId, noteId);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete evidence note error:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const analyses = await storage.listEvidenceAiAnalyses(userId, caseId, evidenceId);
      res.json({ analyses });
    } catch (error) {
      console.error("List AI analyses error:", error);
      res.status(500).json({ error: "Failed to list analyses" });
    }
  });

  app.post("/api/cases/:caseId/evidence/:evidenceId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertEvidenceAiAnalysisSchema } = await import("@shared/schema");
      const parsed = insertEvidenceAiAnalysisSchema.safeParse({ ...req.body, evidenceId });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const analysis = await storage.createEvidenceAiAnalysis(userId, caseId, parsed.data);
      res.status(201).json({ analysis });
    } catch (error) {
      console.error("Create AI analysis error:", error);
      res.status(500).json({ error: "Failed to create analysis" });
    }
  });

  app.get("/api/cases/:caseId/ai-analyses", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const analyses = await storage.listEvidenceAiAnalyses(userId, caseId);
      res.json({ analyses });
    } catch (error) {
      console.error("List all AI analyses error:", error);
      res.status(500).json({ error: "Failed to list analyses" });
    }
  });

  app.get("/api/cases/:caseId/ai/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const evidence = await storage.listEvidence(userId, caseId);
      const analyses = await storage.listEvidenceAiAnalyses(userId, caseId);
      
      const analysisStatusByEvidence: Record<string, { status: string; error?: string }> = {};
      for (const analysis of analyses) {
        analysisStatusByEvidence[analysis.evidenceId] = {
          status: analysis.status,
          error: analysis.errorMessage || undefined,
        };
      }
      
      let running = 0;
      let pending = 0;
      let completed = 0;
      let failed = 0;
      
      for (const e of evidence) {
        const analysis = analysisStatusByEvidence[e.id];
        if (!analysis) {
          pending += 1;
        } else if (analysis.status === "running" || analysis.status === "pending") {
          running += 1;
        } else if (analysis.status === "completed") {
          completed += 1;
        } else if (analysis.status === "failed") {
          failed += 1;
        }
      }
      
      const overallStatus = running > 0 ? "running" : pending > 0 ? "pending" : failed > 0 && completed === 0 ? "failed" : "idle";
      
      res.json({
        overallStatus,
        counts: { running, pending, completed, failed, total: evidence.length },
        evidenceStatus: analysisStatusByEvidence,
      });
    } catch (error) {
      console.error("AI status error:", error);
      res.status(500).json({ error: "Failed to get AI status" });
    }
  });

  app.patch("/api/evidence-ai-analyses/:analysisId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { analysisId } = req.params;
      
      const { updateEvidenceAiAnalysisSchema } = await import("@shared/schema");
      const parsed = updateEvidenceAiAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const updated = await storage.updateEvidenceAiAnalysis(userId, analysisId, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      res.json({ analysis: updated });
    } catch (error) {
      console.error("Update AI analysis error:", error);
      res.status(500).json({ error: "Failed to update analysis" });
    }
  });

  app.delete("/api/evidence-ai-analyses/:analysisId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { analysisId } = req.params;
      
      const deleted = await storage.deleteEvidenceAiAnalysis(userId, analysisId);
      if (!deleted) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete AI analysis error:", error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  const analysisLimiter = createLimiter(2);
  app.post("/api/cases/:caseId/evidence/:evidenceId/ai-analyses/run", requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const { caseId, evidenceId } = req.params;
    const refresh = req.body.refresh === true;
    
    try {
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const evidence = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidence || evidence.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence not found" });
      }
      
      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      if (!extraction || extraction.status !== "complete") {
        return res.status(409).json({ 
          error: "Run text extraction first.", 
          code: "EXTRACTION_NOT_COMPLETE",
          extractionStatus: extraction?.status || "not_started"
        });
      }
      
      if (!extraction.extractedText || extraction.extractedText.trim().length === 0) {
        return res.status(400).json({ error: "No extracted text available for analysis" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: "AI analysis unavailable - OPENAI_API_KEY not configured" });
      }
      
      const existingAnalyses = await storage.listEvidenceAiAnalyses(userId, caseId, evidenceId);
      const existingProcessing = existingAnalyses.find(a => a.status === "processing");
      if (existingProcessing && !refresh) {
        return res.status(409).json({ error: "Analysis already in progress", analysisId: existingProcessing.id });
      }
      
      const existingSummary = existingAnalyses.find(a => a.analysisType === "summary_findings" && a.status === "complete");
      if (existingSummary && !refresh) {
        return res.status(409).json({ error: "Analysis already exists", analysisId: existingSummary.id });
      }
      
      const analysis = await storage.createEvidenceAiAnalysis(userId, caseId, {
        evidenceId,
        analysisType: "summary_findings",
        content: "",
        status: "processing",
        model: "gpt-4o",
      });
      
      console.log(`[AI_ANALYSIS] start { caseId: ${caseId}, evidenceId: ${evidenceId}, analysisId: ${analysis.id} }`);
      res.status(202).json({ analysis, message: "Analysis started" });
      
      analysisLimiter(async () => {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const textToAnalyze = extraction.extractedText!.slice(0, 15000);
          
          const systemPrompt = `You are a legal document analysis assistant for family court cases. Analyze the provided document text and extract key information. Be factual and objective. Do not provide legal advice.

Return a JSON object with this structure:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "keyFacts": ["Fact 1", "Fact 2", ...],
  "potentialIssues": ["Issue 1", ...],
  "datesAndDeadlinesMentioned": ["Date/deadline 1", ...],
  "namesAndRoles": ["Name - Role", ...],
  "exhibitCandidates": ["Description of what could be an exhibit", ...],
  "trialBinderCandidates": ["Description of trial-relevant content", ...],
  "confidenceNotes": ["Any caveats about extraction quality or missing info"]
}`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Analyze this document:\n\n${textToAnalyze}` }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          });
          
          const responseText = completion.choices[0]?.message?.content || "{}";
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = { summary: responseText, error: "Failed to parse structured response" };
          }
          
          await storage.updateEvidenceAiAnalysis(userId, analysis.id, {
            status: "complete",
            summary: typeof parsed.summary === "string" ? parsed.summary : "Analysis complete",
            findings: parsed,
            content: responseText,
          });
          
          await triggerCaseMemoryRebuild(userId, caseId, "evidence_ai_analysis_complete", {
            evidenceId,
            analysisId: analysis.id,
            model: "gpt-4o",
          });
          
          console.log(`[AI_ANALYSIS] complete { analysisId: ${analysis.id} }`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          const code = (error as any)?.code || "ANALYSIS_ERROR";
          console.error(`[AI_ANALYSIS] failed { analysisId: ${analysis.id}, code: ${code}, message: ${errorMsg} }`);
          await storage.updateEvidenceAiAnalysis(userId, analysis.id, {
            status: "failed",
            error: errorMsg.slice(0, 500),
          });
          
          await triggerCaseMemoryRebuild(userId, caseId, "evidence_ai_analysis_failed", {
            evidenceId,
            analysisId: analysis.id,
            error: errorMsg.slice(0, 200),
          });
        }
      });
    } catch (error) {
      console.error("Run AI analysis error:", error);
      res.status(500).json({ error: "Failed to start analysis" });
    }
  });

  const claimSuggestionLimiter = createLimiter(2);
  app.post("/api/cases/:caseId/evidence/:evidenceId/claims/suggest", requireAuth, async (req, res) => {
    const userId = req.session.userId as string;
    const { caseId, evidenceId } = req.params;
    const refresh = req.body.refresh === true;
    const limit = typeof req.body.limit === "number" ? Math.min(req.body.limit, 20) : 10;
    
    try {
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const evidence = await storage.getEvidenceFile(evidenceId, userId);
      if (!evidence || evidence.caseId !== caseId) {
        return res.status(404).json({ error: "Evidence not found" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(502).json({ error: "Lexi cannot authenticate to OpenAI." });
      }
      
      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      const notes = await storage.listEvidenceNotesFull(userId, caseId, evidenceId);
      
      let inputText = "";
      if (extraction?.status === "complete" && extraction.extractedText?.trim()) {
        inputText = extraction.extractedText.slice(0, 20000);
      } else if (notes.length > 0) {
        inputText = notes
          .map(n => `[Note: ${n.noteTitle || "Untitled"}]\n${n.noteText || ""}`)
          .join("\n\n")
          .slice(0, 20000);
      }
      
      if (!inputText.trim()) {
        return res.status(409).json({ 
          error: "Extraction not ready.", 
          code: "EXTRACTION_NOT_COMPLETE" 
        });
      }
      
      const existingClaims = await storage.listCaseClaims(userId, caseId);
      if (!refresh && existingClaims.some(c => c.createdFrom === "ai_suggested" && c.status === "suggested")) {
        const suggestedForEvidence = existingClaims.filter(c => 
          c.createdFrom === "ai_suggested" && c.status === "suggested"
        );
        return res.status(200).json({ 
          ok: true, 
          created: 0, 
          skipped: 0, 
          message: "Suggested claims already exist. Use refresh=true to suggest more.",
          existingCount: suggestedForEvidence.length
        });
      }
      
      const normalizedExisting = new Set(
        existingClaims
          .filter(c => c.status === "suggested" || c.status === "accepted")
          .map(c => c.claimText.toLowerCase().trim().replace(/\s+/g, " "))
      );
      
      res.status(202).json({ ok: true, message: "Generating claim suggestions..." });
      
      claimSuggestionLimiter(async () => {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          
          const systemPrompt = `You are a legal document analyst extracting factual claims from evidence. Your job is to identify NEUTRAL, FACTUAL statements that can be verified from the text.

RULES:
- Claims must be neutral factual statements only
- DO NOT infer dates, motives, diagnoses, or intent
- If date/location is unclear, set missingInfoFlag=true and do NOT invent
- citation.quote must be a short direct excerpt present in the text
- Keep claims objective and traceable

Return ONLY valid JSON (no markdown) as an array of objects:
[
  {
    "claimText": "Factual statement here",
    "claimType": "fact"|"procedural"|"context"|"communication"|"financial"|"medical"|"school"|"custody",
    "tags": ["relevant", "tags"],
    "missingInfoFlag": false,
    "citation": {
      "quote": "exact short quote from text",
      "pageNumber": null,
      "timestampSeconds": null,
      "startOffset": null,
      "endOffset": null
    }
  }
]

Limit to ${limit} most important claims.`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Extract factual claims from this evidence:\n\n${inputText}` }
            ],
            temperature: 0.2,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          });
          
          const responseText = completion.choices[0]?.message?.content || "[]";
          let suggestions: Array<{
            claimText: string;
            claimType: string;
            tags: string[];
            missingInfoFlag: boolean;
            citation: {
              quote: string;
              pageNumber: number | null;
              timestampSeconds: number | null;
              startOffset: number | null;
              endOffset: number | null;
            };
          }> = [];
          
          try {
            const parsed = JSON.parse(responseText);
            suggestions = Array.isArray(parsed) ? parsed : (parsed.claims || parsed.suggestions || []);
          } catch {
            console.error("[CLAIM_SUGGEST] Failed to parse OpenAI response");
            return;
          }
          
          let created = 0;
          let skipped = 0;
          
          for (const sug of suggestions.slice(0, limit)) {
            if (!sug.claimText?.trim()) {
              skipped++;
              continue;
            }
            
            const normalized = sug.claimText.toLowerCase().trim().replace(/\s+/g, " ");
            if (normalizedExisting.has(normalized)) {
              skipped++;
              continue;
            }
            normalizedExisting.add(normalized);
            
            const citationPointer = await storage.createCitationPointer(userId, caseId, {
              evidenceFileId: evidenceId,
              quote: sug.citation?.quote?.slice(0, 500) || "",
              pageNumber: sug.citation?.pageNumber ?? null,
              timestampSeconds: sug.citation?.timestampSeconds ?? null,
              startOffset: sug.citation?.startOffset ?? null,
              endOffset: sug.citation?.endOffset ?? null,
              excerpt: sug.citation?.quote?.slice(0, 200) || null,
              confidence: 0.8,
            });
            
            const validTypes = ["fact", "procedural", "context", "communication", "financial", "medical", "school", "custody"];
            const claimType = validTypes.includes(sug.claimType) ? sug.claimType as any : "fact";
            
            const claim = await storage.createCaseClaim(userId, caseId, {
              claimText: sug.claimText.trim(),
              claimType,
              tags: Array.isArray(sug.tags) ? sug.tags : [],
              missingInfoFlag: sug.missingInfoFlag === true,
              createdFrom: "ai_suggested",
              status: "suggested",
            });
            
            await storage.attachClaimCitation(userId, claim.id, citationPointer.id);
            created++;
          }
          
          console.log(`[CLAIM_SUGGEST] complete { caseId: ${caseId}, evidenceId: ${evidenceId}, created: ${created}, skipped: ${skipped} }`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`[CLAIM_SUGGEST] failed { caseId: ${caseId}, evidenceId: ${evidenceId}, error: ${errorMsg} }`);
        }
      });
    } catch (error) {
      console.error("Suggest claims error:", error);
      res.status(500).json({ error: "Failed to suggest claims" });
    }
  });

  app.get("/api/cases/:caseId/exhibit-snippets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const exhibitListId = req.query.exhibitListId as string | undefined;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const snippets = await storage.listExhibitSnippets(userId, caseId, exhibitListId);
      res.json({ snippets });
    } catch (error) {
      console.error("List exhibit snippets error:", error);
      res.status(500).json({ error: "Failed to list snippets" });
    }
  });

  app.post("/api/cases/:caseId/exhibit-snippets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertExhibitSnippetSchema } = await import("@shared/schema");
      const parsed = insertExhibitSnippetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const snippet = await storage.createExhibitSnippet(userId, caseId, parsed.data);
      res.status(201).json({ snippet });
    } catch (error) {
      console.error("Create exhibit snippet error:", error);
      res.status(500).json({ error: "Failed to create snippet" });
    }
  });

  app.patch("/api/exhibit-snippets/:snippetId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { snippetId } = req.params;
      
      const { updateExhibitSnippetSchema } = await import("@shared/schema");
      const parsed = updateExhibitSnippetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const updated = await storage.updateExhibitSnippet(userId, snippetId, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Snippet not found" });
      }
      
      res.json({ snippet: updated });
    } catch (error) {
      console.error("Update exhibit snippet error:", error);
      res.status(500).json({ error: "Failed to update snippet" });
    }
  });

  app.delete("/api/exhibit-snippets/:snippetId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { snippetId } = req.params;
      
      const deleted = await storage.deleteExhibitSnippet(userId, snippetId);
      if (!deleted) {
        return res.status(404).json({ error: "Snippet not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exhibit snippet error:", error);
      res.status(500).json({ error: "Failed to delete snippet" });
    }
  });

  app.get("/api/cases/:caseId/trial-prep-shortlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const items = await storage.listTrialPrepShortlist(userId, caseId);
      res.json({ items });
    } catch (error) {
      console.error("List trial prep shortlist error:", error);
      res.status(500).json({ error: "Failed to list shortlist" });
    }
  });

  app.post("/api/cases/:caseId/trial-prep-shortlist", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertTrialPrepShortlistSchema } = await import("@shared/schema");
      const parsed = insertTrialPrepShortlistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const item = await storage.createTrialPrepShortlistItem(userId, caseId, parsed.data);
      
      await triggerCaseMemoryRebuild(userId, caseId, "trial_prep_created", {
        itemId: item.id,
        title: item.title,
      });
      
      res.status(201).json({ item });
    } catch (error: unknown) {
      const err = error as { code?: string; constraint?: string };
      if (err.code === "23505" || (err.constraint && err.constraint.includes("unique"))) {
        return res.status(409).json({ ok: false, error: "duplicate" });
      }
      console.error("Create trial prep shortlist item error:", error);
      res.status(500).json({ error: "Failed to create shortlist item" });
    }
  });

  app.patch("/api/trial-prep-shortlist/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      
      const { updateTrialPrepShortlistSchema } = await import("@shared/schema");
      const parsed = updateTrialPrepShortlistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const existing = await storage.getTrialPrepShortlistItem(userId, itemId);
      const wasPinned = existing?.isPinned ?? false;
      
      const updated = await storage.updateTrialPrepShortlistItem(userId, itemId, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (updated.caseId) {
        const nowPinned = updated.isPinned ?? false;
        let reason = "trial_prep_updated";
        if (!wasPinned && nowPinned) {
          reason = "trial_prep_pinned";
        } else if (wasPinned && !nowPinned) {
          reason = "trial_prep_unpinned";
        }
        
        await triggerCaseMemoryRebuild(userId, updated.caseId, reason, {
          itemId: updated.id,
          title: updated.title,
        });
      }
      
      res.json({ item: updated });
    } catch (error) {
      console.error("Update trial prep shortlist item error:", error);
      res.status(500).json({ error: "Failed to update shortlist item" });
    }
  });

  app.delete("/api/trial-prep-shortlist/:itemId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { itemId } = req.params;
      
      const existing = await storage.getTrialPrepShortlistItem(userId, itemId);
      
      const deleted = await storage.deleteTrialPrepShortlistItem(userId, itemId);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (existing?.caseId) {
        await triggerCaseMemoryRebuild(userId, existing.caseId, "trial_prep_deleted", {
          itemId,
          title: existing.title,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete trial prep shortlist item error:", error);
      res.status(500).json({ error: "Failed to delete shortlist item" });
    }
  });

  app.post("/api/cases/:caseId/citations", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertCitationPointerSchema } = await import("@shared/schema");
      const parsed = insertCitationPointerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const citation = await storage.createCitationPointer(userId, caseId, parsed.data);
      res.status(201).json({ citation });
    } catch (error) {
      console.error("Create citation pointer error:", error);
      res.status(500).json({ error: "Failed to create citation" });
    }
  });

  app.get("/api/cases/:caseId/evidence/:evidenceId/citations", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, evidenceId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const citations = await storage.listCitationPointersByEvidence(userId, caseId, evidenceId);
      res.json({ citations });
    } catch (error) {
      console.error("List citations error:", error);
      res.status(500).json({ error: "Failed to list citations" });
    }
  });

  app.get("/api/cases/:caseId/claims", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      const { status, evidenceFileId } = req.query;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const filters: { status?: "suggested" | "accepted" | "rejected"; evidenceFileId?: string } = {};
      if (status && ["suggested", "accepted", "rejected"].includes(status as string)) {
        filters.status = status as "suggested" | "accepted" | "rejected";
      }
      if (evidenceFileId && typeof evidenceFileId === "string") {
        filters.evidenceFileId = evidenceFileId;
      }
      
      const claims = await storage.listCaseClaims(userId, caseId, filters);
      res.json({ claims });
    } catch (error) {
      console.error("List claims error:", error);
      res.status(500).json({ error: "Failed to list claims" });
    }
  });

  app.get("/api/cases/:caseId/draft-readiness", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const allClaims = await storage.listCaseClaims(userId, caseId, {});
      const acceptedClaims = allClaims.filter(c => c.status === "accepted");
      const suggestedClaims = allClaims.filter(c => c.status === "suggested");
      const rejectedClaims = allClaims.filter(c => c.status === "rejected");
      const withMissingInfo = allClaims.filter(c => c.missingInfoFlag);
      
      const evidenceFiles = await storage.listEvidenceFiles(userId, caseId);
      const evidenceWithClaims = new Set(allClaims.map(c => c.primaryEvidenceId).filter(Boolean));
      const evidenceWithExtraction = evidenceFiles.filter(e => e.extractionStatus === "complete");
      
      const readinessScore = Math.min(100, Math.round(
        (acceptedClaims.length * 10) + 
        (evidenceWithExtraction.length * 5) - 
        (suggestedClaims.length * 2) - 
        (withMissingInfo.length * 3)
      ));
      
      res.json({
        stats: {
          totalClaims: allClaims.length,
          acceptedClaims: acceptedClaims.length,
          suggestedClaims: suggestedClaims.length,
          rejectedClaims: rejectedClaims.length,
          claimsWithMissingInfo: withMissingInfo.length,
          totalEvidence: evidenceFiles.length,
          evidenceWithExtraction: evidenceWithExtraction.length,
          evidenceWithClaims: evidenceWithClaims.size,
          readinessScore: Math.max(0, readinessScore),
        },
      });
    } catch (error) {
      console.error("Draft readiness error:", error);
      res.status(500).json({ error: "Failed to get draft readiness" });
    }
  });

  app.post("/api/cases/:caseId/claims", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertCaseClaimSchema } = await import("@shared/schema");
      const parsed = insertCaseClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const claim = await storage.createCaseClaim(userId, caseId, parsed.data);
      res.status(201).json({ claim });
    } catch (error) {
      console.error("Create claim error:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  app.get("/api/claims/:claimId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId } = req.params;
      
      const claim = await storage.getCaseClaim(userId, claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const citations = await storage.listClaimCitations(userId, claimId);
      res.json({ claim, citations });
    } catch (error) {
      console.error("Get claim error:", error);
      res.status(500).json({ error: "Failed to get claim" });
    }
  });

  app.patch("/api/claims/:claimId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId } = req.params;
      
      const { updateCaseClaimSchema } = await import("@shared/schema");
      const parsed = updateCaseClaimSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const existingClaim = await storage.getCaseClaim(userId, claimId);
      const updated = await storage.updateCaseClaim(userId, claimId, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (parsed.data.status && parsed.data.status !== existingClaim?.status && updated.caseId) {
        const eventType = parsed.data.status === "accepted" ? "claim_accept" : parsed.data.status === "rejected" ? "claim_reject" : null;
        if (eventType) {
          await storage.createLexiFeedbackEvent(userId, updated.caseId, eventType, {
            claimId: updated.id,
            claimText: updated.claimText.slice(0, 100),
            previousStatus: existingClaim?.status,
          });
        }
        
        if (parsed.data.status === "accepted" || parsed.data.status === "rejected") {
          const caseIdNum = parseInt(updated.caseId, 10);
          if (!isNaN(caseIdNum)) {
            scheduleMemoryRebuild(caseIdNum, () => rebuildCaseMemory(userId, updated.caseId));
          }
        }
      }
      
      res.json({ claim: updated });
    } catch (error) {
      console.error("Update claim error:", error);
      res.status(500).json({ error: "Failed to update claim" });
    }
  });

  app.delete("/api/claims/:claimId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId } = req.params;
      
      const deleted = await storage.deleteCaseClaim(userId, claimId);
      if (!deleted) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete claim error:", error);
      res.status(500).json({ error: "Failed to delete claim" });
    }
  });

  app.post("/api/claims/:claimId/citations/:citationId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId, citationId } = req.params;
      
      const attached = await storage.attachClaimCitation(userId, claimId, citationId);
      if (!attached) {
        return res.status(404).json({ error: "Claim or citation not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Attach citation error:", error);
      res.status(500).json({ error: "Failed to attach citation" });
    }
  });

  app.delete("/api/claims/:claimId/citations/:citationId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId, citationId } = req.params;
      
      const detached = await storage.detachClaimCitation(userId, claimId, citationId);
      if (!detached) {
        return res.status(404).json({ error: "Link not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Detach citation error:", error);
      res.status(500).json({ error: "Failed to detach citation" });
    }
  });

  app.post("/api/claims/:claimId/citations/auto", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { claimId } = req.params;
      const { maxAttach, preferEvidenceId } = req.body || {};
      
      const claim = await storage.getCaseClaim(userId, claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const result = await storage.autoAttachClaimCitation(userId, claimId, {
        maxAttach: typeof maxAttach === "number" ? Math.min(maxAttach, 5) : 1,
        preferEvidenceId: typeof preferEvidenceId === "string" ? preferEvidenceId : undefined,
      });
      
      if (result.attached === 0 && result.citationIds.length === 0) {
        const existingCitations = await storage.listClaimCitations(userId, claimId);
        if (existingCitations.length > 0) {
          return res.json({ ok: true, attached: 0, citationIds: [], message: "Claim already has citations" });
        }
        return res.json({ ok: false, error: "no_citations_available" });
      }
      
      res.json({ ok: true, attached: result.attached, citationIds: result.citationIds });
    } catch (error) {
      console.error("Auto-attach citation error:", error);
      res.status(500).json({ error: "Failed to auto-attach citation" });
    }
  });

  app.get("/api/cases/:caseId/issues", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const issues = await storage.listIssueGroupings(userId, caseId);
      res.json({ issues });
    } catch (error) {
      console.error("List issues error:", error);
      res.status(500).json({ error: "Failed to list issues" });
    }
  });

  app.post("/api/cases/:caseId/issues", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const { insertIssueGroupingSchema } = await import("@shared/schema");
      const parsed = insertIssueGroupingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const issue = await storage.createIssueGrouping(userId, caseId, parsed.data);
      res.status(201).json({ issue });
    } catch (error) {
      console.error("Create issue error:", error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  app.get("/api/issues/:issueId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { issueId } = req.params;
      
      const issue = await storage.getIssueGrouping(userId, issueId);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      const claims = await storage.listIssueClaims(userId, issueId);
      res.json({ issue, claims });
    } catch (error) {
      console.error("Get issue error:", error);
      res.status(500).json({ error: "Failed to get issue" });
    }
  });

  app.patch("/api/issues/:issueId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { issueId } = req.params;
      
      const { updateIssueGroupingSchema } = await import("@shared/schema");
      const parsed = updateIssueGroupingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      
      const updated = await storage.updateIssueGrouping(userId, issueId, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      res.json({ issue: updated });
    } catch (error) {
      console.error("Update issue error:", error);
      res.status(500).json({ error: "Failed to update issue" });
    }
  });

  app.delete("/api/issues/:issueId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { issueId } = req.params;
      
      const deleted = await storage.deleteIssueGrouping(userId, issueId);
      if (!deleted) {
        return res.status(404).json({ error: "Issue not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete issue error:", error);
      res.status(500).json({ error: "Failed to delete issue" });
    }
  });

  app.post("/api/issues/:issueId/claims/:claimId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { issueId, claimId } = req.params;
      
      const added = await storage.addClaimToIssue(userId, issueId, claimId);
      if (!added) {
        return res.status(404).json({ error: "Issue or claim not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Add claim to issue error:", error);
      res.status(500).json({ error: "Failed to add claim to issue" });
    }
  });

  app.delete("/api/issues/:issueId/claims/:claimId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { issueId, claimId } = req.params;
      
      const removed = await storage.removeClaimFromIssue(userId, issueId, claimId);
      if (!removed) {
        return res.status(404).json({ error: "Link not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Remove claim from issue error:", error);
      res.status(500).json({ error: "Failed to remove claim from issue" });
    }
  });

  // Phase 3A: Cross-Module Links - Timeline Event Links
  app.get("/api/cases/:caseId/timeline/events/:eventId/links", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, eventId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const event = await storage.getTimelineEvent(eventId, userId);
      if (!event || event.caseId !== caseId) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const links = await storage.listTimelineEventLinks(userId, caseId, eventId);
      
      const hydratedLinks = await Promise.all(links.map(async (link) => {
        const base = {
          linkId: link.id,
          linkType: link.linkType,
          note: link.note,
          createdAt: link.createdAt,
        };
        
        if (link.linkType === "evidence" && link.evidenceId) {
          const evidence = await storage.getEvidenceFile(link.evidenceId, userId);
          return { ...base, evidence: evidence ? { id: evidence.id, originalName: evidence.originalName } : null };
        }
        if (link.linkType === "claim" && link.claimId) {
          const claim = await storage.getCaseClaim(userId, link.claimId);
          return { ...base, claim: claim ? { id: claim.id, text: claim.claimText, status: claim.status } : null };
        }
        if (link.linkType === "snippet" && link.snippetId) {
          const snippet = await storage.getExhibitSnippet(userId, link.snippetId);
          return { ...base, snippet: snippet ? { id: snippet.id, title: snippet.title } : null };
        }
        return base;
      }));
      
      res.json({ links: hydratedLinks });
    } catch (error) {
      console.error("List timeline event links error:", error);
      res.status(500).json({ error: "Failed to list links" });
    }
  });

  app.post("/api/cases/:caseId/timeline/events/:eventId/links", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, eventId } = req.params;
      const { linkType, evidenceId, claimId, snippetId, note } = req.body;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      if (!linkType || !["evidence", "claim", "snippet"].includes(linkType)) {
        return res.status(400).json({ error: "Invalid linkType" });
      }
      
      const targetCount = [evidenceId, claimId, snippetId].filter(Boolean).length;
      if (targetCount !== 1) {
        return res.status(400).json({ error: "Exactly one of evidenceId, claimId, or snippetId must be provided" });
      }
      
      if (linkType === "evidence" && !evidenceId) {
        return res.status(400).json({ error: "evidenceId required for evidence link" });
      }
      if (linkType === "claim" && !claimId) {
        return res.status(400).json({ error: "claimId required for claim link" });
      }
      if (linkType === "snippet" && !snippetId) {
        return res.status(400).json({ error: "snippetId required for snippet link" });
      }
      
      const link = await storage.createTimelineEventLink(userId, caseId, eventId, {
        linkType,
        evidenceId: evidenceId || null,
        claimId: claimId || null,
        snippetId: snippetId || null,
        note: note || null,
      });
      
      res.json({ link });
    } catch (error: any) {
      console.error("Create timeline event link error:", error);
      if (error.message?.includes("not found") || error.message?.includes("doesn't belong")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create link" });
    }
  });

  app.delete("/api/timeline/event-links/:linkId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { linkId } = req.params;
      
      const deleted = await storage.deleteTimelineEventLink(userId, linkId);
      if (!deleted) {
        return res.status(404).json({ error: "Link not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete timeline event link error:", error);
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  // Phase 3A: Cross-Module Links - Claim Links
  app.get("/api/cases/:caseId/claims/:claimId/links", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, claimId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const claim = await storage.getCaseClaim(userId, claimId);
      if (!claim || claim.caseId !== caseId) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const links = await storage.listClaimLinks(userId, caseId, claimId);
      
      const hydratedLinks = await Promise.all(links.map(async (link) => {
        const base = {
          linkId: link.id,
          linkType: link.linkType,
          createdAt: link.createdAt,
        };
        
        if (link.linkType === "timeline" && link.eventId) {
          const event = await storage.getTimelineEvent(link.eventId, userId);
          return { ...base, event: event ? { id: event.id, title: event.title, eventDate: event.eventDate } : null };
        }
        if (link.linkType === "trial_prep" && link.trialPrepId) {
          const item = await storage.getTrialPrepShortlistItem(userId, link.trialPrepId);
          return { ...base, trialPrepItem: item ? { id: item.id, title: item.title, binderSection: item.binderSection } : null };
        }
        if (link.linkType === "snippet" && link.snippetId) {
          const snippet = await storage.getExhibitSnippet(userId, link.snippetId);
          return { ...base, snippet: snippet ? { id: snippet.id, title: snippet.title } : null };
        }
        return base;
      }));
      
      res.json({ links: hydratedLinks });
    } catch (error) {
      console.error("List claim links error:", error);
      res.status(500).json({ error: "Failed to list links" });
    }
  });

  app.post("/api/cases/:caseId/claims/:claimId/links", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, claimId } = req.params;
      const { linkType, eventId, trialPrepId, snippetId } = req.body;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      if (!linkType || !["timeline", "trial_prep", "snippet"].includes(linkType)) {
        return res.status(400).json({ error: "Invalid linkType" });
      }
      
      const targetCount = [eventId, trialPrepId, snippetId].filter(Boolean).length;
      if (targetCount !== 1) {
        return res.status(400).json({ error: "Exactly one of eventId, trialPrepId, or snippetId must be provided" });
      }
      
      if (linkType === "timeline" && !eventId) {
        return res.status(400).json({ error: "eventId required for timeline link" });
      }
      if (linkType === "trial_prep" && !trialPrepId) {
        return res.status(400).json({ error: "trialPrepId required for trial_prep link" });
      }
      if (linkType === "snippet" && !snippetId) {
        return res.status(400).json({ error: "snippetId required for snippet link" });
      }
      
      const link = await storage.createClaimLink(userId, caseId, claimId, {
        linkType,
        eventId: eventId || null,
        trialPrepId: trialPrepId || null,
        snippetId: snippetId || null,
      });
      
      res.json({ link });
    } catch (error: any) {
      console.error("Create claim link error:", error);
      if (error.message?.includes("not found") || error.message?.includes("doesn't belong")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create link" });
    }
  });

  app.delete("/api/claim-links/:linkId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { linkId } = req.params;
      
      const deleted = await storage.deleteClaimLink(userId, linkId);
      if (!deleted) {
        return res.status(404).json({ error: "Link not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete claim link error:", error);
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  app.get("/api/cases/:caseId/draft-readiness", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const stats = await storage.getCaseDraftReadiness(userId, caseId);
      res.json({ stats });
    } catch (error) {
      console.error("Get draft readiness error:", error);
      res.status(500).json({ error: "Failed to get draft readiness" });
    }
  });

  app.get("/api/cases/:caseId/trial-prep/export", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }

      const items = await storage.listTrialPrepShortlist(userId, caseId);
      
      const { binderSectionValues } = await import("@shared/schema");
      
      const groupedItems: Record<string, typeof items> = {};
      for (const section of binderSectionValues) {
        const sectionItems = items.filter(i => i.binderSection === section);
        const pinned = sectionItems.filter(i => i.isPinned).sort((a, b) => b.importance - a.importance);
        const unpinned = sectionItems.filter(i => !i.isPinned).sort((a, b) => b.importance - a.importance);
        groupedItems[section] = [...pinned, ...unpinned];
      }

      function getTop3(sectionItems: typeof items) {
        const sorted = [...sectionItems].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          if (a.importance !== b.importance) return b.importance - a.importance;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return sorted.slice(0, 3);
      }

      function formatItem(item: typeof items[0]): string {
        const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";
        let text = `Title: ${item.title}\n`;
        if (item.summary) text += `Summary: ${item.summary}\n`;
        text += `Source Type: ${item.sourceType}\n`;
        text += `Source Reference: ${item.sourceType}:${item.sourceId}\n`;
        if (tags) text += `Tags: ${tags}\n`;
        text += `Importance: ${item.importance}/5\n`;
        if (item.isPinned) text += `Status: PINNED\n`;
        return text;
      }

      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      const PassThrough = (await import("stream")).PassThrough;
      const passThrough = new PassThrough();

      passThrough.on("data", (chunk) => chunks.push(chunk));

      const archiveComplete = new Promise<Buffer>((resolve, reject) => {
        passThrough.on("end", () => resolve(Buffer.concat(chunks)));
        passThrough.on("error", reject);
        archive.on("error", reject);
      });

      archive.pipe(passThrough);

      const readme = `TRIAL BINDER EXPORT
==================

Case: ${caseRecord.nickname || caseRecord.title}
Exported: ${new Date().toLocaleString()}
Total Items: ${items.length}

IMPORTANT NOTES:
- This binder is for organizational purposes only.
- Always verify information against original documents.
- This export contains references to evidence items, not the original files.
- Consider printing relevant evidence files separately.

STRUCTURE:
Each folder represents a binder section.
- 00_TOP3.txt contains your top 3 strongest examples for that section.
- 01_ALL_ITEMS.txt contains all items in that section.

Top 3 selection criteria:
1. Pinned items first
2. Then by importance rating (highest first)
3. Then by date added (newest first)
`;

      archive.append(readme, { name: "00_README.txt" });

      let folderIndex = 1;
      for (const section of binderSectionValues) {
        const sectionItems = groupedItems[section] || [];
        if (sectionItems.length === 0) continue;

        const folderName = `${String(folderIndex).padStart(2, "0")}_${section.replace(/[\/\\:*?"<>|&]/g, "_")}`;
        
        const top3 = getTop3(sectionItems);
        let top3Content = `TOP 3 FOR: ${section}\n${"=".repeat(50)}\n\n`;
        if (top3.length === 0) {
          top3Content += "(No items in this section)\n";
        } else {
          top3.forEach((item, idx) => {
            top3Content += `--- ${idx + 1}. ---\n${formatItem(item)}\n`;
          });
        }
        archive.append(top3Content, { name: `${folderName}/00_TOP3.txt` });

        let allContent = `ALL ITEMS IN: ${section}\n${"=".repeat(50)}\n\n`;
        if (sectionItems.length === 0) {
          allContent += "(No items)\n";
        } else {
          sectionItems.forEach((item, idx) => {
            allContent += `--- Item ${idx + 1} ---\n${formatItem(item)}\n`;
          });
        }
        archive.append(allContent, { name: `${folderName}/01_ALL_ITEMS.txt` });

        folderIndex++;
      }

      await archive.finalize();
      const zipBuffer = await archiveComplete;
      
      await triggerCaseMemoryRebuild(userId, caseId, "export_trial_prep_binder", {
        itemCount: items.length,
      });

      const fileName = `trial-binder-${caseRecord.nickname || caseRecord.id}-${Date.now()}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", zipBuffer.length);
      res.send(zipBuffer);
    } catch (error) {
      console.error("Trial prep export error:", error);
      res.status(500).json({ error: "Failed to export trial binder" });
    }
  });

  // Phase 2F: Case Facts CRUD
  app.get("/api/cases/:caseId/facts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const parsed = listCaseFactsSchema.safeParse(req.query);
      const filters = parsed.success ? parsed.data : {};
      const facts = await storage.listCaseFacts(userId, caseId, filters);
      res.json({ facts });
    } catch (error) {
      console.error("List facts error:", error);
      res.status(500).json({ error: "Failed to list facts" });
    }
  });

  app.post("/api/cases/:caseId/facts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const parsed = insertCaseFactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid fact data", details: parsed.error.flatten() });
      }
      const fact = await storage.createCaseFact(userId, caseId, parsed.data);
      res.status(201).json({ fact });
    } catch (error) {
      console.error("Create fact error:", error);
      res.status(500).json({ error: "Failed to create fact" });
    }
  });

  app.patch("/api/facts/:factId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { factId } = req.params;
      const existing = await storage.getCaseFact(userId, factId);
      if (!existing) {
        return res.status(404).json({ error: "Fact not found" });
      }
      const parsed = updateCaseFactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten() });
      }
      const updated = await storage.updateCaseFact(userId, factId, parsed.data);
      res.json({ fact: updated });
    } catch (error) {
      console.error("Update fact error:", error);
      res.status(500).json({ error: "Failed to update fact" });
    }
  });

  app.delete("/api/facts/:factId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { factId } = req.params;
      const existing = await storage.getCaseFact(userId, factId);
      if (!existing) {
        return res.status(404).json({ error: "Fact not found" });
      }
      await storage.deleteCaseFact(userId, factId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Delete fact error:", error);
      res.status(500).json({ error: "Failed to delete fact" });
    }
  });

  // Phase 2F: Auto-suggest facts from existing data
  app.post("/api/cases/:caseId/facts/suggest", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { caseId } = req.params;
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      const { refresh } = req.body || {};
      
      await storage.createActivityLog(userId, caseId, "facts_suggesting", "Suggesting facts from case data", {});

      const suggestedFacts: Array<{
        key: string;
        value: string | null;
        valueType: string;
        sourceType: string;
        sourceId: string | null;
        citationIds: string[];
        missingInfoFlag: boolean;
      }> = [];

      const claims = await storage.listCaseClaims(userId, caseId);
      const acceptedClaims = claims.filter(c => c.status === "accepted");
      
      for (const claim of acceptedClaims) {
        const citations = await storage.listClaimCitations(userId, claim.id);
        const citationIds = citations.map(c => c.citationId);
        
        let factKey = `claim.${claim.claimType || "general"}`;
        const existingWithKey = suggestedFacts.filter(f => f.key.startsWith(factKey));
        if (existingWithKey.length > 0) {
          factKey = `${factKey}.${existingWithKey.length + 1}`;
        }
        
        suggestedFacts.push({
          key: factKey,
          value: claim.claimText.substring(0, 2000),
          valueType: "text",
          sourceType: "claim",
          sourceId: claim.id,
          citationIds,
          missingInfoFlag: citationIds.length === 0,
        });
      }

      const notes = await storage.listEvidenceNotesFull(userId, caseId);
      for (const note of notes) {
        if (!note.noteText) continue;
        const factKey = `note.${note.id.substring(0, 8)}`;
        suggestedFacts.push({
          key: factKey,
          value: note.noteText.substring(0, 2000),
          valueType: "text",
          sourceType: "note",
          sourceId: note.id,
          citationIds: [],
          missingInfoFlag: true,
        });
      }

      const events = await storage.listTimelineEvents(caseId, userId);
      for (const event of events.slice(0, 20)) {
        const factKey = `timeline.${event.eventDate || event.id.substring(0, 8)}`;
        suggestedFacts.push({
          key: factKey,
          value: event.title || event.notes?.substring(0, 200) || null,
          valueType: event.eventDate ? "date" : "text",
          sourceType: "timeline",
          sourceId: event.id,
          citationIds: [],
          missingInfoFlag: true,
        });
      }

      let createdCount = 0;
      for (const sf of suggestedFacts) {
        const existingFacts = await storage.listCaseFacts(userId, caseId, { prefix: sf.key });
        const alreadyExists = existingFacts.some(f => f.key === sf.key && f.value === sf.value);
        if (alreadyExists && !refresh) continue;

        const fact = await storage.createCaseFact(userId, caseId, {
          key: sf.key,
          value: sf.value,
          valueType: sf.valueType as any,
          status: "suggested",
          sourceType: sf.sourceType as any,
          sourceId: sf.sourceId,
          missingInfoFlag: sf.missingInfoFlag,
        });
        
        for (const citId of sf.citationIds) {
          await storage.attachFactCitation(userId, caseId, fact.id, citId);
        }
        createdCount++;
      }

      await storage.createActivityLog(userId, caseId, "facts_suggested", `Suggested ${createdCount} facts`, { count: createdCount });

      const allFacts = await storage.listCaseFacts(userId, caseId, { status: "suggested" });
      res.json({ ok: true, suggestedCount: createdCount, facts: allFacts });
    } catch (error) {
      console.error("Suggest facts error:", error);
      res.status(500).json({ error: "Failed to suggest facts" });
    }
  });

  // Phase 2F: Fact Citations
  app.get("/api/facts/:factId/citations", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { factId } = req.params;
      const existing = await storage.getCaseFact(userId, factId);
      if (!existing) {
        return res.status(404).json({ error: "Fact not found" });
      }
      const citations = await storage.listFactCitations(userId, factId);
      res.json({ citations });
    } catch (error) {
      console.error("List fact citations error:", error);
      res.status(500).json({ error: "Failed to list citations" });
    }
  });

  app.post("/api/facts/:factId/citations/:citationId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { factId, citationId } = req.params;
      const fact = await storage.getCaseFact(userId, factId);
      if (!fact) {
        return res.status(404).json({ error: "Fact not found" });
      }
      const citation = await storage.attachFactCitation(userId, fact.caseId, factId, citationId);
      res.status(201).json({ citation });
    } catch (error) {
      console.error("Attach citation error:", error);
      res.status(500).json({ error: "Failed to attach citation" });
    }
  });

  app.delete("/api/facts/:factId/citations/:citationId", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { factId, citationId } = req.params;
      const fact = await storage.getCaseFact(userId, factId);
      if (!fact) {
        return res.status(404).json({ error: "Fact not found" });
      }
      await storage.detachFactCitation(userId, factId, citationId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Detach citation error:", error);
      res.status(500).json({ error: "Failed to detach citation" });
    }
  });

  // Phase 2F Task D: Template Auto-Fill - get pre-filled payload from accepted facts
  app.get("/api/cases/:caseId/template-autofill", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user!.id;
      const { caseId } = req.params;
      
      const caseData = await storage.getCase(caseId, userId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const profile = await storage.getUserProfile(userId);
      const acceptedFacts = await storage.listCaseFacts(userId, caseId, { status: "accepted" });
      
      const factMap: Record<string, string | null> = {};
      for (const fact of acceptedFacts) {
        factMap[fact.key] = fact.value;
      }
      
      const today = new Date().toISOString().split("T")[0];
      
      const payload = {
        court: {
          district: factMap["court.district"] || "",
          county: factMap["court.county"] || caseData.county || "",
          state: factMap["court.state"] || caseData.state || "",
        },
        case: {
          caseNumber: factMap["case.number"] || caseData.caseNumber || "",
        },
        parties: {
          petitioner: factMap["party.petitioner"] || profile?.petitionerName || "",
          respondent: factMap["party.respondent"] || profile?.respondentName || "",
        },
        filer: {
          fullName: factMap["filer.name"] || profile?.fullName || "",
          email: factMap["filer.email"] || profile?.email || "",
          addressLine1: profile?.addressLine1 || "",
          addressLine2: profile?.addressLine2 || "",
          city: profile?.city || "",
          state: profile?.state || "",
          zip: profile?.zip || "",
          phone: profile?.phone || "",
          partyRole: factMap["filer.role"] || profile?.partyRole || "",
          isSelfRepresented: profile?.isSelfRepresented ?? true,
          attorney: profile?.isSelfRepresented === false ? {
            name: profile?.fullName || "",
            firm: profile?.firmName || "",
            barNumber: profile?.barNumber || "",
          } : undefined,
        },
        document: {
          title: factMap["document.title"] || "",
          subtitle: factMap["document.subtitle"] || "",
        },
        date: today,
      };
      
      const missingFields: string[] = [];
      if (!payload.court.county) missingFields.push("court.county");
      if (!payload.court.state) missingFields.push("court.state");
      if (!payload.case.caseNumber) missingFields.push("case.caseNumber");
      if (!payload.filer.fullName) missingFields.push("filer.fullName");
      if (!payload.filer.addressLine1) missingFields.push("filer.addressLine1");
      if (!payload.filer.partyRole) missingFields.push("filer.partyRole");
      
      const citationCount = acceptedFacts.reduce((acc, f) => {
        return acc + (f.sourceType === "claim" ? 1 : 0);
      }, 0);
      
      res.json({
        payload,
        missingFields,
        factCount: acceptedFacts.length,
        citationBackedCount: citationCount,
        guardrailsPassed: citationCount > 0 || acceptedFacts.length === 0,
      });
    } catch (error) {
      console.error("Template autofill error:", error);
      res.status(500).json({ error: "Failed to generate template autofill" });
    }
  });

  // Phase 2F: Get fact keys for a template type (placeholder mapping)
  app.get("/api/template-fields/:templateType", requireAuth, async (req, res) => {
    try {
      const { templateType } = req.params;
      
      const commonFields = [
        { key: "court.district", label: "Court District", required: false },
        { key: "court.county", label: "County", required: true },
        { key: "court.state", label: "State", required: true },
        { key: "case.number", label: "Case Number", required: true },
        { key: "party.petitioner", label: "Petitioner Name", required: false },
        { key: "party.respondent", label: "Respondent Name", required: false },
        { key: "filer.name", label: "Filer Full Name", required: true },
        { key: "filer.email", label: "Filer Email", required: false },
        { key: "filer.role", label: "Filer Party Role", required: true },
        { key: "document.title", label: "Document Title", required: false },
      ];
      
      const templateSpecificFields: Record<string, Array<{ key: string; label: string; required: boolean }>> = {
        declaration: [
          { key: "declaration.statement", label: "Declaration Statement", required: true },
          { key: "declaration.facts", label: "Statement of Facts", required: true },
        ],
        affidavit: [
          { key: "affidavit.sworn_statement", label: "Sworn Statement", required: true },
        ],
        motion: [
          { key: "motion.relief_requested", label: "Relief Requested", required: true },
          { key: "motion.grounds", label: "Grounds for Motion", required: true },
        ],
        response: [
          { key: "response.to_motion", label: "Response to Motion", required: true },
          { key: "response.arguments", label: "Arguments", required: true },
        ],
      };
      
      const fields = [
        ...commonFields,
        ...(templateSpecificFields[templateType] || []),
      ];
      
      res.json({ templateType, fields });
    } catch (error) {
      console.error("Template fields error:", error);
      res.status(500).json({ error: "Failed to get template fields" });
    }
  });

  app.post("/api/cases/:caseId/documents/templates/:templateKey/preflight", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId as string;
      const { caseId, templateKey } = req.params;
      
      const caseRecord = await storage.getCase(caseId, userId);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const acceptedFacts = await storage.listAcceptedCaseFacts(userId, caseId);
      const profile = await storage.getUserProfile(userId);
      
      const factMap: Record<string, string> = {};
      for (const fact of acceptedFacts) {
        factMap[fact.fieldKey] = fact.value;
      }
      
      const requiredFields: Record<string, string[]> = {
        declaration: ["court.county", "court.state", "case.number", "filer.name", "filer.role", "declaration.statement"],
        affidavit: ["court.county", "court.state", "case.number", "filer.name", "filer.role", "affidavit.sworn_statement"],
        motion: ["court.county", "court.state", "case.number", "filer.name", "motion.relief_requested"],
        response: ["court.county", "court.state", "case.number", "filer.name", "response.to_motion"],
        brief: ["court.county", "court.state", "case.number", "filer.name"],
      };
      
      const templateRequired = requiredFields[templateKey] || requiredFields.declaration;
      const filledFields: string[] = [];
      const missingFields: string[] = [];
      
      for (const field of templateRequired) {
        const fromFact = factMap[field];
        let fromProfile = "";
        
        if (field === "court.county") fromProfile = caseRecord.county || "";
        if (field === "court.state") fromProfile = caseRecord.state || "";
        if (field === "case.number") fromProfile = caseRecord.caseNumber || "";
        if (field === "filer.name") fromProfile = profile?.fullName || "";
        if (field === "filer.role") fromProfile = profile?.partyRole || "";
        
        if (fromFact || fromProfile) {
          filledFields.push(field);
        } else {
          missingFields.push(field);
        }
      }
      
      const citationBackedFacts = acceptedFacts.filter(f => f.sourceType === "claim");
      const hasAnyCitations = citationBackedFacts.length > 0;
      
      const allRequiredFilled = missingFields.length === 0;
      const isReady = allRequiredFilled && hasAnyCitations;
      
      res.json({
        templateKey,
        isReady,
        filledFieldsCount: filledFields.length,
        requiredFieldsCount: templateRequired.length,
        missingFields,
        filledFields,
        citationBackedCount: citationBackedFacts.length,
        guardrailsPassed: hasAnyCitations,
        readinessScore: Math.round((filledFields.length / templateRequired.length) * 100),
      });
    } catch (error) {
      console.error("Template preflight error:", error);
      res.status(500).json({ error: "Failed to run preflight check" });
    }
  });

  return httpServer;
}
