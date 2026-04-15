"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Send, Check } from "lucide-react";

interface NdaDetailActionsProps {
  ndaId: string;
  status: string;
  hasSigned: boolean;
  signingLink: string;
}

export default function NdaDetailActions({
  ndaId,
  status,
  hasSigned,
  signingLink,
}: NdaDetailActionsProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = signingLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await fetch("/api/nda/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ndaId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendMessage(data.error || "Failed to resend");
        return;
      }

      setResendMessage("Signing link resent successfully!");
    } catch {
      setResendMessage("An unexpected error occurred");
    } finally {
      setIsResending(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/nda/pdf?ndaId=${ndaId}`, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Link
          </>
        )}
      </Button>

      {hasSigned && (
        <Button
          onClick={handleDownloadPdf}
          size="sm"
          className="bg-teal hover:bg-teal-hover text-white gap-2"
        >
          <Download className="h-4 w-4" />
          Download Signed PDF
        </Button>
      )}

      {status !== "SIGNED" && status !== "EXPIRED" && (
        <Button
          onClick={handleResend}
          disabled={isResending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isResending ? "Resending..." : "Resend Signing Link"}
        </Button>
      )}

      {resendMessage && (
        <p
          className={`text-sm ${
            resendMessage.includes("success")
              ? "text-emerald-400"
              : "text-destructive"
          }`}
        >
          {resendMessage}
        </p>
      )}
    </div>
  );
}
