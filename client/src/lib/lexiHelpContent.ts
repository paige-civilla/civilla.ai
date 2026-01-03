import { getDocumentTypeByKey, DOCUMENT_TYPES } from "./documentLibrary";

export interface LexiHelpContext {
  routeKey: string;
  selectedDocKey?: string;
  selectedSubtypeKey?: string;
}

export interface LexiHelpContent {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const moduleHelp: Record<string, LexiHelpContent> = {
  dashboard: {
    title: "Your Case Dashboard",
    paragraphs: [
      "This is your central hub for managing your case. You can see upcoming deadlines, recent activity, and quick access to all modules.",
      "The calendar shows important dates, and the tiles below give you shortcuts to each part of your case."
    ],
    bullets: [
      "Check your calendar regularly for upcoming deadlines",
      "Use module tiles to navigate to different areas",
      "The sidebar menu gives you full access to all features"
    ]
  },
  evidence: {
    title: "Evidence Management",
    paragraphs: [
      "This tool helps you organize and manage evidence files for your case. You can upload documents, photos, and other files that may be relevant to your case.",
      "Keeping your evidence organized makes it easier to find what you need when preparing court documents or exhibits."
    ],
    bullets: [
      "Upload files with descriptive names",
      "Add notes to remember why each piece of evidence is important",
      "Evidence can later be linked to exhibits for court filings"
    ]
  },
  timeline: {
    title: "Case Timeline",
    paragraphs: [
      "The timeline helps you track and organize important events related to your case. A clear timeline can help you remember details and present information in chronological order.",
      "Courts often find chronological organization helpful when reviewing case history."
    ],
    bullets: [
      "Record events as they happen",
      "Include dates, descriptions, and any supporting evidence",
      "Use categories to organize different types of events"
    ]
  },
  exhibits: {
    title: "Exhibit Lists",
    paragraphs: [
      "Exhibits are pieces of evidence formally presented to the court. This tool helps you organize and number your exhibits according to court requirements.",
      "Many courts require exhibit lists to be submitted before hearings or trials."
    ],
    bullets: [
      "Create exhibit lists for different hearings or filings",
      "Link exhibits to evidence files you've uploaded",
      "Number exhibits according to your court's preferences"
    ]
  },
  documents: {
    title: "Document Preparation",
    paragraphs: [
      "This is where you can create, edit, and manage documents for your case. You can draft documents in your own words, then generate court-formatted versions when ready.",
      "The tool supports various document types commonly used in family law proceedings."
    ],
    bullets: [
      "Start with drafts to organize your thoughts",
      "Use the court-formatted option for formal submissions",
      "Review all information before downloading final documents"
    ]
  },
  tasks: {
    title: "Case To-Do List",
    paragraphs: [
      "Keep track of tasks you need to complete for your case. This helps ensure nothing falls through the cracks and you stay organized.",
      "You can set due dates and mark tasks as complete when finished."
    ],
    bullets: [
      "Break larger tasks into smaller steps",
      "Set realistic due dates",
      "Review your task list regularly"
    ]
  },
  deadlines: {
    title: "Important Deadlines",
    paragraphs: [
      "Court deadlines are often strict and missing them can have serious consequences. This tool helps you track filing deadlines, hearing dates, and other important dates.",
      "Set reminders for yourself to ensure you have time to prepare before deadlines."
    ],
    bullets: [
      "Add all court-imposed deadlines",
      "Give yourself buffer time before actual due dates",
      "Check this regularly to avoid missed deadlines"
    ]
  },
  patterns: {
    title: "Communication Pattern Analysis",
    paragraphs: [
      "This tool analyzes your logged communications to identify recurring themes and patterns. Recognizing patterns can help you understand the overall picture of your communications.",
      "Pattern analysis is for your own organization and understanding."
    ],
    bullets: [
      "Review detected patterns for insights",
      "Patterns can help identify recurring issues",
      "Use this information to organize your case narrative"
    ]
  },
  contacts: {
    title: "Case Contacts",
    paragraphs: [
      "Keep track of people involved in your case, including the other party, attorneys, witnesses, and court personnel. Having contact information organized saves time.",
      "This is for your reference and organization."
    ],
    bullets: [
      "Add contact details for all relevant parties",
      "Note each person's role in the case",
      "Update information as it changes"
    ]
  },
  communications: {
    title: "Communications Log",
    paragraphs: [
      "Track important communications related to your case. Logging communications can help you remember conversations and provide context if disputes arise.",
      "Include the date, participants, and a summary of what was discussed."
    ],
    bullets: [
      "Log communications promptly while details are fresh",
      "Include relevant quotes or key points",
      "Note the method of communication (email, text, phone, in person)"
    ]
  },
  children: {
    title: "Children Information",
    paragraphs: [
      "If your case involves children, this section helps you organize information about each child, including basic details and any relevant notes.",
      "Courts consider children's needs carefully in family law matters."
    ],
    bullets: [
      "Keep basic information about each child current",
      "Note any special circumstances or needs",
      "This information may be needed for court forms"
    ]
  },
  settings: {
    title: "Case Settings",
    paragraphs: [
      "Configure your case settings, including the case title, nickname for easy reference, case number, and other details.",
      "Keeping this information accurate helps with document generation."
    ],
    bullets: [
      "The official case title is used in court documents",
      "Use a nickname for your own quick reference",
      "Update the case number when assigned by the court"
    ]
  },
  account: {
    title: "Account Settings",
    paragraphs: [
      "Manage your personal information, preferences, and account settings. This information may be used to pre-fill documents.",
      "Keep your contact information current."
    ],
    bullets: [
      "Update your contact information as needed",
      "Review autofill preferences",
      "Manage your role (self-represented or attorney)"
    ]
  },
  library: {
    title: "Document Library",
    paragraphs: [
      "Browse common document types used in family law cases. Each entry explains what the document is, when it's commonly used, and what information is typically included.",
      "This library is for educational purposes to help you understand different document types."
    ],
    bullets: [
      "Learn about documents before drafting them",
      "Use 'Start Draft' to begin creating a document",
      "Motion subtypes are organized under the Motions category"
    ]
  }
};

export function getLexiHelp(context: LexiHelpContext): LexiHelpContent {
  if (context.selectedSubtypeKey) {
    const subtype = getDocumentTypeByKey(context.selectedSubtypeKey);
    if (subtype) {
      return {
        title: subtype.title,
        paragraphs: [
          subtype.description,
          "Questions to consider: What specific facts support your request? Do you have evidence to attach? Have you reviewed your court's local rules for this type of filing?"
        ],
        bullets: [
          `Commonly used: ${subtype.commonWhenUsed.join("; ")}`,
          `Information typically included: ${subtype.requiredInfo.slice(0, 2).join("; ")}`
        ]
      };
    }
  }

  if (context.selectedDocKey) {
    const doc = getDocumentTypeByKey(context.selectedDocKey);
    if (doc) {
      return {
        title: doc.title,
        paragraphs: [
          doc.description,
          "Questions to consider: What specific facts support your position? Do you have evidence to attach? Have you reviewed your court's local rules?"
        ],
        bullets: [
          `Commonly used: ${doc.commonWhenUsed.join("; ")}`,
          `Information typically included: ${doc.requiredInfo.slice(0, 2).join("; ")}`
        ]
      };
    }
  }

  const help = moduleHelp[context.routeKey];
  if (help) {
    return help;
  }

  return {
    title: "Help",
    paragraphs: [
      "Welcome to your case management workspace. Each section of this tool is designed to help you organize different aspects of your case.",
      "Use the navigation to explore different modules, and this help panel will update with relevant information for each section."
    ]
  };
}

export function getAllModuleHelpKeys(): string[] {
  return Object.keys(moduleHelp);
}
