"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pen, Upload, Trash2 } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({
  onSignatureChange,
  width = 500,
  height = 200,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#14213D";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (mode === "draw") {
      initCanvas();
      const handleResize = () => initCanvas();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [initCanvas, mode]);

  const getPosition = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;
    const ctx = getContext();
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPosition(e);
    if (!pos) return;
    const ctx = getContext();
    if (!ctx) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    if (mode === "draw") {
      initCanvas();
    }
    setHasSignature(false);
    setUploadPreview(null);
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadPreview(dataUrl);
      setHasSignature(true);
      onSignatureChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const switchMode = (newMode: "draw" | "upload") => {
    if (newMode === mode) return;
    clearSignature();
    setMode(newMode);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-background rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => switchMode("draw")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
            mode === "draw"
              ? "bg-surface text-white"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Pen className="h-3.5 w-3.5" />
          Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
            mode === "upload"
              ? "bg-surface text-white"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      {/* Draw mode */}
      {mode === "draw" && (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: `${height}px` }}
            className="cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">
                Draw your signature here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="rounded-lg border border-border overflow-hidden">
          {uploadPreview ? (
            <div className="bg-[#14213D] flex items-center justify-center p-4" style={{ height: `${height}px` }}>
              <img
                src={uploadPreview}
                alt="Uploaded signature"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <label
              className="bg-[#14213D] flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a2a4d] transition-colors"
              style={{ height: `${height}px` }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">
                Click to upload signature image
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                PNG or JPG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
