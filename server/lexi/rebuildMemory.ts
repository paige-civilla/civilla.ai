import { storage } from "../storage";

export async function rebuildCaseMemory(userId: string, caseId: string): Promise<string> {
  const caseRecord = await storage.getCase(caseId, userId);
  if (!caseRecord) {
    throw new Error("Case not found");
  }

  const summaryParts: string[] = [];

  if (caseRecord.title) {
    summaryParts.push(`## Case: ${caseRecord.title}`);
  }
  if (caseRecord.caseNumber) {
    summaryParts.push(`Case Number: ${caseRecord.caseNumber}`);
  }
  if (caseRecord.county || caseRecord.state) {
    summaryParts.push(`Location: ${[caseRecord.county, caseRecord.state].filter(Boolean).join(", ")}`);
  }

  const claims = await storage.listCaseClaims(caseId, userId);
  const acceptedClaims = claims.filter(c => c.status === "accepted");
  if (acceptedClaims.length > 0) {
    summaryParts.push(`\n## Accepted Claims (${acceptedClaims.length})`);
    for (const claim of acceptedClaims.slice(0, 10)) {
      summaryParts.push(`- ${claim.claimText.slice(0, 200)}${claim.claimText.length > 200 ? "..." : ""}`);
    }
    if (acceptedClaims.length > 10) {
      summaryParts.push(`- ... and ${acceptedClaims.length - 10} more`);
    }
  }

  const events = await storage.listTimelineEvents(caseId, userId);
  if (events.length > 0) {
    summaryParts.push(`\n## Key Timeline Events (${events.length} total)`);
    const recentEvents = events.slice(0, 5);
    for (const ev of recentEvents) {
      const dateStr = ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : "Unknown date";
      summaryParts.push(`- ${dateStr}: ${ev.title || "Untitled event"}`);
    }
  }

  const trialPrepItems = await storage.listTrialBinderItems(userId, caseId);
  const pinnedItems = trialPrepItems.filter((i) => i.pinnedRank !== null);
  if (pinnedItems.length > 0) {
    summaryParts.push(`\n## Pinned Trial Prep Items (${pinnedItems.length})`);
    for (const item of pinnedItems.slice(0, 5)) {
      summaryParts.push(`- ${item.sectionKey || "Untitled"}`);
    }
  }

  const memoryMarkdown = summaryParts.join("\n");

  await storage.updateLexiCaseMemoryMarkdown(userId, caseId, memoryMarkdown);

  await storage.createActivityLog(userId, caseId, "memory_rebuild", `Auto-rebuilt case memory from ${acceptedClaims.length} claims, ${events.length} events`, {
    claimCount: acceptedClaims.length,
    eventCount: events.length,
    pinnedItemCount: pinnedItems.length,
    trigger: "auto",
  });

  return memoryMarkdown;
}
