export interface LexiSource {
  title: string;
  url: string;
  jurisdiction?: string;
  type?: "statute" | "court_rule" | "form" | "judiciary" | "other";
  reachable?: boolean;
  accessedAt?: string;
  publisher?: string;
}

export function normalizeUrl(url: string): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  if (/^[^\s\/]+\.[a-z]{2,}/i.test(raw) && raw.includes('.')) return `https://${raw}`;
  return null;
}

export function normalizeUrlsInContent(content: string): string {
  return content.replace(
    /(?<![("'])((?:https?:\/\/)?(?:www\.)?[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\/[^\s\])'"<>]*)?)/gi,
    (match) => {
      if (/^https?:\/\//i.test(match)) return match;
      if (/^www\./i.test(match)) return `https://${match}`;
      if (/^[a-z0-9][-a-z0-9]*\.[a-z]{2,}/i.test(match)) return `https://${match}`;
      return match;
    }
  );
}

export function formatSources(sources: LexiSource[]): string {
  if (!sources || sources.length === 0) {
    return "";
  }
  
  const lines = sources.map((source) => {
    const jurisdictionPart = source.jurisdiction ? ` (${source.jurisdiction})` : "";
    return `- ${source.title}${jurisdictionPart} - ${source.url}`;
  });
  
  return `\n\nSources:\n${lines.join("\n")}`;
}

export function extractSourcesFromContent(content: string): {
  mainContent: string;
  sources: LexiSource[];
  hasSources: boolean;
} {
  const sourcesMatch = content.match(/\n\nSources:\n([\s\S]*?)$/i);
  
  if (!sourcesMatch) {
    return {
      mainContent: content,
      sources: [],
      hasSources: false,
    };
  }
  
  const mainContent = content.slice(0, sourcesMatch.index);
  const sourcesText = sourcesMatch[1];
  
  const sourceLines = sourcesText.split("\n").filter((line) => line.trim().startsWith("-"));
  
  const sources: LexiSource[] = sourceLines.map((line) => {
    const match = line.match(/^-\s*(.+?)\s*(?:\(([^)]+)\))?\s*-\s*(.+)$/);
    if (match) {
      return {
        title: match[1].trim(),
        jurisdiction: match[2]?.trim(),
        url: match[3].trim(),
      };
    }
    return {
      title: line.replace(/^-\s*/, "").trim(),
      url: "",
    };
  });
  
  return {
    mainContent,
    sources,
    hasSources: sources.length > 0,
  };
}

async function checkUrlReachable(url: string, timeoutMs: number = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CivillaBot/1.0)",
      },
    });
    
    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("https://") && !url.startsWith("http://")) return false;
  if (url.includes("placeholder") || url.includes("example.com")) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function normalizeAndValidateSources(sources: LexiSource[]): Promise<LexiSource[]> {
  const accessedAt = new Date().toISOString();
  
  const validatedSources = await Promise.all(
    sources.map(async (source) => {
      const normalizedUrl = normalizeUrl(source.url);
      
      if (!normalizedUrl || !isValidUrl(normalizedUrl)) {
        return {
          ...source,
          url: source.url,
          reachable: false,
          accessedAt,
        };
      }
      
      const reachable = await checkUrlReachable(normalizedUrl);
      
      return {
        ...source,
        url: normalizedUrl,
        reachable,
        accessedAt,
      };
    })
  );
  
  return validatedSources;
}

export const NO_SOURCES_FOUND_MESSAGE = `I did not find an official source for that yet. To verify this information, I recommend checking:

- Your state's judiciary website (usually [state]courts.gov or courts.[state].gov)
- Your state legislature's website for statutes
- Your local court clerk's office

Would you like me to help you identify the specific website for your state?`;
