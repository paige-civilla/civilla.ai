export type LexiIntent =
  | "SERVED_PAPERS"
  | "FILE_OR_SERVE"
  | "CHILD_SUPPORT_MODIFICATION"
  | "DIVORCE_FILING"
  | "DIVORCE_RESPONSE"
  | "UNKNOWN";

export interface LexiClassification {
  intent: LexiIntent;
  confidence: number;
  reasons: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text: string, phrases: string[]) =>
  phrases.some((p) => text.includes(p));

export function classifyLexiIntent(raw: string): LexiClassification {
  const text = norm(raw);

  if (!text) return { intent: "UNKNOWN", confidence: 0, reasons: ["empty_input"] };

  const served = hasAny(text, ["served", "got served", "served papers", "summons", "complaint", "petition", "divorce papers", "papers i received"]);
  const respond = hasAny(text, ["answer", "respond", "response", "court date", "hearing", "deadline"]);
  const file = hasAny(text, ["file", "filing", "start divorce", "initiate", "serve someone", "serve my spouse", "serve the other party"]);
  const divorce = hasAny(text, ["divorce", "dissolution", "separation"]);
  const childSupport = hasAny(text, ["child support", "support modification", "modify support", "change child support", "arrears"]);

  if (served) {
    const reasons = ["mentions_served_or_received_papers"];
    const confidence = respond ? 0.85 : 0.75;
    return { intent: "SERVED_PAPERS", confidence, reasons };
  }

  if (childSupport) {
    return { intent: "CHILD_SUPPORT_MODIFICATION", confidence: 0.8, reasons: ["mentions_child_support_modification"] };
  }

  if (file && divorce) {
    return { intent: "DIVORCE_FILING", confidence: 0.75, reasons: ["mentions_filing_divorce"] };
  }

  if (respond && divorce) {
    return { intent: "DIVORCE_RESPONSE", confidence: 0.75, reasons: ["mentions_responding_divorce"] };
  }

  if (file) {
    return { intent: "FILE_OR_SERVE", confidence: 0.65, reasons: ["mentions_file_or_serve"] };
  }

  return { intent: "UNKNOWN", confidence: 0.4, reasons: ["no_strong_keywords"] };
}

export interface LexiReply {
  title: string;
  message: string;
  primaryAction: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  tertiaryAction?: { label: string; to: string };
}

export function buildLexiReply(intent: LexiIntent): LexiReply {
  const disclaimer = "Prepared using Civilla for educational and research purposes. Not legal advice.";

  switch (intent) {
    case "SERVED_PAPERS":
      return {
        title: "It sounds like you may have been served papers.",
        message:
          `If you upload what you received, Civilla can help identify what the documents are and show typical next steps and common information people gather (varies by state and court).\n\n${disclaimer}`,
        primaryAction: { label: "Upload papers", to: "/app/start-here?path=served" },
        secondaryAction: { label: "Go to Start Here", to: "/app/start-here" },
        tertiaryAction: { label: "Browse common paths", to: "/app/start-here" },
      };
    case "CHILD_SUPPORT_MODIFICATION":
      return {
        title: "Child support modification",
        message:
          `Civilla can walk through typical steps and help organize the info commonly needed for child support modification in your state.\n\n${disclaimer}`,
        primaryAction: { label: "Go to Start Here", to: "/app/start-here?path=child-support" },
        secondaryAction: { label: "Browse common paths", to: "/app/start-here" },
      };
    case "DIVORCE_FILING":
      return {
        title: "Starting a divorce filing",
        message:
          `Civilla can help you understand the typical filing process and draft documents from your selections (jurisdiction-aware).\n\n${disclaimer}`,
        primaryAction: { label: "Go to Start Here", to: "/app/start-here?path=filing" },
        secondaryAction: { label: "Browse common paths", to: "/app/start-here" },
      };
    case "DIVORCE_RESPONSE":
      return {
        title: "Responding to divorce papers",
        message:
          `Civilla can explain typical response steps and help you draft a response from your selections. If you have the papers, uploading them can help identify deadlines and document types.\n\n${disclaimer}`,
        primaryAction: { label: "Upload papers", to: "/app/start-here?path=served" },
        secondaryAction: { label: "Go to Start Here", to: "/app/start-here?path=response" },
      };
    case "FILE_OR_SERVE":
      return {
        title: "Filing or serving paperwork",
        message:
          `Civilla can help you identify common filing/serving steps and what information is typically needed in your jurisdiction.\n\n${disclaimer}`,
        primaryAction: { label: "Go to Start Here", to: "/app/start-here?path=filing" },
        secondaryAction: { label: "Browse common paths", to: "/app/start-here" },
      };
    default:
      return {
        title: "Thanks — I can help route you.",
        message:
          `You can start by choosing a common path below, or upload papers if you were served.\n\n${disclaimer}`,
        primaryAction: { label: "Go to Start Here", to: "/app/start-here" },
        secondaryAction: { label: "Upload papers", to: "/app/start-here?path=served" },
      };
  }
}
