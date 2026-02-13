import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../db";
import {
  lexiThreads,
  lexiMessages,
  createLexiThreadSchema,
  renameLexiThreadSchema,
  lexiChatRequestSchema,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import OpenAI from "openai";
import { buildLexiSystemPrompt } from "../lexi/systemPrompt";
import { buildLexiContext } from "../services/lexiContext";
import { isAiTestMode, getMockLexiResponse } from "../lexi/testMode";

export const lexiRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get all threads for user
lexiRouter.get(
  "/threads",
  requireAuth,
  asyncHandler(async (req, res) => {
    const threads = await db.query.lexiThreads.findMany({
      where: eq(lexiThreads.userId, req.session.userId!),
      orderBy: [desc(lexiThreads.updatedAt)],
    });

    res.json(threads);
  }),
);

// Create new thread
lexiRouter.post(
  "/threads",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createLexiThreadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid thread data" });
    }

    const [thread] = await db
      .insert(lexiThreads)
      .values({
        userId: req.session.userId!,
        caseId: parsed.data.caseId,
        title: parsed.data.title || "New Chat",
      })
      .returning();

    logger.info("Lexi thread created", {
      threadId: thread.id,
      userId: req.session.userId,
    });

    res.status(201).json(thread);
  }),
);

// Get thread with messages
lexiRouter.get(
  "/threads/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const threadId = parseInt(req.params.id);

    const thread = await db.query.lexiThreads.findFirst({
      where: and(
        eq(lexiThreads.id, threadId),
        eq(lexiThreads.userId, req.session.userId!),
      ),
      with: {
        messages: {
          orderBy: [desc(lexiMessages.createdAt)],
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.json(thread);
  }),
);

// Rename thread
lexiRouter.patch(
  "/threads/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const threadId = parseInt(req.params.id);
    const parsed = renameLexiThreadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid title" });
    }

    const [updated] = await db
      .update(lexiThreads)
      .set({ title: parsed.data.title })
      .where(
        and(
          eq(lexiThreads.id, threadId),
          eq(lexiThreads.userId, req.session.userId!),
        ),
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Thread not found" });
    }

    res.json(updated);
  }),
);

// Delete thread
lexiRouter.delete(
  "/threads/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const threadId = parseInt(req.params.id);

    const deleted = await db
      .delete(lexiThreads)
      .where(
        and(
          eq(lexiThreads.id, threadId),
          eq(lexiThreads.userId, req.session.userId!),
        ),
      )
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ message: "Thread not found" });
    }

    logger.info("Lexi thread deleted", {
      threadId,
      userId: req.session.userId,
    });

    res.json({ message: "Thread deleted" });
  }),
);

// Chat with Lexi
lexiRouter.post(
  "/chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = lexiChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid chat request" });
    }

    const { threadId, message, caseId } = parsed.data;

    // Test mode check
    if (isAiTestMode()) {
      const mockResponse = getMockLexiResponse(message);
      return res.json({ response: mockResponse });
    }

    // Verify thread ownership
    const thread = await db.query.lexiThreads.findFirst({
      where: and(
        eq(lexiThreads.id, threadId),
        eq(lexiThreads.userId, req.session.userId!),
      ),
    });

    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }

    // Save user message
    await db.insert(lexiMessages).values({
      threadId,
      role: "user",
      content: message,
    });

    // Build context
    const context = caseId ? await buildLexiContext(caseId) : null;
    const systemPrompt = buildLexiSystemPrompt(context);

    // Get previous messages
    const previousMessages = await db.query.lexiMessages.findMany({
      where: eq(lexiMessages.threadId, threadId),
      orderBy: [desc(lexiMessages.createdAt)],
      limit: 10,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...previousMessages.reverse().map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage =
      completion.choices[0]?.message?.content ||
      "I apologize, but I encountered an error.";

    // Save assistant response
    await db.insert(lexiMessages).values({
      threadId,
      role: "assistant",
      content: assistantMessage,
    });

    // Update thread timestamp
    await db
      .update(lexiThreads)
      .set({ updatedAt: new Date() })
      .where(eq(lexiThreads.id, threadId));

    logger.info("Lexi chat completed", {
      threadId,
      userId: req.session.userId,
    });

    res.json({ response: assistantMessage });
  }),
);
