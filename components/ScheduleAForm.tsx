"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "./SignatureCanvas";

export interface SignerFormData {
  fullName: string;
  title: string;
  signatureData: string | null;
}

interface ScheduleAFormProps {
  disabled: boolean;
  onSubmit: (signer: SignerFormData) => void;
  isSubmitting: boolean;
}

export default function ScheduleAForm({
  disabled,
  onSubmit,
  isSubmitting,
}: ScheduleAFormProps) {
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const isValid = fullName.trim() && title.trim() && signatureData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || disabled) return;
    onSubmit({ fullName, title, signatureData });
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="bg-surface rounded-xl p-8 border border-border">
        <h3 className="text-xl font-bold text-white mb-2">
          Authorized Signatory
        </h3>
        <p className="text-muted-foreground text-sm mb-8">
          Receiving Party Representative
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signer-name" className="text-white">
                Full Legal Name
              </Label>
              <Input
                id="signer-name"
                placeholder="Enter your full legal name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={disabled}
                className="bg-background border-border text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signer-title" className="text-white">
                Title / Position
              </Label>
              <Input
                id="signer-title"
                placeholder="e.g., CEO, Director, Partner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={disabled}
                className="bg-background border-border text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Signature</Label>
            <SignatureCanvas
              onSignatureChange={(data) => setSignatureData(data)}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Date: {today}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            type="submit"
            disabled={!isValid || disabled || isSubmitting}
            className="bg-teal hover:bg-teal-hover text-white px-12 py-6 text-lg font-semibold rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing...
              </span>
            ) : (
              "Sign NDA"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
