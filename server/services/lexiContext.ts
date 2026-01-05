import { db } from "../db";
import { evidenceFiles, evidenceNotes, timelineEvents, caseCommunications, exhibitSnippets, trialPrepShortlist, evidenceAiAnalyses, cases } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";

export interface LexiContextHighlight {
  topThemes: { label: string; exampleCount: number }[];
  topPatterns: { label: string; exampleCount: number }[];
  keyDates: { date: string; label: string; sourceType: string }[];
  keyNames: { name: string; mentions: number }[];
}

export interface LexiContext {
  caseId: string;
  caseTitle: string;
  state: string | null;
  caseType: string | null;
  hasChildren: boolean;
  counts: {
    evidenceFiles: number;
    evidenceNotes: number;
    timelineEvents: number;
    communications: number;
    exhibitSnippets: number;
    trialPrepItems: number;
    aiAnalyses: number;
  };
  highlights: LexiContextHighlight;
}

export async function buildLexiContext({
  userId,
  caseId,
  moduleKey,
}: {
  userId: string;
  caseId: string;
  moduleKey?: string;
}): Promise<LexiContext | null> {
  try {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
      .limit(1);

    if (!caseRecord) {
      return null;
    }

    const [
      [evidenceCount],
      [notesCount],
      [timelineCount],
      [commCount],
      [snippetCount],
      [trialPrepCount],
      [analysisCount],
    ] = await Promise.all([
      db.select({ count: count() }).from(evidenceFiles).where(and(eq(evidenceFiles.caseId, caseId), eq(evidenceFiles.userId, userId))),
      db.select({ count: count() }).from(evidenceNotes).where(and(eq(evidenceNotes.caseId, caseId), eq(evidenceNotes.userId, userId))),
      db.select({ count: count() }).from(timelineEvents).where(and(eq(timelineEvents.caseId, caseId), eq(timelineEvents.userId, userId))),
      db.select({ count: count() }).from(caseCommunications).where(and(eq(caseCommunications.caseId, caseId), eq(caseCommunications.userId, userId))),
      db.select({ count: count() }).from(exhibitSnippets).where(and(eq(exhibitSnippets.caseId, caseId), eq(exhibitSnippets.userId, userId))),
      db.select({ count: count() }).from(trialPrepShortlist).where(and(eq(trialPrepShortlist.caseId, caseId), eq(trialPrepShortlist.userId, userId))),
      db.select({ count: count() }).from(evidenceAiAnalyses).where(and(eq(evidenceAiAnalyses.caseId, caseId), eq(evidenceAiAnalyses.userId, userId))),
    ]);

    const counts = {
      evidenceFiles: evidenceCount?.count ?? 0,
      evidenceNotes: notesCount?.count ?? 0,
      timelineEvents: timelineCount?.count ?? 0,
      communications: commCount?.count ?? 0,
      exhibitSnippets: snippetCount?.count ?? 0,
      trialPrepItems: trialPrepCount?.count ?? 0,
      aiAnalyses: analysisCount?.count ?? 0,
    };

    let highlights: LexiContextHighlight = {
      topThemes: [],
      topPatterns: [],
      keyDates: [],
      keyNames: [],
    };

    try {
      const analyses = await db
        .select({ findings: evidenceAiAnalyses.findings })
        .from(evidenceAiAnalyses)
        .where(and(
          eq(evidenceAiAnalyses.caseId, caseId),
          eq(evidenceAiAnalyses.userId, userId),
          eq(evidenceAiAnalyses.status, "complete")
        ))
        .limit(50);

      const themeTally: Record<string, number> = {};
      const patternTally: Record<string, number> = {};
      const dateTally: Record<string, { label: string; sourceType: string; count: number }> = {};
      const nameTally: Record<string, number> = {};

      for (const a of analyses) {
        const f = a.findings as {
          themes?: string[];
          patterns?: string[];
          dates?: { date: string; label?: string }[];
          names?: string[];
        } | null;

        if (!f) continue;

        if (Array.isArray(f.themes)) {
          for (const t of f.themes) {
            const key = String(t).trim().toLowerCase();
            if (key) themeTally[key] = (themeTally[key] || 0) + 1;
          }
        }

        if (Array.isArray(f.patterns)) {
          for (const p of f.patterns) {
            const key = String(p).trim().toLowerCase();
            if (key) patternTally[key] = (patternTally[key] || 0) + 1;
          }
        }

        if (Array.isArray(f.dates)) {
          for (const d of f.dates) {
            if (d.date) {
              const key = String(d.date).split("T")[0];
              if (!dateTally[key]) {
                dateTally[key] = { label: d.label || "Event", sourceType: "ai_analysis", count: 0 };
              }
              dateTally[key].count += 1;
            }
          }
        }

        if (Array.isArray(f.names)) {
          for (const n of f.names) {
            const key = String(n).trim();
            if (key) nameTally[key] = (nameTally[key] || 0) + 1;
          }
        }
      }

      highlights.topThemes = Object.entries(themeTally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, exampleCount]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          exampleCount,
        }));

      highlights.topPatterns = Object.entries(patternTally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, exampleCount]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          exampleCount,
        }));

      highlights.keyDates = Object.entries(dateTally)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5)
        .map(([date, info]) => ({
          date,
          label: info.label,
          sourceType: info.sourceType,
        }));

      highlights.keyNames = Object.entries(nameTally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, mentions]) => ({ name, mentions }));

    } catch (highlightErr) {
      console.error("buildLexiContext: highlights extraction failed, returning counts only", highlightErr);
    }

    const hasChildren = caseRecord.hasChildren ?? false;

    return {
      caseId,
      caseTitle: caseRecord.title,
      state: caseRecord.state,
      caseType: caseRecord.caseType,
      hasChildren,
      counts,
      highlights,
    };
  } catch (error) {
    console.error("buildLexiContext error:", error);
    return null;
  }
}

export function formatContextForPrompt(context: LexiContext): string {
  const lines: string[] = [];
  
  lines.push("CASE CONTEXT (READ ONLY):");
  lines.push(`Case: "${context.caseTitle}"`);
  if (context.state) lines.push(`State: ${context.state}`);
  if (context.caseType) lines.push(`Type: ${context.caseType}`);
  if (context.hasChildren) lines.push("Has children involved: Yes");
  
  lines.push("");
  lines.push("What the user has added:");
  lines.push(`- Evidence files: ${context.counts.evidenceFiles}`);
  lines.push(`- Notes on evidence: ${context.counts.evidenceNotes}`);
  lines.push(`- Timeline events: ${context.counts.timelineEvents}`);
  lines.push(`- Communications logged: ${context.counts.communications}`);
  lines.push(`- Exhibit snippets: ${context.counts.exhibitSnippets}`);
  lines.push(`- Trial prep items: ${context.counts.trialPrepItems}`);
  lines.push(`- AI analyses complete: ${context.counts.aiAnalyses}`);
  
  if (context.highlights.topThemes.length > 0) {
    lines.push("");
    lines.push("Top themes detected:");
    for (const t of context.highlights.topThemes) {
      lines.push(`- ${t.label} (${t.exampleCount} mentions)`);
    }
  }
  
  if (context.highlights.topPatterns.length > 0) {
    lines.push("");
    lines.push("Top patterns detected:");
    for (const p of context.highlights.topPatterns) {
      lines.push(`- ${p.label} (${p.exampleCount} mentions)`);
    }
  }
  
  if (context.highlights.keyDates.length > 0) {
    lines.push("");
    lines.push("Key dates found:");
    for (const d of context.highlights.keyDates) {
      lines.push(`- ${d.date}: ${d.label}`);
    }
  }
  
  if (context.highlights.keyNames.length > 0) {
    lines.push("");
    lines.push("Key names mentioned:");
    for (const n of context.highlights.keyNames) {
      lines.push(`- ${n.name} (${n.mentions} mentions)`);
    }
  }
  
  lines.push("");
  lines.push("Use this context to:");
  lines.push("- Reference what the user already has (counts + highlights)");
  lines.push("- Avoid duplication; suggest summarizing existing items if relevant");
  lines.push("- Do NOT claim you reviewed actual file contents unless AI analysis exists");
  
  return lines.join("\n");
}
