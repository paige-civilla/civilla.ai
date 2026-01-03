export type DocCategory = 
  | "Starting a case" 
  | "Motions" 
  | "Responses" 
  | "Orders" 
  | "Service" 
  | "Evidence/Exhibits" 
  | "Other";

export interface DocumentType {
  key: string;
  title: string;
  category: DocCategory;
  description: string;
  commonWhenUsed: string[];
  requiredInfo: string[];
  subtypeOf?: string;
  subtypeLabel?: string;
  templateKey?: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: "declaration",
    title: "Declaration",
    category: "Evidence/Exhibits",
    description: "A written statement of facts made under penalty of perjury. Used to present information to the court without live testimony.",
    commonWhenUsed: [
      "When you need to tell the court about facts you personally know",
      "To support or oppose a motion",
      "When live testimony is not required"
    ],
    requiredInfo: [
      "Your name and relationship to the case",
      "A statement that you are making the declaration under penalty of perjury",
      "The facts you want to tell the court, organized clearly",
      "Your signature and date"
    ],
    templateKey: "declaration"
  },
  {
    key: "affidavit",
    title: "Affidavit",
    category: "Evidence/Exhibits",
    description: "Similar to a declaration, but typically signed before a notary public. Some courts require affidavits instead of declarations.",
    commonWhenUsed: [
      "When the court or local rules require notarization",
      "To present sworn statements about facts",
      "In jurisdictions that prefer affidavits over declarations"
    ],
    requiredInfo: [
      "Your name and relationship to the case",
      "The facts stated under oath",
      "Notary acknowledgment section",
      "Your signature and date"
    ],
    templateKey: "affidavit"
  },
  {
    key: "motion",
    title: "Motion (General)",
    category: "Motions",
    description: "A formal request asking the court to take a specific action or make a decision. The type of motion depends on what you are asking the court to do.",
    commonWhenUsed: [
      "When you need the court to decide something before trial",
      "To request changes to existing orders",
      "To address procedural issues in your case"
    ],
    requiredInfo: [
      "What you are asking the court to do",
      "The legal or factual basis for your request",
      "A supporting declaration if facts are involved",
      "A proposed order for the court to sign"
    ],
    templateKey: "motion"
  },
  {
    key: "motion_to_compel",
    title: "Motion to Compel",
    category: "Motions",
    description: "Asks the court to order the other party to respond to discovery requests or comply with a prior order.",
    commonWhenUsed: [
      "When the other party has not responded to your discovery requests",
      "When responses are incomplete or evasive",
      "After attempting to resolve the issue informally"
    ],
    requiredInfo: [
      "Description of the discovery requests that were not answered",
      "Efforts made to resolve the issue without court involvement",
      "Why the information is needed",
      "A proposed order"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion to Compel",
    templateKey: "motion"
  },
  {
    key: "motion_for_sanctions",
    title: "Motion for Sanctions",
    category: "Motions",
    description: "Asks the court to impose penalties on a party for misconduct, failure to comply with orders, or bad faith actions.",
    commonWhenUsed: [
      "When the other party has violated a court order",
      "For discovery abuse or failure to respond",
      "When a party has acted in bad faith"
    ],
    requiredInfo: [
      "The specific conduct that warrants sanctions",
      "Evidence of the misconduct",
      "What sanctions you are requesting",
      "Legal authority for the requested sanctions"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion for Sanctions",
    templateKey: "motion"
  },
  {
    key: "motion_for_continuance",
    title: "Motion for Continuance",
    category: "Motions",
    description: "Asks the court to postpone a hearing, trial, or deadline to a later date.",
    commonWhenUsed: [
      "When you need more time to prepare",
      "Due to scheduling conflicts or emergencies",
      "When new evidence or issues arise that require additional time"
    ],
    requiredInfo: [
      "The current date/deadline you want to change",
      "The reason you need more time",
      "Whether the other party agrees (stipulation)",
      "Proposed new date if applicable"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion for Continuance",
    templateKey: "motion"
  },
  {
    key: "motion_to_reconsider",
    title: "Motion to Reconsider",
    category: "Motions",
    description: "Asks the court to review and potentially change a previous ruling or order.",
    commonWhenUsed: [
      "When you believe the court made an error in its ruling",
      "When new evidence has become available",
      "When there has been a significant change in circumstances"
    ],
    requiredInfo: [
      "The specific order or ruling you want reconsidered",
      "Why reconsideration is warranted",
      "New evidence or legal arguments not previously considered",
      "What outcome you are requesting"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion to Reconsider",
    templateKey: "motion"
  },
  {
    key: "motion_for_temporary_orders",
    title: "Motion for Temporary Orders",
    category: "Motions",
    description: "Asks the court for orders that will remain in effect during the case until a final decision is made.",
    commonWhenUsed: [
      "At the start of a case when immediate decisions are needed",
      "For temporary custody, support, or property arrangements",
      "When parties cannot agree on interim arrangements"
    ],
    requiredInfo: [
      "What temporary orders you are requesting",
      "Why immediate orders are necessary",
      "Supporting facts and declarations",
      "A proposed temporary order"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion for Temporary Orders",
    templateKey: "motion"
  },
  {
    key: "motion_to_modify",
    title: "Motion to Modify",
    category: "Motions",
    description: "Asks the court to change an existing order due to changed circumstances.",
    commonWhenUsed: [
      "When circumstances have substantially changed since the original order",
      "To modify custody, parenting time, or support",
      "When the current order is no longer appropriate"
    ],
    requiredInfo: [
      "The current order you want to modify",
      "What changes you are requesting",
      "The substantial change in circumstances",
      "Why the modification is appropriate"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion to Modify",
    templateKey: "motion"
  },
  {
    key: "motion_to_enforce",
    title: "Motion to Enforce",
    category: "Motions",
    description: "Asks the court to enforce an existing order that the other party is not following.",
    commonWhenUsed: [
      "When the other party is violating a court order",
      "To enforce custody, parenting time, or support orders",
      "When informal attempts to resolve the issue have failed"
    ],
    requiredInfo: [
      "The specific order being violated",
      "How and when it was violated",
      "Evidence of the violations",
      "What relief you are requesting"
    ],
    subtypeOf: "motion",
    subtypeLabel: "Motion to Enforce",
    templateKey: "motion"
  },
  {
    key: "proposed_order",
    title: "Proposed Order",
    category: "Orders",
    description: "A draft order for the judge to sign if they grant your motion. Courts often require you to submit a proposed order with your motion.",
    commonWhenUsed: [
      "When filing most motions",
      "When required by local rules",
      "To specify exactly what you want the court to order"
    ],
    requiredInfo: [
      "The case caption and case number",
      "Title of the order",
      "The specific orders you are requesting",
      "Signature lines for the judge"
    ],
    templateKey: "proposed_order"
  },
  {
    key: "certificate_of_service",
    title: "Certificate of Service",
    category: "Service",
    description: "A document stating that you properly delivered copies of court papers to other parties in the case.",
    commonWhenUsed: [
      "Whenever you file documents with the court",
      "To prove you gave the other party copies of your filings",
      "Required by most court rules"
    ],
    requiredInfo: [
      "What documents were served",
      "How they were served (mail, email, hand delivery, etc.)",
      "Who was served",
      "The date of service"
    ],
    templateKey: "certificate_of_service"
  },
  {
    key: "notice_of_appearance",
    title: "Notice of Appearance",
    category: "Starting a case",
    description: "A document filed to officially enter a case and receive notices of hearings and other filings. Self-represented parties often file this to ensure they receive case communications.",
    commonWhenUsed: [
      "When you are responding to a case filed against you",
      "To ensure you receive all court notices and filings",
      "When entering a case as a self-represented party"
    ],
    requiredInfo: [
      "Your name and contact information",
      "The case number and parties",
      "A statement that you are appearing in the case",
      "Your signature"
    ],
    templateKey: "notice_of_appearance"
  },
  {
    key: "case_information_sheet",
    title: "Family Law Case Information Sheet",
    category: "Starting a case",
    description: "A form providing basic information about the parties, children, and issues in a family law case. Many courts require this form to be filed at the start of a case.",
    commonWhenUsed: [
      "When starting a new family law case",
      "When required by local court rules",
      "To provide the court with essential case information"
    ],
    requiredInfo: [
      "Names, addresses, and contact info for all parties",
      "Information about children if applicable",
      "Issues in the case (custody, support, property, etc.)",
      "Prior court cases involving the same parties"
    ],
    templateKey: "case_information_sheet"
  },
  {
    key: "response_objection",
    title: "Response / Objection",
    category: "Responses",
    description: "A written reply to a motion or other filing by the opposing party, explaining why the court should deny their request.",
    commonWhenUsed: [
      "When the other party files a motion you disagree with",
      "To present your side before the court decides",
      "Within the deadline set by court rules"
    ],
    requiredInfo: [
      "What motion or filing you are responding to",
      "Your position on the request",
      "Facts and legal arguments supporting your position",
      "What you want the court to do"
    ],
    templateKey: "response"
  },
  {
    key: "memorandum",
    title: "Memorandum of Law",
    category: "Other",
    description: "A written legal argument supporting your position, citing relevant laws and cases. Often filed with motions to explain the legal basis for your request.",
    commonWhenUsed: [
      "To support complex motions",
      "When legal research is needed to support your position",
      "In conjunction with declarations providing facts"
    ],
    requiredInfo: [
      "Statement of the legal issue",
      "Relevant facts",
      "Legal arguments with citations",
      "Conclusion stating what relief you request"
    ],
    templateKey: "memorandum"
  }
];

export function getDocumentTypeByKey(key: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find(d => d.key === key);
}

export function getDocumentTypesByCategory(category: DocCategory): DocumentType[] {
  return DOCUMENT_TYPES.filter(d => d.category === category);
}

export function getMotionSubtypes(): DocumentType[] {
  return DOCUMENT_TYPES.filter(d => d.subtypeOf === "motion");
}

export const DOC_CATEGORIES: DocCategory[] = [
  "Starting a case",
  "Motions",
  "Responses",
  "Orders",
  "Service",
  "Evidence/Exhibits",
  "Other"
];
