export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import NdaDetailActions from "./NdaDetailActions";
import {
  FileText,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Link as LinkIcon,
  Shield,
  Globe,
  Monitor,
  User,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  SENT: {
    label: "Sent",
    variant: "secondary",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  OPENED: {
    label: "Opened",
    variant: "outline",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  SIGNED: {
    label: "Signed",
    variant: "default",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  EXPIRED: {
    label: "Expired",
    variant: "destructive",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export default async function NdaDetailPage({ params }: PageProps) {
  const { id } = await params;

  const nda = await prisma.nda.findUnique({
    where: { id },
    include: {
      signers: { orderBy: { signedAt: "asc" } },
      auditLog: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!nda) {
    notFound();
  }

  const config = statusConfig[nda.status] || statusConfig.SENT;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const signingLink = `${baseUrl}/nda/${nda.token}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-teal" />
            <h2 className="text-2xl font-semibold text-white">
              {nda.receivingPartyName}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm ml-9">
            {nda.receivingPartyEmail}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${config.className}`}>
          {config.label}
        </Badge>
      </div>

      {/* Details Card */}
      <div className="bg-surface rounded-xl p-6 border border-border space-y-5">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal" />
          NDA Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Receiving Party
              </p>
              <p className="text-white mt-1 text-sm">{nda.receivingPartyName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Address
              </p>
              <p className="text-white mt-1 text-sm whitespace-pre-line">
                {nda.receivingPartyAddress}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Email
              </p>
              <p className="text-white mt-1 text-sm">{nda.receivingPartyEmail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Signer
              </p>
              <p className="text-white mt-1 text-sm">
                {nda.signers[0]?.fullName || "Awaiting signature"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Effective Date
              </p>
              <p className="text-white mt-1 text-sm">
                {nda.effectiveDate
                  ? new Date(nda.effectiveDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "\u2014"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Created
              </p>
              <p className="text-white mt-1 text-sm">
                {nda.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Expires
              </p>
              <p className="text-white mt-1 text-sm">
                {nda.expiresAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex items-start gap-3">
          <LinkIcon className="h-4 w-4 text-muted-foreground mt-2" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Signing Link
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-teal bg-background px-3 py-2 rounded-lg block break-all flex-1">
                {signingLink}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <NdaDetailActions
        ndaId={nda.id}
        status={nda.status}
        hasSigned={nda.status === "SIGNED"}
        signingLink={signingLink}
      />

      {/* Signer */}
      {nda.signers[0] && (
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-teal" />
            Signatory
          </h3>
          <div className="bg-background rounded-lg p-4 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-medium text-sm">
                  {nda.signers[0].fullName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {nda.signers[0].title}
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {nda.signers[0].signedAt.toLocaleString()}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {nda.signers[0].ipAddress}
              </p>
              <p className="truncate flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {nda.signers[0].userAgent}
              </p>
            </div>
            {nda.signers[0].signatureData && (
              <div className="mt-3 bg-surface rounded-lg p-2 inline-block">
                <img
                  src={nda.signers[0].signatureData}
                  alt={`Signature of ${nda.signers[0].fullName}`}
                  className="h-16 w-auto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-surface rounded-xl p-6 border border-border">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal" />
          Audit Log
        </h3>
        {nda.auditLog.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events logged.</p>
        ) : (
          <div className="space-y-2">
            {nda.auditLog.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between bg-background rounded-lg p-3 border border-border"
              >
                <div>
                  <p className="text-white text-sm font-medium">{log.event}</p>
                  <p className="text-muted-foreground text-xs mt-1 font-mono">
                    {typeof log.metadata === "string" ? log.metadata : JSON.stringify(log.metadata, null, 0)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {log.createdAt.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
