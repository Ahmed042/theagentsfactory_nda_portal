export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  FileText,
  Plus,
  Send,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
    icon: typeof Send;
  }
> = {
  SENT: { label: "Sent", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Send },
  OPENED: { label: "Opened", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Eye },
  SIGNED: { label: "Signed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  EXPIRED: { label: "Expired", className: "bg-red-500/10 text-red-400 border-red-500/20", icon: Clock },
};

export default async function AdminNdasPage() {
  const ndas = await prisma.nda.findMany({
    include: {
      signers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  for (const nda of ndas) {
    if (nda.status !== "SIGNED" && nda.status !== "EXPIRED" && now > nda.expiresAt) {
      await prisma.nda.update({
        where: { id: nda.id },
        data: { status: "EXPIRED" },
      });
      nda.status = "EXPIRED";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-teal" />
          <div>
            <h2 className="text-2xl font-semibold text-white">NDAs</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage all non-disclosure agreements
            </p>
          </div>
        </div>
        <Link
          href="/admin/ndas/new"
          className="bg-teal hover:bg-teal-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create NDA
        </Link>
      </div>

      {ndas.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center border border-border">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No NDAs created yet.</p>
          <Link
            href="/admin/ndas/new"
            className="text-teal hover:underline text-sm mt-2 inline-block"
          >
            Create your first NDA
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Receiving Party</TableHead>
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Signer</TableHead>
                <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                <TableHead className="text-muted-foreground font-medium">Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ndas.map((nda) => {
                const cfg = statusConfig[nda.status] || statusConfig.SENT;
                const StatusIcon = cfg.icon;
                const signer = nda.signers[0];
                return (
                  <TableRow
                    key={nda.id}
                    className="border-border hover:bg-background/50"
                  >
                    <TableCell>
                      <Link
                        href={`/admin/ndas/${nda.id}`}
                        className="text-white font-medium hover:text-teal transition-colors"
                      >
                        {nda.receivingPartyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {nda.receivingPartyEmail}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1.5 ${cfg.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {signer ? signer.fullName : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {nda.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {nda.expiresAt.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
