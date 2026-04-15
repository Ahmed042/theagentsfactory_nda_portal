import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { FileText, Plus, CheckCircle } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">
              The Agent Factory
            </h1>
            <p className="text-xs text-muted-foreground">
              NDA Management Portal
            </p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/admin/ndas"
              className="text-sm text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-surface inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              All NDAs
            </a>
            <a
              href="/admin/ndas/signed"
              className="text-sm text-muted-foreground hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-surface inline-flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Signed
            </a>
            <a
              href="/admin/ndas/new"
              className="text-sm bg-teal hover:bg-teal-hover text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 ml-2"
            >
              <Plus className="h-4 w-4" />
              New NDA
            </a>
            <div className="ml-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {session.user.name}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
