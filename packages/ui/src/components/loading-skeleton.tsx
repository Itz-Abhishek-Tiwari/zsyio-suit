"use client";

import * as React from "react";
import { Skeleton } from "./skeleton";
import { cn } from "../lib/utils";

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
  showHeader?: boolean;
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden divide-y divide-border/60",
        className
      )}
    >
      {showHeader && (
        <div className="bg-surface-subtle/60 px-5 py-3.5 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={`head-${i}`}
              className={cn("h-4 rounded-md", i === 0 ? "w-36" : "w-20")}
            />
          ))}
        </div>
      )}

      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`row-${r}`}
            className="px-5 py-4 flex items-center justify-between gap-4"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div key={`cell-${r}-${c}`} className={cn(c === 0 ? "flex-1 max-w-xs" : "")}>
                <Skeleton
                  className={cn(
                    "h-4 rounded-md",
                    c === 0 ? "w-3/4" : c === columns - 1 ? "w-8 rounded-lg" : "w-16"
                  )}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface CardGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const GRID_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: CardGridSkeletonProps) {
  const colClass = GRID_COLS[columns] || GRID_COLS[3];

  return (
    <div className={cn("grid gap-4", colClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skel-${i}`}
          className="rounded-lg border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-sm" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            <Skeleton className="h-3 w-full rounded-sm" />
            <Skeleton className="h-3 w-4/5 rounded-sm" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
