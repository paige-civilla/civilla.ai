import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as fs from "fs";
import * as path from "path";
import PQueue from "p-queue";
import sharp from "sharp";
import { storage } from "../storage";
import type { UpsertEvidenceOcrPage, OcrProvider } from "@shared/schema";

const OCR_MAX_PAGES = parseInt(process.env.OCR_MAX_PAGES || "50", 10);
const OCR_MAX_FILE_MB = parseInt(process.env.OCR_MAX_FILE_MB || "25", 10);
const OCR_PROVIDER_MODE = process.env.OCR_PROVIDER_MODE || "gcv_primary";

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient | null {
  if (visionClient) return visionClient;
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_VISION_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_CLOUD_VISION_PRIVATE_KEY;
  
  if (!projectId || !clientEmail || !privateKey) {
    console.log("Google Cloud Vision credentials not configured");
    return null;
  }
  
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  
  try {
    visionClient = new ImageAnnotatorClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      projectId,
    });
    return visionClient;
  } catch (error) {
    console.error("Failed to initialize Vision client:", error);
    return null;
  }
}

export function isGcvConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_VISION_CLIENT_EMAIL &&
    process.env.GOOGLE_CLOUD_VISION_PRIVATE_KEY
  );
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
  const client = getVisionClient();
  if (!client) {
    throw new Error("Google Cloud Vision not configured");
  }
  
  const [result] = await client.documentTextDetection(imageBuffer);
  const fullTextAnnotation = result.fullTextAnnotation;
  
  if (!fullTextAnnotation) {
    return { text: "", confidence: null };
  }
  
  let totalConfidence = 0;
  let confidenceCount = 0;
  
  if (fullTextAnnotation.pages) {
    for (const page of fullTextAnnotation.pages) {
      if (page.confidence !== undefined && page.confidence !== null) {
        totalConfidence += page.confidence;
        confidenceCount++;
      }
    }
  }
  
  const avgConfidence = confidenceCount > 0 
    ? Math.round((totalConfidence / confidenceCount) * 100) 
    : null;
  
  return {
    text: fullTextAnnotation.text || "",
    confidence: avgConfidence,
  };
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
    const text = textContent.items
      .filter((item): item is { str: string } => "str" in item && typeof (item as { str: string }).str === "string")
      .map((item) => item.str)
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
  
  const queue = new PQueue({ concurrency: 2 });
  let processed = 0;
  
  const tasks = pdfTextPages.map((pdfPage, idx) => {
    return queue.add(async () => {
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
