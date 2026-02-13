import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../db";
import { cases, insertCaseSchema } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";

export const casesRouter = Router();

// Get all cases for current user
casesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userCases = await db.query.cases.findMany({
      where: eq(cases.userId, req.session.userId!),
      orderBy: [desc(cases.createdAt)],
    });

    res.json(userCases);
  }),
);

// Get single case by ID
casesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.id);

    const caseData = await db.query.cases.findFirst({
      where: and(eq(cases.id, caseId), eq(cases.userId, req.session.userId!)),
    });

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(caseData);
  }),
);

// Create new case
casesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = insertCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid case data",
        errors: parsed.error.errors,
      });
    }

    const [newCase] = await db
      .insert(cases)
      .values({
        ...parsed.data,
        userId: req.session.userId!,
      })
      .returning();

    logger.info("Case created", {
      caseId: newCase.id,
      userId: req.session.userId,
    });

    res.status(201).json(newCase);
  }),
);

// Update case
casesRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.id);

    // Verify ownership
    const existingCase = await db.query.cases.findFirst({
      where: and(eq(cases.id, caseId), eq(cases.userId, req.session.userId!)),
    });

    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const [updated] = await db
      .update(cases)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, caseId))
      .returning();

    logger.info("Case updated", { caseId, userId: req.session.userId });

    res.json(updated);
  }),
);

// Delete case
casesRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseId = parseInt(req.params.id);

    // Verify ownership
    const existingCase = await db.query.cases.findFirst({
      where: and(eq(cases.id, caseId), eq(cases.userId, req.session.userId!)),
    });

    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    await db.delete(cases).where(eq(cases.id, caseId));

    logger.info("Case deleted", { caseId, userId: req.session.userId });

    res.json({ message: "Case deleted successfully" });
  }),
);
