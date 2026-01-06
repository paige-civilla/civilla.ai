const DEBOUNCE_MS = 60_000;

const pendingRebuilds = new Map<number, NodeJS.Timeout>();

export function scheduleMemoryRebuild(caseId: number, rebuildFn: () => Promise<unknown>) {
  if (pendingRebuilds.has(caseId)) {
    clearTimeout(pendingRebuilds.get(caseId)!);
  }
  const timer = setTimeout(async () => {
    pendingRebuilds.delete(caseId);
    try {
      await rebuildFn();
    } catch (err) {
      console.error(`[memoryDebounce] Failed to rebuild memory for case ${caseId}:`, err);
    }
  }, DEBOUNCE_MS);
  pendingRebuilds.set(caseId, timer);
}

export function cancelPendingRebuild(caseId: number) {
  const timer = pendingRebuilds.get(caseId);
  if (timer) {
    clearTimeout(timer);
    pendingRebuilds.delete(caseId);
  }
}

export function hasPendingRebuild(caseId: number): boolean {
  return pendingRebuilds.has(caseId);
}
