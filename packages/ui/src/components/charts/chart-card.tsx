"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface ChartCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  icon,
  headerAction,
  children,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-none transition-colors",
        "suite-chart",

        className
      )}
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex flex-1 basis-56 min-w-0 items-start gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-md bg-surface-subtle text-primary border border-border/70 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-base font-medium font-display text-foreground tracking-tight leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {headerAction && (
          <div className="flex flex-wrap items-center gap-2 max-w-full">{headerAction}</div>
        )}
      </div>

      <div className={cn("relative z-10 w-full", contentClassName)}>{children}</div>
    </div>
  );
}
