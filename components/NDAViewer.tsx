"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { getNdaContent } from "@/lib/nda-content";

interface NDAViewerProps {
  receivingPartyName: string;
  receivingPartyAddress: string;
  effectiveDate?: string;
  disclosingSignatoryName?: string;
  disclosingSignatoryTitle?: string;
  disclosingSignedDate?: string;
  onScrollComplete: () => void;
}

export default function NDAViewer({
  receivingPartyName,
  receivingPartyAddress,
  effectiveDate,
  disclosingSignatoryName,
  disclosingSignatoryTitle,
  disclosingSignedDate,
  onScrollComplete,
}: NDAViewerProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const ndaText = getNdaContent({
    effectiveDate: effectiveDate || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    receivingPartyName,
    receivingPartyAddress,
    disclosingSignatoryName,
    disclosingSignatoryTitle,
    disclosingSignedDate,
  });

  const handleScroll = useCallback(() => {
    const element = contentRef.current;
    if (!element || hasScrolledToBottom) return;

    const { scrollTop, scrollHeight, clientHeight } = element;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

    if (isNearBottom) {
      setHasScrolledToBottom(true);
      onScrollComplete();
    }
  }, [hasScrolledToBottom, onScrollComplete]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const paragraphs = ndaText.split("\n\n");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D7377] to-[#0E8C91] px-8 py-6">
          <h2 className="text-white text-xl font-bold">
            Non-Disclosure Agreement
          </h2>
          <p className="text-white/80 text-sm mt-1">
            The Agent Factory, Inc. / Mortgages.ai
          </p>
        </div>

        <div
          ref={contentRef}
          className="h-[60vh] overflow-y-auto px-8 py-6"
        >
          <div className="prose prose-sm max-w-none text-gray-800">
            {paragraphs.map((paragraph, index) => {
              const isHeading =
                paragraph.startsWith("MUTUAL") ||
                paragraph.startsWith("RECITALS") ||
                paragraph.startsWith("IN WITNESS") ||
                /^\d+\./.test(paragraph) ||
                paragraph.startsWith("DISCLOSING PARTY") ||
                paragraph.startsWith("RECEIVING PARTY") ||
                paragraph.startsWith("SIGNATURE PAGE") ||
                paragraph.startsWith("SCHEDULE A");

              const isPartyInfo =
                paragraph.startsWith("Disclosing Party:") ||
                paragraph.startsWith("Receiving Party:") ||
                paragraph === receivingPartyName ||
                paragraph === receivingPartyAddress;

              const isSignatureLine =
                paragraph.startsWith("By:") ||
                paragraph.startsWith("Authorized Signatory") ||
                paragraph.startsWith("Name:") ||
                paragraph.startsWith("Title:") ||
                paragraph.startsWith("Date:");

              if (isHeading) {
                return (
                  <h3
                    key={index}
                    className="text-gray-900 font-bold text-base mt-6 mb-3"
                  >
                    {paragraph}
                  </h3>
                );
              }

              if (isPartyInfo) {
                return (
                  <p
                    key={index}
                    className="text-gray-900 font-medium whitespace-pre-line"
                  >
                    {paragraph}
                  </p>
                );
              }

              if (isSignatureLine) {
                return (
                  <p
                    key={index}
                    className="text-gray-800 whitespace-pre-line my-1"
                  >
                    {paragraph}
                  </p>
                );
              }

              if (paragraph.startsWith("(")) {
                return (
                  <p
                    key={index}
                    className="text-gray-700 leading-relaxed pl-6 my-1 whitespace-pre-line"
                  >
                    {paragraph}
                  </p>
                );
              }

              return (
                <p
                  key={index}
                  className="text-gray-700 leading-relaxed my-3 whitespace-pre-line"
                >
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
          {hasScrolledToBottom ? (
            <p className="text-sm text-green-600 font-medium text-center">
              Agreement reviewed. Please sign below.
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Scroll to the bottom to review the full agreement before signing
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
