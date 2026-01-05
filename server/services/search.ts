import { db } from "../db";
import { 
  evidenceFiles, 
  evidenceNotes, 
  timelineEvents, 
  caseCommunications, 
  documents, 
  exhibitSnippets, 
  trialPrepShortlist,
  cases 
} from "@shared/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";

export type SearchResultType = 
  | "evidence" 
  | "note" 
  | "timeline" 
  | "communication" 
  | "document" 
  | "snippet" 
  | "trialprep";

export interface SearchResult {
  type: SearchResultType;
  caseId: string;
  id: string;
  title: string;
  snippet: string;
  href: string;
  caseTitle?: string;
}

interface SearchParams {
  userId: string;
  caseId?: string | null;
  q: string;
  limit?: number;
}

function buildSnippet(text: string | null, query: string, maxLen = 100): string {
  if (!text) return "";
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIdx = lowerText.indexOf(lowerQuery);
  
  if (matchIdx === -1) {
    return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
  }
  
  const contextBefore = 30;
  const contextAfter = maxLen - contextBefore - query.length;
  
  let start = Math.max(0, matchIdx - contextBefore);
  let end = Math.min(text.length, matchIdx + query.length + contextAfter);
  
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";
  
  return snippet;
}

function isExactTitleMatch(title: string, query: string): boolean {
  return title.toLowerCase() === query.toLowerCase();
}

function scoreResult(result: SearchResult, query: string): number {
  const lowerTitle = result.title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (lowerTitle === lowerQuery) return 100;
  if (lowerTitle.startsWith(lowerQuery)) return 90;
  if (lowerTitle.includes(lowerQuery)) return 80;
  return 50;
}

export async function searchCaseWide(params: SearchParams): Promise<SearchResult[]> {
  const { userId, caseId, q, limit = 5 } = params;
  
  const query = q.trim().replace(/\s+/g, " ");
  if (query.length < 2) {
    return [];
  }
  
  const pattern = `%${query}%`;
  const perTableLimit = 3;
  
  const caseFilter = caseId 
    ? (table: any) => and(eq(table.userId, userId), eq(table.caseId, caseId))
    : (table: any) => eq(table.userId, userId);

  const [
    evidenceResults,
    noteResults,
    timelineResults,
    communicationResults,
    documentResults,
    snippetResults,
    trialprepResults,
    casesData,
  ] = await Promise.all([
    db.select({
      id: evidenceFiles.id,
      caseId: evidenceFiles.caseId,
      originalName: evidenceFiles.originalName,
      description: evidenceFiles.description,
    })
      .from(evidenceFiles)
      .where(and(
        caseFilter(evidenceFiles),
        or(
          ilike(evidenceFiles.originalName, pattern),
          ilike(evidenceFiles.description, pattern),
          ilike(evidenceFiles.notes, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: evidenceNotes.id,
      caseId: evidenceNotes.caseId,
      evidenceFileId: evidenceNotes.evidenceFileId,
      noteTitle: evidenceNotes.noteTitle,
      noteText: evidenceNotes.noteText,
    })
      .from(evidenceNotes)
      .where(and(
        caseFilter(evidenceNotes),
        or(
          ilike(evidenceNotes.noteTitle, pattern),
          ilike(evidenceNotes.noteText, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: timelineEvents.id,
      caseId: timelineEvents.caseId,
      title: timelineEvents.title,
      notes: timelineEvents.notes,
    })
      .from(timelineEvents)
      .where(and(
        caseFilter(timelineEvents),
        or(
          ilike(timelineEvents.title, pattern),
          ilike(timelineEvents.notes, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: caseCommunications.id,
      caseId: caseCommunications.caseId,
      subject: caseCommunications.subject,
      summary: caseCommunications.summary,
    })
      .from(caseCommunications)
      .where(and(
        caseFilter(caseCommunications),
        or(
          ilike(caseCommunications.subject, pattern),
          ilike(caseCommunications.summary, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: documents.id,
      caseId: documents.caseId,
      title: documents.title,
      content: documents.content,
    })
      .from(documents)
      .where(and(
        caseFilter(documents),
        or(
          ilike(documents.title, pattern),
          ilike(documents.content, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: exhibitSnippets.id,
      caseId: exhibitSnippets.caseId,
      title: exhibitSnippets.title,
      snippetText: exhibitSnippets.snippetText,
    })
      .from(exhibitSnippets)
      .where(and(
        caseFilter(exhibitSnippets),
        or(
          ilike(exhibitSnippets.title, pattern),
          ilike(exhibitSnippets.snippetText, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: trialPrepShortlist.id,
      caseId: trialPrepShortlist.caseId,
      title: trialPrepShortlist.title,
      summary: trialPrepShortlist.summary,
    })
      .from(trialPrepShortlist)
      .where(and(
        caseFilter(trialPrepShortlist),
        or(
          ilike(trialPrepShortlist.title, pattern),
          ilike(trialPrepShortlist.summary, pattern)
        )
      ))
      .limit(perTableLimit),

    db.select({
      id: cases.id,
      title: cases.title,
    }).from(cases).where(eq(cases.userId, userId)),
  ]);

  const caseMap = new Map(casesData.map(c => [c.id, c.title]));

  const results: SearchResult[] = [];

  for (const r of evidenceResults) {
    results.push({
      type: "evidence",
      caseId: r.caseId,
      id: r.id,
      title: r.originalName,
      snippet: buildSnippet(r.description || r.originalName, query),
      href: `/app/evidence/${r.caseId}?fileId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of noteResults) {
    results.push({
      type: "note",
      caseId: r.caseId,
      id: r.id,
      title: r.noteTitle || "Note",
      snippet: buildSnippet(r.noteText, query),
      href: `/app/evidence/${r.caseId}?noteId=${r.id}&fileId=${r.evidenceFileId}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of timelineResults) {
    results.push({
      type: "timeline",
      caseId: r.caseId,
      id: r.id,
      title: r.title,
      snippet: buildSnippet(r.notes || r.title, query),
      href: `/app/timeline/${r.caseId}?eventId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of communicationResults) {
    results.push({
      type: "communication",
      caseId: r.caseId,
      id: r.id,
      title: r.subject || "Communication",
      snippet: buildSnippet(r.summary, query),
      href: `/app/communications/${r.caseId}?commId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of documentResults) {
    results.push({
      type: "document",
      caseId: r.caseId,
      id: r.id,
      title: r.title,
      snippet: buildSnippet(r.content, query),
      href: `/app/documents/${r.caseId}?docId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of snippetResults) {
    results.push({
      type: "snippet",
      caseId: r.caseId,
      id: r.id,
      title: r.title,
      snippet: buildSnippet(r.snippetText, query),
      href: `/app/exhibits/${r.caseId}?snippetId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  for (const r of trialprepResults) {
    results.push({
      type: "trialprep",
      caseId: r.caseId,
      id: r.id,
      title: r.title,
      snippet: buildSnippet(r.summary || r.title, query),
      href: `/app/trial-prep/${r.caseId}?tpId=${r.id}`,
      caseTitle: caseMap.get(r.caseId),
    });
  }

  results.sort((a, b) => scoreResult(b, query) - scoreResult(a, query));

  const typeCounts: Record<string, number> = {};
  const maxPerType = 2;
  const final: SearchResult[] = [];

  for (const r of results) {
    const count = typeCounts[r.type] || 0;
    if (count < maxPerType) {
      final.push(r);
      typeCounts[r.type] = count + 1;
      if (final.length >= limit) break;
    }
  }

  if (final.length < limit) {
    for (const r of results) {
      if (!final.includes(r)) {
        final.push(r);
        if (final.length >= limit) break;
      }
    }
  }

  return final;
}
