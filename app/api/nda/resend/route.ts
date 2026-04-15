import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { sendSigningLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { ndaId: string };

  if (!body.ndaId) {
    return NextResponse.json(
      { error: "ndaId is required" },
      { status: 400 }
    );
  }

  const nda = await prisma.nda.findUnique({
    where: { id: body.ndaId },
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
    return NextResponse.json(
      { error: "This NDA link has expired" },
      { status: 400 }
    );
  }

  await sendSigningLink({
    to: nda.receivingPartyEmail,
    receivingPartyName: nda.receivingPartyName,
    token: nda.token,
  });

  await prisma.auditLog.create({
    data: {
      ndaId: nda.id,
      event: "EMAIL_RESENT",
      metadata: JSON.stringify({
        resentBy: session.user.email,
        to: nda.receivingPartyEmail,
      }),
    },
  });

  return NextResponse.json({ success: true });
}
