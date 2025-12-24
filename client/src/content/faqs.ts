export type FaqItem = { id: string; q: string; a: string; tags?: string[] };

export const FAQ_LEGAL: FaqItem[] = [
  {
    id: "legal-advice",
    q: "Can civilla Give Me Legal Advice?",
    a: "No. civilla is an educational platform. We explain general legal concepts and typical court processes, and we help you organize your information. We do not tell you what to file, what strategy to use, or what decision you should make. If you need legal advice, talk to a licensed attorney in your state."
  },
  {
    id: "attorney-client",
    q: "Does Using civilla Create An Attorney-Client Relationship?",
    a: "No. Using civilla, reading content, or contacting support does not create an attorney-client relationship."
  },
  {
    id: "documents-court",
    q: "Can I Use civilla's Documents In Court?",
    a: "civilla's documents are educational drafts to help you get organized. You are responsible for reviewing and ensuring anything you file meets your local court's rules, forms, and requirements. When in doubt, check your court's website or consult an attorney."
  },
  {
    id: "who-decides",
    q: "Who Decides What I Do With My Case?",
    a: "You do. civilla provides information and organization tools. You make the decisions."
  }
];

export const FAQ_PRIVACY: FaqItem[] = [
  {
    id: "is-private",
    q: "Is My Information Private?",
    a: "We treat your information as sensitive. We use security controls to protect it and we do not sell your personal information. For details, see the Privacy Policy."
  },
  {
    id: "sharing",
    q: "Do You Share My Data With Courts Or The Other Party?",
    a: "No. civilla does not send your information to courts, opposing parties, or anyone else. You control what you download, share, or file."
  }
];

export const FAQ_SAFETY: FaqItem[] = [
  {
    id: "quick-exit",
    q: "What Is Quick Exit?",
    a: "Quick Exit is a safety feature designed to help you leave the site quickly. It redirects you to a neutral website. For additional safety, consider using a private browsing window and clearing history if needed."
  },
  {
    id: "not-emergency",
    q: "Is civilla An Emergency Service?",
    a: "No. If you are in immediate danger, call your local emergency number (911 in the U.S.). If you are in crisis, contact your local crisis hotline (988 in the U.S.)."
  }
];

export const FAQ_ACCESSIBILITY: FaqItem[] = [
  {
    id: "a11y-help",
    q: "How Do I Request Accessibility Help Or Report A Barrier?",
    a: "Email us and tell us what you're trying to do, what device/browser you're using, and what went wrong. We'll respond with care and work on a fix."
  }
];

export const FAQ_ALL: FaqItem[] = [
  ...FAQ_LEGAL,
  ...FAQ_PRIVACY,
  ...FAQ_SAFETY,
  ...FAQ_ACCESSIBILITY
];

export const FAQ_SECTIONS = [
  { title: "Legal Boundaries", items: FAQ_LEGAL },
  { title: "Privacy", items: FAQ_PRIVACY },
  { title: "Safety", items: FAQ_SAFETY },
  { title: "Accessibility", items: FAQ_ACCESSIBILITY },
];
