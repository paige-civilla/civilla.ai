import { getTemplateByKey, type TemplateDefinition, type AllowedSource } from "./registry";
import type { IStorage } from "../storage";
import type { CaseClaim, CitationPointer, TimelineEvent } from "@shared/schema";

type EvidenceFile = Awaited<ReturnType<IStorage["listEvidenceFiles"]>>[0];

export interface CompileOptions {
  includeTimeline?: boolean;
  includeSnippets?: boolean;
  includePinnedTrialPrep?: boolean;
  includeEvidenceFacts?: boolean;
}

export interface ClaimWithCitations {
  claim: CaseClaim;
  citations: CitationPointer[];
}

export interface TracedSentence {
  sentenceId: string;
  sectionKey: string;
  sectionTitle: string;
  paragraphNumber: number;
  text: string;
  claimId: string;
  citationIds: string[];
  evidenceFileIds: string[];
  citationDetails: Array<{
    citationId: string;
    evidenceFileId: string;
    fileName: string;
    pageNumber?: number;
    timestampSeconds?: number;
    quoteSnippet: string;
  }>;
}

export interface CompileResult {
  ok: boolean;
  markdown: string;
  sources: Array<{
    evidenceFileId: string;
    fileName: string;
    exhibitLabel: string;
    pagesReferenced: number[];
  }>;
  tracedSentences: TracedSentence[];
  stats: {
    totalClaimsIncluded: number;
    totalCitations: number;
    sectionsGenerated: number;
  };
  errors?: string[];
}

export interface PreflightResult {
  templateReady: boolean;
  acceptedClaimsCount: number;
  includedClaimsCount: number;
  uncitedIncludedClaimsCount: number;
  uncitedClaims: Array<{ id: string; text: string }>;
  missingInfoIncludedClaimsCount: number;
  missingInfoClaims: Array<{ id: string; text: string }>;
  extractionCoveragePercent: number;
  reasons: string[];
  warnings: string[];
}

function formatCitationInline(
  citation: CitationPointer,
  evidenceMap: Map<string, EvidenceFile>,
  exhibitLabels: Map<string, string>
): string {
  const evidence = evidenceMap.get(citation.evidenceFileId);
  const fileName = evidence?.originalName || "Unknown";
  const exhibitLabel = exhibitLabels.get(citation.evidenceFileId) || fileName;

  let ref = `[Source: ${exhibitLabel}`;
  if (citation.pageNumber) {
    ref += `, p.${citation.pageNumber}`;
  } else if (citation.timestampSeconds) {
    ref += `, t=${citation.timestampSeconds}s`;
  } else {
    ref += `, verify location`;
  }
  ref += `]`;
  return ref;
}

function generateExhibitLabel(index: number): string {
  if (index <= 26) {
    return `Exhibit ${String.fromCharCode(64 + index)}`;
  }
  const first = Math.floor((index - 1) / 26);
  const second = ((index - 1) % 26) + 1;
  return `Exhibit ${String.fromCharCode(64 + first)}${String.fromCharCode(64 + second)}`;
}

function filterClaimsByTemplate(
  claims: CaseClaim[],
  template: TemplateDefinition,
  sectionKey?: string
): CaseClaim[] {
  let filtered = [...claims];

  if (template.requiredClaimTypes && template.requiredClaimTypes.length > 0) {
    filtered = filtered.filter(c => template.requiredClaimTypes!.includes(c.claimType));
  }

  if (template.requiredClaimTags && template.requiredClaimTags.length > 0) {
    filtered = filtered.filter(c => {
      const tags = Array.isArray(c.tags) ? c.tags : [];
      return template.requiredClaimTags!.some(tag => tags.includes(tag));
    });
  }

  if (sectionKey) {
    const section = template.sections.find(s => s.key === sectionKey);
    if (section) {
      if (section.claimTypes && section.claimTypes.length > 0) {
        filtered = filtered.filter(c => section.claimTypes!.includes(c.claimType));
      }
      if (section.claimTags && section.claimTags.length > 0) {
        filtered = filtered.filter(c => {
          const tags = Array.isArray(c.tags) ? c.tags : [];
          return section.claimTags!.some(tag => tags.includes(tag));
        });
      }
    }
  }

  return filtered;
}

export async function runPreflight(
  storage: IStorage,
  userId: string,
  caseId: string,
  templateKey: string
): Promise<PreflightResult> {
  const template = getTemplateByKey(templateKey);
  if (!template) {
    return {
      templateReady: false,
      acceptedClaimsCount: 0,
      includedClaimsCount: 0,
      uncitedIncludedClaimsCount: 0,
      uncitedClaims: [],
      missingInfoIncludedClaimsCount: 0,
      missingInfoClaims: [],
      extractionCoveragePercent: 0,
      reasons: ["Template not found"],
      warnings: [],
    };
  }

  const acceptedClaims = await storage.listCaseClaims(userId, caseId, { status: "accepted" });
  const includedClaims = filterClaimsByTemplate(acceptedClaims, template);

  const uncitedClaims: Array<{ id: string; text: string }> = [];
  const missingInfoClaims: Array<{ id: string; text: string }> = [];
  let citedCount = 0;

  for (const claim of includedClaims) {
    const citations = await storage.listClaimCitations(userId, claim.id);
    if (citations.length === 0) {
      uncitedClaims.push({ id: claim.id, text: claim.claimText.substring(0, 100) });
    } else {
      citedCount++;
    }
    if (claim.missingInfoFlag) {
      missingInfoClaims.push({ id: claim.id, text: claim.claimText.substring(0, 100) });
    }
  }

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (includedClaims.length === 0) {
    reasons.push("No accepted claims match this template's requirements");
  }

  if (template.requiredCitationCount > 0 && uncitedClaims.length > 0) {
    reasons.push(`${uncitedClaims.length} claim(s) missing required citations`);
  }

  if (!template.allowMissingInfoClaims && missingInfoClaims.length > 0) {
    reasons.push(`${missingInfoClaims.length} claim(s) flagged as needing more info`);
  } else if (missingInfoClaims.length > 0) {
    warnings.push(`${missingInfoClaims.length} claim(s) flagged as needing more info (allowed but review recommended)`);
  }

  const extractionCoveragePercent = includedClaims.length > 0
    ? Math.round((citedCount / includedClaims.length) * 100)
    : 0;

  return {
    templateReady: reasons.length === 0 && includedClaims.length > 0,
    acceptedClaimsCount: acceptedClaims.length,
    includedClaimsCount: includedClaims.length,
    uncitedIncludedClaimsCount: uncitedClaims.length,
    uncitedClaims,
    missingInfoIncludedClaimsCount: missingInfoClaims.length,
    missingInfoClaims,
    extractionCoveragePercent,
    reasons,
    warnings,
  };
}

export async function compileTemplate(
  storage: IStorage,
  userId: string,
  caseId: string,
  templateKey: string,
  title: string,
  options: CompileOptions = {}
): Promise<CompileResult> {
  const template = getTemplateByKey(templateKey);
  if (!template) {
    return {
      ok: false,
      markdown: "",
      sources: [],
      tracedSentences: [],
      stats: { totalClaimsIncluded: 0, totalCitations: 0, sectionsGenerated: 0 },
      errors: ["Template not found"],
    };
  }

  const acceptedClaims = await storage.listCaseClaims(userId, caseId, { status: "accepted" });
  const evidenceFiles = await storage.listEvidenceFiles(userId, caseId);
  const evidenceMap = new Map(evidenceFiles.map(e => [e.id, e]));

  const claimsWithCitations: ClaimWithCitations[] = [];
  const errors: string[] = [];

  const includedClaims = filterClaimsByTemplate(acceptedClaims, template);

  for (const claim of includedClaims) {
    const citations = await storage.listClaimCitations(userId, claim.id);

    if (template.requiredCitationCount > 0 && citations.length < template.requiredCitationCount) {
      errors.push(`Claim "${claim.claimText.substring(0, 50)}..." has ${citations.length} citations (requires ${template.requiredCitationCount})`);
      continue;
    }

    if (!template.allowMissingInfoClaims && claim.missingInfoFlag) {
      errors.push(`Claim "${claim.claimText.substring(0, 50)}..." is flagged as missing info`);
      continue;
    }

    claimsWithCitations.push({ claim, citations });
  }

  if (errors.length > 0 && template.requiredCitationCount > 0) {
    return {
      ok: false,
      markdown: "",
      sources: [],
      tracedSentences: [],
      stats: { totalClaimsIncluded: 0, totalCitations: 0, sectionsGenerated: 0 },
      errors,
    };
  }

  if (claimsWithCitations.length === 0 && template.allowedSources.includes("claims")) {
    return {
      ok: false,
      markdown: "",
      sources: [],
      tracedSentences: [],
      stats: { totalClaimsIncluded: 0, totalCitations: 0, sectionsGenerated: 0 },
      errors: ["No claims available to compile"],
    };
  }

  const exhibitLabels = new Map<string, string>();
  let exhibitCounter = 0;

  const getExhibitLabel = (evidenceId: string): string => {
    if (!exhibitLabels.has(evidenceId)) {
      exhibitCounter++;
      exhibitLabels.set(evidenceId, generateExhibitLabel(exhibitCounter));
    }
    return exhibitLabels.get(evidenceId)!;
  };

  for (const { citations } of claimsWithCitations) {
    for (const cit of citations) {
      getExhibitLabel(cit.evidenceFileId);
    }
  }

  let markdown = `# ${title}\n\n`;

  if (template.educationalOnly) {
    markdown += `> **EDUCATIONAL / ORGANIZATIONAL USE ONLY**\n\n`;
  }

  if (template.introTemplate) {
    markdown += `${template.introTemplate}\n\n`;
  }

  let sectionsGenerated = 0;
  let paragraphNumber = 0;
  const tracedSentences: TracedSentence[] = [];

  for (const section of template.sections) {
    if (section.key === "intro" || section.key === "conclusion" || section.key === "cover") {
      continue;
    }

    let sectionClaims: ClaimWithCitations[];

    if (section.claimTypes && section.claimTypes.length > 0) {
      sectionClaims = claimsWithCitations.filter(
        ({ claim }) => section.claimTypes!.includes(claim.claimType)
      );
    } else if (section.claimTags && section.claimTags.length > 0) {
      sectionClaims = claimsWithCitations.filter(({ claim }) => {
        const tags = Array.isArray(claim.tags) ? claim.tags : [];
        return section.claimTags!.some(tag => tags.includes(tag));
      });
    } else {
      sectionClaims = claimsWithCitations;
    }

    if (sectionClaims.length === 0 && section.optional) {
      continue;
    }

    if (sectionClaims.length === 0 && section.sourceType === "timeline" && options.includeTimeline) {
      markdown += `## ${section.title}\n\n`;
      markdown += `*Timeline events would be included here*\n\n`;
      sectionsGenerated++;
      continue;
    }

    if (sectionClaims.length === 0 && section.sourceType === "trialPrep" && options.includePinnedTrialPrep) {
      markdown += `## ${section.title}\n\n`;
      markdown += `*Trial prep items would be included here*\n\n`;
      sectionsGenerated++;
      continue;
    }

    if (sectionClaims.length === 0) {
      continue;
    }

    markdown += `## ${section.title}\n\n`;
    sectionsGenerated++;

    for (const { claim, citations } of sectionClaims) {
      paragraphNumber++;

      const citationRefs = citations.map(cit =>
        formatCitationInline(cit, evidenceMap, exhibitLabels)
      );

      markdown += `${paragraphNumber}. ${claim.claimText} ${citationRefs.join(" ")}\n\n`;

      tracedSentences.push({
        sentenceId: `${section.key}-${paragraphNumber}`,
        sectionKey: section.key,
        sectionTitle: section.title,
        paragraphNumber,
        text: claim.claimText,
        claimId: claim.id,
        citationIds: citations.map(c => c.id),
        evidenceFileIds: Array.from(new Set(citations.map(c => c.evidenceFileId))),
        citationDetails: citations.map(cit => {
          const evidence = evidenceMap.get(cit.evidenceFileId);
          return {
            citationId: cit.id,
            evidenceFileId: cit.evidenceFileId,
            fileName: evidence?.originalName || "Unknown",
            pageNumber: cit.pageNumber ?? undefined,
            timestampSeconds: cit.timestampSeconds ?? undefined,
            quoteSnippet: (cit.quote || "").slice(0, 140),
          };
        }),
      });
    }
  }

  if (options.includeEvidenceFacts) {
    const allFacts = await storage.listEvidenceFactsByCase(userId, caseId);
    const pendingFacts = allFacts.filter(f => !f.promotedToClaim);
    
    if (pendingFacts.length > 0) {
      markdown += `## Extracted Facts Summary\n\n`;
      markdown += `*The following facts were automatically extracted from evidence files and have not yet been promoted to claims. Review for accuracy.*\n\n`;
      
      const factsByType = new Map<string, typeof pendingFacts>();
      for (const fact of pendingFacts) {
        const type = fact.factType || "other";
        if (!factsByType.has(type)) {
          factsByType.set(type, []);
        }
        factsByType.get(type)!.push(fact);
      }
      
      const typeOrder = ["date", "event", "communication", "financial", "medical", "custody", "procedural", "other"];
      for (const factType of typeOrder) {
        const facts = factsByType.get(factType);
        if (!facts || facts.length === 0) continue;
        
        const typeLabel = factType.charAt(0).toUpperCase() + factType.slice(1);
        markdown += `### ${typeLabel} Facts\n\n`;
        
        for (const fact of facts) {
          const confidence = fact.confidence != null ? ` (${fact.confidence}% confidence)` : "";
          const evidence = evidenceMap.get(fact.evidenceId);
          const sourceRef = evidence ? ` [Source: ${evidence.originalName}]` : "";
          markdown += `- ${fact.factText}${confidence}${sourceRef}\n`;
        }
        markdown += `\n`;
      }
    }
  }

  if (template.footerTemplate) {
    markdown += `---\n\n${template.footerTemplate}\n\n`;
  }

  const sources: CompileResult["sources"] = [];

  if (exhibitLabels.size > 0) {
    markdown += `## Sources\n\n`;

    const entries = Array.from(exhibitLabels.entries());
    for (const [evidenceId, exhibitLabel] of entries) {
      const evidence = evidenceMap.get(evidenceId);
      if (!evidence) continue;

      const pagesReferenced: number[] = [];
      for (const { citations } of claimsWithCitations) {
        for (const cit of citations) {
          if (cit.evidenceFileId === evidenceId && cit.pageNumber) {
            if (!pagesReferenced.includes(cit.pageNumber)) {
              pagesReferenced.push(cit.pageNumber);
            }
          }
        }
      }
      pagesReferenced.sort((a, b) => a - b);

      const pageRef = pagesReferenced.length > 0
        ? ` (pp. ${pagesReferenced.join(", ")})`
        : "";

      markdown += `- **${exhibitLabel}**: ${evidence.originalName}${pageRef}\n`;

      sources.push({
        evidenceFileId: evidenceId,
        fileName: evidence.originalName,
        exhibitLabel,
        pagesReferenced,
      });
    }
  }

  let totalCitations = 0;
  for (const { citations } of claimsWithCitations) {
    totalCitations += citations.length;
  }

  return {
    ok: true,
    markdown,
    sources,
    tracedSentences,
    stats: {
      totalClaimsIncluded: claimsWithCitations.length,
      totalCitations,
      sectionsGenerated,
    },
  };
}
