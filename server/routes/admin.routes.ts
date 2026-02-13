import { Router } from "express";
import { requireAuth } from "../auth";
import { requireAdmin } from "../middleware/admin";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../logger";
import {
  getAdminMetrics,
  getSystemHealth,
  searchUsers,
  setUserRoles,
} from "../admin/adminMetrics";
import { runSmokeChecks } from "../diagnostics/smokeChecks";

export const adminRouter = Router();

// All admin routes require both auth and admin role
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Get admin dashboard metrics
adminRouter.get(
  "/metrics",
  asyncHandler(async (req, res) => {
    const metrics = await getAdminMetrics();
    res.json(metrics);
  }),
);

// Get system health
adminRouter.get(
  "/health",
  asyncHandler(async (req, res) => {
    const health = await getSystemHealth();
    res.json(health);
  }),
);

// Run smoke checks
adminRouter.post(
  "/smoke-checks",
  asyncHandler(async (req, res) => {
    logger.info("Running smoke checks", { adminId: req.session.userId });

    const results = await runSmokeChecks();

    res.json(results);
  }),
);

// Search users
adminRouter.get(
  "/users/search",
  asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Search query required" });
    }

    const users = await searchUsers(query);
    res.json(users);
  }),
);

// Update user roles
adminRouter.patch(
  "/users/:userId/roles",
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: "Roles must be an array" });
    }

    await setUserRoles(userId, roles);

    logger.info("User roles updated", {
      adminId: req.session.userId,
      targetUserId: userId,
      newRoles: roles,
    });

    res.json({ message: "Roles updated successfully" });
  }),
);

// Get all users (paginated)
adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { db } = await import("../db");
    const { users } = await import("@shared/schema");
    const { desc } = await import("drizzle-orm");

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
      columns: {
        password: false, // Don't return passwords
      },
    });

    res.json({
      users: allUsers,
      page,
      limit,
    });
  }),
);
