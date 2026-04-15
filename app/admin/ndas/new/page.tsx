"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Send, ArrowLeft, AlertCircle } from "lucide-react";

export default function NewNdaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    receivingPartyName: "",
    receivingPartyAddress: "",
    receivingPartyEmail: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    disclosingSignatoryName: "Viraj Bhalla",
    disclosingSignatoryTitle: "CEO",
    disclosingSignedDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/nda/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create NDA");
        return;
      }

      router.push(`/admin/ndas/${data.id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="h-6 w-6 text-teal" />
        <h2 className="text-2xl font-semibold text-white">Create New NDA</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-8 ml-9">
        Generate a signing link to send to the receiving party.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white text-sm">
              Receiving Party Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Acme Corporation"
              value={form.receivingPartyName}
              onChange={(e) =>
                setForm((p) => ({ ...p, receivingPartyName: e.target.value }))
              }
              required
              className="bg-background border-border text-white placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-white text-sm">
              Receiving Party Address
            </Label>
            <Textarea
              id="address"
              placeholder="Full address"
              value={form.receivingPartyAddress}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  receivingPartyAddress: e.target.value,
                }))
              }
              required
              className="bg-background border-border text-white placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm">
              Receiving Party Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@company.com"
              value={form.receivingPartyEmail}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  receivingPartyEmail: e.target.value,
                }))
              }
              required
              className="bg-background border-border text-white placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate" className="text-white text-sm">
              Effective Date
            </Label>
            <Input
              id="effectiveDate"
              type="date"
              value={form.effectiveDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveDate: e.target.value }))
              }
              required
              className="bg-background border-border text-white w-48"
            />
            <p className="text-xs text-muted-foreground">
              The date the NDA becomes effective
            </p>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Disclosing Party Signatory
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="disclosingName" className="text-white text-sm">
                  Authorized Signatory Name
                </Label>
                <Input
                  id="disclosingName"
                  placeholder="Full name"
                  value={form.disclosingSignatoryName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, disclosingSignatoryName: e.target.value }))
                  }
                  required
                  className="bg-background border-border text-white placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disclosingTitle" className="text-white text-sm">
                  Title
                </Label>
                <Input
                  id="disclosingTitle"
                  placeholder="e.g., CEO"
                  value={form.disclosingSignatoryTitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, disclosingSignatoryTitle: e.target.value }))
                  }
                  required
                  className="bg-background border-border text-white placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="disclosingDate" className="text-white text-sm">
                Signing Date
              </Label>
              <Input
                id="disclosingDate"
                type="date"
                value={form.disclosingSignedDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, disclosingSignedDate: e.target.value }))
                }
                required
                className="bg-background border-border text-white w-48"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal hover:bg-teal-hover text-white gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create NDA & Send Link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/ndas")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
