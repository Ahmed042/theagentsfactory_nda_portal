"use client";

import { useState } from "react";
import NDAViewer from "@/components/NDAViewer";
import ScheduleAForm, { SignerFormData } from "@/components/ScheduleAForm";
import { Clock, CheckCircle, AlertCircle, PartyPopper } from "lucide-react";

interface NdaSigningClientProps {
  token: string;
  receivingPartyName: string;
  receivingPartyAddress: string;
  effectiveDate: string;
  disclosingSignatoryName: string;
  disclosingSignatoryTitle: string;
  disclosingSignedDate: string;
  isExpired: boolean;
  isSigned: boolean;
}

export default function NdaSigningClient({
  token,
  receivingPartyName,
  receivingPartyAddress,
  effectiveDate,
  disclosingSignatoryName,
  disclosingSignatoryTitle,
  disclosingSignedDate,
  isExpired,
  isSigned,
}: NdaSigningClientProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-8 max-w-md text-center border border-border">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Link Expired</h1>
          <p className="text-muted-foreground text-sm">
            This NDA signing link has expired. Please contact The Agent Factory
            to request a new link.
          </p>
        </div>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-8 max-w-md text-center border border-border">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Already Signed
          </h1>
          <p className="text-muted-foreground text-sm">
            This NDA has already been signed. A copy has been emailed to
            all parties.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-8 max-w-md text-center border border-border">
          <PartyPopper className="h-12 w-12 text-teal mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Thank You
          </h1>
          <p className="text-muted-foreground text-sm">
            Your signature has been recorded successfully. A signed copy of the
            NDA will be emailed to all parties.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (signer: SignerFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/nda/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: signer.fullName,
          title: signer.title,
          signatureData: signer.signatureData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sign NDA");
        return;
      }

      setIsComplete(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">
              The Agent Factory
            </h1>
            <p className="text-sm text-muted-foreground">
              Non-Disclosure Agreement
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prepared for</p>
            <p className="text-white font-medium">{receivingPartyName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* NDA Document */}
        <NDAViewer
          receivingPartyName={receivingPartyName}
          receivingPartyAddress={receivingPartyAddress}
          effectiveDate={effectiveDate}
          disclosingSignatoryName={disclosingSignatoryName}
          disclosingSignatoryTitle={disclosingSignatoryTitle}
          disclosingSignedDate={disclosingSignedDate}
          onScrollComplete={() => setHasScrolled(true)}
        />

        {/* Signature Section */}
        {hasScrolled && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
              <div className="max-w-4xl mx-auto mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            <ScheduleAForm
              disabled={isSubmitting}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {!hasScrolled && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Please read the entire agreement above before signing.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            The Agent Factory, Inc. / Mortgages.ai — 37-02 Astoria Blvd,
            Astoria, New York 11103
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This document is legally binding upon execution by all parties.
          </p>
        </div>
      </footer>
    </div>
  );
}
