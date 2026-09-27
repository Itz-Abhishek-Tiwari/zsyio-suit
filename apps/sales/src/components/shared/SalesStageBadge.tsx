"use client";

import { cn } from "@/lib/utils";
import type { SalesStage, SalesPriority } from "@zsyio/types";
import { SALES_STAGE_LABELS, SALES_STAGE_COLORS, SALES_PRIORITY_LABELS } from "@zsyio/types";

interface SalesStageBadgeProps {
  stage: SalesStage;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SalesStageBadge({ stage, size = "sm", className }: SalesStageBadgeProps) {
  const color = SALES_STAGE_COLORS[stage];
  const label = SALES_STAGE_LABELS[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface SalesPriorityBadgeProps {
  priority: SalesPriority;
  size?: "xs" | "sm";
  className?: string;
}

const PRIORITY_COLORS: Record<SalesPriority, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  CRITICAL: "#ef4444",
};

export function SalesPriorityBadge({ priority, size = "xs", className }: SalesPriorityBadgeProps) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      {SALES_PRIORITY_LABELS[priority]}
    </span>
  );
}
