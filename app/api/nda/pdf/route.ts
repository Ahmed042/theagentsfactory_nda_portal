import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateNdaPdf } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ndaId = req.nextUrl.searchParams.get("ndaId");
  if (!ndaId) {
    return NextResponse.json(
      { error: "ndaId is required" },
      { status: 400 }
    );
  }

  const nda = await prisma.nda.findUnique({
    where: { id: ndaId },
    include: { signers: true, auditLog: true },
  });

  if (!nda) {
    return NextResponse.json({ error: "NDA not found" }, { status: 404 });
  }

  const pdfBase64 = await generateNdaPdf(nda);
  const pdfBuffer = Buffer.from(pdfBase64, "base64");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="NDA-${nda.receivingPartyName.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
