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
    templateKey: "affidavit_general",
    displayName: "Affidavit (General)",
    category: "declarations",
    description: "A general sworn affidavit presenting facts under oath with evidence citations. Structure follows standard affidavit format.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "identity", title: "Identity and Competence", description: "Affiant identification and basis for knowledge", claimTypes: ["context"] },
      { key: "sworn_facts", title: "Sworn Facts", description: "Numbered factual statements under oath", claimTypes: ["fact", "procedural", "custody", "financial"] },
      { key: "communications", title: "Communications", description: "Documented communications relevant to the case", claimTypes: ["communication"], optional: true },
      { key: "conclusion", title: "Jurat", description: "Standard affidavit oath language" },
    ],
    introTemplate: "AFFIDAVIT OF [AFFIANT NAME]\n\nSTATE OF [STATE]\nCOUNTY OF [COUNTY]\n\nBefore me, the undersigned notary public, personally appeared [AFFIANT NAME], who being duly sworn, deposes and says:",
    footerTemplate: "Further affiant sayeth naught.\n\n_________________________\n[AFFIANT NAME]\n\nSWORN TO AND SUBSCRIBED before me this ___ day of __________, 20___.\n\n_________________________\nNotary Public\nMy Commission Expires: ___________",
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
  // A2. MOTIONS (Structure Only)
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "motion_modify_custody",
    displayName: "Motion to Modify Custody",
    category: "declarations",
    description: "A neutral, structure-only motion to modify custody presenting factual grounds for the requested modification. All content comes from accepted claims.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredClaimTypes: ["custody", "fact"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "caption", title: "Caption", description: "Case caption and party information", claimTypes: ["context", "procedural"] },
      { key: "introduction", title: "Introduction", description: "Brief statement of what is being requested", claimTypes: ["procedural"] },
      { key: "factual_background", title: "Factual Background", description: "Relevant background facts", claimTypes: ["context", "fact"] },
      { key: "changed_circumstances", title: "Changed Circumstances", description: "Facts showing material change since last order", claimTypes: ["fact", "custody"] },
      { key: "best_interests", title: "Best Interests of the Child", description: "Facts relevant to children's wellbeing", claimTypes: ["custody", "medical", "school"] },
      { key: "supporting_evidence", title: "Supporting Evidence", description: "Evidence summary supporting the motion", claimTypes: ["fact", "communication"] },
      { key: "relief_requested", title: "Relief Requested", description: "Specific modifications being requested", claimTypes: ["procedural", "custody"] },
    ],
    introTemplate: "MOTION TO MODIFY CUSTODY\n\n[PARTY NAME], appearing pro se/through counsel, respectfully moves this Court to modify the existing custody order and states as follows:",
    footerTemplate: "WHEREFORE, [PARTY NAME] respectfully requests that the Court:\n1. [EVIDENCE REQUIRED: Specific relief requested]\n2. Grant such other and further relief as the Court deems just and proper.\n\nDated: [DATE]\n\n_________________________\n[PARTY NAME]\n[ADDRESS]\n[PHONE]\n[EMAIL]",
  },
  {
    templateKey: "memorandum_of_facts",
    displayName: "Memorandum of Facts",
    category: "declarations",
    description: "A comprehensive factual memorandum organizing all accepted claims by topic for court review. No legal argument included.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Purpose of the memorandum", claimTypes: ["context", "procedural"] },
      { key: "procedural_history", title: "Procedural History", description: "Case history and prior proceedings", claimTypes: ["procedural"] },
      { key: "factual_background", title: "Factual Background", description: "Background facts and context", claimTypes: ["context", "fact"] },
      { key: "custody_facts", title: "Custody-Related Facts", description: "Facts about custody arrangements", claimTypes: ["custody"], optional: true },
      { key: "financial_facts", title: "Financial Facts", description: "Financial information", claimTypes: ["financial"], optional: true },
      { key: "communication_facts", title: "Communications", description: "Documented communications", claimTypes: ["communication"], optional: true },
      { key: "medical_school_facts", title: "Medical and Educational Facts", description: "Children's medical and school information", claimTypes: ["medical", "school"], optional: true },
      { key: "conclusion", title: "Conclusion", description: "Summary of key facts" },
    ],
    introTemplate: "MEMORANDUM OF FACTS\n\nThis memorandum presents the factual record in the above-captioned matter, organized by topic. All facts are supported by documentary evidence as cited.",
    footerTemplate: "The foregoing facts are presented for the Court's consideration and are supported by the evidence referenced herein.",
  },
  {
    templateKey: "statement_of_issues",
    displayName: "Statement of Issues",
    category: "declarations",
    description: "A clear statement of the factual and procedural issues before the court, organized by topic with supporting evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Overview of issues presented", claimTypes: ["procedural", "context"] },
      { key: "custody_issues", title: "Custody Issues", description: "Issues related to custody arrangements", claimTypes: ["custody"], optional: true },
      { key: "parenting_time_issues", title: "Parenting Time Issues", description: "Issues related to parenting schedules", claimTypes: ["custody", "fact"], optional: true },
      { key: "financial_issues", title: "Financial Issues", description: "Support and financial issues", claimTypes: ["financial"], optional: true },
      { key: "procedural_issues", title: "Procedural Issues", description: "Discovery, compliance, and procedure", claimTypes: ["procedural"], optional: true },
      { key: "other_issues", title: "Other Issues", description: "Additional issues for resolution", claimTypes: ["fact", "communication"] },
    ],
    introTemplate: "STATEMENT OF ISSUES\n\nThe following issues are presented for the Court's consideration in the above-captioned matter:",
    footerTemplate: "Each issue identified above is supported by the evidence cited herein.",
  },

  // ─────────────────────────────────────────────────────────────────
  // A3. RESPONSES & OBJECTIONS
  // ─────────────────────────────────────────────────────────────────
  {
    templateKey: "response_to_motion",
    displayName: "Response to Motion",
    category: "declarations",
    description: "A factual response to the opposing party's motion, presenting only evidence-backed facts without legal argument.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Statement of what is being responded to", claimTypes: ["procedural", "context"] },
      { key: "factual_response", title: "Factual Response", description: "Facts addressing the motion's claims", claimTypes: ["fact", "custody", "financial"] },
      { key: "disputed_facts", title: "Disputed Facts", description: "Facts in dispute with evidence", claimTypes: ["fact", "communication"] },
      { key: "supporting_evidence", title: "Supporting Evidence", description: "Evidence summary", claimTypes: ["fact", "procedural"] },
      { key: "conclusion", title: "Conclusion", description: "Summary of response" },
    ],
    introTemplate: "RESPONSE TO [MOTION TYPE]\n\n[PARTY NAME], appearing pro se/through counsel, responds to [OPPOSING PARTY]'s motion and states as follows:",
    footerTemplate: "WHEREFORE, [PARTY NAME] respectfully requests that the Court [deny/grant in part] [OPPOSING PARTY]'s motion and grant such other relief as the Court deems just and proper.\n\nDated: [DATE]\n\n_________________________\n[PARTY NAME]",
  },
  {
    templateKey: "objection_to_evidence",
    displayName: "Objection to Evidence",
    category: "declarations",
    description: "A factual objection to evidence or testimony, citing specific grounds and supporting documentation.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "What is being objected to", claimTypes: ["procedural"] },
      { key: "grounds", title: "Grounds for Objection", description: "Factual basis for objection", claimTypes: ["procedural", "fact"] },
      { key: "supporting_facts", title: "Supporting Facts", description: "Evidence supporting the objection", claimTypes: ["fact", "communication"] },
      { key: "conclusion", title: "Conclusion", description: "Relief requested" },
    ],
    introTemplate: "OBJECTION TO [EVIDENCE/TESTIMONY]\n\n[PARTY NAME] objects to the following evidence/testimony and states as follows:",
    footerTemplate: "WHEREFORE, [PARTY NAME] respectfully requests that the Court sustain this objection.\n\nDated: [DATE]\n\n_________________________\n[PARTY NAME]",
  },
  {
    templateKey: "trial_brief_facts",
    displayName: "Trial Brief (Facts Section Only)",
    category: "declarations",
    description: "The factual section of a trial brief presenting only evidence-backed facts organized by issue. Does not include legal argument.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Brief overview of the case", claimTypes: ["context", "procedural"] },
      { key: "procedural_history", title: "Procedural History", description: "Case history", claimTypes: ["procedural"] },
      { key: "statement_of_facts", title: "Statement of Facts", description: "Comprehensive factual presentation", claimTypes: ["fact", "custody", "financial", "communication", "medical", "school"] },
      { key: "disputed_facts", title: "Disputed Facts", description: "Facts in dispute", claimTypes: ["fact"], optional: true },
      { key: "undisputed_facts", title: "Undisputed Facts", description: "Facts not in dispute", claimTypes: ["fact"], optional: true },
      { key: "evidence_summary", title: "Evidence Summary", description: "Overview of supporting evidence", claimTypes: ["fact", "procedural"] },
    ],
    introTemplate: "TRIAL BRIEF - STATEMENT OF FACTS\n\n[PARTY NAME] submits the following statement of facts for the Court's consideration at trial:",
    footerTemplate: "The foregoing facts are presented for the Court's consideration and are supported by the evidence cited herein.\n\nDated: [DATE]\n\n_________________________\n[PARTY NAME]",
  },
  {
    templateKey: "pattern_summary_court",
    displayName: "Pattern Summary for Court",
    category: "declarations",
    description: "A formal summary of documented behavioral patterns for court review, with all instances cited to evidence.",
    educationalOnly: false,
    allowedSources: ["claims"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Purpose and scope of summary", claimTypes: ["context"] },
      { key: "patterns", title: "Documented Patterns", description: "Patterns with cited examples", claimTypes: ["fact", "communication", "custody"] },
      { key: "evidence_basis", title: "Evidence Basis", description: "Summary of supporting evidence", claimTypes: ["fact"] },
    ],
    introTemplate: "PATTERN SUMMARY FOR COURT REVIEW\n\nThe following summary presents documented patterns identified in the evidence:",
    footerTemplate: "Each pattern identified above is supported by the cited evidence. The Court is respectfully directed to the exhibits for full documentation.",
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

  {
    templateKey: "chronological_timeline_summary",
    displayName: "Chronological Timeline Summary",
    category: "procedural",
    description: "A complete chronological summary of all events from the timeline for court review. Presents facts in date order with evidence citations.",
    educationalOnly: false,
    allowedSources: ["claims", "timeline"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: true,
    sections: [
      { key: "background", title: "Background", description: "Case context and parties", claimTypes: ["context"] },
      { key: "timeline", title: "Chronological Timeline", description: "Events in date order", sourceType: "timeline" },
      { key: "key_events", title: "Key Events", description: "Most significant events", claimTypes: ["fact", "custody", "communication"] },
    ],
    introTemplate: "CHRONOLOGICAL TIMELINE SUMMARY\n\nThe following timeline presents events in chronological order as documented in the evidence:",
    footerTemplate: "All events listed above are supported by the evidence cited. Dates are as documented in the source materials.",
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
  {
    templateKey: "evidence_summary_court_review",
    displayName: "Evidence Summary for Court Review",
    category: "evidence",
    description: "A formal evidence summary organized for court review, presenting key facts from each piece of evidence with proper citations.",
    educationalOnly: false,
    allowedSources: ["claims", "snippets"],
    requiredCitationCount: 1,
    allowMissingInfoClaims: false,
    sections: [
      { key: "introduction", title: "Introduction", description: "Overview of evidence presented", claimTypes: ["context", "procedural"] },
      { key: "documentary_evidence", title: "Documentary Evidence", description: "Documents and written records", claimTypes: ["fact", "procedural"] },
      { key: "communication_evidence", title: "Communication Evidence", description: "Emails, texts, and other communications", claimTypes: ["communication"] },
      { key: "financial_evidence", title: "Financial Evidence", description: "Financial records and documentation", claimTypes: ["financial"], optional: true },
      { key: "other_evidence", title: "Other Evidence", description: "Additional supporting evidence", claimTypes: ["medical", "school", "custody"] },
    ],
    introTemplate: "EVIDENCE SUMMARY FOR COURT REVIEW\n\nThe following evidence is submitted in support of [PARTY]'s position in the above-captioned matter. Each item is documented with specific citations to the source materials.",
    footerTemplate: "The foregoing evidence summary is presented for the Court's consideration. All evidence is available for review in the accompanying exhibits.",
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
