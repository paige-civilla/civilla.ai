import { storage } from "../storage";
import OpenAI from "openai";
import type { CaseClaim } from "@shared/schema";

const MIN_TEXT_LENGTH = 300;
const MAX_TEXT_SLICE = 20000;
const MAX_CLAIMS = 10;
const DEBOUNCE_MS = 60_000;
const CONCURRENCY_LIMIT = 2;
const RETRY_DELAY_MS = 30_000;

let activeJobs = 0;
const processedEvidence = new Set<string>();
const pendingJobs = new Map<string, NodeJS.Timeout>();

interface AutoSuggestResult {
  created: number;
  skipped: number;
  error?: string;
}

function createConcurrencyLimiter(maxConcurrency: number) {
  const queue: Array<() => void> = [];
  let current = 0;

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        current++;
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          current--;
          if (queue.length > 0) {
            const next = queue.shift();
            next?.();
          }
        }
      };

      if (current < maxConcurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

const claimsLimiter = createConcurrencyLimiter(CONCURRENCY_LIMIT);

export function hasAutoSuggestRun(evidenceId: string): boolean {
  return processedEvidence.has(evidenceId);
}

export function isAutoSuggestPending(caseId: string): boolean {
  return pendingJobs.has(caseId);
}

export function cancelAutoSuggest(caseId: string): void {
  const timer = pendingJobs.get(caseId);
  if (timer) {
    clearTimeout(timer);
    pendingJobs.delete(caseId);
  }
}

interface TriggerOptions {
  userId: string;
  caseId: string;
  evidenceId: string;
  extractedText: string;
}

export function triggerClaimsSuggestionForEvidence(opts: TriggerOptions): void {
  const { userId, caseId, evidenceId, extractedText } = opts;

  if (extractedText.length < MIN_TEXT_LENGTH) {
    console.log(`[AutoSuggest] Skipped evidence ${evidenceId}: text too short (${extractedText.length} chars)`);
    return;
  }

  if (processedEvidence.has(evidenceId)) {
    console.log(`[AutoSuggest] Skipped evidence ${evidenceId}: already processed`);
    return;
  }

  const existingTimer = pendingJobs.get(caseId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    pendingJobs.delete(caseId);
    claimsLimiter(async () => {
      await runAutoSuggestForEvidence({ userId, caseId, evidenceId });
    }).catch(err => {
      console.error(`[AutoSuggest] Limiter error for evidence ${evidenceId}:`, err);
    });
  }, DEBOUNCE_MS);

  pendingJobs.set(caseId, timer);
  console.log(`[AutoSuggest] Scheduled for evidence ${evidenceId} (debounced 60s)`);
}

async function runAutoSuggestForEvidence(opts: { userId: string; caseId: string; evidenceId: string }): Promise<AutoSuggestResult> {
  const { userId, caseId, evidenceId } = opts;

  processedEvidence.add(evidenceId);

  try {
    await storage.createActivityLog(userId, caseId, "claims_suggesting", `Background: generating suggested claims...`, {
      evidenceId,
      status: "started",
    });

    const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
    if (!extraction || extraction.status !== "complete" || !extraction.extractedText?.trim()) {
      console.log(`[AutoSuggest] Skipped evidence ${evidenceId}: extraction not complete`);
      return { created: 0, skipped: 0, error: "extraction_not_complete" };
    }

    const existingClaims = await storage.listCaseClaims(userId, caseId, { evidenceFileId: evidenceId });
    if (existingClaims.length > 0) {
      console.log(`[AutoSuggest] Skipped evidence ${evidenceId}: claims already exist (${existingClaims.length})`);
      return { created: 0, skipped: 0, error: "claims_exist" };
    }

    if (!process.env.OPENAI_API_KEY) {
      await storage.createActivityLog(userId, caseId, "claims_suggesting", `Background claims failed: invalid API key`, {
        evidenceId,
        status: "blocked_invalid_key",
      });
      console.error(`[AutoSuggest] No OpenAI API key configured`);
      return { created: 0, skipped: 0, error: "no_api_key" };
    }

    const inputText = extraction.extractedText.slice(0, MAX_TEXT_SLICE);
    const result = await generateClaimsWithRetry(userId, caseId, evidenceId, inputText);

    await storage.createActivityLog(userId, caseId, "claims_suggested", `Generated ${result.created} suggested claims`, {
      evidenceId,
      created: result.created,
      skipped: result.skipped,
      status: "completed",
    });

    if (result.created >= 3) {
      await bootstrapIssueGroupings(userId, caseId);
    }

    console.log(`[AutoSuggest] Complete for evidence ${evidenceId}: created=${result.created}, skipped=${result.skipped}`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[AutoSuggest] Error for evidence ${evidenceId}:`, error);

    await storage.createActivityLog(userId, caseId, "claims_suggesting", `Background claims failed: ${errorMsg}`, {
      evidenceId,
      status: "failed",
      error: errorMsg,
    });

    return { created: 0, skipped: 0, error: errorMsg };
  }
}

async function generateClaimsWithRetry(
  userId: string,
  caseId: string,
  evidenceId: string,
  inputText: string,
  retryCount = 0
): Promise<AutoSuggestResult> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a legal document analyst extracting factual claims from evidence. Your job is to identify NEUTRAL, FACTUAL statements that can be verified from the text.

RULES:
- Claims must be neutral factual statements only
- DO NOT infer dates, motives, diagnoses, or intent
- If date/location is unclear, set missingInfoFlag=true and do NOT invent
- citation.quote must be a short direct excerpt present in the text
- Keep claims objective and traceable

Return ONLY valid JSON (no markdown) as an array of objects:
[
  {
    "claimText": "Factual statement here",
    "claimType": "fact"|"procedural"|"context"|"communication"|"financial"|"medical"|"school"|"custody",
    "tags": ["relevant", "tags"],
    "missingInfoFlag": false,
    "citation": {
      "quote": "exact short quote from text",
      "pageNumber": null,
      "timestampSeconds": null,
      "startOffset": null,
      "endOffset": null
    }
  }
]

Limit to ${MAX_CLAIMS} most important claims.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract factual claims from this evidence:\n\n${inputText}` }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    let suggestions: Array<{
      claimText: string;
      claimType: string;
      tags: string[];
      missingInfoFlag: boolean;
      citation: {
        quote: string;
        pageNumber: number | null;
        timestampSeconds: number | null;
        startOffset: number | null;
        endOffset: number | null;
      };
    }> = [];

    try {
      const parsed = JSON.parse(responseText);
      suggestions = Array.isArray(parsed) ? parsed : (parsed.claims || parsed.suggestions || []);
    } catch {
      console.error("[AutoSuggest] Failed to parse OpenAI response");
      return { created: 0, skipped: 0, error: "parse_error" };
    }

    const existingClaims = await storage.listCaseClaims(userId, caseId);
    const normalizedExisting = new Set(
      existingClaims
        .filter(c => c.status === "suggested" || c.status === "accepted")
        .map(c => c.claimText.toLowerCase().trim().replace(/\s+/g, " "))
    );

    let created = 0;
    let skipped = 0;
    const validTypes = ["fact", "procedural", "context", "communication", "financial", "medical", "school", "custody"];

    for (const sug of suggestions.slice(0, MAX_CLAIMS)) {
      if (!sug.claimText?.trim()) {
        skipped++;
        continue;
      }

      const normalized = sug.claimText.toLowerCase().trim().replace(/\s+/g, " ");
      if (normalizedExisting.has(normalized)) {
        skipped++;
        continue;
      }
      normalizedExisting.add(normalized);

      const citationPointer = await storage.createCitationPointer(userId, caseId, {
        evidenceFileId: evidenceId,
        quote: sug.citation?.quote?.slice(0, 500) || "",
        pageNumber: sug.citation?.pageNumber ?? null,
        timestampSeconds: sug.citation?.timestampSeconds ?? null,
        startOffset: sug.citation?.startOffset ?? null,
        endOffset: sug.citation?.endOffset ?? null,
        excerpt: sug.citation?.quote?.slice(0, 200) || null,
        confidence: 0.8,
      });

      const claimType = validTypes.includes(sug.claimType) ? sug.claimType as any : "fact";

      const claim = await storage.createCaseClaim(userId, caseId, {
        claimText: sug.claimText.trim(),
        claimType,
        tags: Array.isArray(sug.tags) ? sug.tags : [],
        missingInfoFlag: sug.missingInfoFlag === true,
        createdFrom: "ai_suggested",
        status: "suggested",
      });

      await storage.attachClaimCitation(userId, claim.id, citationPointer.id);
      created++;
    }

    return { created, skipped };
  } catch (error: any) {
    if (error?.status === 429 && retryCount < 1) {
      console.log(`[AutoSuggest] Rate limited, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return generateClaimsWithRetry(userId, caseId, evidenceId, inputText, retryCount + 1);
    }

    if (error?.status === 401) {
      await storage.createActivityLog(userId, caseId, "claims_suggesting", `Blocked: invalid OpenAI key`, {
        evidenceId,
        status: "blocked_invalid_key",
      });
    } else if (error?.status === 429) {
      await storage.createActivityLog(userId, caseId, "claims_suggesting", `Rate limited by OpenAI`, {
        evidenceId,
        status: "rate_limited",
      });
    }

    throw error;
  }
}

async function bootstrapIssueGroupings(userId: string, caseId: string): Promise<void> {
  try {
    const existingIssues = await storage.listIssueGroupings(userId, caseId);
    if (existingIssues.length > 0) {
      console.log(`[AutoSuggest] Issue groupings already exist for case ${caseId}, skipping bootstrap`);
      return;
    }

    const claims = await storage.listCaseClaims(userId, caseId);
    if (claims.length < 3) {
      return;
    }

    const tagCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    for (const claim of claims) {
      typeCounts.set(claim.claimType, (typeCounts.get(claim.claimType) || 0) + 1);
      const tags = claim.tags as string[] || [];
      for (const tag of tags) {
        tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1);
      }
    }

    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type]) => type);

    const topTags = Array.from(tagCounts.entries())
      .filter(([tag]) => tag.length > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    const issueGroups: Array<{ title: string; description: string; tags: string[] }> = [];

    const typeLabels: Record<string, string> = {
      fact: "Key Facts",
      procedural: "Procedural History",
      context: "Background Context",
      communication: "Communications",
      financial: "Financial Matters",
      medical: "Medical Records",
      school: "School Records",
      custody: "Custody Matters",
    };

    for (const type of topTypes) {
      issueGroups.push({
        title: typeLabels[type] || `${type.charAt(0).toUpperCase()}${type.slice(1)} Evidence`,
        description: `Claims related to ${type} from case evidence`,
        tags: [type],
      });
    }

    for (const tag of topTags) {
      if (!topTypes.includes(tag)) {
        issueGroups.push({
          title: `${tag.charAt(0).toUpperCase()}${tag.slice(1)} Issues`,
          description: `Claims tagged with "${tag}"`,
          tags: [tag],
        });
      }
    }

    const created: string[] = [];
    for (const group of issueGroups.slice(0, 6)) {
      const issue = await storage.createIssueGrouping(userId, caseId, {
        title: group.title,
        description: group.description,
        tags: group.tags,
      });
      created.push(issue.id);

      for (const claim of claims) {
        const claimTags = (claim.tags as string[] || []).map(t => t.toLowerCase());
        if (group.tags.some(t => claimTags.includes(t) || claim.claimType === t)) {
          await storage.addClaimToIssue(userId, issue.id, claim.id);
        }
      }
    }

    console.log(`[AutoSuggest] Bootstrapped ${created.length} issue groupings for case ${caseId}`);
  } catch (error) {
    console.error(`[AutoSuggest] Error bootstrapping issue groupings:`, error);
  }
}

export function getAutoSuggestStats(): { active: number; pending: number; processed: number } {
  return {
    active: activeJobs,
    pending: pendingJobs.size,
    processed: processedEvidence.size,
  };
}
