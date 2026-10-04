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
    badge: "bg-notion-green text-notion-green-fg border border-notion-green/30",
    dot: "bg-notion-green-fg",
  },
  amber: {
    badge: "bg-notion-yellow text-notion-yellow-fg border border-notion-yellow/30",
    dot: "bg-notion-yellow-fg",
  },
  rose: {
    badge: "bg-notion-red text-notion-red-fg border border-notion-red/30",
    dot: "bg-notion-red-fg",
  },
  blue: {
    badge: "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
    dot: "bg-notion-blue-fg",
  },
  purple: {
    badge: "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
    dot: "bg-notion-purple-fg",
  },
  indigo: {
    badge: "bg-notion-purple text-notion-purple-fg border border-notion-purple/30",
    dot: "bg-notion-purple-fg",
  },
  slate: {
    badge: "bg-notion-gray text-notion-gray-fg border border-notion-gray/30",
    dot: "bg-notion-gray-fg",
  },
  cyan: {
    badge: "bg-notion-blue text-notion-blue-fg border border-notion-blue/30",
    dot: "bg-notion-blue-fg",
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-1.5 py-0.5 gap-1 font-medium rounded-[3px]",
  sm: "text-xs px-2 py-0.5 gap-1.5 font-normal rounded-[3px]",
  md: "text-xs px-2.5 py-1 gap-1.5 font-medium rounded-[4px]",
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
