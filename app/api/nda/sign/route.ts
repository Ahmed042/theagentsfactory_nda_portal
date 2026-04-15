import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNdaPdf } from "@/lib/pdf";
import { sendSignedNdaNotification } from "@/lib/email";

interface SignNdaBody {
  token: string;
  fullName: string;
  title: string;
  signatureData: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SignNdaBody;

  if (!body.token || !body.fullName || !body.title || !body.signatureData) {
    return NextResponse.json(
      { error: "All fields are required (token, fullName, title, signatureData)" },
      { status: 400 }
    );
  }

  const nda = await prisma.nda.findUnique({
    where: { token: body.token },
    include: { signers: true },
  });

  if (!nda) {
    return NextResponse.json({ error: "NDA not found" }, { status: 404 });
  }

  if (nda.status === "SIGNED") {
    return NextResponse.json(
      { error: "This NDA has already been signed" },
      { status: 400 }
    );
  }

  if (new Date() > nda.expiresAt) {
    await prisma.nda.update({
      where: { id: nda.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "This NDA link has expired" },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const signer = await prisma.signer.create({
    data: {
      ndaId: nda.id,
      fullName: body.fullName,
      title: body.title,
      signatureData: body.signatureData,
      ipAddress: ip,
      userAgent: userAgent,
    },
  });

  await prisma.nda.update({
    where: { id: nda.id },
    data: { status: "SIGNED" },
  });

  await prisma.auditLog.create({
    data: {
      ndaId: nda.id,
      event: "NDA_SIGNED",
      metadata: JSON.stringify({
        signerId: signer.id,
        fullName: signer.fullName,
        title: signer.title,
        ipAddress: ip,
        userAgent: userAgent,
        signedAt: signer.signedAt.toISOString(),
      }),
    },
  });

  try {
    const updatedNda = await prisma.nda.findUnique({
      where: { id: nda.id },
      include: { signers: true, auditLog: true },
    });

    if (updatedNda) {
      const pdfBase64 = await generateNdaPdf(updatedNda);

      await prisma.nda.update({
        where: { id: nda.id },
        data: { signedPdfUrl: "generated" },
      });

      await sendSignedNdaNotification({
        to: nda.receivingPartyEmail,
        receivingPartyName: nda.receivingPartyName,
        pdfBase64,
      });

      await prisma.auditLog.create({
        data: {
          ndaId: nda.id,
          event: "PDF_GENERATED_AND_EMAILED",
          metadata: JSON.stringify({
            emailedTo: [nda.receivingPartyEmail, "viraj@theagentfactory.io"],
          }),
        },
      });
    }
  } catch (pdfError) {
    console.error("Failed to generate PDF or send email:", pdfError);
  }

  return NextResponse.json({
    success: true,
    status: "SIGNED",
    message: "NDA has been signed. A copy will be emailed to all parties.",
  });
}
