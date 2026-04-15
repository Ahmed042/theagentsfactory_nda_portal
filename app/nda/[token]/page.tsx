export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NdaSigningClient from "./NdaSigningClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NdaSigningPage({ params }: PageProps) {
  const { token } = await params;

  const nda = await prisma.nda.findUnique({
    where: { token },
    include: { signers: true },
  });

  if (!nda) {
    notFound();
  }

  // Log opened event
  await prisma.auditLog.create({
    data: {
      ndaId: nda.id,
      event: "NDA_OPENED",
      metadata: JSON.stringify({ token }),
    },
  });

  if (nda.status === "SENT") {
    await prisma.nda.update({
      where: { id: nda.id },
      data: { status: "OPENED" },
    });
  }

  const isExpired = new Date() > nda.expiresAt;
  const isSigned = nda.status === "SIGNED";

  return (
    <NdaSigningClient
      token={nda.token}
      receivingPartyName={nda.receivingPartyName}
      receivingPartyAddress={nda.receivingPartyAddress}
      effectiveDate={formatDate(nda.effectiveDate)}
      disclosingSignatoryName={nda.disclosingSignatoryName || ""}
      disclosingSignatoryTitle={nda.disclosingSignatoryTitle || ""}
      disclosingSignedDate={formatDate(nda.disclosingSignedDate)}
      isExpired={isExpired}
      isSigned={isSigned}
    />
  );
}
