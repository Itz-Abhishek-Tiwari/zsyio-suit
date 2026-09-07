"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@zsyio/ui";
import {
  ExternalLink,
  FileText,
  Folder,
  Lock,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { NoteIcon } from "./NoteIcon";
import { getCleanExcerpt, formatTimeAgo } from "./note-url-utils";

export interface NotePreviewData {
  id: string;
  title: string;
  content: string;
  icon?: string | null;
  folder?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  author?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  updatedAt?: string;
  createdAt?: string;
  generalAccess?: string;
}

// Global in-memory cache to prevent duplicate fetches across tickets and re-renders
const noteCache = new Map<string, NotePreviewData>();

export interface NoteCardPreviewProps {
  noteId: string;
  rawUrl?: string;
  customLabel?: React.ReactNode;
  className?: string;
}

export function NoteCardPreview({
  noteId,
  rawUrl,
  customLabel,
  className,
}: NoteCardPreviewProps) {
  const [data, setData] = useState<NotePreviewData | null>(() => noteCache.get(noteId) || null);
  const [status, setStatus] = useState<"loading" | "success" | "forbidden" | "not_found" | "error">(
    () => (noteCache.has(noteId) ? "success" : "loading")
  );

  useEffect(() => {
    if (!noteId) return;

    if (noteCache.has(noteId)) {
      setData(noteCache.get(noteId)!);
      setStatus("success");
      return;
    }

    let isMounted = true;
    setStatus("loading");

    fetch(`/api/notes/${encodeURIComponent(noteId)}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!isMounted) return;
        if (res.ok) {
          const json = await res.json();
          noteCache.set(noteId, json);
          setData(json);
          setStatus("success");
        } else if (res.status === 403) {
          setStatus("forbidden");
        } else if (res.status === 404) {
          setStatus("not_found");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [noteId]);

  // Destination URL: prefer provided rawUrl, fallback to relative notes route
  const targetHref = rawUrl || `/notes?id=${noteId}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the user clicked a specific inner link or button, let that handle it
    const target = e.target as HTMLElement;
    if (target.closest("a") && target.closest("a") !== e.currentTarget) return;

    e.preventDefault();
    window.open(targetHref, "_blank", "noopener,noreferrer");
  };

  // 1. Loading Skeleton State
  if (status === "loading") {
    return (
      <div
        className={cn(
          "my-3 not-prose flex flex-col gap-3 w-full max-w-md rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-4.5 backdrop-blur-xs animate-pulse select-none",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted/70 shrink-0" />
            <div className="h-4 w-16 bg-muted/60 rounded-full" />
            <div className="h-4 w-20 bg-muted/50 rounded-md" />
          </div>
          <div className="w-4 h-4 rounded bg-muted/40" />
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-4 w-3/4 bg-muted/80 rounded-md" />
          <div className="h-3.5 w-1/2 bg-muted/60 rounded-md" />
        </div>
        <div className="h-16 rounded-xl bg-muted/40 border border-border/40" />
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-muted/70" />
            <div className="h-3 w-16 bg-muted/60 rounded" />
            <div className="h-3 w-12 bg-muted/40 rounded" />
          </div>
          <div className="h-3 w-14 bg-muted/40 rounded" />
        </div>
      </div>
    );
  }

  // 2. Forbidden / Access Restricted State
  if (status === "forbidden") {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          "my-3 not-prose flex flex-col gap-3 w-full max-w-md group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card via-amber-500/5 to-amber-500/10 p-4 sm:p-4.5 text-left transition-all duration-200 hover:border-amber-500/50 cursor-pointer select-none",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Restricted
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-amber-500 shrink-0 transition-colors" />
        </div>

        <h4 className="font-bold text-sm text-foreground tracking-tight">
          Private Zsyio Document
        </h4>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-normal">
          You do not currently have permission to view this document.
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[10px] text-muted-foreground">
          <span className="text-amber-600/80 font-medium">Restricted Access</span>
          <span className="text-amber-600 font-semibold group-hover:underline">Open in Notes ↗</span>
        </div>
      </div>
    );
  }

  // 3. Not Found or Error Fallback State
  if (status === "not_found" || status === "error" || !data) {
    const isCustomText =
      customLabel &&
      typeof customLabel === "string" &&
      !customLabel.startsWith("http") &&
      !customLabel.startsWith("/");

    return (
      <div
        onClick={handleCardClick}
        className={cn(
          "my-3 not-prose flex flex-col gap-3 w-full max-w-md group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-surface-subtle/50 p-4 sm:p-4.5 text-left transition-all duration-200 hover:border-primary/40 cursor-pointer select-none",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
              {status === "not_found" ? "Not found" : "Unavailable"}
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary shrink-0 transition-colors" />
        </div>

        <h4 className="font-bold text-sm text-foreground tracking-tight">
          {isCustomText ? customLabel : "Zsyio Document Link"}
        </h4>

        <div className="rounded-xl bg-surface-subtle/70 dark:bg-muted/20 border border-border/50 p-3 text-[11px] font-mono text-muted-foreground/80 break-all leading-relaxed">
          {rawUrl || `/notes?id=${noteId}`}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
          <span>Zsyio Canvas</span>
          <span className="text-primary font-semibold group-hover:underline">Open Link ↗</span>
        </div>
      </div>
    );
  }

  // 4. Rich Success State: True Vertical Document Card View
  const excerpt = getCleanExcerpt(data.content, 140);
  const timeAgo = formatTimeAgo(data.updatedAt || data.createdAt);
  const authorInitials = data.author?.name
    ? data.author.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "U";

  return (
    <div
      onClick={handleCardClick}
      title="Click to open note in new tab"
      className={cn(
        "my-3 not-prose flex flex-col gap-3 w-full max-w-md group relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-surface-subtle/50 p-4 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-primary/40 dark:hover:border-primary/50 transition-all duration-200 text-left select-none cursor-pointer",
        "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary/30 before:via-primary before:to-primary/30 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:rounded-t-2xl",
        className
      )}
    >
      {/* Top Header Row: Icon, App Badge, Folder Pill & External Link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary/15 transition-all duration-200 shrink-0 shadow-2xs">
            <NoteIcon icon={data.icon} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              Notes
            </span>

            {data.folder && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/60 shrink-0 max-w-[130px] truncate">
                <Folder className="w-2.5 h-2.5 text-primary/70 shrink-0" />
                <span className="truncate">{data.folder.name}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0">
          <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
            Open
          </span>
          <span className="p-1 rounded-md group-hover:bg-primary/10 transition-colors">
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </span>
        </div>
      </div>

      {/* Card Title (Prominent, multi-line, uncluttered) */}
      <div>
        <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug tracking-tight line-clamp-2">
          {data.title || "Untitled Document"}
        </h4>
      </div>

      {/* Embedded Document Preview Sheet */}
      <div className="rounded-xl bg-surface-subtle/70 dark:bg-muted/25 border border-border/50 p-3 text-xs text-muted-foreground/90 leading-relaxed line-clamp-3 font-normal">
        {excerpt ? (
          <span>{excerpt}</span>
        ) : (
          <span className="italic text-muted-foreground/50">Empty document content</span>
        )}
      </div>

      {/* Card Footer: Author Avatar, Timestamp, and Action Prompt */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2 truncate min-w-0">
          {data.author?.name && (
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-4.5 h-4.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-[8px] font-bold flex items-center justify-center shrink-0">
                {authorInitials}
              </div>
              <span className="font-semibold text-foreground/80 truncate text-[11px]">
                {data.author.name}
              </span>
            </div>
          )}
          {data.author?.name && timeAgo && <span className="text-muted-foreground/40">•</span>}
          {timeAgo && (
            <span className="inline-flex items-center gap-1 text-muted-foreground/70 shrink-0 text-[10px]">
              <Clock className="w-2.5 h-2.5 opacity-70" />
              {timeAgo}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-primary font-semibold text-[10px] shrink-0">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">View Document</span>
          <span className="text-xs leading-none group-hover:translate-x-0.5 transition-transform">↗</span>
        </div>
      </div>
    </div>
  );
}
