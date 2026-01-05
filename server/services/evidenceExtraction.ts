import { ImageAnnotatorClient } from "@google-cloud/vision";
import * as fs from "fs";
import pLimit from "p-limit";
import sharp from "sharp";

const OCR_MAX_PAGES = parseInt(process.env.OCR_MAX_PAGES || "25", 10);
const OCR_CONCURRENCY = 3;

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

export function logGcvStatus(): void {
  const configured = isGcvConfigured();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || "not-set";
  console.log(`Vision OCR configured: ${configured} (project=${projectId})`);
}

export async function checkVisionHealth(): Promise<{ ok: boolean; error?: string }> {
  if (!isGcvConfigured()) {
    return { ok: false, error: "Google Cloud Vision credentials not configured" };
  }

  try {
    const client = getVisionClient();
    if (!client) {
      return { ok: false, error: "Failed to initialize Vision client" };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

interface ExtractionResult {
  text: string;
  meta: {
    pagesProcessed?: number;
    totalPages?: number;
    usedNativeText?: boolean;
    usedOcr?: boolean;
    capped?: boolean;
    pagesSkipped?: number;
    fileType: "pdf" | "image" | "unsupported";
    reason?: string;
    confidence?: number;
  };
}

interface ExtractionOptions {
  userId: string;
  caseId: string;
  evidenceId: string;
  filePath: string;
  mimeType: string;
  originalFilename: string;
}

const supportedImageTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/gif",
];

async function ocrWithGcv(imageBuffer: Buffer): Promise<{ text: string; confidence: number | null }> {
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

async function extractNativePdfText(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }> {
  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(pdfBuffer);
    return { text: data.text || "", numPages: data.numpages || 0 };
  } catch (error) {
    console.error("Native PDF text extraction failed:", error);
    return { text: "", numPages: 0 };
  }
}

async function renderPdfPageToImage(pdfBuffer: Buffer, pageNumber: number): Promise<Buffer> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("canvas");

  const data = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjs.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2.0 });
  const width = Math.floor(viewport.width);
  const height = Math.floor(viewport.height);

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  const renderTask = page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
    canvas: canvas as unknown as HTMLCanvasElement,
  });
  await renderTask.promise;

  return canvas.toBuffer("image/png");
}

async function extractPdfWithOcr(pdfBuffer: Buffer, totalPages: number): Promise<{
  text: string;
  pagesProcessed: number;
  capped: boolean;
  pagesSkipped: number;
}> {
  const pagesToProcess = Math.min(totalPages, OCR_MAX_PAGES);
  const capped = totalPages > OCR_MAX_PAGES;
  const pagesSkipped = capped ? totalPages - OCR_MAX_PAGES : 0;

  const limit = pLimit(OCR_CONCURRENCY);
  const pageTexts: string[] = new Array(pagesToProcess).fill("");

  const tasks = Array.from({ length: pagesToProcess }, (_, i) => i + 1).map((pageNum) =>
    limit(async () => {
      try {
        const imageBuffer = await renderPdfPageToImage(pdfBuffer, pageNum);
        const { text } = await ocrWithGcv(imageBuffer);
        pageTexts[pageNum - 1] = `----- Page ${pageNum} -----\n${text}`;
      } catch (error) {
        console.error(`OCR failed for page ${pageNum}:`, error);
        pageTexts[pageNum - 1] = `----- Page ${pageNum} -----\n[OCR failed]`;
      }
    })
  );

  await Promise.all(tasks);

  return {
    text: pageTexts.join("\n\n"),
    pagesProcessed: pagesToProcess,
    capped,
    pagesSkipped,
  };
}

async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  const pdfBuffer = fs.readFileSync(filePath);
  const fileSizeMb = pdfBuffer.length / (1024 * 1024);

  if (fileSizeMb > 30) {
    return {
      text: "",
      meta: {
        fileType: "pdf",
        reason: "File too large (>30MB). Consider splitting the PDF.",
      },
    };
  }

  const nativeResult = await extractNativePdfText(pdfBuffer);
  const NATIVE_TEXT_THRESHOLD = 500;

  if (nativeResult.text.length >= NATIVE_TEXT_THRESHOLD) {
    const capped = nativeResult.numPages > OCR_MAX_PAGES;
    return {
      text: nativeResult.text,
      meta: {
        fileType: "pdf",
        pagesProcessed: Math.min(nativeResult.numPages, OCR_MAX_PAGES),
        totalPages: nativeResult.numPages,
        usedNativeText: true,
        usedOcr: false,
        capped,
        pagesSkipped: capped ? nativeResult.numPages - OCR_MAX_PAGES : 0,
      },
    };
  }

  if (!isGcvConfigured()) {
    return {
      text: nativeResult.text,
      meta: {
        fileType: "pdf",
        pagesProcessed: Math.min(nativeResult.numPages, OCR_MAX_PAGES),
        totalPages: nativeResult.numPages,
        usedNativeText: true,
        usedOcr: false,
        reason: "OCR skipped: Google Vision credentials not configured",
      },
    };
  }

  const totalPages = nativeResult.numPages || 1;
  const ocrResult = await extractPdfWithOcr(pdfBuffer, totalPages);

  return {
    text: ocrResult.text,
    meta: {
      fileType: "pdf",
      pagesProcessed: ocrResult.pagesProcessed,
      totalPages,
      usedNativeText: false,
      usedOcr: true,
      capped: ocrResult.capped,
      pagesSkipped: ocrResult.pagesSkipped,
    },
  };
}

async function extractFromImage(filePath: string): Promise<ExtractionResult> {
  if (!isGcvConfigured()) {
    return {
      text: "",
      meta: {
        fileType: "image",
        reason: "OCR skipped: Google Vision credentials not configured",
      },
    };
  }

  const imageBuffer = fs.readFileSync(filePath);
  const normalized = await sharp(imageBuffer)
    .resize({ width: 2000, withoutEnlargement: true })
    .png()
    .toBuffer();

  const { text, confidence } = await ocrWithGcv(normalized);

  return {
    text,
    meta: {
      fileType: "image",
      usedOcr: true,
      confidence: confidence ?? undefined,
    },
  };
}

export async function extractEvidenceText(opts: ExtractionOptions): Promise<ExtractionResult> {
  const { mimeType, originalFilename, filePath } = opts;

  const isPdf = mimeType.includes("pdf") || originalFilename.toLowerCase().endsWith(".pdf");
  const isImage = supportedImageTypes.includes(mimeType);

  if (isPdf) {
    return extractFromPdf(filePath);
  }

  if (isImage) {
    return extractFromImage(filePath);
  }

  return {
    text: "",
    meta: {
      fileType: "unsupported",
      reason: `Unsupported file type: ${mimeType}`,
    },
  };
}
