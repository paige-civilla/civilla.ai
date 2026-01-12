import { Request, Response, NextFunction } from "express";
import { checkQuota, recordUsage, QuotaCheckType, getQuotaRemaining } from "../usage/limits";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export interface QuotaRequest extends Request {
  quotaCheck?: {
    type: QuotaCheckType;
    allowed: boolean;
    remaining?: number;
  };
}

export function requireQuota(
  type: QuotaCheckType,
  options: {
    quantityEstimator?: (req: Request) => number;
  } = {}
) {
  return async (req: QuotaRequest, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const quantity = options.quantityEstimator ? options.quantityEstimator(req) : 1;
    const result = await checkQuota(req.session.userId, type, quantity);

    req.quotaCheck = {
      type,
      allowed: result.allowed,
      remaining: result.remaining,
    };

    if (!result.allowed) {
      const statusCode = result.code === "NEEDS_PROCESSING_PACK" ? 402 : 429;
      return res.status(statusCode).json({
        error: result.reason || "Quota exceeded",
        code: result.code || "QUOTA_EXCEEDED",
        quotaType: type,
        remaining: result.remaining,
        packSuggested: result.packSuggested,
      });
    }

    next();
  };
}

export async function recordUsageAfter(
  userId: string,
  type: "ocr_page" | "ai_call" | "ai_tokens" | "upload_bytes",
  quantity: number,
  caseId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await recordUsage(userId, type, quantity, caseId, metadata);
}

export async function attachQuotaRemaining(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session.userId) {
    return next();
  }

  try {
    const remaining = await getQuotaRemaining(req.session.userId);
    (req as any).quotaRemaining = remaining;
  } catch (err) {
    console.error("[Quota] Failed to get quota remaining:", err);
  }

  next();
}
