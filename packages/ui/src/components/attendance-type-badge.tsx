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
    badgeClass: "bg-success/10 text-success border-success/25",
    dotClass: "bg-success",
  },
  HALF_DAY: {
    label: "Half Day",
    badgeClass: "bg-warning/10 text-warning border-warning/25",
    dotClass: "bg-warning",
  },
  ABSENT: {
    label: "Absent",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/25",
    dotClass: "bg-destructive",
  },
  ON_LEAVE: {
    label: "On Leave",
    badgeClass: "bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/25",
    dotClass: "bg-notion-purple-fg",
  },
  WEEKEND: {
    label: "Weekend Off",
    badgeClass: "bg-surface-subtle text-muted-foreground border-border/70",
    dotClass: "bg-muted-foreground/50",
  },
  HOLIDAY: {
    label: "Holiday",
    badgeClass: "bg-notion-blue-fg/10 text-notion-blue-fg border-notion-blue-fg/25",
    dotClass: "bg-notion-blue-fg",
  },
};

const SIZE_STYLES = {
  xs: "text-xs px-2 py-0.5 gap-1.5 font-semibold",
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
