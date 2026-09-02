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
        "relative overflow-hidden rounded-lg border border-border/80 bg-card/95 dark:bg-card/85 backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs transition-all",
        "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-primary/70 before:via-primary/30 before:to-transparent before:z-10",
        "dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(var(--primary-rgb),0.035),transparent_70%)] pointer-events-none z-0" />

      {/* Subtle micro-dot technical pattern on top right */}
      <div className="absolute right-0 top-0 w-64 h-32 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none [mask-image:linear-gradient(to_left,white,transparent)] z-0" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-md bg-surface-subtle text-primary border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-extrabold font-display text-foreground tracking-tight leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {headerAction && (
          <div className="self-start sm:self-auto shrink-0">{headerAction}</div>
        )}
      </div>

      <div className={cn("relative z-10 w-full", contentClassName)}>{children}</div>
    </div>
  );
}
