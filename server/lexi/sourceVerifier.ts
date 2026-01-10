const pdfParse = require("pdf-parse");

export interface VerifiedSource {
  label: string;
  url: string;
  kind: "official" | "secondary";
  verified: true;
  matchedOn: "keyword" | "quote" | "title";
  matchSnippet?: string;
}

interface VerifySourcesParams {
  queryTopic: string;
  keyTerms: string[];
  quote?: string;
  candidates: string[];
}

const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov$/i,
  /\.us$/i,
  /courts?\./i,
  /judiciary/i,
  /supreme/i,
  /legislature/i,
  /uscourts\.gov/i,
  /law\.cornell\.edu/i,
];

function isOfficialDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return OFFICIAL_DOMAIN_PATTERNS.some((p) => p.test(parsed.hostname));
  } catch {
    return false;
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .trim();
}

function extractSnippet(text: string, matchIndex: number, length: number = 120): string {
  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(text.length, matchIndex + length);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtmlTags(match[1]) : "";
}

function checkQuoteMatch(normalizedText: string, quote: string): { matched: boolean; index: number } {
  const normalizedQuote = normalizeText(quote);
  const words = normalizedQuote.split(/\s+/).filter(Boolean);
  
  if (words.length < 5) {
    return { matched: false, index: -1 };
  }
  
  const searchPhrase = words.slice(0, Math.min(12, words.length)).join(" ");
  const index = normalizedText.indexOf(searchPhrase);
  
  return { matched: index !== -1, index };
}

function checkKeyTerms(normalizedText: string, keyTerms: string[]): { matched: boolean; matchCount: number; index: number } {
  let matchCount = 0;
  let firstIndex = -1;
  
  for (const term of keyTerms) {
    const normalizedTerm = normalizeText(term);
    if (normalizedTerm.length < 2) continue;
    
    const index = normalizedText.indexOf(normalizedTerm);
    if (index !== -1) {
      matchCount++;
      if (firstIndex === -1) firstIndex = index;
    }
  }
  
  return { matched: matchCount >= 2, matchCount, index: firstIndex };
}

function checkTitleMatch(title: string, queryTopic: string, normalizedText: string, keyTerms: string[]): { matched: boolean; index: number } {
  const normalizedTitle = normalizeText(title);
  const topicWords = normalizeText(queryTopic).split(/\s+/).filter((w) => w.length > 3);
  
  const titleMatches = topicWords.filter((word) => normalizedTitle.includes(word)).length;
  if (titleMatches < Math.min(2, topicWords.length)) {
    return { matched: false, index: -1 };
  }
  
  for (const term of keyTerms) {
    const normalizedTerm = normalizeText(term);
    const index = normalizedText.indexOf(normalizedTerm);
    if (index !== -1) {
      return { matched: true, index };
    }
  }
  
  return { matched: false, index: -1 };
}

async function fetchPageContent(url: string, timeoutMs: number = 8000): Promise<{ text: string; title: string; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CivillaBot/1.0)",
        "Accept": "text/html,application/pdf,*/*",
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.status !== 200) {
      return null;
    }
    
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/pdf")) {
      const buffer = await response.arrayBuffer();
      try {
        const pdfData = await pdfParse(Buffer.from(buffer));
        return {
          text: pdfData.text || "",
          title: pdfData.info?.Title || "",
          contentType: "pdf",
        };
      } catch {
        return null;
      }
    }
    
    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const html = await response.text();
      return {
        text: stripHtmlTags(html),
        title: extractTitle(html),
        contentType: "html",
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

function normalizeUrlToHttps(url: string): string | null {
  const trimmed = url.trim();
  
  if (trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  
  if (trimmed.startsWith("http://")) {
    const httpsUrl = trimmed.replace(/^http:/, "https:");
    try {
      new URL(httpsUrl);
      return httpsUrl;
    } catch {
      return null;
    }
  }
  
  return null;
}

function getLabelFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let label = parsed.hostname.replace(/^www\./, "");
    if (parsed.pathname !== "/") {
      const pathPart = parsed.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
      if (pathPart) label += "/" + pathPart;
    }
    return label.length > 50 ? label.substring(0, 47) + "..." : label;
  } catch {
    return url.substring(0, 50);
  }
}

export async function verifySources(params: VerifySourcesParams): Promise<VerifiedSource[]> {
  const { queryTopic, keyTerms, quote, candidates } = params;
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[LexiSources] candidates", candidates);
  }
  
  const validUrls = candidates
    .map((c) => normalizeUrlToHttps(c))
    .filter((u): u is string => u !== null)
    .slice(0, 8);
  
  const verified: VerifiedSource[] = [];
  
  await Promise.all(
    validUrls.map(async (url) => {
      const content = await fetchPageContent(url);
      if (!content) return;
      
      const normalizedText = normalizeText(content.text);
      if (normalizedText.length < 100) return;
      
      let matchedOn: "quote" | "keyword" | "title" | null = null;
      let matchIndex = -1;
      
      if (quote && quote.length > 20) {
        const quoteResult = checkQuoteMatch(normalizedText, quote);
        if (quoteResult.matched) {
          matchedOn = "quote";
          matchIndex = quoteResult.index;
        }
      }
      
      if (!matchedOn) {
        const keyTermResult = checkKeyTerms(normalizedText, keyTerms);
        if (keyTermResult.matched) {
          matchedOn = "keyword";
          matchIndex = keyTermResult.index;
        }
      }
      
      if (!matchedOn) {
        const titleResult = checkTitleMatch(content.title, queryTopic, normalizedText, keyTerms);
        if (titleResult.matched) {
          matchedOn = "title";
          matchIndex = titleResult.index;
        }
      }
      
      if (matchedOn && matchIndex !== -1) {
        const originalText = content.text;
        const normalizedUpToMatch = normalizeText(originalText.slice(0, matchIndex * 2));
        const approxOriginalIndex = Math.min(matchIndex, originalText.length - 1);
        
        verified.push({
          label: getLabelFromUrl(url),
          url,
          kind: isOfficialDomain(url) ? "official" : "secondary",
          verified: true,
          matchedOn,
          matchSnippet: extractSnippet(originalText, approxOriginalIndex),
        });
      }
    })
  );
  
  verified.sort((a, b) => {
    if (a.kind === "official" && b.kind !== "official") return -1;
    if (a.kind !== "official" && b.kind === "official") return 1;
    
    const matchOrder: Record<string, number> = { quote: 0, keyword: 1, title: 2 };
    return (matchOrder[a.matchedOn] || 2) - (matchOrder[b.matchedOn] || 2);
  });
  
  const result = verified.slice(0, 5);
  
  if (result.length === 0) {
    const searchQuery = `${queryTopic} site:.gov OR site:.us OR courts`;
    result.push({
      label: "Search official sources",
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      kind: "secondary",
      verified: true,
      matchedOn: "keyword",
      matchSnippet: "No direct official source could be verified. Use this search to locate the official page.",
    });
  }
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[LexiSources] verified", result);
  }
  
  return result;
}

export function extractKeyTermsFromText(text: string, state?: string): string[] {
  const terms: string[] = [];
  
  if (state) {
    terms.push(state);
  }
  
  const ruleMatches = text.match(/(?:Rule|Section|Statute|Code|IRFLP|IRCP|USC|CFR)\s*\d+[A-Za-z]?(?:\.\d+)?/gi);
  if (ruleMatches) {
    terms.push(...ruleMatches.slice(0, 3));
  }
  
  const legalTerms = [
    "child support", "custody", "parenting time", "visitation", "alimony", "spousal support",
    "income shares", "worksheet", "guidelines", "modification", "enforcement",
    "property division", "marital assets", "discovery", "deposition", "subpoena",
    "motion", "hearing", "trial", "order", "judgment", "decree",
  ];
  
  const lowerText = text.toLowerCase();
  for (const term of legalTerms) {
    if (lowerText.includes(term)) {
      terms.push(term);
    }
  }
  
  return Array.from(new Set(terms)).slice(0, 8);
}

export function extractTopicFromContext(userMessage: string, threadTitle?: string, moduleKey?: string): string {
  if (userMessage.length > 10 && userMessage.length < 200) {
    return userMessage;
  }
  
  if (threadTitle && threadTitle.length > 5) {
    return threadTitle;
  }
  
  const moduleTopics: Record<string, string> = {
    evidence: "court evidence rules",
    timeline: "case timeline documentation",
    documents: "legal document requirements",
    "trial-prep": "trial preparation procedures",
    "child-support": "child support calculation guidelines",
    "parenting-plan": "parenting plan requirements",
  };
  
  return moduleTopics[moduleKey || ""] || "family law court procedures";
}
