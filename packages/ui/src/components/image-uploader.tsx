"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "./button";
import { cn } from "../lib/utils";

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  description?: string;
  aspectRatio?: "square" | "landscape" | "auto";
  maxDimension?: number;
  quality?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Converts a File into an optimized Base64 Data URL using an HTML5 Canvas.
 * For SVGs, preserves raw vector markup. For raster images, scales them to maxDimension
 * and compresses to WebP/PNG for compact payload size.
 */
async function processImageToBase64(
  file: File,
  maxDimension = 1000,
  quality = 0.88
): Promise<string> {
  // If SVG, read directly as data URL without rasterizing
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // For bitmap images, use Canvas to resize & compress
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as webp with fallback to png
        try {
          const mimeType = file.type === "image/png" ? "image/png" : "image/webp";
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => {
        // If image loading fails, fallback to raw reader result
        resolve(reader.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  value,
  onChange,
  label = "Upload Image",
  description = "PNG, JPG, WebP, SVG up to 5MB (automatically converted to Base64)",
  aspectRatio = "square",
  maxDimension = 1000,
  quality = 0.88,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, SVG, GIF).");
      return;
    }

    // Validate size (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    try {
      setIsProcessing(true);
      const base64 = await processImageToBase64(file, maxDimension, quality);
      onChange(base64);
    } catch (err) {
      console.error("Image conversion error:", err);
      setError("Failed to convert image. Please try another file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
    // Reset file input so same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
  };

  const openFilePicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        /* Preview Card */
        <div className="relative group rounded-2xl border border-border/80 bg-surface-subtle overflow-hidden p-3 transition-all hover:border-primary/40 shadow-xs">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "relative rounded-xl overflow-hidden bg-background border border-border/60 shrink-0 flex items-center justify-center shadow-inner",
                aspectRatio === "square" && "w-20 h-20",
                aspectRatio === "landscape" && "w-28 h-20",
                aspectRatio === "auto" && "max-w-[120px] max-h-[80px]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-contain p-1"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={openFilePicker}
                  className="w-8 h-8 rounded-full bg-white/90 text-slate-800 hover:bg-white shadow-sm"
                  title="Change Image"
                  disabled={disabled}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Image stored as Base64</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {value.startsWith("data:")
                  ? `Base64 encoded string (${Math.round((value.length * 3) / 4 / 1024)} KB)`
                  : "Image URL"}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openFilePicker}
                  disabled={disabled || isProcessing}
                  className="h-7 px-2.5 text-[11px] font-medium rounded-lg"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="h-7 px-2.5 text-[11px] font-medium rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-3 h-3 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group",
            isDragging
              ? "border-primary bg-primary/5 shadow-inner scale-[0.99]"
              : "border-border hover:border-primary/50 hover:bg-surface-subtle/70 bg-card",
            disabled && "opacity-60 cursor-not-allowed hover:border-border hover:bg-card"
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-xs",
              isDragging
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary border border-primary/20"
            )}
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {isProcessing
                ? "Converting to Base64..."
                : isDragging
                ? "Drop image file here"
                : label}
            </span>
            <span className="text-[11px] text-muted-foreground max-w-xs">{description}</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/80 bg-surface-subtle px-2.5 py-1 rounded-full border border-border/60">
            <ImageIcon className="w-3 h-3" />
            <span>Click or drag & drop</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-0.5 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
