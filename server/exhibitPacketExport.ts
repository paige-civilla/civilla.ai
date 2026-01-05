import archiver from "archiver";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { storage } from "./storage";
import type { ExhibitPacket, ExhibitPacketItem, EvidenceFile } from "@shared/schema";
import { getSignedDownloadUrl } from "./r2";

interface PacketItemWithEvidence {
  item: ExhibitPacketItem;
  evidence: EvidenceFile[];
}

interface GeneratePacketResult {
  zipBuffer: Buffer;
  fileName: string;
  meta: {
    packetTitle: string;
    itemCount: number;
    evidenceCount: number;
    generatedAt: string;
  };
}

export async function generateCoverPagePdf(
  packet: ExhibitPacket,
  items: PacketItemWithEvidence[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").text("EXHIBIT PACKET", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).font("Helvetica-Bold").text(packet.title, { align: "center" });

    if (packet.filingType) {
      doc.moveDown(0.3);
      doc.fontSize(12).font("Helvetica").text(`Filing Type: ${packet.filingType}`, { align: "center" });
    }

    if (packet.filingDate) {
      doc.fontSize(12).font("Helvetica").text(`Filing Date: ${new Date(packet.filingDate).toLocaleDateString()}`, { align: "center" });
    }

    doc.moveDown(1);

    doc.fontSize(14).font("Helvetica-Bold").text("Table of Contents", { underline: true });
    doc.moveDown(0.5);

    for (const { item, evidence } of items) {
      doc.fontSize(12).font("Helvetica-Bold").text(`${item.exhibitLabel}: ${item.exhibitTitle}`);
      if (item.exhibitNotes) {
        doc.fontSize(10).font("Helvetica-Oblique").text(`   ${item.exhibitNotes}`);
      }
      if (evidence.length > 0) {
        doc.fontSize(10).font("Helvetica").text(`   Attached files: ${evidence.length}`);
        for (const ev of evidence) {
          doc.fontSize(9).font("Helvetica").text(`      - ${ev.originalName || "Untitled"}`);
        }
      }
      doc.moveDown(0.3);
    }

    if (packet.coverPageText) {
      doc.moveDown(1);
      doc.fontSize(12).font("Helvetica-Bold").text("Notes:", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").text(packet.coverPageText);
    }

    doc.moveDown(2);
    doc.fontSize(9).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
  });
}

async function fetchEvidenceBuffer(evidence: EvidenceFile): Promise<Buffer | null> {
  try {
    if (!evidence.storageKey) return null;
    const url = await getSignedDownloadUrl(evidence.storageKey);
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (err) {
    console.error(`Failed to fetch evidence ${evidence.id}:`, err);
    return null;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, "_").slice(0, 100);
}

export async function generateExhibitPacketZip(
  userId: string,
  packetId: string
): Promise<GeneratePacketResult | null> {
  const packet = await storage.getExhibitPacket(userId, packetId);
  if (!packet) return null;

  const items = await storage.listPacketItems(userId, packetId);
  const itemsWithEvidence: PacketItemWithEvidence[] = [];

  for (const item of items) {
    const evidence = await storage.listPacketItemEvidence(userId, item.id);
    itemsWithEvidence.push({ item, evidence });
  }

  const coverPdf = await generateCoverPagePdf(packet, itemsWithEvidence);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  const passThrough = new PassThrough();

  passThrough.on("data", (chunk) => chunks.push(chunk));

  archive.pipe(passThrough);

  archive.append(coverPdf, { name: "00_Cover_Page.pdf" });

  let evidenceCount = 0;
  for (let i = 0; i < itemsWithEvidence.length; i++) {
    const { item, evidence } = itemsWithEvidence[i];
    const folderPrefix = `${String(i + 1).padStart(2, "0")}_${sanitizeFileName(item.exhibitLabel)}`;

    for (let j = 0; j < evidence.length; j++) {
      const ev = evidence[j];
      const buffer = await fetchEvidenceBuffer(ev);
      if (buffer) {
        const ext = ev.originalName?.split(".").pop() || "file";
        const fileName = `${folderPrefix}_${String(j + 1).padStart(2, "0")}_${sanitizeFileName(ev.originalName || "file")}.${ext}`;
        archive.append(buffer, { name: `${folderPrefix}/${fileName}` });
        evidenceCount++;
      }
    }
  }

  await archive.finalize();

  await new Promise<void>((resolve) => {
    passThrough.on("end", resolve);
  });

  const zipBuffer = Buffer.concat(chunks);
  const sanitizedTitle = sanitizeFileName(packet.title);
  const fileName = `${sanitizedTitle}_Exhibits_${new Date().toISOString().split("T")[0]}.zip`;

  return {
    zipBuffer,
    fileName,
    meta: {
      packetTitle: packet.title,
      itemCount: items.length,
      evidenceCount,
      generatedAt: new Date().toISOString(),
    },
  };
}
