import { jsPDF } from "jspdf";
import { getNdaContent, NDA_DISCLOSING_PARTY } from "./nda-content";
import type { Nda, Signer, AuditLog } from "@prisma/client";

type NdaWithRelations = Nda & {
  signers: Signer[];
  auditLog: AuditLog[];
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateNdaPdf(nda: NdaWithRelations): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    fontSize: number,
    options?: {
      bold?: boolean;
      color?: [number, number, number];
      align?: "left" | "center";
      maxWidth?: number;
    }
  ) => {
    const {
      bold = false,
      color = [33, 33, 33],
      align = "left",
      maxWidth = contentWidth,
    } = options || {};

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      addPageIfNeeded(lineHeight);
      const x = align === "center" ? pageWidth / 2 : margin;
      doc.text(line, x, y, { align });
      y += lineHeight;
    }
  };

  // Header
  doc.setFillColor(13, 115, 119);
  doc.rect(0, 0, pageWidth, 25, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NON-DISCLOSURE AGREEMENT", pageWidth / 2, 12, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${NDA_DISCLOSING_PARTY.legalName}`,
    pageWidth / 2,
    19,
    { align: "center" }
  );

  y = 35;

  // Get the signer for the receiving party signature block
  const signer = nda.signers[0] || null;

  // NDA Text — populate all fields
  const effectiveDate = formatDate(nda.effectiveDate) || formatDate(nda.createdAt);

  const ndaText = getNdaContent({
    effectiveDate,
    receivingPartyName: nda.receivingPartyName,
    receivingPartyAddress: nda.receivingPartyAddress,
    disclosingSignatoryName: nda.disclosingSignatoryName || "",
    disclosingSignatoryTitle: nda.disclosingSignatoryTitle || "",
    disclosingSignedDate: formatDate(nda.disclosingSignedDate),
    receivingSignatoryName: signer?.fullName || "",
    receivingSignatoryTitle: signer?.title || "",
    receivingSignedDate: signer ? formatDate(signer.signedAt) : "",
  });

  const paragraphs = ndaText.split("\n\n");

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const isHeading =
      trimmed.startsWith("MUTUAL") ||
      trimmed.startsWith("RECITALS") ||
      trimmed.startsWith("IN WITNESS") ||
      /^\d+\./.test(trimmed) ||
      trimmed.startsWith("DISCLOSING PARTY") ||
      trimmed.startsWith("RECEIVING PARTY") ||
      trimmed.startsWith("SIGNATURE PAGE");

    if (isHeading) {
      y += 3;
      addText(trimmed, 10, { bold: true });
      y += 1;
    } else if (trimmed.startsWith("(")) {
      addText(trimmed, 8.5, { color: [66, 66, 66] });
      y += 0.5;
    } else {
      addText(trimmed, 9);
      y += 1.5;
    }
  }

  // Signature Page with actual signatures
  doc.addPage();
  y = margin;

  addText("SIGNATURE PAGE", 14, { bold: true, align: "center", color: [13, 115, 119] });
  y += 8;

  // ---- DISCLOSING PARTY SIGNATURE BLOCK ----
  addText("DISCLOSING PARTY", 11, { bold: true });
  y += 4;

  addText("By: The Agent Factory, Inc.", 9, { bold: true });
  addText("Authorized Signatory", 8, { color: [100, 100, 100] });
  y += 2;
  addText(`Name: ${nda.disclosingSignatoryName || ""}`, 9);
  addText(`Title: ${nda.disclosingSignatoryTitle || ""}`, 9);
  addText(`Date: ${formatDate(nda.disclosingSignedDate)}`, 9, { color: [100, 100, 100] });
  y += 2;
  addText(NDA_DISCLOSING_PARTY.legalName + " / " + NDA_DISCLOSING_PARTY.brand, 8, { color: [100, 100, 100] });
  addText(NDA_DISCLOSING_PARTY.address, 8, { color: [100, 100, 100] });
  y += 10;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ---- RECEIVING PARTY SIGNATURE BLOCK ----
  addText("RECEIVING PARTY", 11, { bold: true });
  y += 4;

  if (signer) {
    // Add signature image
    if (signer.signatureData) {
      try {
        addPageIfNeeded(25);
        addText("By:", 9, { bold: true });
        doc.addImage(signer.signatureData, "PNG", margin + 8, y, 60, 20);
        y += 24;
      } catch {
        addText("By: [Signature on file]", 9, { bold: true });
        y += 2;
      }
    }
    addText("Authorized Signatory", 8, { color: [100, 100, 100] });
    y += 2;
    addText(`Name: ${signer.fullName}`, 9);
    addText(`Title: ${signer.title}`, 9);
    addText(`Date: ${formatDate(signer.signedAt)}`, 9, { color: [100, 100, 100] });
  } else {
    addText("By: ___________________________", 9);
    addText("Authorized Signatory", 8, { color: [100, 100, 100] });
    y += 2;
    addText("Name: ___________________________", 9);
    addText("Title: ___________________________", 9);
    addText("Date: ___________________________", 9);
  }

  y += 2;
  addText(nda.receivingPartyName, 8, { color: [100, 100, 100] });
  addText(nda.receivingPartyAddress, 8, { color: [100, 100, 100] });
  y += 10;

  // Document footer
  y += 10;
  addPageIfNeeded(15);
  doc.setDrawColor(13, 115, 119);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  addText(
    "This document was electronically signed and is legally binding under the ESIGN Act and UETA.",
    7,
    { color: [150, 150, 150], align: "center" }
  );
  addText(
    `${NDA_DISCLOSING_PARTY.legalName} / ${NDA_DISCLOSING_PARTY.brand}`,
    7,
    { color: [150, 150, 150], align: "center" }
  );

  // Return base64
  const pdfOutput = doc.output("datauristring");
  const base64 = pdfOutput.split(",")[1];
  return base64;
}
