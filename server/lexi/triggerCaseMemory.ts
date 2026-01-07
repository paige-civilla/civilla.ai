import { storage } from "../storage";
import { scheduleMemoryRebuild } from "./memoryDebounce";
import { rebuildCaseMemory } from "./rebuildMemory";

export async function triggerCaseMemoryRebuild(
  userId: string,
  caseId: string,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await storage.createActivityLog(userId, caseId, reason, `Memory rebuild triggered: ${reason}`, metadata ?? {});
    
    const numericCaseId = parseInt(caseId, 10);
    if (!isNaN(numericCaseId)) {
      scheduleMemoryRebuild(numericCaseId, () => rebuildCaseMemory(userId, caseId));
    }
  } catch (error) {
    console.error(`[triggerCaseMemoryRebuild] Failed for ${reason}:`, error);
  }
}
