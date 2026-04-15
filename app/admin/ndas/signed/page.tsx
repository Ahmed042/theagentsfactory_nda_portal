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
import { CheckCircle, Download, Calendar, FileText } from "lucide-react";

export default async function SignedNdasPage() {
  const ndas = await prisma.nda.findMany({
    where: { status: "SIGNED" },
    include: {
      signers: { orderBy: { signedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-semibold text-white">Signed NDAs</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              All fully executed agreements
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
          {ndas.length} completed
        </Badge>
      </div>

      {ndas.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 text-center border border-border">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No signed NDAs yet.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Receiving Party</TableHead>
                <TableHead className="text-muted-foreground font-medium">Effective Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Signed Date</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ndas.map((nda) => {
                const lastSigned = nda.signers[0]?.signedAt;
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {nda.receivingPartyEmail}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {nda.effectiveDate
                          ? new Date(nda.effectiveDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "\u2014"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lastSigned
                        ? lastSigned.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/api/nda/pdf?ndaId=${nda.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-teal hover:text-teal-hover transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
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
