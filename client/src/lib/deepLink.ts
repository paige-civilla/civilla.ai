export type DeepLinkType = 
  | "evidence-note" 
  | "timeline-event" 
  | "document" 
  | "exhibit-snippet" 
  | "trial-prep";

export interface DeepLinkParams {
  type: DeepLinkType | null;
  id: string | null;
}

const PARAM_MAP: Record<string, DeepLinkType> = {
  noteId: "evidence-note",
  eventId: "timeline-event",
  docId: "document",
  snippetId: "exhibit-snippet",
  tpId: "trial-prep",
};

export function parseDeepLinkFromLocation(): DeepLinkParams {
  const params = new URLSearchParams(window.location.search);
  
  for (const [param, type] of Object.entries(PARAM_MAP)) {
    const id = params.get(param);
    if (id) {
      return { type, id };
    }
  }
  
  return { type: null, id: null };
}

export function getDeepLinkParam(paramName: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}

export function scrollAndHighlight(elementId: string, duration = 2000): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    return false;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });

  element.classList.add("deep-link-highlight");

  setTimeout(() => {
    element.classList.remove("deep-link-highlight");
  }, duration);

  return true;
}

export function clearDeepLinkQueryParams(): void {
  const url = new URL(window.location.href);
  const paramsToRemove = Object.keys(PARAM_MAP);
  
  let changed = false;
  for (const param of paramsToRemove) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }
  
  if (changed) {
    window.history.replaceState(null, "", url.pathname + url.search);
  }
}

export function useDeepLinkEffect(
  paramName: string,
  elementIdPrefix: string,
  isDataLoaded: boolean,
  onBeforeScroll?: (id: string) => Promise<void> | void
): void {
  const id = getDeepLinkParam(paramName);
  
  if (!id || !isDataLoaded) return;

  const attemptScroll = async () => {
    if (onBeforeScroll) {
      await onBeforeScroll(id);
    }
    
    setTimeout(() => {
      const success = scrollAndHighlight(`${elementIdPrefix}${id}`);
      if (success) {
        clearDeepLinkQueryParams();
      }
    }, 100);
  };

  attemptScroll();
}
