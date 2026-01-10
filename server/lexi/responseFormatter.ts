/**
 * Response formatter to ensure Lexi responses are calm, clear, and well-structured.
 * Enforces formatting rules and removes any legal-advice-like language.
 */

// Patterns that sound like legal advice - replace with neutral alternatives
const LEGAL_ADVICE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\byou should file\b/gi, replacement: "one option is to file" },
  { pattern: /\byou must file\b/gi, replacement: "the typical requirement is to file" },
  { pattern: /\byou need to file\b/gi, replacement: "it may be necessary to file" },
  { pattern: /\byou should submit\b/gi, replacement: "submissions typically include" },
  { pattern: /\byou must submit\b/gi, replacement: "the usual requirement is to submit" },
  { pattern: /\bI recommend\b/gi, replacement: "one approach is" },
  { pattern: /\bI advise\b/gi, replacement: "it may be helpful to consider" },
  { pattern: /\bmy advice is\b/gi, replacement: "one consideration is" },
  { pattern: /\byou're required to\b/gi, replacement: "it's typically required to" },
  { pattern: /\byou'll need to\b/gi, replacement: "it's often necessary to" },
  { pattern: /\bmake sure you\b/gi, replacement: "consider" },
  { pattern: /\bdon't forget to\b/gi, replacement: "it may help to remember to" },
  { pattern: /\byou have to\b/gi, replacement: "the typical expectation is to" },
  { pattern: /\byou're going to need\b/gi, replacement: "it may be helpful to have" },
  { pattern: /\bI strongly suggest\b/gi, replacement: "one option to consider is" },
  { pattern: /\bthe best approach is\b/gi, replacement: "one common approach is" },
  { pattern: /\byour best bet is\b/gi, replacement: "one option is" },
  { pattern: /\bwhat you should do\b/gi, replacement: "what's often done" },
  { pattern: /\byou're obligated to\b/gi, replacement: "there may be an obligation to" },
];

// Valid URL patterns for source links
const VALID_URL_PATTERN = /^https:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d+)?(\/[-a-zA-Z0-9@:%._+~#=/?&]*)?$/;

/**
 * Sanitize legal advice language from response
 */
export function sanitizeLegalLanguage(content: string): string {
  let result = content;
  
  for (const { pattern, replacement } of LEGAL_ADVICE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

/**
 * Validate and fix source links in response
 */
export function validateSourceLinks(content: string): string {
  // Find Sources section if present
  const sourcesMatch = content.match(/\n(sources?:?)\s*\n/i);
  if (!sourcesMatch) return content;
  
  const sourcesIndex = sourcesMatch.index! + sourcesMatch[0].length;
  const beforeSources = content.substring(0, sourcesMatch.index! + sourcesMatch[0].length);
  const afterSources = content.substring(sourcesIndex);
  
  // Process source links line by line
  const lines = afterSources.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    // Check if this is a source line (starts with number, dash, or bullet)
    if (/^[\s]*[-•*\d]+\.?\s/.test(line)) {
      // Extract URL from line
      const urlMatch = line.match(/(https?:\/\/[^\s)>\]]+)/);
      
      if (urlMatch) {
        const url = urlMatch[1];
        // Validate URL format
        if (!VALID_URL_PATTERN.test(url)) {
          // Invalid URL - add note
          processedLines.push(line.replace(url, `[Link may need verification: ${url}]`));
          continue;
        }
      } else if (line.includes('www.') || line.includes('.gov') || line.includes('.org')) {
        // Has domain but no https:// - add note
        processedLines.push(line + ' (verify on official website)');
        continue;
      }
    }
    
    processedLines.push(line);
  }
  
  return beforeSources + processedLines.join('\n');
}

/**
 * Enforce formatting rules: bullets, headings, spacing
 */
export function enforceFormatting(content: string): string {
  let result = content;
  
  // Fix inline lists (convert "- item - item" to proper bullets)
  result = result.replace(/:\s*-\s*([^-\n]+)\s*-\s*([^-\n]+)/g, ':\n\n- $1\n- $2');
  
  // Ensure blank line before bullet lists
  result = result.replace(/([^\n])\n([-•*]\s)/g, '$1\n\n$2');
  
  // Ensure blank line before headings
  result = result.replace(/([^\n])\n(#{1,3}\s)/g, '$1\n\n$2');
  result = result.replace(/([^\n])\n(\*\*[^*]+\*\*:?)\n/g, '$1\n\n$2\n');
  
  // Ensure blank line after headings
  result = result.replace(/(#{1,3}\s[^\n]+)\n([^\n])/g, '$1\n\n$2');
  
  // Break up long paragraphs (more than 5 sentences)
  const paragraphs = result.split(/\n\n+/);
  const processedParagraphs = paragraphs.map(para => {
    // Skip if it's a list item or heading
    if (/^[-•*#]/.test(para.trim())) return para;
    
    // Count sentences
    const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) {
      // Break into smaller chunks
      const midpoint = Math.ceil(sentences.length / 2);
      const first = sentences.slice(0, midpoint).join('. ').trim();
      const second = sentences.slice(midpoint).join('. ').trim();
      return first + (first.endsWith('.') ? '' : '.') + '\n\n' + second + (second.endsWith('.') ? '' : '.');
    }
    return para;
  });
  
  result = processedParagraphs.join('\n\n');
  
  // Remove excessive blank lines (more than 2)
  result = result.replace(/\n{4,}/g, '\n\n\n');
  
  // Ensure proper spacing around "Sources:" section
  result = result.replace(/\n(Sources?:)/gi, '\n\n---\n\n$1');
  
  return result.trim();
}

/**
 * Add delay explanation for slower responses
 */
export function getDelayExplanation(isResearchMode: boolean, estimatedSeconds?: number): string | null {
  if (!estimatedSeconds || estimatedSeconds < 5) return null;
  
  if (isResearchMode) {
    return "I'm researching official sources for accurate information. This may take a moment...";
  }
  
  if (estimatedSeconds > 15) {
    return "I'm gathering information to give you a thorough response. Thanks for your patience...";
  }
  
  return null;
}

/**
 * Format response for consistent, calm presentation
 */
export function formatLexiResponse(
  content: string,
  options: {
    isResearchMode?: boolean;
    validateLinks?: boolean;
  } = {}
): string {
  let result = content;
  
  // Step 1: Sanitize legal advice language
  result = sanitizeLegalLanguage(result);
  
  // Step 2: Validate source links if needed
  if (options.validateLinks !== false) {
    result = validateSourceLinks(result);
  }
  
  // Step 3: Enforce formatting rules
  result = enforceFormatting(result);
  
  return result;
}

/**
 * Check if response looks properly formatted
 */
export function isWellFormatted(content: string): boolean {
  // Check for proper spacing
  const hasSections = content.includes('\n\n');
  const hasBullets = /^[-•*]\s/m.test(content);
  const hasLongParagraph = content.split('\n\n').some(p => {
    if (/^[-•*#]/.test(p.trim())) return false;
    const sentences = p.split(/[.!?]+/).filter(s => s.trim());
    return sentences.length > 6;
  });
  
  return hasSections && !hasLongParagraph;
}
