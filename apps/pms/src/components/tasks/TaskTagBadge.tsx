"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Tag as TagIcon, X } from "lucide-react";

export const TAG_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: {
    bg: "bg-notion-blue-fg/10",
    text: "text-notion-blue-fg",
    border: "border-notion-blue-fg/20",
    dot: "bg-notion-blue-fg",
  },
  emerald: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    dot: "bg-success",
  },
  purple: {
    bg: "bg-notion-purple-fg/10",
    text: "text-notion-purple-fg",
    border: "border-notion-purple-fg/20",
    dot: "bg-notion-purple-fg",
  },
  amber: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    dot: "bg-warning",
  },
  rose: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    dot: "bg-destructive",
  },
  cyan: {
    bg: "bg-notion-blue-fg/10",
    text: "text-notion-blue-fg",
    border: "border-notion-blue-fg/20",
    dot: "bg-notion-blue-fg",
  },
  orange: {
    bg: "bg-notion-orange-fg/10",
    text: "text-notion-orange-fg",
    border: "border-notion-orange-fg/20",
    dot: "bg-notion-orange-fg",
  },
  indigo: {
    bg: "bg-notion-purple-fg/10",
    text: "text-notion-purple-fg",
    border: "border-notion-purple-fg/20",
    dot: "bg-notion-purple-fg",
  },
};

export function getTagColorConfig(colorName?: string | null) {
  if (colorName && TAG_COLORS[colorName.toLowerCase()]) {
    return TAG_COLORS[colorName.toLowerCase()];
  }
  // Default blue
  return TAG_COLORS.blue;
}

export interface TaskTagBadgeProps {
  name: string;
  color?: string | null;
  size?: "xs" | "sm" | "md";
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function TaskTagBadge({
  name,
  color,
  size = "sm",
  onRemove,
  onClick,
  className,
  showIcon = false,
}: TaskTagBadgeProps) {
  const colorCfg = getTagColorConfig(color);

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.25 gap-1 rounded-md",
    sm: "text-xs px-2 py-0.5 gap-1.2 rounded-md font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 rounded-lg font-medium",
  }[size];

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center select-none border transition-colors shrink-0",
        colorCfg.bg,
        colorCfg.text,
        colorCfg.border,
        sizeClasses,
        onClick && "cursor-pointer hover:brightness-110",
        className
      )}
      title={name}
    >
      {showIcon ? (
        <TagIcon className={cn("shrink-0", size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colorCfg.dot)} />
      )}
      <span className="truncate max-w-[140px]">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors cursor-pointer text-current"
          title={`Remove tag ${name}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}
