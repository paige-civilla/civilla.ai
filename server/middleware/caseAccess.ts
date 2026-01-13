import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { cases, caseCollaborators } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

export type CaseRole = "owner" | "attorney_viewer" | null;

export async function getUserCaseRole(userId: string, caseId: string): Promise<CaseRole> {
  const caseRow = await db.select({ userId: cases.userId }).from(cases).where(eq(cases.id, caseId)).limit(1);
  if (caseRow.length > 0 && caseRow[0].userId === userId) {
    return "owner";
  }
  const collab = await db
    .select({ role: caseCollaborators.role })
    .from(caseCollaborators)
    .where(
      and(
        eq(caseCollaborators.caseId, caseId),
        eq(caseCollaborators.userId, userId),
        isNull(caseCollaborators.revokedAt)
      )
    )
    .limit(1);
  if (collab.length > 0 && collab[0].role === "attorney_viewer") {
    return "attorney_viewer";
  }
  return null;
}

export function requireCaseAccess(minRole: "viewer" | "owner") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const caseId = req.params.caseId;
      if (!caseId) return res.status(400).json({ error: "Missing caseId" });

      const role = await getUserCaseRole(userId, caseId);
      if (!role) {
        return res.status(403).json({ error: "No access to this case" });
      }

      if (minRole === "owner" && role !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      (req as any).caseRole = role;
      return next();
    } catch (e) {
      console.error("[requireCaseAccess] Error:", e);
      return res.status(500).json({ error: "Case access check failed" });
    }
  };
}

export async function requireReadOnlyViewer(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).caseRole as CaseRole;
  if (role === "attorney_viewer") {
    const method = req.method.toUpperCase();
    if (method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT") {
      return res.status(403).json({ error: "Read-only access" });
    }
  }
  return next();
}

export function blockAttorneyMutations(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).caseRole as CaseRole;
  if (role === "attorney_viewer") {
    return res.status(403).json({ error: "Read-only access" });
  }
  return next();
}
