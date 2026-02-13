import { Router } from "express";
import { hashPassword, comparePasswords, requireAuth } from "../auth";
import { db } from "../db";
import {
  users,
  insertUserSchema,
  userProfiles,
  upsertUserProfileSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import {
  verifyTurnstile,
  isTurnstileConfigured,
  getClientIp,
} from "../turnstile";
import { applyEntitlementsForUser } from "../entitlements";

export const authRouter = Router();

// Register new user
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, turnstileToken } = req.body;

    // Verify Turnstile CAPTCHA if configured
    if (isTurnstileConfigured()) {
      const turnstileResult = await verifyTurnstile(
        turnstileToken,
        getClientIp(req),
      );
      if (!turnstileResult.success) {
        return res.status(400).json({
          message: "CAPTCHA verification failed. Please try again.",
        });
      }
    }

    const parsed = insertUserSchema.safeParse({ email, password });
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid email or password format" });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    // Create default user profile
    await db.insert(userProfiles).values({
      userId: newUser.id,
      displayName: email.split("@")[0],
    });

    // Apply entitlements
    await applyEntitlementsForUser(newUser.id, email);

    req.session.userId = newUser.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    logger.info("New user registered", { userId: newUser.id, email });

    res.status(201).json({
      message: "Registration successful",
      userId: newUser.id,
    });
  }),
);

// Login
authRouter;
