import { storage } from "../storage";
import { extractEvidenceText } from "./evidenceExtraction";
import { getSignedDownloadUrl } from "../r2";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const activeJobs = new Map<string, Promise<void>>();

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

  try {
    let extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);

    if (!extraction) {
      extraction = await storage.createEvidenceExtraction(userId, caseId, {
        evidenceId,
        provider: "internal",
        mimeType,
      });
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

    console.log(`[ExtractionJob] Complete for evidence ${evidenceId}: ${result.text.length} chars`);
  } catch (error) {
    console.error(`[ExtractionJob] Error for evidence ${evidenceId}:`, error);

    try {
      const extraction = await storage.getEvidenceExtraction(userId, caseId, evidenceId);
      if (extraction) {
        await storage.updateEvidenceExtraction(userId, extraction.id, {
          status: "failed",
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
    activeJobs.delete(evidenceId);
  }
}

export function enqueueEvidenceExtraction(opts: EnqueueOptions): void {
  const { evidenceId } = opts;

  if (activeJobs.has(evidenceId)) {
    console.log(`[ExtractionJob] Job already running for evidence ${evidenceId}`);
    return;
  }

  const jobPromise = runExtractionJob(opts);
  activeJobs.set(evidenceId, jobPromise);

  console.log(`[ExtractionJob] Enqueued extraction for evidence ${evidenceId}`);
}

export function isExtractionRunning(evidenceId: string): boolean {
  return activeJobs.has(evidenceId);
}
