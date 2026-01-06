import { storage } from "../storage";
import type { LexiUserPrefs, LexiCaseMemory } from "@shared/schema";

export interface LexiPersonalization {
  prefs: LexiUserPrefs | null;
  caseMemory: LexiCaseMemory | null;
}

export async function getLexiPersonalization(userId: string, caseId: string | null): Promise<LexiPersonalization> {
  const prefs = await storage.getLexiUserPrefs(userId) || null;
  let caseMemory: LexiCaseMemory | null = null;
  if (caseId) {
    caseMemory = await storage.getLexiCaseMemory(userId, caseId) || null;
  }
  return { prefs, caseMemory };
}

export function buildPrefsPromptFragment(prefs: LexiUserPrefs | null): string {
  if (!prefs) return "";
  const lines: string[] = [];
  
  if (prefs.responseStyle && prefs.responseStyle !== "default") {
    lines.push(`- Response style: ${prefs.responseStyle}`);
  }
  if (prefs.verbosity !== null && prefs.verbosity !== undefined) {
    const verbosityLabels: Record<number, string> = {
      1: "very brief (bullet points preferred)",
      2: "concise",
      3: "balanced",
      4: "detailed",
      5: "comprehensive with examples",
    };
    lines.push(`- Verbosity level: ${verbosityLabels[prefs.verbosity] || "balanced"}`);
  }
  if (prefs.citationStrictness && prefs.citationStrictness !== "default") {
    lines.push(`- Citation approach: ${prefs.citationStrictness}`);
  }
  
  if (lines.length === 0) return "";
  return `\n## User Preferences\n${lines.join("\n")}\n`;
}

export function buildCaseMemoryPromptFragment(memory: LexiCaseMemory | null): string {
  if (!memory) return "";
  const lines: string[] = [];
  
  if (memory.pinnedContext && memory.pinnedContext.trim()) {
    lines.push(`**Pinned Context:** ${memory.pinnedContext.trim()}`);
  }
  
  if (memory.goalsJson && Array.isArray(memory.goalsJson) && memory.goalsJson.length > 0) {
    const goals = memory.goalsJson as string[];
    lines.push(`**Case Goals:**\n${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}`);
  }
  
  if (memory.writingRulesJson && typeof memory.writingRulesJson === "object") {
    const rules = memory.writingRulesJson as { bannedPhrases?: string[]; tone?: string };
    if (rules.tone) {
      lines.push(`**Preferred Tone:** ${rules.tone}`);
    }
    if (rules.bannedPhrases && rules.bannedPhrases.length > 0) {
      lines.push(`**Avoid These Phrases:** ${rules.bannedPhrases.join(", ")}`);
    }
  }
  
  if (memory.lastAutoSummary && memory.lastAutoSummary.trim()) {
    lines.push(`**Recent Case Summary:** ${memory.lastAutoSummary.trim()}`);
  }
  
  if (lines.length === 0) return "";
  return `\n## Case-Specific Memory\n${lines.join("\n\n")}\n`;
}

export function buildPersonalizationPrompt(personalization: LexiPersonalization): string {
  const prefsFragment = buildPrefsPromptFragment(personalization.prefs);
  const memoryFragment = buildCaseMemoryPromptFragment(personalization.caseMemory);
  
  if (!prefsFragment && !memoryFragment) return "";
  
  return `${prefsFragment}${memoryFragment}`;
}
