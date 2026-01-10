import { Request, Response, NextFunction } from "express";

export function devOnly(req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === "production";
  const auditEnabled = process.env.AUDIT_ENABLED === "true";

  if (isProduction && !auditEnabled) {
    return res.status(403).json({
      error: "This endpoint is only available in development mode",
      code: "DEV_ONLY",
    });
  }

  next();
}
