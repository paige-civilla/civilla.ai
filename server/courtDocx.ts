import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  Footer,
  PageNumber,
  convertInchesToTwip,
  LineRuleType,
} from "docx";

export interface CourtDocxPayload {
  court: {
    district: string;
    county: string;
    state: string;
  };
  case: {
    caseNumber: string;
  };
  parties: {
    petitioner: string;
    respondent: string;
  };
  document: {
    title: string;
    subtitle?: string;
  };
  contactBlock: {
    isRepresented: boolean;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    barNumber?: string;
    firm?: string;
  };
  body: {
    paragraphs: string[];
  };
  signature: {
    datedLine: string;
    signerName: string;
    signerTitle: string;
  };
  footer: {
    docName: string;
    showPageNumbers: boolean;
  };
}

const TIMES_NEW_ROMAN = "Times New Roman";
const FONT_SIZE_12PT = 24;
const FONT_SIZE_10PT = 20;

const DOUBLE_SPACE_TWIPS = 480;
const SINGLE_SPACE_TWIPS = 240;

const MARGIN_1_INCH = convertInchesToTwip(1);

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const CAPTION_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

const CELL_MARGINS = {
  top: convertInchesToTwip(0.12),
  bottom: convertInchesToTwip(0.12),
  left: convertInchesToTwip(0.15),
  right: convertInchesToTwip(0.15),
};

function timesRun(
  text: string,
  opts?: { bold?: boolean; italic?: boolean; size?: number }
): TextRun {
  return new TextRun({
    text,
    font: TIMES_NEW_ROMAN,
    size: opts?.size ?? FONT_SIZE_12PT,
    bold: opts?.bold ?? false,
    italics: opts?.italic ?? false,
  });
}

function singleSpacedParagraph(
  textOrRuns: string | TextRun[],
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType],
  spacingBefore?: number,
  spacingAfter?: number
): Paragraph {
  const children =
    typeof textOrRuns === "string" ? [timesRun(textOrRuns)] : textOrRuns;

  return new Paragraph({
    children,
    alignment: alignment ?? AlignmentType.LEFT,
    spacing: {
      before: spacingBefore ?? 0,
      after: spacingAfter ?? 0,
      line: SINGLE_SPACE_TWIPS,
      lineRule: LineRuleType.AUTO,
    },
  });
}

function doubleSpacedParagraph(
  textOrRuns: string | TextRun[],
  alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
): Paragraph {
  const children =
    typeof textOrRuns === "string" ? [timesRun(textOrRuns)] : textOrRuns;

  return new Paragraph({
    children,
    alignment: alignment ?? AlignmentType.LEFT,
    spacing: {
      before: 0,
      after: 0,
      line: DOUBLE_SPACE_TWIPS,
      lineRule: LineRuleType.AUTO,
    },
  });
}

function buildContactBlock(contactBlock: CourtDocxPayload["contactBlock"]): Paragraph[] {
  const lines: string[] = [];

  if (contactBlock.name) lines.push(contactBlock.name);
  if (contactBlock.address) {
    const addressLines = contactBlock.address.split("\n");
    lines.push(...addressLines);
  }
  if (contactBlock.phone) lines.push(`Telephone: ${contactBlock.phone}`);
  if (contactBlock.email) lines.push(`Email: ${contactBlock.email}`);
  if (contactBlock.barNumber) lines.push(`Idaho State Bar No. ${contactBlock.barNumber}`);
  if (contactBlock.firm) lines.push(contactBlock.firm);
  if (!contactBlock.isRepresented) lines.push("In Pro Per");

  return lines.map((line) => singleSpacedParagraph(line, AlignmentType.LEFT));
}

function buildCourtHeader(court: CourtDocxPayload["court"]): Paragraph[] {
  return [
    new Paragraph({
      children: [
        timesRun(
          `IN THE DISTRICT COURT OF THE ${court.district.toUpperCase()} JUDICIAL DISTRICT`,
          { bold: true }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [
        timesRun(
          `OF THE STATE OF ${court.state.toUpperCase()}, IN AND FOR THE COUNTY OF ${court.county.toUpperCase()}`,
          { bold: true }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
  ];
}

function buildCaptionTable(
  parties: CourtDocxPayload["parties"],
  caseNumber: string,
  documentTitle: string,
  documentSubtitle?: string
): Table {
  const leftCellContent = [
    singleSpacedParagraph(`${parties.petitioner},`),
    singleSpacedParagraph("        Petitioner,", AlignmentType.LEFT, 0, 120),
    singleSpacedParagraph("vs.", AlignmentType.LEFT, 0, 120),
    singleSpacedParagraph(`${parties.respondent},`),
    singleSpacedParagraph("        Respondent."),
  ];

  const rightCellContent = [
    new Paragraph({
      children: [timesRun(`Case No. ${caseNumber}`, { bold: true })],
      spacing: { after: 200, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [timesRun(documentTitle.toUpperCase(), { bold: true })],
      spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
  ];

  if (documentSubtitle) {
    rightCellContent.push(
      new Paragraph({
        children: [timesRun(documentSubtitle)],
        spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
      })
    );
  }

  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftCellContent,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: CAPTION_BORDER,
            margins: CELL_MARGINS,
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: rightCellContent,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: CAPTION_BORDER,
            margins: CELL_MARGINS,
            verticalAlign: VerticalAlign.TOP,
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function buildBodyParagraphs(paragraphs: string[]): Paragraph[] {
  return paragraphs.map((text) => doubleSpacedParagraph(text));
}

function buildSignatureBlock(
  signature: CourtDocxPayload["signature"],
  contactBlock: CourtDocxPayload["contactBlock"]
): Paragraph[] {
  const blocks: Paragraph[] = [
    new Paragraph({
      children: [timesRun("")],
      spacing: { before: 720, after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [timesRun(signature.datedLine)],
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 480, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [timesRun("_______________________________")],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [timesRun(signature.signerName)],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
    new Paragraph({
      children: [timesRun(signature.signerTitle)],
      alignment: AlignmentType.LEFT,
      spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
    }),
  ];

  if (contactBlock.isRepresented) {
    if (contactBlock.firm) {
      blocks.push(
        new Paragraph({
          children: [timesRun(contactBlock.firm)],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
        })
      );
    }
    if (contactBlock.barNumber) {
      blocks.push(
        new Paragraph({
          children: [timesRun(`Idaho State Bar No. ${contactBlock.barNumber}`)],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
        })
      );
    }
    if (contactBlock.email) {
      blocks.push(
        new Paragraph({
          children: [timesRun(contactBlock.email)],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
        })
      );
    }
    if (contactBlock.phone) {
      blocks.push(
        new Paragraph({
          children: [timesRun(contactBlock.phone)],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
        })
      );
    }
  }

  return blocks;
}

function buildFooter(docName: string, showPageNumbers: boolean): Footer {
  const pageNumberRuns = showPageNumbers
    ? [
        new TextRun({ text: "Page ", font: TIMES_NEW_ROMAN, size: FONT_SIZE_10PT }),
        new TextRun({ children: [PageNumber.CURRENT], font: TIMES_NEW_ROMAN, size: FONT_SIZE_10PT }),
        new TextRun({ text: " of ", font: TIMES_NEW_ROMAN, size: FONT_SIZE_10PT }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: TIMES_NEW_ROMAN, size: FONT_SIZE_10PT }),
      ]
    : [];

  return new Footer({
    children: [
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [timesRun(docName, { size: FONT_SIZE_10PT })],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: NO_BORDER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: pageNumberRuns,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: NO_BORDER,
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

export async function buildCourtDocxBuffer(payload: CourtDocxPayload): Promise<Buffer> {
  const contactParagraphs = buildContactBlock(payload.contactBlock);
  const courtHeader = buildCourtHeader(payload.court);
  const captionTable = buildCaptionTable(
    payload.parties,
    payload.case.caseNumber,
    payload.document.title,
    payload.document.subtitle
  );
  const bodyParagraphs = buildBodyParagraphs(payload.body.paragraphs);
  const signatureBlock = buildSignatureBlock(payload.signature, payload.contactBlock);
  const footer = buildFooter(payload.footer.docName, payload.footer.showPageNumbers);

  const spacer = new Paragraph({
    children: [timesRun("")],
    spacing: { after: 200, line: SINGLE_SPACE_TWIPS, lineRule: LineRuleType.AUTO },
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_1_INCH,
              right: MARGIN_1_INCH,
              bottom: MARGIN_1_INCH,
              left: MARGIN_1_INCH,
            },
          },
        },
        footers: {
          default: footer,
        },
        children: [
          ...contactParagraphs,
          ...courtHeader,
          captionTable,
          spacer,
          ...bodyParagraphs,
          ...signatureBlock,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
