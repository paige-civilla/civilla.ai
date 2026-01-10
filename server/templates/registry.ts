export type TemplateCategory = 
  | "declarations"
  | "procedural"
  | "evidence"
  | "communications"
  | "parenting"
  | "patterns"
  | "courtroom";

export type AllowedSource = "claims" | "timeline" | "snippets" | "trialPrep";

export interface SectionBlueprint {
  key: string;
  title: string;
  description: string;
  claimTypes?: string[];
  claimTags?: string[];
  sourceType?: AllowedSource;
  optional?: boolean;
}

export interface TemplateDefinition {
  templateKey: string;
  displayName: string;
  category: TemplateCategory;
  description: string;
  educationalOnly: boolean;
  allowedSources: AllowedSource[];
  requiredClaimTypes?: string[];
  requiredClaimTags?: string[];
  requiredCitationCount: number;
  allowMissingInfoClaims: boolean;
  sections: SectionBlueprint[];
  introTemplate: string;
  footerTemplate: string;
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────────────
  // A. FACT DECLARATIONS / STATEMENTS
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "declaration_facts_only",
    displayName: "Declaration (Facts Only)",
    category: "declarations",
    description: "A sworn statement presenting factual claims with evidence citations. Each paragraph states a fact supported by documentary evidence.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "intro", title: "Introduction", description: "Declarant identification" },
      { key: "facts", title: "Statement of Facts", description: "Numbered factual claims", claimTypes: ["fact", "procedural", "context"] },
      { key: "communications", title: "Communications", description: "Documented communications", claimTypes: ["communication"], optional: true },
      { key: "financial", title: "Financial Matters", description: "Financial evidence", claimTypes: ["financial"], optional: true },
      { key: "conclusion", title: "Declaration", description: "Standard declaration language" },
    ],
    introTemplate: "I, [DECLARANT NAME], declare under penalty of perjury under the laws of [STATE] that the following is true and correct:",
    footerTemplate: "I declare under penalty of perjury under the laws of the State of [STATE] that the foregoing is true and correct.\n\nExecuted on [DATE] at [CITY], [STATE].\n\n_________________________\n[DECLARANT NAME]",
  },
  {
    templateKey: "declaration_custody",
    displayName: "Declaration – Custody/Parenting Time Facts",
    category: "declarations",
    description: "A sworn statement focusing on custody and parenting time facts with evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredClaimTypes: ["custody", "fact"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "intro", title: "Introduction", description: "Declarant identification" },
      { key: "custody", title: "Custody Arrangements", description: "Facts about custody", claimTypes: ["custody"] },
      { key: "parenting", title: "Parenting Time", description: "Facts about parenting time", claimTypes: ["custody", "fact"] },
      { key: "children", title: "Children's Needs", description: "Facts about children", claimTypes: ["medical", "school"] },
      { key: "conclusion", title: "Declaration", description: "Standard declaration language" },
    ],
    introTemplate: "I, [DECLARANT NAME], declare under penalty of perjury under the laws of [STATE] that the following is true and correct regarding custody and parenting time:",
    footerTemplate: "I declare under penalty of perjury under the laws of the State of [STATE] that the foregoing is true and correct.\n\nExecuted on [DATE] at [CITY], [STATE].\n\n_________________________\n[DECLARANT NAME]",
  },
  {
    templateKey: "declaration_discovery",
    displayName: "Declaration – Discovery/Disclosure Compliance",
    category: "declarations",
    description: "A factual declaration documenting discovery and disclosure compliance with evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredClaimTypes: ["procedural"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "intro", title: "Introduction", description: "Declarant identification" },
      { key: "requests", title: "Discovery Requests Made", description: "Requests sent", claimTypes: ["procedural"] },
      { key: "responses", title: "Responses Received", description: "Responses received", claimTypes: ["procedural"] },
      { key: "outstanding", title: "Outstanding Items", description: "Unresolved discovery", claimTypes: ["procedural"] },
      { key: "conclusion", title: "Declaration", description: "Standard declaration language" },
    ],
    introTemplate: "I, [DECLARANT NAME], declare under penalty of perjury under the laws of [STATE] that the following is true and correct regarding discovery and disclosure:",
    footerTemplate: "I declare under penalty of perjury under the laws of the State of [STATE] that the foregoing is true and correct.\n\nExecuted on [DATE] at [CITY], [STATE].\n\n_________________________\n[DECLARANT NAME]",
  },
  {
    templateKey: "statement_of_facts_chronological",
    displayName: "Statement of Facts (Chronological)",
    category: "declarations",
    description: "A neutral chronological narrative of events organized by date with evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims", "timeline"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "background", title: "Background", description: "Context and party information", claimTypes: ["context", "procedural"] },
      { key: "chronology", title: "Chronology of Events", description: "Facts in chronological order", claimTypes: ["fact", "communication", "financial", "medical", "school", "custody"] },
      { key: "current", title: "Current Status", description: "Present circumstances", claimTypes: ["procedural"] },
    ],
    introTemplate: "The following statement of facts is presented for the Court's consideration in the above-captioned matter:",
    footerTemplate: "The foregoing facts are supported by the exhibits referenced herein.",
  },
  {
    templateKey: "statement_of_facts_issue_grouped",
    displayName: "Statement of Facts (Issue-Grouped)",
    category: "declarations",
    description: "A neutral statement of facts organized by legal issues with evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "background", title: "Background", description: "Context and party information", claimTypes: ["context"] },
      { key: "custody_issues", title: "Custody Issues", description: "Custody-related facts", claimTypes: ["custody"], optional: true },
      { key: "financial_issues", title: "Financial Issues", description: "Financial facts", claimTypes: ["financial"], optional: true },
      { key: "procedural_issues", title: "Procedural Issues", description: "Procedural facts", claimTypes: ["procedural"], optional: true },
      { key: "other_facts", title: "Other Relevant Facts", description: "Additional facts", claimTypes: ["fact", "communication", "medical", "school"] },
    ],
    introTemplate: "The following statement of facts is organized by issue for the Court's consideration:",
    footerTemplate: "The foregoing facts are supported by the exhibits referenced herein.",
  },

  // ─────────────────────────────────────────────────────────────────
  // B. PROCEDURAL / CASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "case_status_summary",
    displayName: "Case Status Summary",
    category: "procedural",
    description: "A summary of case status for your own preparation. NOT a court filing.",
    educationalOnly: true,
    allowedSources: ["claims", "timeline"],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "overview", title: "Case Overview", description: "Basic case information" },
      { key: "parties", title: "Parties", description: "Party information", claimTypes: ["context"] },
      { key: "pending", title: "Pending Matters", description: "Open issues", claimTypes: ["procedural"] },
      { key: "timeline", title: "Key Dates", description: "Important dates", sourceType: "timeline" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nCase Status Summary prepared for personal reference:",
    footerTemplate: "This summary is for organizational purposes only and is not a court filing.",
  },
  {
    templateKey: "discovery_tracker",
    displayName: "Discovery & Disclosure Tracker Summary",
    category: "procedural",
    description: "A factual summary of discovery exchanges including dates and items exchanged.",
    educationalOnly: true,
    allowedSources: ["claims", "timeline"],
    requiredClaimTypes: ["procedural"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "sent", title: "Discovery Sent", description: "Items sent to opposing party", claimTypes: ["procedural"] },
      { key: "received", title: "Discovery Received", description: "Items received", claimTypes: ["procedural"] },
      { key: "outstanding", title: "Outstanding Requests", description: "Pending items", claimTypes: ["procedural"] },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nDiscovery and Disclosure Tracker:",
    footerTemplate: "This tracker is for organizational purposes only.",
  },
  {
    templateKey: "deadline_hearing_summary",
    displayName: "Deadline & Hearing Summary",
    category: "procedural",
    description: "A factual summary of deadlines and hearings from your timeline.",
    educationalOnly: true,
    allowedSources: ["timeline"],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "upcoming", title: "Upcoming Deadlines", description: "Future deadlines", sourceType: "timeline" },
      { key: "hearings", title: "Scheduled Hearings", description: "Court dates", sourceType: "timeline" },
      { key: "past", title: "Past Events", description: "Completed items", sourceType: "timeline" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nDeadline and Hearing Summary:",
    footerTemplate: "This summary is for organizational purposes only. Verify all dates with the court.",
  },

  // ─────────────────────────────────────────────────────────────────
  // C. EVIDENCE / EXHIBITS
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "exhibit_index",
    displayName: "Exhibit Index",
    category: "evidence",
    description: "A master list of all exhibits with descriptions for court filing.",
    educationalOnly: false,
    allowedSources: ["claims", "snippets"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "exhibits", title: "Exhibit List", description: "Numbered exhibits with descriptions" },
    ],
    introTemplate: "The following exhibits are submitted in support of [PARTY]'s [MOTION/DECLARATION]:",
    footerTemplate: "",
  },
  {
    templateKey: "exhibit_packet_cover",
    displayName: "Exhibit Packet Cover Page",
    category: "evidence",
    description: "A cover page for an exhibit packet with title and subtitle only.",
    educationalOnly: false,
    allowedSources: [],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "cover", title: "Cover", description: "Title and subtitle" },
    ],
    introTemplate: "EXHIBIT PACKET\n\n[CASE NAME]\n[CASE NUMBER]\n\n",
    footerTemplate: "",
  },
  {
    templateKey: "evidence_summary_by_exhibit",
    displayName: "Evidence Summary by Exhibit",
    category: "evidence",
    description: "1-3 bullet facts per exhibit with citations for quick reference.",
    educationalOnly: true,
    allowedSources: ["claims", "snippets"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "summaries", title: "Evidence Summaries", description: "Bullet facts per exhibit" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nEvidence Summary by Exhibit:",
    footerTemplate: "This summary is for organizational purposes only.",
  },
  {
    templateKey: "trial_binder_dividers",
    displayName: "Trial Binder Section Divider Pages",
    category: "evidence",
    description: "Auto-generated section heading pages for trial binder organization.",
    educationalOnly: true,
    allowedSources: ["trialPrep"],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "dividers", title: "Divider Pages", description: "Section headings", sourceType: "trialPrep" },
    ],
    introTemplate: "",
    footerTemplate: "",
  },

  // ─────────────────────────────────────────────────────────────────
  // D. COMMUNICATION & INCIDENT LOGS
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "communication_log_summary",
    displayName: "Communication Log Summary",
    category: "communications",
    description: "A factual log of communications with channel, date, and subject.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredClaimTypes: ["communication"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "log", title: "Communication Log", description: "Dated entries", claimTypes: ["communication"] },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nCommunication Log Summary:",
    footerTemplate: "This log is for organizational purposes only.",
  },
  {
    templateKey: "incident_log",
    displayName: "Incident Log",
    category: "communications",
    description: "One row per accepted claim tagged as 'incident' with citations.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredClaimTags: ["incident"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "incidents", title: "Incidents", description: "Incident entries", claimTags: ["incident"] },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nIncident Log:",
    footerTemplate: "This log is for organizational purposes only. Each incident is supported by cited evidence.",
  },

  // ─────────────────────────────────────────────────────────────────
  // E. PARENTING PLAN / CHILD-RELATED
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "parenting_plan_outline",
    displayName: "Parenting Plan Outline",
    category: "parenting",
    description: "Structured headings with TBD placeholders for parenting plan creation.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredClaimTypes: ["custody"],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "legal_custody", title: "Legal Custody", description: "Decision-making authority" },
      { key: "physical_custody", title: "Physical Custody", description: "Residential arrangements" },
      { key: "schedule", title: "Parenting Schedule", description: "Regular schedule" },
      { key: "holidays", title: "Holiday Schedule", description: "Holiday arrangements" },
      { key: "communication", title: "Parent Communication", description: "How parents communicate" },
      { key: "modifications", title: "Modification Process", description: "How to request changes" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nParenting Plan Outline:\n\nNote: Items marked [TBD] require discussion and agreement.",
    footerTemplate: "This outline is for organizational purposes only and does not constitute legal advice.",
  },
  {
    templateKey: "parenting_issues_checklist",
    displayName: "Parenting Issues Checklist",
    category: "parenting",
    description: "Factual open items derived from claims with missing_info_flag.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredClaimTypes: ["custody"],
    requiredCitationCount: 0,
    allowMissingInfoClaims: true,
    sections: [
      { key: "open_items", title: "Open Items Requiring Resolution", description: "Items with missing info" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nParenting Issues Checklist:\n\nThe following items require additional information or resolution:",
    footerTemplate: "This checklist is for organizational purposes only.",
  },

  // ─────────────────────────────────────────────────────────────────
  // F. PATTERN / THEMES
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "pattern_analysis_summary",
    displayName: "Pattern Analysis Summary",
    category: "patterns",
    description: "Export-ready summary of identified patterns with citation backing.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "patterns", title: "Identified Patterns", description: "Pattern summaries with examples" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nPattern Analysis Summary:\n\nThe following patterns have been identified from the evidence:",
    footerTemplate: "This analysis is for organizational purposes only. Each pattern is supported by cited evidence.",
  },
  {
    templateKey: "themes_examples_appendix",
    displayName: "Themes & Examples Appendix",
    category: "patterns",
    description: "Top themes with cited examples for reference.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "themes", title: "Themes", description: "Theme summaries with examples" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nThemes and Examples Appendix:",
    footerTemplate: "This appendix is for organizational purposes only.",
  },

  // ─────────────────────────────────────────────────────────────────
  // G. COURTROOM PREP
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "witness_list",
    displayName: "Witness List",
    category: "courtroom",
    description: "Names, roles, contact info, and what witnesses can speak to based on claims. No coaching.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "witnesses", title: "Witnesses", description: "Witness information derived from claims" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nWitness List:\n\nNote: This list is derived from accepted claims and does not constitute witness coaching.",
    footerTemplate: "This list is for organizational purposes only.",
  },
  {
    templateKey: "exhibit_claim_map",
    displayName: "Exhibit-to-Claim Map",
    category: "courtroom",
    description: "Which exhibits support which claims for courtroom preparation.",
    educationalOnly: true,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "map", title: "Exhibit to Claim Mapping", description: "Cross-reference of exhibits and claims" },
    ],
    introTemplate: "EDUCATIONAL / ORGANIZATIONAL USE ONLY\n\nExhibit-to-Claim Map:",
    footerTemplate: "This map is for organizational purposes only.",
  },
];

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; description: string }> = {
  declarations: { label: "Fact Declarations & Statements", description: "Sworn statements and fact summaries" },
  procedural: { label: "Procedural / Case Management", description: "Case status and tracking documents" },
  evidence: { label: "Evidence / Exhibits", description: "Exhibit lists and evidence summaries" },
  communications: { label: "Communication & Incident Logs", description: "Communication and incident tracking" },
  parenting: { label: "Parenting Plan / Child-Related", description: "Custody and parenting documents" },
  patterns: { label: "Pattern / Themes", description: "Pattern analysis and theme summaries" },
  courtroom: { label: "Courtroom Prep", description: "Trial preparation documents" },
};

export function getTemplateByKey(key: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find(t => t.templateKey === key);
}

export function getTemplatesByCategory(category: TemplateCategory): TemplateDefinition[] {
  return TEMPLATE_REGISTRY.filter(t => t.category === category);
}
