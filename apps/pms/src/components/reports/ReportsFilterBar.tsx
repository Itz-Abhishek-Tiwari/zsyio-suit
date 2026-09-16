"use client";

import React from "react";
import { RefreshCw, BarChart2 } from "lucide-react";
import { Button } from "@zsyio/ui";

interface ReportsFilterBarProps {
  onRefresh: () => void;
  isFetching?: boolean;
}

export function ReportsFilterBar({
  onRefresh,
  isFetching,
}: ReportsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
          <BarChart2 className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Workspace Reports Scope</h2>
          <p className="text-[11px] text-muted-foreground">
            Overall aggregated delivery metrics across all workspace client accounts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          className="h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-xl border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>
    </div>
  );
}
