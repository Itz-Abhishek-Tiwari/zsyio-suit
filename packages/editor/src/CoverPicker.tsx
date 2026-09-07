"use client";

import React, { useState, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger, SegmentedTabs, cn } from "@zsyio/ui";
import {
  Image as ImageIcon,
  UploadCloud,
  Link2,
  X,
  Check,
  Palette,
  Loader2,
  Images,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { parseCover } from "./cover-utils";

const CURATED_WALLPAPERS = [
  {
    name: "Uttarakhand Himalayas",
    url: "https://images.pexels.com/photos/36908025/pexels-photo-36908025.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Sikkim Himalayas",
    url: "https://images.pexels.com/photos/30201553/pexels-photo-30201553.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Snowy Uttarakhand",
    url: "https://images.pexels.com/photos/36908021/pexels-photo-36908021.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Ladakh Valley",
    url: "https://images.pexels.com/photos/37312734/pexels-photo-37312734.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Kanchenjunga, Sikkim",
    url: "https://images.pexels.com/photos/29445121/pexels-photo-29445121.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Ladakh Mountains",
    url: "https://images.pexels.com/photos/29037111/pexels-photo-29037111.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Himachal Himalayas",
    url: "https://images.pexels.com/photos/35131050/pexels-photo-35131050.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    name: "Ladakh Green Valley",
    url: "https://images.pexels.com/photos/33395692/pexels-photo-33395692.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
];

const GRADIENT_COVERS = [
  {
    name: "Ocean Depth",
    value: "linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 58, 138) 50%, rgb(14, 116, 144) 100%)",
  },
  {
    name: "Emerald Glade",
    value: "linear-gradient(135deg, rgb(6, 78, 59) 0%, rgb(16, 185, 129) 50%, rgb(52, 211, 153) 100%)",
  },
  {
    name: "Nordic Dusk",
    value: "linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(51, 65, 85) 50%, rgb(71, 85, 105) 100%)",
  },
  {
    name: "Desert Dawn",
    value: "linear-gradient(135deg, rgb(180, 83, 9) 0%, rgb(217, 119, 6) 50%, rgb(251, 191, 36) 100%)",
  },
  {
    name: "Alpine Mist",
    value: "linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 50%, rgb(147, 197, 253) 100%)",
  },
  {
    name: "Terracotta Earth",
    value: "linear-gradient(135deg, rgb(159, 18, 57) 0%, rgb(190, 24, 93) 50%, rgb(225, 29, 72) 100%)",
  },
  {
    name: "Charcoal & Steel",
    value: "linear-gradient(135deg, rgb(24, 24, 27) 0%, rgb(39, 39, 42) 50%, rgb(63, 63, 70) 100%)",
  },
  {
    name: "Warm Amber",
    value: "linear-gradient(135deg, rgb(120, 53, 15) 0%, rgb(180, 83, 9) 50%, rgb(245, 158, 11) 100%)",
  },
];

const SOLID_COVERS = [
  { name: "Slate", value: "rgb(71, 85, 105)" },
  { name: "Zinc", value: "rgb(63, 63, 70)" },
  { name: "Cobalt", value: "rgb(30, 58, 138)" },
  { name: "Teal", value: "rgb(13, 148, 136)" },
  { name: "Emerald", value: "rgb(16, 185, 129)" },
  { name: "Amber", value: "rgb(217, 119, 6)" },
  { name: "Terracotta", value: "rgb(190, 24, 93)" },
  { name: "Indigo", value: "rgb(79, 70, 229)" },
];

interface CoverPickerProps {
  currentCover?: string | null;
  onSelect: (cover: string | null) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  align?: "start" | "center" | "end";
}

export function CoverPicker({
  currentCover,
  onSelect,
  children,
  disabled,
  align = "start",
}: CoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "curated" | "gradients" | "solids">("upload");
  const [customUrl, setCustomUrl] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cleanCurrentCover = parseCover(currentCover).url;

  // Process a selected or dropped file
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be under 5MB");
      return;
    }

    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onSelect(result);
        toast.success("Cover image updated");
        setOpen(false);
      }
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Please enter a valid web URL starting with https://");
      return;
    }
    onSelect(trimmed);
    setCustomUrl("");
    toast.success("Cover image set from URL");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children ? (
          children
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-subtle/80 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-all border border-border/80 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{currentCover ? "Change Cover" : "Add Cover"}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] p-3.5 sm:p-4 rounded-2xl shadow-xl border border-border bg-card/95 backdrop-blur-md z-50"
      >
        <div className="flex flex-col gap-3">
          {/* Header & Tabs */}
          <SegmentedTabs<"upload" | "curated" | "gradients" | "solids">
            value={tab}
            onChange={setTab}
            size="sm"
            fullWidth
            tabs={[
              {
                id: "upload",
                label: "Upload",
                icon: <UploadCloud className="w-3.5 h-3.5" />,
              },
              {
                id: "curated",
                label: "Gallery",
                icon: <Images className="w-3.5 h-3.5" />,
              },
              {
                id: "gradients",
                label: "Gradients",
                icon: <Layers className="w-3.5 h-3.5" />,
              },
              {
                id: "solids",
                label: "Colors",
                icon: <Palette className="w-3.5 h-3.5" />,
              },
            ]}
          />

          {/* 1. Upload & Link Tab */}
          {tab === "upload" && (
            <div className="flex flex-col gap-3 py-1">
              {/* File upload drag drop zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isDragging
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[0.99]"
                    : "border-border/80 hover:border-primary/60 bg-surface-subtle/40 hover:bg-surface-elevated",
                  isProcessingFile && "opacity-60 pointer-events-none"
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload custom image by clicking or dragging and dropping"
              >
                {isProcessingFile ? (
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    Click or drag image to upload
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Supports PNG, JPG, WebP, GIF (Max 5MB)
                  </span>
                </div>
              </div>

              {/* URL input */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label htmlFor="cover-url-input" className="text-[11px] font-semibold text-muted-foreground">
                  Or paste an image web link:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="cover-url-input"
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
                      placeholder="https://images.unsplash.com/..."
                      aria-label="Custom image URL"
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface-subtle focus:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    disabled={!customUrl.trim()}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Curated Wallpapers Tab */}
          {tab === "curated" && (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {CURATED_WALLPAPERS.map((item) => {
                const isSelected = cleanCurrentCover === item.url;
                return (
                  <button
                    key={item.name}
                    type="button"
                    aria-label={`Select wallpaper: ${item.name}`}
                    onClick={() => {
                      onSelect(item.url);
                      setOpen(false);
                    }}
                    className={cn(
                      "group relative h-16 rounded-xl overflow-hidden border transition-all cursor-pointer text-left p-2 flex flex-col justify-end shadow-2xs bg-cover bg-center bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border/60 hover:scale-[1.02]"
                    )}
                    style={{ backgroundImage: `url(${item.url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-md truncate">
                      {item.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Gradients Tab */}
          {tab === "gradients" && (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {GRADIENT_COVERS.map((g) => {
                const isSelected = currentCover === g.value;
                return (
                  <button
                    key={g.name}
                    type="button"
                    aria-label={`Select gradient: ${g.name}`}
                    onClick={() => {
                      onSelect(g.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "group relative h-14 rounded-xl overflow-hidden border transition-all cursor-pointer text-left p-2 flex flex-col justify-end shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border/60 hover:scale-[1.02]"
                    )}
                    style={{ background: g.value }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                      {g.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 4. Solid Colors Tab */}
          {tab === "solids" && (
            <div className="grid grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {SOLID_COVERS.map((s) => {
                const isSelected = currentCover === s.value;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      onSelect(s.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-border/60 hover:scale-105"
                    )}
                    style={{ backgroundColor: s.value }}
                    title={s.name}
                    aria-label={`Select color: ${s.name}`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Action when cover exists */}
          {currentCover && (
            <div className="pt-2 border-t border-border/70 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Active cover image set</span>
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1"
                title="Remove Cover"
                aria-label="Remove active cover image"
              >
                <X className="w-3.5 h-3.5" /> Remove cover
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
