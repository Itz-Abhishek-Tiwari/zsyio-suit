"use client";

import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTimeBadgeProps {
  actualHours?: number | null;
  estimatedHours?: number | null;
  compact?: boolean;
  className?: string;
}

export function TaskTimeBadge({
  actualHours,
  estimatedHours,
  compact = false,
  className,
}: TaskTimeBadgeProps) {
  const actual = Number((actualHours ?? 0).toFixed(1));
  const estimated = estimatedHours ? Number(estimatedHours.toFixed(1)) : 0;

  if (actual === 0 && estimated === 0) {
    return null;
  }

  const ratio = estimated > 0 ? (actual / estimated) * 100 : 0;
  const isOver = estimated > 0 && actual > estimated;
  const isClose = estimated > 0 && ratio >= 80 && !isOver;

  const colorStyles = isOver
    ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15"
    : isClose
    ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/15"
    : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15";

  const dotColor = isOver
    ? "bg-destructive"
    : isClose
    ? "bg-warning"
    : "bg-success";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-semibold rounded-md border transition-all select-none shadow-2xs",
        compact ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        colorStyles,
        className
      )}
      title={
        estimated > 0
          ? `Time tracked: ${actual}h of ${estimated}h budget (${Math.round(ratio)}%)${
              isOver ? ` - Overrun by ${(actual - estimated).toFixed(1)}h` : ""
            }`
          : `Time tracked: ${actual}h (No budget estimate set)`
      }
    >
      {/* Status dot or warning icon */}
      {isOver ? (
        <AlertTriangle className={compact ? "w-2.5 h-2.5 shrink-0 text-destructive" : "w-3 h-3 shrink-0 text-destructive"} />
      ) : (
        <span className={cn("rounded-full shrink-0", compact ? "w-1.5 h-1.5" : "w-2 h-2", dotColor)} />
      )}

      <Clock className={compact ? "w-2.5 h-2.5 shrink-0 opacity-70" : "w-3 h-3 shrink-0 opacity-70"} />

      <span className="tracking-tight">
        <span>{actual}h</span>
        {estimated > 0 && (
          <span className="opacity-50 font-normal">/{estimated}h</span>
        )}
      </span>
    </div>
  );
}
