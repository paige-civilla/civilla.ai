import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../db";
import { evidenceFiles, cases } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import multer from "multer";
import {
  uploadToR2,
  getSignedDownloadUrl,
  deleteFromR2,
  isR2Configured,
} from "../r2";
import { enqueueEvidenceExtraction } from "../services/evidenceJobs";
import crypto from "crypto";

export const evidenceRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload evidence file
evidenceRouter.post(
  "/cases/:caseId/evidence",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.caseId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Verify case ownership
    const caseData = await db.query.cases.findFirst({
      where: and(eq(cases.id, caseId), eq(cases.userId, req.session.userId!)),
    });

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Generate unique filename
    const fileId = crypto.randomBytes(16).toString("hex");
    const extension = req.file.originalname.split(".").pop();
    const filename = `${fileId}.${extension}`;

    let storageKey: string | null = null;

    // Upload to R2 if configured
    if (isR2Configured()) {
      storageKey = `evidence/${caseId}/${filename}`;
      await uploadToR2(storageKey, req.file.buffer, req.file.mimetype);
    }

    // Save to database
    const [evidence] = await db
      .insert(evidenceFiles)
      .values({
        caseId,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storageKey,
        uploadedBy: req.session.userId!,
      })
      .returning();

    // Enqueue for AI extraction
    await enqueueEvidenceExtraction(evidence.id);

    logger.info("Evidence uploaded", {
      evidenceId: evidence.id,
      caseId,
      userId: req.session.userId,
    });

    res.status(201).json(evidence);
  }),
);

// Get all evidence for a case
evidenceRouter.get(
  "/cases/:caseId/evidence",
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.caseId);

    // Verify case ownership
    const caseData = await db.query.cases.findFirst({
      where: and(eq(cases.id, caseId), eq(cases.userId, req.session.userId!)),
    });

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    const evidence = await db.query.evidenceFiles.findMany({
      where: eq(evidenceFiles.caseId, caseId),
    });

    res.json(evidence);
  }),
);

// Get single evidence file
evidenceRouter.get(
  "/evidence/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const evidenceId = parseInt(req.params.id);

    const evidence = await db.query.evidenceFiles.findFirst({
      where: eq(evidenceFiles.id, evidenceId),
      with: {
        case: true,
      },
    });

    if (!evidence) {
      return res.status(404).json({ message: "Evidence not found" });
    }

    // Verify case ownership
    if (evidence.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(evidence);
  }),
);

// Download evidence file
evidenceRouter.get(
  "/evidence/:id/download",
  requireAuth,
  asyncHandler(async (req, res) => {
    const evidenceId = parseInt(req.params.id);

    const evidence = await db.query.evidenceFiles.findFirst({
      where: eq(evidenceFiles.id, evidenceId),
      with: {
        case: true,
      },
    });

    if (!evidence) {
      return res.status(404).json({ message: "Evidence not found" });
    }

    // Verify case ownership
    if (evidence.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!evidence.storageKey) {
      return res.status(404).json({ message: "File not found in storage" });
    }

    // Get signed download URL
    const downloadUrl = await getSignedDownloadUrl(
      evidence.storageKey,
      evidence.filename,
    );

    res.json({ url: downloadUrl });
  }),
);

// Delete evidence
evidenceRouter.delete(
  "/evidence/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const evidenceId = parseInt(req.params.id);

    const evidence = await db.query.evidenceFiles.findFirst({
      where: eq(evidenceFiles.id, evidenceId),
      with: {
        case: true,
      },
    });

    if (!evidence) {
      return res.status(404).json({ message: "Evidence not found" });
    }

    // Verify case ownership
    if (evidence.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete from R2
    if (evidence.storageKey) {
      await deleteFromR2(evidence.storageKey);
    }

    // Delete from database
    await db.delete(evidenceFiles).where(eq(evidenceFiles.id, evidenceId));

    logger.info("Evidence deleted", { evidenceId, userId: req.session.userId });

    res.json({ message: "Evidence deleted" });
  }),
);
