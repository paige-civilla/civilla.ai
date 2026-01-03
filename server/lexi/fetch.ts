const ALLOWED_DOMAINS = [
  ".gov",
  ".us",
  ".state.",
  "courts.",
  "judiciary.",
  "legislature.",
  "law.",
];

const MAX_BYTES = 100000;
const TIMEOUT_MS = 10000;
const USER_AGENT = "Civilla-Lexi/1.0 (Legal Research Assistant)";

export function isDomainAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    return ALLOWED_DOMAINS.some((pattern) => hostname.includes(pattern));
  } catch {
    return false;
  }
}

export async function safeFetch(url: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  if (!isDomainAllowed(url)) {
    return {
      success: false,
      error: `Domain not in allowlist: ${url}`,
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return {
        success: false,
        error: `Unsupported content type: ${contentType}`,
      };
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: "No response body" };
    }
    
    let received = 0;
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      received += value.length;
      if (received > MAX_BYTES) {
        reader.cancel();
        break;
      }
      
      chunks.push(value);
    }
    
    const decoder = new TextDecoder("utf-8");
    const content = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("");
    
    return {
      success: true,
      content,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: message,
    };
  }
}

export function buildStateJudiciaryUrl(state: string): string | null {
  const stateMap: Record<string, string> = {
    alabama: "https://judicial.alabama.gov",
    alaska: "https://courts.alaska.gov",
    arizona: "https://www.azcourts.gov",
    arkansas: "https://www.arcourts.gov",
    california: "https://www.courts.ca.gov",
    colorado: "https://www.courts.state.co.us",
    connecticut: "https://www.jud.ct.gov",
    delaware: "https://courts.delaware.gov",
    florida: "https://www.flcourts.org",
    georgia: "https://www.gasupreme.us",
    hawaii: "https://www.courts.state.hi.us",
    idaho: "https://isc.idaho.gov",
    illinois: "https://www.illinoiscourts.gov",
    indiana: "https://www.in.gov/courts",
    iowa: "https://www.iowacourts.gov",
    kansas: "https://www.kscourts.org",
    kentucky: "https://courts.ky.gov",
    louisiana: "https://www.lasc.org",
    maine: "https://www.courts.maine.gov",
    maryland: "https://www.courts.state.md.us",
    massachusetts: "https://www.mass.gov/courts",
    michigan: "https://courts.michigan.gov",
    minnesota: "https://www.mncourts.gov",
    mississippi: "https://courts.ms.gov",
    missouri: "https://www.courts.mo.gov",
    montana: "https://courts.mt.gov",
    nebraska: "https://supremecourt.nebraska.gov",
    nevada: "https://nvcourts.gov",
    "new hampshire": "https://www.courts.state.nh.us",
    "new jersey": "https://www.njcourts.gov",
    "new mexico": "https://www.nmcourts.gov",
    "new york": "https://www.nycourts.gov",
    "north carolina": "https://www.nccourts.gov",
    "north dakota": "https://www.ndcourts.gov",
    ohio: "https://www.supremecourt.ohio.gov",
    oklahoma: "https://www.oscn.net",
    oregon: "https://www.courts.oregon.gov",
    pennsylvania: "https://www.pacourts.us",
    "rhode island": "https://www.courts.ri.gov",
    "south carolina": "https://www.sccourts.org",
    "south dakota": "https://ujs.sd.gov",
    tennessee: "https://www.tncourts.gov",
    texas: "https://www.txcourts.gov",
    utah: "https://www.utcourts.gov",
    vermont: "https://www.vermontjudiciary.org",
    virginia: "https://www.vacourts.gov",
    washington: "https://www.courts.wa.gov",
    "west virginia": "https://www.courtswv.gov",
    wisconsin: "https://www.wicourts.gov",
    wyoming: "https://www.courts.state.wy.us",
  };
  
  return stateMap[state.toLowerCase()] || null;
}
