import * as fs from "fs";
import sharp from "sharp";

const OCR_MAX_PAGES = parseInt(process.env.OCR_MAX_PAGES || "25", 10);
const OCR_CONCURRENCY = 3;

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

export function logGcvStatus(): void {
  const configured = isGcvConfigured();
  console.log(`Vision OCR configured: ${configured} (auth=api-key)`);
}

export async function checkVisionHealth(): Promise<{ ok: boolean; error?: string }> {
  if (!isGcvConfigured()) {
    return { ok: false, error: "OCR not configured. Add GOOGLE_CLOUD_VISION_API_KEY in Replit Secrets." };
  }
  return { ok: true };
}

interface VisionOcrResult {
  text: string;
  confidence: number | null;
  raw?: unknown;
}

async function visionOcrImageBuffer(imageBuffer: Buffer): Promise<VisionOcrResult> {
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
    throw new Error(`vision_ocr_failed: ${res.status} ${res.statusText} ${errText}`.slice(0, 2000));
  }

  const json = await res.json();
  const first = json?.responses?.[0];

  if (first?.error) {
    throw new Error(`vision_api_error: ${first.error.message || JSON.stringify(first.error)}`.slice(0, 2000));
  }

  const fullTextAnnotation = first?.fullTextAnnotation;
  const text =
    fullTextAnnotation?.text ||
    (first?.textAnnotations?.[0]?.description ?? "") ||
    "";

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

  return { text, confidence: avgConfidence, raw: first };
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
    provider?: string;
    apiKeyAuth?: boolean;
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

  const limit = createConcurrencyLimiter(OCR_CONCURRENCY);
  const pageTexts: string[] = new Array(pagesToProcess).fill("");

  const tasks = Array.from({ length: pagesToProcess }, (_, i) => i + 1).map((pageNum) =>
    limit(async () => {
      try {
        const imageBuffer = await renderPdfPageToImage(pdfBuffer, pageNum);
        const { text } = await visionOcrImageBuffer(imageBuffer);
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
        reason: "OCR skipped: Vision API key not configured",
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
      provider: "google-vision-rest",
      apiKeyAuth: true,
    },
  };
}

async function extractFromImage(filePath: string): Promise<ExtractionResult> {
  if (!isGcvConfigured()) {
    return {
      text: "",
      meta: {
        fileType: "image",
        reason: "OCR skipped: Vision API key not configured",
      },
    };
  }

  const imageBuffer = fs.readFileSync(filePath);
  const normalized = await sharp(imageBuffer)
    .resize({ width: 2000, withoutEnlargement: true })
    .png()
    .toBuffer();

  const { text, confidence } = await visionOcrImageBuffer(normalized);

  return {
    text,
    meta: {
      fileType: "image",
      usedOcr: true,
      confidence: confidence ?? undefined,
      provider: "google-vision-rest",
      apiKeyAuth: true,
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
