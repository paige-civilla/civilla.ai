/**
 * Brand Components for civilla branding
 * 
 * Use <Brand> for standalone tokens: <Brand>civilla.ai</Brand>
 * Use <BrandText> for long strings so civilla branding always stays lowercase/italic/semi-bold
 * 
 * These components ensure consistent styling across the app without spacing issues.
 */

import type { ReactNode } from "react";

/**
 * Brand - For standalone brand tokens
 * Renders the text with civilla brand styling (lowercase, italic, semi-bold)
 */
export function Brand({ children }: { children: string }) {
  return <span className="civilla-brand">{children.toLowerCase()}</span>;
}

/**
 * BrandText - For long strings containing brand mentions
 * Automatically finds and styles: www.civilla.ai, civilla.ai, civilla
 * Uses index slicing to preserve exact original spacing
 */
export function BrandText({ children }: { children: ReactNode }) {
  if (typeof children !== "string") {
    return <>{children}</>;
  }

  const regex = /(\bwww\.civilla\.ai\b|\bcivilla\.ai\b|\bcivilla\b)/gi;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      result.push(children.slice(lastIndex, match.index));
    }
    result.push(
      <span key={match.index} className="civilla-brand">
        {match[0].toLowerCase()}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < children.length) {
    result.push(children.slice(lastIndex));
  }

  return <>{result}</>;
}
