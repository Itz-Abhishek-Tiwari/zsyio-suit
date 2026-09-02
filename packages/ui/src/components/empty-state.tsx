"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../lib/utils";

export interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

const SIZE_STYLES = {
  sm: "py-10 gap-2.5",
  md: "py-16 gap-3",
  lg: "py-24 gap-4",
};

const ICON_SIZE_STYLES = {
  sm: "w-10 h-10 [&_svg]:w-5 [&_svg]:h-5",
  md: "w-12 h-12 [&_svg]:w-6 [&_svg]:h-6",
  lg: "w-14 h-14 [&_svg]:w-7 [&_svg]:h-7",
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
}: EmptyStateProps) {
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  const iconSizeClass = ICON_SIZE_STYLES[size] || ICON_SIZE_STYLES.md;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-center bg-surface-elevated/70 px-4 shadow-2xs transition-all",
        sizeClass,
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center bg-primary-light text-primary border border-primary/20 shadow-2xs",
          iconSizeClass
        )}
      >
        {icon ?? <Inbox />}
      </div>

      <div className="max-w-md">
        <p className="font-bold text-sm text-foreground tracking-tight">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 mt-2 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
