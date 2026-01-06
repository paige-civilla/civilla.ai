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

interface CasePreferences {
  tone?: "formal" | "friendly" | "concise" | "default";
  formatting?: {
    useBullets?: boolean;
    useHeadings?: boolean;
    shortParagraphs?: boolean;
  };
  bannedPhrases?: string[];
  customInstructions?: string;
}

export function buildCaseMemoryPromptFragment(memory: LexiCaseMemory | null): string {
  if (!memory) return "";
  const lines: string[] = [];
  
  if (memory.memoryMarkdown && memory.memoryMarkdown.trim()) {
    lines.push(`**Case Context:**\n${memory.memoryMarkdown.trim()}`);
  }
  
  if (memory.preferencesJson && typeof memory.preferencesJson === "object") {
    const prefs = memory.preferencesJson as CasePreferences;
    
    if (prefs.tone && prefs.tone !== "default") {
      lines.push(`**Preferred Tone:** ${prefs.tone}`);
    }
    
    if (prefs.formatting) {
      const fmtRules: string[] = [];
      if (prefs.formatting.useBullets) fmtRules.push("use bullet points");
      if (prefs.formatting.useHeadings) fmtRules.push("use markdown headings");
      if (prefs.formatting.shortParagraphs) fmtRules.push("keep paragraphs short");
      if (fmtRules.length > 0) {
        lines.push(`**Formatting Preferences:** ${fmtRules.join(", ")}`);
      }
    }
    
    if (prefs.bannedPhrases && prefs.bannedPhrases.length > 0) {
      lines.push(`**Avoid These Phrases:** ${prefs.bannedPhrases.join(", ")}`);
    }
    
    if (prefs.customInstructions && prefs.customInstructions.trim()) {
      lines.push(`**Custom Instructions:** ${prefs.customInstructions.trim()}`);
    }
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
