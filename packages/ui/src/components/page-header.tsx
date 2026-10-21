import * as React from "react";
import { cn } from "../lib/utils";

export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  borderBottom?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  titleIcon,
  description,
  actions,
  stats,
  breadcrumbs,
  children,
  className,
  borderBottom = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        borderBottom ? "pb-5 border-b border-border" : "pb-1",
        className
      )}
    >
      {breadcrumbs && <div className="flex items-center gap-2">{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              {eyebrow}
            </div>
          )}

          <div className="flex items-center gap-3">
            {titleIcon && (
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                {titleIcon}
              </div>
            )}
            <h1 className="text-2xl font-semibold font-display tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          {description && (
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-0.5 max-w-2xl">
              {description}
            </div>
          )}
        </div>

        {(actions || stats) && (
          <div className="flex items-center gap-3 flex-wrap shrink-0 self-start sm:self-auto">
            {stats}
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
