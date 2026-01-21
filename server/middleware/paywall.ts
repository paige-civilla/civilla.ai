import { Request, Response, NextFunction } from "express";
import { getEntitlements, createPaywallError, SubscriptionTier } from "../billing";

// Feature flag to bypass paywall enforcement for testing
const STRIPE_ENABLED = process.env.STRIPE_ENABLED === 'true';

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export interface PaywallRequest extends Request {
  entitlements?: Awaited<ReturnType<typeof getEntitlements>>;
}

export function requireTier(...allowedTiers: SubscriptionTier[]) {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    // Bypass all paywall checks when Stripe is disabled
    if (!STRIPE_ENABLED) {
      return next();
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const entitlements = await getEntitlements(req.session.userId);
    req.entitlements = entitlements;

    if (entitlements.isComped || entitlements.isLifetime) {
      return next();
    }

    if (!allowedTiers.includes(entitlements.tier)) {
      return res.status(402).json(
        createPaywallError(
          "This feature requires an upgraded plan",
          "TIER_REQUIRED",
          allowedTiers[0],
          entitlements.tier
        )
      );
    }

    if (entitlements.status === "past_due" || entitlements.status === "unpaid") {
      return res.status(402).json(
        createPaywallError(
          "Your subscription payment is past due. Please update your payment method.",
          "SUBSCRIPTION_INACTIVE",
          undefined,
          entitlements.tier
        )
      );
    }

    next();
  };
}

export function requireAnalysis() {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    // Bypass when Stripe is disabled
    if (!STRIPE_ENABLED) {
      return next();
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const entitlements = await getEntitlements(req.session.userId);
    req.entitlements = entitlements;

    if (entitlements.isComped || entitlements.isLifetime) {
      return next();
    }

    if (entitlements.archiveMode) {
      return res.status(402).json(
        createPaywallError(
          "Analysis is disabled in archive mode. Upgrade to a full plan to enable analysis.",
          "ARCHIVE_MODE_ACTIVE",
          "core",
          entitlements.tier
        )
      );
    }

    if (!entitlements.analysisEnabled) {
      return res.status(402).json(
        createPaywallError(
          "AI analysis requires a paid subscription",
          "ANALYSIS_DISABLED",
          "core",
          entitlements.tier
        )
      );
    }

    next();
  };
}

export function requireDownloads() {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    // Bypass when Stripe is disabled
    if (!STRIPE_ENABLED) {
      return next();
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const entitlements = await getEntitlements(req.session.userId);
    req.entitlements = entitlements;

    if (entitlements.isComped || entitlements.isLifetime) {
      return next();
    }

    if (!entitlements.downloadsEnabled) {
      return res.status(402).json(
        createPaywallError(
          "Downloads require a Core plan or higher",
          "DOWNLOADS_DISABLED",
          "core",
          entitlements.tier
        )
      );
    }

    next();
  };
}

export function requireVideoUploads() {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    // Bypass when Stripe is disabled
    if (!STRIPE_ENABLED) {
      return next();
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const entitlements = await getEntitlements(req.session.userId);
    req.entitlements = entitlements;

    if (entitlements.isComped || entitlements.isLifetime) {
      return next();
    }

    if (!entitlements.videoUploadsEnabled) {
      return res.status(402).json(
        createPaywallError(
          "Video uploads require a Pro plan or higher",
          "VIDEO_UPLOAD_DISABLED",
          "pro",
          entitlements.tier
        )
      );
    }

    next();
  };
}

export function requireAdvancedExhibits() {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    // Bypass when Stripe is disabled
    if (!STRIPE_ENABLED) {
      return next();
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const entitlements = await getEntitlements(req.session.userId);
    req.entitlements = entitlements;

    if (entitlements.isComped || entitlements.isLifetime) {
      return next();
    }

    if (!entitlements.advancedExhibitsEnabled) {
      return res.status(402).json(
        createPaywallError(
          "Advanced exhibits require a Pro plan or higher",
          "ADVANCED_EXHIBITS_DISABLED",
          "pro",
          entitlements.tier
        )
      );
    }

    next();
  };
}

export async function checkCaseLimit(userId: string, currentCaseCount: number): Promise<{ allowed: boolean; error?: ReturnType<typeof createPaywallError> }> {
  // Bypass when Stripe is disabled
  if (!STRIPE_ENABLED) {
    return { allowed: true };
  }

  const entitlements = await getEntitlements(userId);

  if (entitlements.isComped || entitlements.isLifetime) {
    return { allowed: true };
  }

  if (currentCaseCount >= entitlements.casesAllowed) {
    return {
      allowed: false,
      error: createPaywallError(
        `You have reached your case limit (${entitlements.casesAllowed}). Upgrade your plan or add the second case add-on.`,
        "CASE_LIMIT_REACHED",
        entitlements.tier === "premium" ? undefined : "premium",
        entitlements.tier
      ),
    };
  }

  return { allowed: true };
}

export function loadEntitlements() {
  return async (req: PaywallRequest, res: Response, next: NextFunction) => {
    if (req.session.userId) {
      req.entitlements = await getEntitlements(req.session.userId);
    }
    next();
  };
}
