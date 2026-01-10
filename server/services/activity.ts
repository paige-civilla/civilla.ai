import { storage } from "../storage";

export interface RecordActivityOptions {
  userId: string;
  caseId?: string | null;
  eventType: string;
  moduleKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordActivity({
  userId,
  caseId,
  eventType,
  moduleKey,
  entityType,
  entityId,
  metadata,
}: RecordActivityOptions): Promise<void> {
  try {
    await storage.createActivityLog(
      userId,
      caseId || null,
      eventType,
      eventType,
      metadata || {},
      {
        moduleKey: moduleKey || null,
        entityType: entityType || null,
        entityId: entityId || null,
      }
    );
  } catch (error) {
    console.error("[recordActivity] Failed to log activity:", error);
  }
}
