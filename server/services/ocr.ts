import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { storage } from "../storage";
import type { UpsertEvidenceOcrPage, OcrProvider } from "@shared/schema";

const OCR_MAX_PAGES = parseInt(process.env.OCR_MAX_PAGES || "50", 10);
const OCR_MAX_FILE_MB = parseInt(process.env.OCR_MAX_FILE_MB || "25", 10);
const OCR_PROVIDER_MODE = process.env.OCR_PROVIDER_MODE || "gcv_primary";

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

export function isGcvConfigured(): boolean {
  return !!process.env.GOOGLE_CLOUD_VISION_API_KEY;
}

function computeJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = text1.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const tokens2 = text2.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  if (set1.size === 0 && set2.size === 0) return 100;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersectionSize = 0;
  tokens1.forEach(t => {
    if (set2.has(t)) intersectionSize++;
  });
  
  const unionSize = set1.size + set2.size - intersectionSize;
  
  return Math.round((intersectionSize / unionSize) * 100);
}

function shouldNeedReview(
  textPrimary: string,
  diffScore: number | null,
  confidencePrimary: number | null
): boolean {
  const MIN_TEXT_LENGTH = 20;
  const MIN_DIFF_SCORE = 75;
  const MIN_CONFIDENCE = 70;
  
  if (textPrimary.length < MIN_TEXT_LENGTH) return true;
  if (diffScore !== null && diffScore < MIN_DIFF_SCORE) return true;
  if (confidencePrimary !== null && confidencePrimary < MIN_CONFIDENCE) return true;
  
  return false;
}

async function extractTextWithGcv(imageBuffer: Buffer): Promise<{ text: string; confidence: number | null }> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("OCR not configured. Add GOOGLE_CLOUD_VISION_API_KEY in Replit Secrets.");
  }

  const content = imageBuffer.toString("base64");
  const body = {
    requests: [
      {
        image: { content },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Vision OCR failed: ${res.status} ${res.statusText} ${errText}`.slice(0, 500));
  }

  const json = await res.json();
  const first = json?.responses?.[0];

  if (first?.error) {
    throw new Error(`Vision API error: ${first.error.message || JSON.stringify(first.error)}`.slice(0, 500));
  }

  const fullTextAnnotation = first?.fullTextAnnotation;
  const text = fullTextAnnotation?.text || (first?.textAnnotations?.[0]?.description ?? "") || "";

  let avgConfidence: number | null = null;
  if (fullTextAnnotation?.pages) {
    let totalConfidence = 0;
    let confidenceCount = 0;
    for (const page of fullTextAnnotation.pages) {
      if (page.confidence !== undefined && page.confidence !== null) {
        totalConfidence += page.confidence;
        confidenceCount++;
      }
    }
    if (confidenceCount > 0) {
      avgConfidence = Math.round((totalConfidence / confidenceCount) * 100);
    }
  }

  return { text, confidence: avgConfidence };
}

async function extractTextFromPdfWithPdfjs(pdfPath: string): Promise<{ pageCount: number; pages: { pageNumber: number; text: string }[] }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  
  const pageCount = pdfDocument.numPages;
  const pages: { pageNumber: number; text: string }[] = [];
  
  const pagesToProcess = Math.min(pageCount, OCR_MAX_PAGES);
  
  for (let i = 1; i <= pagesToProcess; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const text = (textContent.items as Array<{ str?: string }>)
      .filter((item) => typeof item?.str === "string")
      .map((item) => item.str!)
      .join(" ");
    pages.push({ pageNumber: i, text });
  }
  
  return { pageCount, pages };
}

async function convertPdfPageToImage(pdfPath: string, pageNumber: number): Promise<Buffer> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(pageNumber);
  
  const viewport = page.getViewport({ scale: 2.0 });
  const width = Math.floor(viewport.width);
  const height = Math.floor(viewport.height);
  
  const { createCanvas } = await import("canvas");
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  
  const renderTask = page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
    canvas: canvas as unknown as HTMLCanvasElement,
  });
  await renderTask.promise;
  
  const pngBuffer = canvas.toBuffer("image/png");
  return pngBuffer;
}

async function processImage(
  userId: string,
  caseId: string,
  evidenceId: string,
  imageBuffer: Buffer,
  pageNumber: number | null = null
): Promise<UpsertEvidenceOcrPage> {
  const gcvResult = await extractTextWithGcv(imageBuffer);
  
  const payload: UpsertEvidenceOcrPage = {
    pageNumber,
    providerPrimary: "gcv" as OcrProvider,
    providerSecondary: null,
    textPrimary: gcvResult.text,
    textSecondary: null,
    confidencePrimary: gcvResult.confidence,
    confidenceSecondary: null,
    diffScore: null,
    needsReview: shouldNeedReview(gcvResult.text, null, gcvResult.confidence),
  };
  
  return payload;
}

async function processPdfWithDualMode(
  userId: string,
  caseId: string,
  evidenceId: string,
  filePath: string,
  onProgress: (progress: number) => Promise<void>
): Promise<void> {
  const { pageCount, pages: pdfTextPages } = await extractTextFromPdfWithPdfjs(filePath);
  const pagesToProcess = Math.min(pageCount, OCR_MAX_PAGES);
  
  const limit = createConcurrencyLimiter(2);
  let processed = 0;
  
  const tasks = pdfTextPages.map((pdfPage, idx) => {
    return limit(async () => {
      let payload: UpsertEvidenceOcrPage;
      
      const pdfText = pdfPage.text.trim();
      const hasEnoughPdfText = pdfText.length >= 50;
      
      if (hasEnoughPdfText && OCR_PROVIDER_MODE === "gcv_primary") {
        payload = {
          pageNumber: pdfPage.pageNumber,
          providerPrimary: "pdf_text" as OcrProvider,
          providerSecondary: null,
          textPrimary: pdfText,
          textSecondary: null,
          confidencePrimary: 100,
          confidenceSecondary: null,
          diffScore: null,
          needsReview: false,
        };
      } else {
        try {
          const imageBuffer = await convertPdfPageToImage(filePath, pdfPage.pageNumber);
          const gcvResult = await extractTextWithGcv(imageBuffer);
          
          const diffScore = pdfText.length > 0 && gcvResult.text.length > 0
            ? computeJaccardSimilarity(pdfText, gcvResult.text)
            : null;
          
          payload = {
            pageNumber: pdfPage.pageNumber,
            providerPrimary: "gcv" as OcrProvider,
            providerSecondary: pdfText.length > 0 ? "pdf_text" as OcrProvider : null,
            textPrimary: gcvResult.text,
            textSecondary: pdfText.length > 0 ? pdfText : null,
            confidencePrimary: gcvResult.confidence,
            confidenceSecondary: pdfText.length > 0 ? 100 : null,
            diffScore,
            needsReview: shouldNeedReview(gcvResult.text, diffScore, gcvResult.confidence),
          };
        } catch (error) {
          console.error(`Error processing page ${pdfPage.pageNumber} with GCV:`, error);
          payload = {
            pageNumber: pdfPage.pageNumber,
            providerPrimary: "pdf_text" as OcrProvider,
            providerSecondary: null,
            textPrimary: pdfText,
            textSecondary: null,
            confidencePrimary: pdfText.length > 0 ? 80 : 0,
            confidenceSecondary: null,
            diffScore: null,
            needsReview: pdfText.length < 50,
          };
        }
      }
      
      await storage.upsertEvidenceOcrPage(userId, caseId, evidenceId, pdfPage.pageNumber, payload);
      
      processed++;
      const progress = Math.round((processed / pagesToProcess) * 100);
      await onProgress(progress);
    });
  });
  
  await Promise.all(tasks);
}

export async function processEvidenceFile(
  userId: string,
  caseId: string,
  evidenceId: string,
  jobId: string,
  filePath: string,
  mimeType: string
): Promise<void> {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMb = stats.size / (1024 * 1024);
    
    if (fileSizeMb > OCR_MAX_FILE_MB) {
      throw new Error(`File exceeds maximum size of ${OCR_MAX_FILE_MB}MB`);
    }
    
    await storage.updateEvidenceProcessingJob(userId, jobId, {
      status: "processing",
      progress: 0,
    });
    
    const onProgress = async (progress: number) => {
      await storage.updateEvidenceProcessingJob(userId, jobId, { progress });
    };
    
    const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");
    const isImage = mimeType.startsWith("image/") || 
      /\.(png|jpg|jpeg|gif|webp|bmp|tiff?)$/i.test(filePath);
    
    if (isPdf) {
      await processPdfWithDualMode(userId, caseId, evidenceId, filePath, onProgress);
    } else if (isImage) {
      const imageBuffer = fs.readFileSync(filePath);
      const processedBuffer = await sharp(imageBuffer).png().toBuffer();
      const payload = await processImage(userId, caseId, evidenceId, processedBuffer, null);
      await storage.upsertEvidenceOcrPage(userId, caseId, evidenceId, null, payload);
      await onProgress(100);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    await storage.updateEvidenceProcessingJob(userId, jobId, {
      status: "done",
      progress: 100,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OCR processing failed for evidence ${evidenceId}:`, errorMessage);
    
    await storage.updateEvidenceProcessingJob(userId, jobId, {
      status: "error",
      error: errorMessage,
    });
  }
}
