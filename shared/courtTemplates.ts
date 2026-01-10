export type CourtTemplateKey = "declaration" | "statement_of_facts" | "exhibit_index";

export interface CourtTemplateSection {
  key: string;
  title: string;
  description: string;
  claimTypes?: string[];
}

export interface CourtTemplateConfig {
  templateKey: CourtTemplateKey;
  displayName: string;
  description: string;
  requiredCitationCount: number;
  allowMissingInfoClaims: boolean;
  sections: CourtTemplateSection[];
  introTemplate: string;
  footerTemplate: string;
}

export const COURT_TEMPLATES: Record<CourtTemplateKey, CourtTemplateConfig> = {
  declaration: {
    templateKey: "declaration",
    displayName: "Declaration (Facts Only)",
    description: "A sworn statement presenting factual claims with evidence citations. Each paragraph states a fact supported by documentary evidence.",
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      {
        key: "intro",
        title: "Introduction",
        description: "Declarant identification and case reference",
      },
      {
        key: "facts",
        title: "Statement of Facts",
        description: "Numbered factual claims with citations",
        claimTypes: ["fact", "procedural", "context"],
      },
      {
        key: "communications",
        title: "Communications",
        description: "Claims related to documented communications",
        claimTypes: ["communication"],
      },
      {
        key: "financial",
        title: "Financial Matters",
        description: "Claims related to financial evidence",
        claimTypes: ["financial"],
      },
      {
        key: "conclusion",
        title: "Declaration",
        description: "Standard declaration language",
      },
    ],
    introTemplate: "I, [DECLARANT NAME], declare under penalty of perjury under the laws of [STATE] that the following is true and correct:",
    footerTemplate: "I declare under penalty of perjury under the laws of the State of [STATE] that the foregoing is true and correct.\n\nExecuted on [DATE] at [CITY], [STATE].\n\n_________________________\n[DECLARANT NAME]",
  },

  statement_of_facts: {
    templateKey: "statement_of_facts",
    displayName: "Chronological Statement of Facts",
    description: "A neutral chronological narrative of events, organized by date with evidence citations.",
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      {
        key: "background",
        title: "Background",
        description: "Context and party information",
        claimTypes: ["context", "procedural"],
      },
      {
        key: "chronology",
        title: "Chronology of Events",
        description: "Facts presented in chronological order",
        claimTypes: ["fact", "communication", "financial", "medical", "school", "custody"],
      },
      {
        key: "current_status",
        title: "Current Status",
        description: "Present circumstances",
        claimTypes: ["procedural"],
      },
    ],
    introTemplate: "The following statement of facts is presented for the Court's consideration in the above-captioned matter:",
    footerTemplate: "The foregoing facts are supported by the exhibits referenced herein.",
  },

  exhibit_index: {
    templateKey: "exhibit_index",
    displayName: "Exhibit Index",
    description: "A formatted list of all evidence with descriptions, organized for court filing.",
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      {
        key: "exhibits",
        title: "Exhibit List",
        description: "Numbered exhibits with descriptions",
      },
    ],
    introTemplate: "The following exhibits are submitted in support of [PARTY]'s [MOTION/DECLARATION]:",
    footerTemplate: "",
  },
};

export const COURT_TEMPLATE_LIST = Object.values(COURT_TEMPLATES);

export interface ClaimWithCitations {
  id: string;
  claimText: string;
  claimType: string;
  missingInfoFlag: boolean;
  status: string;
  citations: Array<{
    id: string;
    evidenceFileId: string;
    evidenceFileName?: string;
    pageNumber?: number | null;
    quote: string;
    excerpt?: string | null;
  }>;
}

export interface CompilePreflightResult {
  canCompile: boolean;
  acceptedClaimsCount: number;
  claimsWithCitationsCount: number;
  claimsMissingCitations: Array<{ id: string; claimText: string }>;
  claimsWithMissingInfo: Array<{ id: string; claimText: string }>;
  warnings: string[];
  errors: string[];
}

export interface CompiledCourtDocument {
  templateKey: CourtTemplateKey;
  title: string;
  markdown: string;
  sections: Array<{
    key: string;
    title: string;
    claims: Array<{
      claimId: string;
      paragraphNumber: number;
      text: string;
      citations: string[];
    }>;
  }>;
  sources: Array<{
    evidenceFileId: string;
    fileName: string;
    exhibitLabel: string;
    pagesReferenced: number[];
  }>;
  compiledAt: string;
}
