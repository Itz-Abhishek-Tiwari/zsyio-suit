"use client";

import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  max?: number;
  variant?: "primary" | "success" | "warning" | "destructive" | "info";
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  animated?: boolean;
}

const VARIANT_MAP: Record<NonNullable<ProgressProps["variant"]>, { fill: string }> = {
  primary: {
    fill: "bg-primary text-primary-foreground",
  },
  success: {
    fill: "bg-emerald-500 text-white",
  },
  warning: {
    fill: "bg-amber-500 text-white",
  },
  destructive: {
    fill: "bg-destructive text-white",
  },
  info: {
    fill: "bg-blue-500 text-white",
  },
};

const SIZE_MAP: Record<NonNullable<ProgressProps["size"]>, string> = {
  xs: "h-1.5",
  sm: "h-2.5",
  md: "h-3.5",
  lg: "h-5",
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      variant = "primary",
      size = "sm",
      showValue = false,
      animated = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    const { fill } = VARIANT_MAP[variant] ?? VARIANT_MAP.primary;
    const heightClass = SIZE_MAP[size] ?? SIZE_MAP.sm;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`} ref={ref} {...props}>
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={max}
          className={`relative w-full ${heightClass} overflow-hidden rounded-full bg-surface-subtle border border-border/40 p-0.5 shadow-inner`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${fill}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {showValue && (
          <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
            <span>{Math.round(percentage)}%</span>
            <span>
              {value} / {max}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export function TopProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] overflow-hidden pointer-events-none">
      <div className="absolute top-0 h-full rounded-full bg-primary animate-loading-bar" />
    </div>
  );
}
