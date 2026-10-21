"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import { cn } from "../lib/utils";

export interface LightboxItem {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  uploadedAt?: string | Date;
}

export interface MediaLightboxProps {
  open: boolean;
  onClose: () => void;
  items: LightboxItem[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  canDelete?: boolean;
  onDelete?: (item: LightboxItem) => void;
  isDeleting?: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isImageItem(item?: LightboxItem | null): boolean {
  if (!item) return false;
  if (item.type && item.type.startsWith("image/")) return true;
  if (item.url && (item.url.startsWith("data:image/") || item.url.startsWith("blob:"))) return true;
  
  const name = (item.name || "").toLowerCase().trim();
  if (/\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|tiff?)$/i.test(name)) return true;

  if (item.url) {
    try {
      const cleanUrl = item.url.split("?")[0].split("#")[0].toLowerCase();
      if (/\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|tiff?)$/i.test(cleanUrl)) return true;
      if (cleanUrl.includes("images.unsplash.com")) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

export function isPdfItem(item?: LightboxItem | null): boolean {
  if (!item) return false;
  if (item.type === "application/pdf") return true;
  if (item.url && item.url.startsWith("data:application/pdf")) return true;
  const name = (item.name || "").toLowerCase().trim();
  if (name.endsWith(".pdf")) return true;
  if (item.url) {
    try {
      const cleanUrl = item.url.split("?")[0].split("#")[0].toLowerCase();
      if (cleanUrl.endsWith(".pdf")) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export function MediaLightbox({
  open,
  onClose,
  items,
  currentIndex = 0,
  onIndexChange,
  canDelete = false,
  onDelete,
  isDeleting = false,
}: MediaLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeIndex = onIndexChange !== undefined ? currentIndex : internalIndex;

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      if (onIndexChange) {
        onIndexChange(index);
      } else {
        setInternalIndex(index);
      }
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setImageLoading(true);
    },
    [items.length, onIndexChange]
  );

  // Reset viewport state on active index change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImageLoading(true);
  }, [activeIndex]);

  const currentItem = items[activeIndex];

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.5, +(z - 0.25).toFixed(2));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Double click toggles 1x <-> 2x
  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, +(z + 0.15).toFixed(2)));
    } else {
      setZoom((z) => {
        const next = Math.max(0.5, +(z - 0.15).toFixed(2));
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (activeIndex > 0) setActiveIndex(activeIndex - 1);
          break;
        case "ArrowRight":
          if (activeIndex < items.length - 1) setActiveIndex(activeIndex + 1);
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
        case "_":
          handleZoomOut();
          break;
        case "0":
        case "r":
        case "R":
          handleResetZoom();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeIndex, items.length, onClose, setActiveIndex]);

  // Prevent background scrolling and mark lightbox as active on body
  useEffect(() => {
    if (open) {
      document.body.classList.add("media-lightbox-open");
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.classList.remove("media-lightbox-open");
        document.body.style.overflow = origOverflow;
      };
    }
  }, [open]);

  // Direct download trigger
  const handleDownload = async () => {
    if (!currentItem) return;
    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = currentItem.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(currentItem.url, "_blank");
    }
  };

  if (!mounted || !open || !currentItem) return null;

  const isImage = isImageItem(currentItem);
  const isPdf = isPdfItem(currentItem);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-media-lightbox="true"
      aria-label={`Preview: ${currentItem.name}`}
      className="fixed inset-0 z-[99999] bg-black/92 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in-0 duration-200"
      onPointerDownCapture={(e) => {
        e.stopPropagation();
      }}
      onClickCapture={(e) => {
        e.stopPropagation();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ── Top Floating Toolbar ── */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-foreground/60 backdrop-blur-md text-white">
        {/* Left: File details & index */}
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            {isImage ? (
              <ImageIcon className="w-4 h-4 text-success" />
            ) : isPdf ? (
              <FileText className="w-4 h-4 text-destructive" />
            ) : (
              <FileText className="w-4 h-4 text-warning" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate max-w-[240px] sm:max-w-md" title={currentItem.name}>
                {currentItem.name}
              </span>
              {items.length > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-semibold text-white/80 shrink-0">
                  {activeIndex + 1} / {items.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
              {currentItem.size ? <span>{formatBytes(currentItem.size)}</span> : null}
              {currentItem.uploadedAt && (
                <>
                  <span>•</span>
                  <span>{new Date(currentItem.uploadedAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Interactive Viewport Controls (Images) */}
        {isImage && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/15 shadow-md">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom out (-)"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              title="Click to reset zoom & rotation (0)"
              className="px-2 py-1 rounded-lg text-xs font-mono font-semibold text-white/90 hover:bg-white/15 transition-all cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              title="Zoom in (+)"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/20 mx-1" />

            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90° clockwise (R)"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {(zoom !== 1 || rotation !== 0) && (
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset view"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Right: Actions (Download, Open Tab, Delete, Close) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {canDelete && onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(currentItem)}
              title="Delete attachment"
              className="p-2 rounded-lg bg-destructive/15 hover:bg-destructive/25 border border-destructive/30 text-destructive hover:text-destructive transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button
            type="button"
            onClick={onClose}
            title="Close viewer (ESC)"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Viewport Area ── */}
      <main
        className="relative flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-8"
        onWheel={handleWheel}
        onClick={(e) => {
          // If clicked the empty backdrop, close
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Previous Image Arrow */}
        {items.length > 1 && activeIndex > 0 && (
          <button
            type="button"
            onClick={() => setActiveIndex(activeIndex - 1)}
            aria-label="Previous attachment"
            className="absolute left-4 sm:left-8 z-30 p-3 rounded-lg bg-black/60 hover:bg-black/90 border border-white/20 text-white/80 hover:text-white  shadow-md transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Image Arrow */}
        {items.length > 1 && activeIndex < items.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveIndex(activeIndex + 1)}
            aria-label="Next attachment"
            className="absolute right-4 sm:right-8 z-30 p-3 rounded-lg bg-black/60 hover:bg-black/90 border border-white/20 text-white/80 hover:text-white  shadow-md transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Content Viewer */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
        >
          {isImage ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentItem.url}
                alt={currentItem.name}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                draggable={false}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className={cn(
                  "max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-md transition-opacity duration-200",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
              />
            </>
          ) : isPdf ? (
            <div className="w-full max-w-5xl h-[80vh] flex flex-col items-center justify-center">
              <iframe
                src={currentItem.url}
                title={currentItem.name}
                className="w-full h-full rounded-lg border border-white/20 bg-card shadow-md"
              />
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-lg bg-foreground/90 border border-white/15 max-w-md w-full flex flex-col items-center text-center gap-4 text-white shadow-md">
              <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                <FileText className="w-8 h-8 text-destructive" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-base">{currentItem.name}</span>
                <span className="text-xs text-white/60 font-mono">
                  {formatBytes(currentItem.size)}
                </span>
              </div>
              <p className="text-xs text-white/70">
                This document cannot be previewed inline. You can open it in a new tab or download it directly.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Browser</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Bottom Floating Thumbnail Strip ── */}
      {items.length > 1 && (
        <footer className="relative z-20 flex items-center justify-center px-4 py-3 border-t border-white/10 bg-foreground/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5 max-w-3xl overflow-x-auto p-1 custom-scrollbar">
            {items.map((it, idx) => {
              const isSelected = idx === activeIndex;
              const isItImg = isImageItem(it);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer",
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-slate-950 scale-105"
                      : "border-white/20 opacity-50 hover:opacity-100"
                  )}
                  title={it.name}
                >
                  {isItImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.url} alt={it.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-foreground flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white/60" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </footer>
      )}
    </div>,
    document.body
  );
}
