import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile = await storage.getUserProfile(userId);
    const isAdmin = !!profile?.isAdmin;

    if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

    return next();
  } catch (e) {
    console.error("[requireAdmin] Error:", e);
    return res.status(500).json({ error: "Admin auth failed" });
  }
}
