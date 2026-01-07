import { storage } from "../storage";
import { extractEvidenceText } from "./evidenceExtraction";
import { getSignedDownloadUrl } from "../r2";
import { triggerClaimsSuggestionForEvidence } from "../claims/autoSuggest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { EvidenceExtraction } from "@shared/schema";

const GLOBAL_CONCURRENCY = 2;
const STALE_THRESHOLD_MINUTES = 15;

function createConcurrencyLimiter(concurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        activeCount++;
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          activeCount--;
          if (queue.length > 0) {
            const next = queue.shift();
            if (next) next();
          }
        }
      };

      if (activeCount < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

const globalLimit = createConcurrencyLimiter(GLOBAL_CONCURRENCY);

const activeJobs = new Map<string, Promise<void>>();

const processingLocks = new Set<string>();

interface EnqueueOptions {
  userId: string;
  caseId: string;
  evidenceId: string;
  storageKey: string;
  mimeType: string;
  originalFilename: string;
}

async function downloadToTempFile(storageKey: string): Promise<string> {
  const signedUrl = await getSignedDownloadUrl(storageKey, 600);
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const tempDir = os.tmpdir();
  const tempPath = path.join(tempDir, `evidence-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function runExtractionJob(opts: EnqueueOptions): Promise<void> {
  const { userId, caseId, evidenceId, storageKey, mimeType, originalFilename } = opts;
  let tempFilePath: string | null = null;

  if (processingLocks.has(evidenceId)) {
    console.log(`[ExtractionJob] Lock already held for evidence ${evidenceId}, skipping`);
    return;
  }

  processingLocks.add(evidenceId);

  try {
    let extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);

    if (!extraction) {
      extraction = await storage.createEvidenceExtraction(userId, caseId, {
        evidenceId,
        provider: "internal",
        mimeType,
      });
    }

    if (extraction.status === "processing") {
      const updatedAt = new Date(extraction.updatedAt).getTime();
      const staleCutoff = Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000;
      if (updatedAt > staleCutoff) {
        console.log(`[ExtractionJob] Extraction ${evidenceId} already processing (not stale), skipping`);
        return;
      }
    }

    if (extraction.status === "complete") {
      console.log(`[ExtractionJob] Extraction ${evidenceId} already complete, skipping`);
      return;
    }

    await storage.updateEvidenceExtraction(userId, extraction.id, {
      status: "processing",
    });

    tempFilePath = await downloadToTempFile(storageKey);

    const result = await extractEvidenceText({
      userId,
      caseId,
      evidenceId,
      filePath: tempFilePath,
      mimeType,
      originalFilename,
    });

    await storage.updateEvidenceExtraction(userId, extraction.id, {
      status: "complete",
      extractedText: result.text,
      metadata: result.meta,
      error: null,
    });

    await storage.createLexiFeedbackEvent(userId, caseId, "evidence_extraction_complete", {
      evidenceId,
      charCount: result.text.length,
    });
    
    await storage.createActivityLog(userId, caseId, "evidence_upload", `Extraction complete for ${originalFilename}: ${result.text.length} chars`, {
      evidenceId,
      charCount: result.text.length,
    });

    console.log(`[ExtractionJob] Complete for evidence ${evidenceId}: ${result.text.length} chars`);

    triggerClaimsSuggestionForEvidence({
      userId,
      caseId,
      evidenceId,
      extractedText: result.text,
    });
  } catch (error) {
    console.error(`[ExtractionJob] Error for evidence ${evidenceId}:`, error);

    try {
      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      if (extraction) {
        await storage.updateEvidenceExtraction(userId, extraction.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        
        await storage.createLexiFeedbackEvent(userId, caseId, "evidence_extraction_failed", {
          evidenceId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (updateError) {
      console.error(`[ExtractionJob] Failed to update error status:`, updateError);
    }
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
      }
    }
    processingLocks.delete(evidenceId);
    activeJobs.delete(evidenceId);
  }
}

export function enqueueEvidenceExtraction(opts: EnqueueOptions): void {
  const { evidenceId } = opts;

  if (activeJobs.has(evidenceId)) {
    console.log(`[ExtractionJob] Job already queued/running for evidence ${evidenceId}`);
    return;
  }

  if (processingLocks.has(evidenceId)) {
    console.log(`[ExtractionJob] Lock held for evidence ${evidenceId}, not enqueuing`);
    return;
  }

  const jobPromise = globalLimit(() => runExtractionJob(opts));
  activeJobs.set(evidenceId, jobPromise);

  console.log(`[ExtractionJob] Enqueued extraction for evidence ${evidenceId} (concurrency: ${GLOBAL_CONCURRENCY})`);
}

export function isExtractionRunning(evidenceId: string): boolean {
  return activeJobs.has(evidenceId) || processingLocks.has(evidenceId);
}

export async function requeueStaleExtractions(): Promise<number> {
  try {
    const staleExtractions = await storage.findStaleProcessingExtractions(STALE_THRESHOLD_MINUTES);
    
    if (staleExtractions.length === 0) {
      console.log("[ExtractionJob] No stale extractions to re-queue");
      return 0;
    }

    console.log(`[ExtractionJob] Found ${staleExtractions.length} stale extractions, re-queuing...`);

    for (const extraction of staleExtractions) {
      await storage.resetExtractionToQueued(extraction.id);
      
      const file = await storage.getEvidenceFile(extraction.evidenceId, extraction.userId);
      if (file && file.storageKey) {
        enqueueEvidenceExtraction({
          userId: extraction.userId,
          caseId: extraction.caseId,
          evidenceId: extraction.evidenceId,
          storageKey: file.storageKey,
          mimeType: file.mimeType,
          originalFilename: file.originalName,
        });
      }
    }

    console.log(`[ExtractionJob] Re-queued ${staleExtractions.length} stale extractions`);
    return staleExtractions.length;
  } catch (error) {
    console.error("[ExtractionJob] Error re-queuing stale extractions:", error);
    return 0;
  }
}

export function getQueueStats(): { activeCount: number; lockedCount: number; concurrency: number } {
  return {
    activeCount: activeJobs.size,
    lockedCount: processingLocks.size,
    concurrency: GLOBAL_CONCURRENCY,
  };
}
