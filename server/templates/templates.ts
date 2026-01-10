export interface SectionDefinition {
  sectionKey: string;
  title: string;
  guidance: string;
  keywords: string[];
  claimTypes?: string[];
}

export interface NarrativeTemplate {
  key: string;
  label: string;
  description: string;
  sections: SectionDefinition[];
}

export const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
  {
    key: "declaration_facts_only",
    label: "Declaration (Facts Only)",
    description: "A sworn statement presenting factual claims with evidence citations.",
    sections: [
      {
        sectionKey: "intro",
        title: "Introduction",
        guidance: "Identify the declarant and establish context for the declaration.",
        keywords: ["introduction", "background", "declarant", "context"],
        claimTypes: ["context", "procedural"],
      },
      {
        sectionKey: "facts",
        title: "Statement of Facts",
        guidance: "List factual claims in numbered paragraphs. Each fact must have supporting evidence.",
        keywords: ["fact", "event", "incident", "occurred", "happened", "observed"],
        claimTypes: ["fact", "procedural", "context"],
      },
      {
        sectionKey: "communications",
        title: "Communications",
        guidance: "Document relevant communications including texts, emails, and verbal exchanges.",
        keywords: ["communication", "text", "email", "message", "said", "stated", "wrote"],
        claimTypes: ["communication"],
      },
      {
        sectionKey: "financial",
        title: "Financial Matters",
        guidance: "Present financial evidence including income, expenses, and transactions.",
        keywords: ["financial", "money", "payment", "income", "expense", "cost", "debt"],
        claimTypes: ["financial"],
      },
    ],
  },
  {
    key: "affidavit_outline",
    label: "Affidavit Outline (Facts Only)",
    description: "A structured outline for an affidavit presenting sworn factual statements.",
    sections: [
      {
        sectionKey: "personal_info",
        title: "Personal Information",
        guidance: "State name, age, residence, and relationship to the case.",
        keywords: ["personal", "residence", "relationship", "identity", "age"],
        claimTypes: ["context"],
      },
      {
        sectionKey: "knowledge",
        title: "Basis of Knowledge",
        guidance: "Explain how the affiant has personal knowledge of the facts.",
        keywords: ["knowledge", "witness", "observed", "personal", "firsthand"],
        claimTypes: ["fact", "context"],
      },
      {
        sectionKey: "sworn_facts",
        title: "Sworn Facts",
        guidance: "Present facts under oath. Each statement must be truthful and supported by evidence.",
        keywords: ["fact", "truth", "swear", "affirm", "state", "declare"],
        claimTypes: ["fact", "procedural"],
      },
    ],
  },
  {
    key: "motion_cover_sheet",
    label: "Motion Cover Sheet (Structure Only)",
    description: "A structured outline for organizing a motion filing.",
    sections: [
      {
        sectionKey: "caption",
        title: "Caption and Case Information",
        guidance: "Court name, case number, party names, and motion title.",
        keywords: ["court", "case", "number", "party", "caption"],
        claimTypes: ["procedural", "context"],
      },
      {
        sectionKey: "relief_requested",
        title: "Relief Requested",
        guidance: "Clearly state what relief is being requested from the court.",
        keywords: ["relief", "request", "order", "grant", "motion"],
        claimTypes: ["procedural"],
      },
      {
        sectionKey: "factual_basis",
        title: "Factual Basis",
        guidance: "Key facts supporting the motion, organized logically.",
        keywords: ["fact", "basis", "support", "ground", "reason"],
        claimTypes: ["fact", "procedural"],
      },
    ],
  },
  {
    key: "proposed_order_outline",
    label: "Proposed Order Outline (Structure Only)",
    description: "A template outline for a proposed court order.",
    sections: [
      {
        sectionKey: "caption",
        title: "Caption",
        guidance: "Court information, case number, and party names.",
        keywords: ["court", "case", "caption", "order"],
        claimTypes: ["procedural", "context"],
      },
      {
        sectionKey: "findings",
        title: "Findings of Fact",
        guidance: "Proposed findings the court may adopt based on the evidence.",
        keywords: ["finding", "fact", "determined", "established", "found"],
        claimTypes: ["fact"],
      },
      {
        sectionKey: "orders",
        title: "Orders",
        guidance: "Specific orders requested, with supporting evidence references.",
        keywords: ["order", "ordered", "shall", "must", "directed"],
        claimTypes: ["procedural"],
      },
    ],
  },
  {
    key: "exhibit_list_index",
    label: "Exhibit List Index",
    description: "An organized index of exhibits with descriptions and citations.",
    sections: [
      {
        sectionKey: "exhibit_schedule",
        title: "Exhibit Schedule",
        guidance: "List each exhibit with its designation, description, and relevance.",
        keywords: ["exhibit", "document", "evidence", "attachment", "proof"],
        claimTypes: ["fact", "procedural"],
      },
      {
        sectionKey: "authentication",
        title: "Authentication Notes",
        guidance: "Notes on how each exhibit will be authenticated.",
        keywords: ["authenticate", "verify", "source", "origin", "custodian"],
        claimTypes: ["procedural"],
      },
    ],
  },
  {
    key: "trial_brief_outline",
    label: "Trial Brief Outline (Facts Only)",
    description: "A factual outline for a trial brief presentation.",
    sections: [
      {
        sectionKey: "introduction",
        title: "Introduction",
        guidance: "Brief overview of the case and parties involved.",
        keywords: ["introduction", "overview", "background", "case"],
        claimTypes: ["context", "procedural"],
      },
      {
        sectionKey: "statement_of_facts",
        title: "Statement of Facts",
        guidance: "Chronological presentation of relevant facts with evidence citations.",
        keywords: ["fact", "chronological", "timeline", "event", "occurred"],
        claimTypes: ["fact", "communication"],
      },
      {
        sectionKey: "key_evidence",
        title: "Key Evidence",
        guidance: "Summary of the most important evidence supporting the case.",
        keywords: ["evidence", "key", "important", "critical", "essential"],
        claimTypes: ["fact", "financial", "medical"],
      },
    ],
  },
  {
    key: "custody_declaration_addendum",
    label: "Custody Declaration Addendum (Facts Only)",
    description: "A supplemental declaration focused on custody-related facts.",
    sections: [
      {
        sectionKey: "current_arrangement",
        title: "Current Custody Arrangement",
        guidance: "Describe the current custody and parenting time arrangement.",
        keywords: ["custody", "current", "arrangement", "schedule", "parenting"],
        claimTypes: ["custody", "fact"],
      },
      {
        sectionKey: "child_needs",
        title: "Children's Needs",
        guidance: "Document the children's specific needs and how they are being met.",
        keywords: ["child", "children", "need", "school", "medical", "care"],
        claimTypes: ["medical", "school", "custody"],
      },
      {
        sectionKey: "parenting_concerns",
        title: "Parenting Concerns",
        guidance: "Document any concerns about the other parent's parenting with evidence.",
        keywords: ["concern", "parent", "issue", "behavior", "incident"],
        claimTypes: ["fact", "custody", "communication"],
      },
    ],
  },
  {
    key: "communications_summary",
    label: "Communications Summary",
    description: "A structured summary of relevant communications.",
    sections: [
      {
        sectionKey: "text_messages",
        title: "Text Messages",
        guidance: "Summary of relevant text message exchanges with dates.",
        keywords: ["text", "message", "sms", "sent", "received"],
        claimTypes: ["communication"],
      },
      {
        sectionKey: "emails",
        title: "Email Communications",
        guidance: "Summary of relevant email exchanges.",
        keywords: ["email", "wrote", "sent", "replied", "subject"],
        claimTypes: ["communication"],
      },
      {
        sectionKey: "other_communications",
        title: "Other Communications",
        guidance: "Phone calls, in-person conversations, and other documented exchanges.",
        keywords: ["phone", "call", "conversation", "said", "verbal"],
        claimTypes: ["communication", "fact"],
      },
    ],
  },
  {
    key: "parenting_plan_narrative",
    label: "Parenting Plan Narrative Addendum (Structure Only)",
    description: "A narrative supplement to a parenting plan with factual support.",
    sections: [
      {
        sectionKey: "schedule_rationale",
        title: "Schedule Rationale",
        guidance: "Explain the reasoning behind the proposed parenting schedule.",
        keywords: ["schedule", "time", "weekend", "holiday", "vacation"],
        claimTypes: ["custody", "fact"],
      },
      {
        sectionKey: "special_provisions",
        title: "Special Provisions",
        guidance: "Document any special circumstances requiring unique provisions.",
        keywords: ["special", "provision", "exception", "accommodation", "specific"],
        claimTypes: ["custody", "medical", "school"],
      },
      {
        sectionKey: "communication_plan",
        title: "Parent Communication Plan",
        guidance: "How parents will communicate about the children.",
        keywords: ["communication", "parent", "contact", "decision", "inform"],
        claimTypes: ["custody", "communication"],
      },
    ],
  },
  {
    key: "discovery_summary",
    label: "Discovery Summary",
    description: "A summary of discovery requests and responses.",
    sections: [
      {
        sectionKey: "requests_sent",
        title: "Discovery Requests Sent",
        guidance: "List discovery requests sent to the opposing party.",
        keywords: ["request", "sent", "discovery", "interrogatory", "production"],
        claimTypes: ["procedural"],
      },
      {
        sectionKey: "responses_received",
        title: "Responses Received",
        guidance: "Summarize responses received to discovery requests.",
        keywords: ["response", "received", "answer", "produced", "objection"],
        claimTypes: ["procedural"],
      },
      {
        sectionKey: "outstanding_items",
        title: "Outstanding Items",
        guidance: "Identify discovery items not yet resolved.",
        keywords: ["outstanding", "pending", "overdue", "incomplete", "missing"],
        claimTypes: ["procedural"],
      },
    ],
  },
];

export function getTemplateByKey(key: string): NarrativeTemplate | undefined {
  return NARRATIVE_TEMPLATES.find((t) => t.key === key);
}

export function getAllTemplateKeys(): string[] {
  return NARRATIVE_TEMPLATES.map((t) => t.key);
}
