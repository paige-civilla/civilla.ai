import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../db";
import {
  generatedDocuments,
  cases,
  generateDocumentPayloadSchema,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import { buildCourtDocx } from "../courtDocx";

export const documentsRouter = Router();

// Get all generated documents for a case
documentsRouter.get(
  "/cases/:caseId/documents",
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

    const documents = await db.query.generatedDocuments.findMany({
      where: eq(generatedDocuments.caseId, caseId),
      orderBy: [desc(generatedDocuments.createdAt)],
    });

    res.json(documents);
  }),
);

// Generate a new document
documentsRouter.post(
  "/cases/:caseId/documents/generate",
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

    const parsed = generateDocumentPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid document data",
        errors: parsed.error.errors,
      });
    }

    // Build the document
    const docBuffer = await buildCourtDocx({
      templateType: parsed.data.templateType,
      caseId,
      data: parsed.data.data,
    });

    // Save to database
    const [document] = await db
      .insert(generatedDocuments)
      .values({
        caseId,
        templateType: parsed.data.templateType,
        title:
          parsed.data.title ||
          `${parsed.data.templateType} - ${new Date().toLocaleDateString()}`,
        data: parsed.data.data,
        generatedBy: req.session.userId!,
      })
      .returning();

    logger.info("Document generated", {
      documentId: document.id,
      caseId,
      templateType: parsed.data.templateType,
      userId: req.session.userId,
    });

    // Return document with buffer for download
    res.status(201).json({
      ...document,
      buffer: docBuffer.toString("base64"),
    });
  }),
);

// Get single document
documentsRouter.get(
  "/documents/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const document = await db.query.generatedDocuments.findFirst({
      where: eq(generatedDocuments.id, documentId),
      with: {
        case: true,
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Verify case ownership
    if (document.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(document);
  }),
);

// Regenerate document
documentsRouter.post(
  "/documents/:id/regenerate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const document = await db.query.generatedDocuments.findFirst({
      where: eq(generatedDocuments.id, documentId),
      with: {
        case: true,
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Verify case ownership
    if (document.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Rebuild the document
    const docBuffer = await buildCourtDocx({
      templateType: document.templateType,
      caseId: document.caseId,
      data: document.data,
    });

    logger.info("Document regenerated", {
      documentId,
      userId: req.session.userId,
    });

    res.json({
      ...document,
      buffer: docBuffer.toString("base64"),
    });
  }),
);

// Delete document
documentsRouter.delete(
  "/documents/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.id);

    const document = await db.query.generatedDocuments.findFirst({
      where: eq(generatedDocuments.id, documentId),
      with: {
        case: true,
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Verify case ownership
    if (document.case.userId !== req.session.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await db
      .delete(generatedDocuments)
      .where(eq(generatedDocuments.id, documentId));

    logger.info("Document deleted", { documentId, userId: req.session.userId });

    res.json({ message: "Document deleted" });
  }),
);
