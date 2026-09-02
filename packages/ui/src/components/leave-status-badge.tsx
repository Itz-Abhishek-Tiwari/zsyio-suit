"use client";

import React from "react";
import { cn } from "../lib/utils";

export type LeaveBadgeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveStatusBadgeProps {
  status: LeaveBadgeStatus | string;
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
    pulse?: boolean;
  }
> = {
  PENDING: {
    label: "Pending Approval",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
    pulse: true,
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    dotClass: "bg-emerald-500",
    pulse: false,
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
    pulse: false,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground/60",
    pulse: false,
  },
};

const SIZE_STYLES = {
  xs: "text-[10px] px-2 py-0.5 gap-1.5 font-semibold",
  sm: "text-xs px-2.5 py-0.5 gap-1.5 font-medium",
  md: "text-xs px-3 py-1 gap-2 font-semibold",
};

export function LeaveStatusBadge({
  status,
  size = "sm",
  className,
  customLabel,
}: LeaveStatusBadgeProps) {
  const config = BADGE_CONFIG[status] || {
    label: status,
    badgeClass: "bg-muted text-muted-foreground border-border",
  };

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs select-none tracking-tight",
        config.badgeClass,
        sizeStyle,
        className
      )}
    >
      {config.dotClass && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dotClass,
            config.pulse && "animate-pulse"
          )}
        />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
}
