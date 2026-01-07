export interface NormalizedSource {
  title: string;
  url: string;
  reachable?: boolean;
}

export function isValidHttpUrl(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function toGoogleQueryUrl(text: string, state?: string): string {
  const query = state ? `${text} ${state} law` : text;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const OFFICIAL_DOMAIN_PATTERNS = [
  /\.gov$/i,
  /\.us$/i,
  /courts?\..+\.(gov|us|state)/i,
  /legislature\./i,
  /leginfo\./i,
  /law\.cornell\.edu/i,
  /uscourts\.gov/i,
  /courtlistener\.com/i,
  /casetext\.com/i,
  /justia\.com/i,
];

export function isOfficialDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return OFFICIAL_DOMAIN_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

export function normalizeSources(
  rawSources: Array<{ title?: string; url?: string; text?: string }>,
  state?: string
): NormalizedSource[] {
  const results: NormalizedSource[] = [];
  const seenUrls = new Set<string>();

  for (const source of rawSources) {
    const url = source.url?.trim();
    const title = source.title?.trim() || source.text?.trim() || "";

    if (url && isValidHttpUrl(url)) {
      const normalizedUrl = url.toLowerCase();
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        results.push({
          title: title || new URL(url).hostname,
          url,
        });
      }
    } else if (title && title.length > 3) {
      const googleUrl = toGoogleQueryUrl(title, state);
      if (!seenUrls.has(googleUrl)) {
        seenUrls.add(googleUrl);
        results.push({
          title: `Search: ${title}`,
          url: googleUrl,
        });
      }
    }
  }

  return results
    .sort((a, b) => {
      const aOfficial = isOfficialDomain(a.url) ? 0 : 1;
      const bOfficial = isOfficialDomain(b.url) ? 0 : 1;
      return aOfficial - bOfficial;
    })
    .slice(0, 5);
}

export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)"\]>]+/gi;
  const matches = text.match(urlRegex) || [];
  return matches.filter((url) => isValidHttpUrl(url));
}

export function cleanBrokenUrl(url: string): string | null {
  if (!url) return null;
  
  let cleaned = url.trim();
  cleaned = cleaned.replace(/[.,;:!?\)]+$/, "");
  
  if (cleaned.includes("example.com") || cleaned.includes("placeholder")) {
    return null;
  }
  
  if (isValidHttpUrl(cleaned)) {
    return cleaned;
  }
  
  return null;
}
