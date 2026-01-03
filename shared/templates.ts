export interface TemplateDefinition {
  key: string;
  title: string;
  docTypeKey: string;
  supportsCourtDocx: boolean;
  supportsDraft: boolean;
  starterContent?: string[];
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    key: "declaration",
    title: "Declaration",
    docTypeKey: "declaration",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "I, [Your Full Name], declare under penalty of perjury under the laws of the State of [State] that the following is true and correct:",
      "",
      "1. [State your first fact here]",
      "",
      "2. [State your second fact here]",
      "",
      "3. [Continue as needed]",
      "",
      "I declare under penalty of perjury that the foregoing is true and correct.",
      "",
      "Executed on [Date], at [City], [State].",
      "",
      "_____________________________",
      "[Your Full Name]"
    ]
  },
  {
    key: "affidavit",
    title: "Affidavit",
    docTypeKey: "affidavit",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "STATE OF [STATE]",
      "COUNTY OF [COUNTY]",
      "",
      "I, [Your Full Name], being first duly sworn, depose and say:",
      "",
      "1. [State your first fact here]",
      "",
      "2. [State your second fact here]",
      "",
      "3. [Continue as needed]",
      "",
      "FURTHER AFFIANT SAYETH NOT.",
      "",
      "_____________________________",
      "[Your Full Name]",
      "",
      "Subscribed and sworn to before me this ____ day of __________, 20____.",
      "",
      "_____________________________",
      "Notary Public",
      "My Commission Expires: __________"
    ]
  },
  {
    key: "motion",
    title: "Motion",
    docTypeKey: "motion",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "COMES NOW the [Petitioner/Respondent], [Your Full Name], appearing [pro se/through counsel], and respectfully moves this Court for an order [describe what you are requesting].",
      "",
      "STATEMENT OF FACTS",
      "",
      "1. [State the relevant facts]",
      "",
      "2. [Additional facts as needed]",
      "",
      "ARGUMENT",
      "",
      "[Explain why the Court should grant your motion]",
      "",
      "RELIEF REQUESTED",
      "",
      "WHEREFORE, [Petitioner/Respondent] respectfully requests that this Court:",
      "",
      "1. [Specific relief requested]",
      "",
      "2. [Additional relief as needed]",
      "",
      "3. Grant such other relief as the Court deems just and proper."
    ]
  },
  {
    key: "proposed_order",
    title: "Proposed Order",
    docTypeKey: "proposed_order",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "ORDER",
      "",
      "This matter having come before the Court on [Petitioner's/Respondent's] Motion for [Description], and the Court having reviewed the motion, any response, and the record, and being otherwise fully advised:",
      "",
      "IT IS HEREBY ORDERED:",
      "",
      "1. [Specific order language]",
      "",
      "2. [Additional orders as needed]",
      "",
      "",
      "DATED this ____ day of __________, 20____.",
      "",
      "",
      "_____________________________",
      "JUDGE"
    ]
  },
  {
    key: "certificate_of_service",
    title: "Certificate of Service",
    docTypeKey: "certificate_of_service",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "CERTIFICATE OF SERVICE",
      "",
      "I hereby certify that on [Date], I served a true and correct copy of the foregoing [Document Title] upon:",
      "",
      "[Name of Party/Attorney]",
      "[Address]",
      "[City, State ZIP]",
      "",
      "by the following method:",
      "",
      "☐ U.S. Mail, postage prepaid",
      "☐ Hand Delivery",
      "☐ Electronic Mail to: [email address]",
      "☐ Electronic Filing System",
      "☐ Other: __________",
      "",
      "",
      "_____________________________",
      "[Your Full Name]",
      "Dated: __________"
    ]
  },
  {
    key: "notice_of_appearance",
    title: "Notice of Appearance",
    docTypeKey: "notice_of_appearance",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "NOTICE OF APPEARANCE",
      "",
      "PLEASE TAKE NOTICE that the undersigned hereby enters an appearance in this action as a self-represented party.",
      "",
      "All future notices, pleadings, and other documents should be served upon me at the following address:",
      "",
      "[Your Full Name]",
      "[Your Address]",
      "[City, State ZIP]",
      "[Phone Number]",
      "[Email Address]",
      "",
      "I request to receive all notices and filings in this matter.",
      "",
      "DATED this ____ day of __________, 20____.",
      "",
      "",
      "_____________________________",
      "[Your Full Name]",
      "Self-Represented [Petitioner/Respondent]"
    ]
  },
  {
    key: "case_information_sheet",
    title: "Family Law Case Information Sheet",
    docTypeKey: "case_information_sheet",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "FAMILY LAW CASE INFORMATION SHEET",
      "",
      "PETITIONER INFORMATION:",
      "Name: __________",
      "Address: __________",
      "Phone: __________",
      "Email: __________",
      "",
      "RESPONDENT INFORMATION:",
      "Name: __________",
      "Address: __________",
      "Phone: __________",
      "Email: __________",
      "",
      "CHILDREN (if applicable):",
      "Name: __________ DOB: __________",
      "Name: __________ DOB: __________",
      "Name: __________ DOB: __________",
      "",
      "ISSUES IN THIS CASE (check all that apply):",
      "☐ Custody / Parenting Plan",
      "☐ Child Support",
      "☐ Spousal Support",
      "☐ Division of Property",
      "☐ Division of Debts",
      "☐ Domestic Violence Protection",
      "☐ Other: __________",
      "",
      "PRIOR COURT CASES INVOLVING THESE PARTIES:",
      "Case Number: __________ Court: __________ Type: __________",
      "",
      "DATED: __________",
      "",
      "_____________________________",
      "[Your Full Name]"
    ]
  },
  {
    key: "response",
    title: "Response / Objection",
    docTypeKey: "response_objection",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "RESPONSE TO [MOTION/PETITION]",
      "",
      "COMES NOW the [Petitioner/Respondent], [Your Full Name], and responds to the [opposing party's] [Motion/Petition] as follows:",
      "",
      "STATEMENT OF FACTS",
      "",
      "1. [State your version of the relevant facts]",
      "",
      "2. [Additional facts as needed]",
      "",
      "RESPONSE",
      "",
      "1. [Address each point raised by the opposing party]",
      "",
      "2. [Continue as needed]",
      "",
      "CONCLUSION",
      "",
      "WHEREFORE, [Petitioner/Respondent] respectfully requests that this Court:",
      "",
      "1. Deny the [opposing party's] [Motion/Petition]",
      "",
      "2. Grant such other relief as the Court deems just and proper."
    ]
  },
  {
    key: "memorandum",
    title: "Memorandum of Law",
    docTypeKey: "memorandum",
    supportsCourtDocx: true,
    supportsDraft: true,
    starterContent: [
      "MEMORANDUM OF LAW IN SUPPORT OF [MOTION TYPE]",
      "",
      "STATEMENT OF ISSUES",
      "",
      "[State the legal question(s) the Court must decide]",
      "",
      "STATEMENT OF FACTS",
      "",
      "[Provide a concise statement of the relevant facts]",
      "",
      "ARGUMENT",
      "",
      "I. [First Legal Argument Heading]",
      "",
      "[Present your legal argument with citations to relevant statutes and cases]",
      "",
      "II. [Second Legal Argument Heading]",
      "",
      "[Continue as needed]",
      "",
      "CONCLUSION",
      "",
      "For the reasons stated above, [Petitioner/Respondent] respectfully requests that this Court [state the relief requested]."
    ]
  }
];

export const templateKeys = TEMPLATE_REGISTRY.map(t => t.key);

export function getTemplateByKey(key: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find(t => t.key === key);
}

export function getDraftCapableTemplates(): TemplateDefinition[] {
  return TEMPLATE_REGISTRY.filter(t => t.supportsDraft);
}

export function getCourtDocxCapableTemplates(): TemplateDefinition[] {
  return TEMPLATE_REGISTRY.filter(t => t.supportsCourtDocx);
}
