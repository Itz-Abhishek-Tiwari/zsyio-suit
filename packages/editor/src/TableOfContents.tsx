"use client";

import React, { useMemo, useEffect, useState } from "react";
import { cn } from "@zsyio/ui";
import { ListTree, Hash, ChevronRight } from "lucide-react";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  content: string;
  className?: string;
  onSelectHeading?: (headingId: string) => void;
}

/**
 * Extracts markdown headings (# H1, ## H2, ### H3) from raw content
 */
export function extractHeadings(markdown: string): HeadingItem[] {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const headings: HeadingItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2]
        .replace(/[*_~`[\]]/g, "")
        .replace(/\(http[^)]+\)/g, "")
        .trim();

      if (rawText) {
        const slug = rawText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        headings.push({
          id: slug,
          text: rawText,
          level,
        });
      }
    }
  }

  return headings;
}

export function TableOfContents({
  content,
  className,
  onSelectHeading,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  const headings = useMemo(() => extractHeadings(content), [content]);

  useEffect(() => {
    if (headings.length > 0 && !activeId) {
      setActiveId(headings[0].id);
    }
  }, [headings, activeId]);

  if (headings.length === 0) {
    return (
      <div className={cn("p-4 text-xs text-muted-foreground italic select-none", className)}>
        No headings found in this document. Add # Heading 1 or ## Heading 2 to generate an outline.
      </div>
    );
  }

  const handleClick = (item: HeadingItem) => {
    setActiveId(item.id);
    onSelectHeading?.(item.id);

    // Look for element on page
    const el = document.getElementById(item.id) ||
      Array.from(document.querySelectorAll("h1, h2, h3")).find(
        (h) => h.textContent?.trim().toLowerCase() === item.text.toLowerCase()
      );

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className={cn(
        "flex flex-col gap-1 p-2 select-none overflow-y-auto custom-scrollbar",
        className
      )}
      aria-label="Table of Contents"
    >
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
        <ListTree className="w-3.5 h-3.5 text-primary" />
        <span>Outline ({headings.length})</span>
      </div>

      <div className="flex flex-col gap-0.5 mt-1">
        {headings.map((item, idx) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => handleClick(item)}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              className={cn(
                "group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs transition-all text-left cursor-pointer",
                isActive
                  ? "bg-primary-light text-primary font-bold shadow-2xs border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Hash className={cn(
                  "w-3 h-3 shrink-0 opacity-60",
                  item.level === 1 && "text-primary",
                  item.level === 2 && "text-purple-500",
                  item.level === 3 && "text-amber-500"
                )} />
                <span className="truncate">{item.text}</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
