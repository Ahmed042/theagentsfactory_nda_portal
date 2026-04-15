import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { sendSigningLink } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

interface CreateNdaBody {
  receivingPartyName: string;
  receivingPartyAddress: string;
  receivingPartyEmail: string;
  effectiveDate: string;
  disclosingSignatoryName: string;
  disclosingSignatoryTitle: string;
  disclosingSignedDate: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateNdaBody;

  if (
    !body.receivingPartyName ||
    !body.receivingPartyAddress ||
    !body.receivingPartyEmail ||
    !body.effectiveDate
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const nda = await prisma.nda.create({
    data: {
      token,
      receivingPartyName: body.receivingPartyName,
      receivingPartyAddress: body.receivingPartyAddress,
      receivingPartyEmail: body.receivingPartyEmail,
      effectiveDate: new Date(body.effectiveDate),
      disclosingSignatoryName: body.disclosingSignatoryName,
      disclosingSignatoryTitle: body.disclosingSignatoryTitle,
      disclosingSignedDate: new Date(body.disclosingSignedDate),
      status: "SENT",
      expiresAt,
    },
  });

  console.log(`[NDA] Created NDA ${nda.id} for ${body.receivingPartyName}`);

  await prisma.auditLog.create({
    data: {
      ndaId: nda.id,
      event: "NDA_CREATED",
      metadata: JSON.stringify({
        createdBy: session.user.email,
        receivingPartyName: body.receivingPartyName,
        receivingPartyEmail: body.receivingPartyEmail,
      }),
    },
  });

  try {
    console.log(`[NDA] Sending signing link email to ${body.receivingPartyEmail}...`);
    console.log(`[NDA] Sending admin notification to viraj@theagentfactory.io...`);

    await sendSigningLink({
      to: body.receivingPartyEmail,
      receivingPartyName: body.receivingPartyName,
      token,
      effectiveDate: body.effectiveDate,
      ndaId: nda.id,
    });

    console.log(`[NDA] Both emails sent successfully for NDA ${nda.id}`);

    await prisma.auditLog.create({
      data: {
        ndaId: nda.id,
        event: "EMAIL_SENT",
        metadata: JSON.stringify({
          to: body.receivingPartyEmail,
          adminNotified: "viraj@theagentfactory.io",
        }),
      },
    });
  } catch (emailError) {
    console.error("[NDA] Failed to send email:", emailError);

    await prisma.auditLog.create({
      data: {
        ndaId: nda.id,
        event: "EMAIL_FAILED",
        metadata: JSON.stringify({
          error: emailError instanceof Error ? emailError.message : "Unknown error",
          to: body.receivingPartyEmail,
        }),
      },
    });
  }

  return NextResponse.json(nda, { status: 201 });
}
