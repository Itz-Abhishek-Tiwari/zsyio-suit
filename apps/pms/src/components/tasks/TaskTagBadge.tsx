"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Tag as TagIcon, X } from "lucide-react";

export const TAG_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20 dark:border-blue-500/30",
    dot: "bg-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/20 dark:border-purple-500/30",
    dot: "bg-purple-500",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/20 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  cyan: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/20 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/15",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/20 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
  indigo: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/20 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
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
    xs: "text-[9px] px-1.5 py-0.25 gap-1 rounded-md",
    sm: "text-[10px] px-2 py-0.5 gap-1.2 rounded-md font-medium",
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
