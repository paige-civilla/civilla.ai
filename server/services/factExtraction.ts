import OpenAI from "openai";
import { storage } from "../storage";
import type { EvidenceFact, InsertEvidenceFact } from "@shared/schema";

const FACT_TYPES = ["date", "event", "communication", "financial", "medical", "custody", "procedural", "other"] as const;
type FactType = typeof FACT_TYPES[number];

interface ExtractedFact {
  factText: string;
  factType: FactType;
  confidence: number;
  sourceQuote?: string;
  pageNumber?: number;
}

interface FactExtractionResult {
  facts: ExtractedFact[];
  processingTimeMs: number;
  error?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FACT_EXTRACTION_PROMPT = `You are a legal document analyst extracting structured facts from evidence documents.

Extract key facts that would be relevant for legal case preparation. For each fact, identify:
1. The fact itself (clear, concise statement)
2. The type of fact (date, event, communication, financial, medical, custody, procedural, or other)
3. A confidence score (0-100) based on how clearly the fact is stated
4. The source quote from the document (if identifiable)

Focus on:
- Dates and times of events
- Key communications between parties
- Financial transactions or amounts
- Medical information (if relevant)
- Custody arrangements or visitation
- Procedural events (filings, hearings, etc.)
- Any other significant factual claims

Return a JSON array of facts. Each fact should have:
{
  "factText": "Clear statement of the fact",
  "factType": "date|event|communication|financial|medical|custody|procedural|other",
  "confidence": 85,
  "sourceQuote": "Relevant quote from document"
}

Be thorough but avoid speculation. Only extract facts that are clearly stated or strongly implied.`;

export async function extractFactsFromText(
  text: string,
  options?: { maxFacts?: number }
): Promise<FactExtractionResult> {
  const startTime = Date.now();
  const maxFacts = options?.maxFacts ?? 50;

  if (!text || text.trim().length < 50) {
    return {
      facts: [],
      processingTimeMs: Date.now() - startTime,
      error: "Insufficient text for fact extraction",
    };
  }

  try {
    const truncatedText = text.slice(0, 15000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: FACT_EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Extract facts from the following document text:\n\n${truncatedText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        facts: [],
        processingTimeMs: Date.now() - startTime,
        error: "No response from AI",
      };
    }

    let parsed: { facts?: ExtractedFact[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        facts: [],
        processingTimeMs: Date.now() - startTime,
        error: "Failed to parse AI response",
      };
    }

    const rawFacts = parsed.facts ?? [];
    const validFacts: ExtractedFact[] = rawFacts
      .filter((f) => f.factText && typeof f.factText === "string")
      .map((f) => ({
        factText: f.factText.slice(0, 1000),
        factType: FACT_TYPES.includes(f.factType as FactType) ? (f.factType as FactType) : "other",
        confidence: typeof f.confidence === "number" ? Math.min(100, Math.max(0, f.confidence)) : 50,
        sourceQuote: f.sourceQuote?.slice(0, 500),
        pageNumber: f.pageNumber,
      }))
      .slice(0, maxFacts);

    return {
      facts: validFacts,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      facts: [],
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error during fact extraction",
    };
  }
}

export async function runFactExtractionForEvidence(
  userId: string,
  caseId: string,
  evidenceId: string
): Promise<{ success: boolean; factsCreated: number; error?: string }> {
  const evidence = await storage.getEvidenceFile(evidenceId, userId);
  if (!evidence || evidence.caseId !== caseId) {
    return { success: false, factsCreated: 0, error: "Evidence file not found" };
  }

  const extractions = await storage.listEvidenceExtractions(userId, caseId, evidenceId);
  const textContent = extractions.map((e) => e.extractedText || "").join("\n\n");

  if (!textContent || textContent.trim().length < 50) {
    const ocrPages = await storage.listEvidenceOcrPages(userId, caseId, evidenceId);
    const ocrText = ocrPages.map((p) => p.text || "").join("\n\n");
    
    if (!ocrText || ocrText.trim().length < 50) {
      return { success: false, factsCreated: 0, error: "No extracted text available for this evidence" };
    }
    
    const result = await extractFactsFromText(ocrText);
    if (result.error) {
      return { success: false, factsCreated: 0, error: result.error };
    }

    let factsCreated = 0;
    for (const fact of result.facts) {
      const insertData: InsertEvidenceFact = {
        evidenceId,
        factText: fact.factText,
        factType: fact.factType,
        confidence: fact.confidence,
      };
      await storage.createEvidenceFact(userId, caseId, insertData);
      factsCreated++;
    }

    return { success: true, factsCreated };
  }

  const result = await extractFactsFromText(textContent);
  if (result.error) {
    return { success: false, factsCreated: 0, error: result.error };
  }

  let factsCreated = 0;
  for (const fact of result.facts) {
    const insertData: InsertEvidenceFact = {
      evidenceId,
      factText: fact.factText,
      factType: fact.factType,
      confidence: fact.confidence,
    };
    await storage.createEvidenceFact(userId, caseId, insertData);
    factsCreated++;
  }

  return { success: true, factsCreated };
}

export async function promoteFactToClaim(
  userId: string,
  caseId: string,
  factId: string
): Promise<{ success: boolean; claimId?: string; error?: string }> {
  const fact = await storage.getEvidenceFact(userId, factId);
  if (!fact || fact.caseId !== caseId) {
    return { success: false, error: "Evidence fact not found" };
  }

  if (fact.promotedToClaim) {
    return { success: false, error: "Fact has already been promoted to a claim" };
  }

  const claim = await storage.createCaseClaim(userId, caseId, {
    claimText: fact.factText,
    claimType: "fact",
    createdFrom: "evidence_fact",
    status: "suggested",
    tags: [fact.factType],
  });

  await storage.updateEvidenceFact(userId, factId, {
    promotedToClaim: true,
    promotedClaimId: claim.id,
  });

  if (fact.citationId) {
    await storage.attachClaimCitation(userId, claim.id, fact.citationId);
  }

  return { success: true, claimId: claim.id };
}

export function getFactTypeLabel(factType: string): string {
  const labels: Record<string, string> = {
    date: "Date",
    event: "Event",
    communication: "Communication",
    financial: "Financial",
    medical: "Medical",
    custody: "Custody",
    procedural: "Procedural",
    other: "Other",
  };
  return labels[factType] || "Other";
}

export function getFactTypeColor(factType: string): string {
  const colors: Record<string, string> = {
    date: "blue",
    event: "green",
    communication: "purple",
    financial: "yellow",
    medical: "red",
    custody: "orange",
    procedural: "gray",
    other: "slate",
  };
  return colors[factType] || "slate";
}
