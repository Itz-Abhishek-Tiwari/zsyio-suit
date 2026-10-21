import React from "react";
import { Skeleton } from "../skeleton";
import { cn } from "../../lib/utils";

export interface KanbanBoardSkeletonProps {
  columnsCount?: number;
  cardsPerColumn?: number;
  className?: string;
}

export function KanbanBoardSkeleton({
  columnsCount = 5,
  cardsPerColumn = 3,
  className,
}: KanbanBoardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-6 pt-1 items-start w-full animate-fade-in scrollbar-thin",
        className
      )}
    >
      {Array.from({ length: columnsCount }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="flex w-[280px] sm:w-[300px] shrink-0 flex-col gap-3 rounded-lg border border-border/80 bg-surface-subtle/40 p-3.5 min-h-[520px]"
        >
          {/* Column Header Skeleton */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>

          {/* Cards Skeletons */}
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: colIdx % 2 === 0 ? cardsPerColumn : Math.max(1, cardsPerColumn - 1) }).map(
              (_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-lg border border-border/70 bg-card p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-3.5 w-4/5 rounded-md" />
                  </div>

                  <Skeleton className="h-4 w-24 rounded-md" />

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
