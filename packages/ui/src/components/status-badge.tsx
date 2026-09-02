"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type StatusVariant =
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "purple"
  | "indigo"
  | "slate"
  | "cyan";

export interface StatusBadgeProps {
  label: React.ReactNode;
  variant?: StatusVariant;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const VARIANT_STYLES: Record<
  StatusVariant,
  { badge: string; dot: string }
> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    dot: "bg-blue-500",
  },
  purple: {
    badge: "bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    dot: "bg-purple-500",
  },
  indigo: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    dot: "bg-slate-400",
  },
  cyan: {
    badge: "bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
    dot: "bg-sky-500",
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1 font-semibold",
  sm: "text-xs px-2 py-0.5 gap-1.5 font-medium",
  md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
};

export function StatusBadge({
  label,
  variant = "slate",
  dot = false,
  pulse = false,
  icon,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.slate;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border tracking-tight shrink-0 select-none",
        styles.badge,
        sizeStyle,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            styles.dot,
            pulse && "animate-pulse"
          )}
        />
      )}
      {icon}
      <span>{label}</span>
    </span>
  );
}
