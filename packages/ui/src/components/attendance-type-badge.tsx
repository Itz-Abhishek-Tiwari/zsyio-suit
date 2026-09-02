"use client";

import React from "react";
import { cn } from "../lib/utils";

export type AttendanceDayType =
  | "PRESENT"
  | "HALF_DAY"
  | "ABSENT"
  | "ON_LEAVE"
  | "WEEKEND"
  | "HOLIDAY";

export interface AttendanceTypeBadgeProps {
  type: AttendanceDayType | string;
  size?: "xs" | "sm" | "md";
  className?: string;
  customLabel?: string;
}

const BADGE_CONFIG: Record<
  string,
  {
    label: string;
    badgeClass: string;
    dotClass?: string;
  }
> = {
  PRESENT: {
    label: "Present",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotClass: "bg-emerald-500",
  },
  HALF_DAY: {
    label: "Half Day",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
  },
  ABSENT: {
    label: "Absent",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
  ON_LEAVE: {
    label: "On Leave",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    dotClass: "bg-purple-500",
  },
  WEEKEND: {
    label: "Weekend Off",
    badgeClass: "bg-surface-subtle text-muted-foreground border-border/70",
    dotClass: "bg-muted-foreground/50",
  },
  HOLIDAY: {
    label: "Holiday",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    dotClass: "bg-sky-500",
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-2 py-0.5 gap-1.5 font-semibold",
  sm: "text-xs px-2.5 py-0.5 gap-1.5 font-medium",
  md: "text-xs px-3 py-1 gap-2 font-semibold",
};

export function AttendanceTypeBadge({
  type,
  size = "sm",
  className,
  customLabel,
}: AttendanceTypeBadgeProps) {
  const config = BADGE_CONFIG[type] || {
    label: type,
    badgeClass: "bg-muted text-muted-foreground border-border",
  };

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs select-none tracking-tight font-medium",
        config.badgeClass,
        sizeStyle,
        className
      )}
    >
      {config.dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)} />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
}
