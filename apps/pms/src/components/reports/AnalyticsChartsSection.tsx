"use client";

import React from "react";
import {
  ShieldAlert,
  Package,
  Target,
} from "lucide-react";
import { MetricBarChart } from "@zsyio/ui";

import {
  TaskDistributionChart,
  type StatusDistributionItem,
} from "@/components/dashboard/TaskDistributionChart";
import type { ProductBreakdownItem } from "@/store/api/reportsApi";
import { STATUS_COLORS, CHART_THEME } from "@/lib/chart-tokens";

interface AnalyticsChartsSectionProps {
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  productsBreakdown?: ProductBreakdownItem[];
  totalTasks: number;
}

import {
  TASK_TYPE_CONFIG as TYPE_CONFIG,
  PRIORITY_COLOR_MAP,
} from "./reports-chart-config";


export function AnalyticsChartsSection({
  byStatus,
  byPriority,
  byType,
  productsBreakdown = [],
  totalTasks,
}: AnalyticsChartsSectionProps) {
  // Format Status items for TaskDistributionChart
  const statusCountsMap: Record<string, number> = {};
  for (const s of byStatus) {
    statusCountsMap[s.status] = s.count;
  }

  const statusItems: StatusDistributionItem[] = [
    {
      status: "IN_PROGRESS",
      ...STATUS_COLORS.IN_PROGRESS,
      count: statusCountsMap["IN_PROGRESS"] ?? 0,
    },
    {
      status: "TODO",
      ...STATUS_COLORS.TODO,
      count: statusCountsMap["TODO"] ?? 0,
    },
    {
      status: "IN_REVIEW",
      ...STATUS_COLORS.IN_REVIEW,
      count: statusCountsMap["IN_REVIEW"] ?? 0,
    },
    {
      status: "BLOCKED",
      ...STATUS_COLORS.BLOCKED,
      count: statusCountsMap["BLOCKED"] ?? 0,
    },
    {
      status: "DONE",
      ...STATUS_COLORS.DONE,
      count: statusCountsMap["DONE"] ?? 0,
    },
    {
      status: "BACKLOG",
      ...STATUS_COLORS.BACKLOG,
      count: statusCountsMap["BACKLOG"] ?? 0,
    },
  ];

  // Format Priority data for MetricBarChart
  const priorityItems = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((pr) => {
    const item = byPriority.find((p) => p.priority === pr);
    const cfg = PRIORITY_COLOR_MAP[pr] || { label: pr, color: CHART_THEME.fallbackColor };
    return {
      key: pr,
      label: cfg.label,
      value: item?.count ?? 0,
      color: cfg.color,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TaskDistributionChart
          title="Status Breakdown"
          description="Distribution of tasks across workflow statuses."
          items={statusItems}
          totalTasks={totalTasks}
        />

        <div className="flex flex-col gap-6">
          <MetricBarChart
            title="Priority Spread"
            description="Urgency distribution across active sprint tasks."
            icon={<ShieldAlert className="w-4 h-4 text-destructive" />}
            items={priorityItems}
          />

          <div className="rounded-md border border-border bg-card p-5 flex flex-col gap-3 shadow-none">

          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-semibold   text-muted-foreground">
              Task Category Breakdown
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {byType.map((t) => {
                const cfg = TYPE_CONFIG[t.type] ?? {
                  label: t.type,
                  icon: <Target className="w-3.5 h-3.5 text-muted-foreground" />,
                  barBg: "bg-muted-foreground",
                };
                const pct = totalTasks ? Math.round((t.count / totalTasks) * 100) : 0;
                return (
                  <div key={t.type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-semibold flex items-center gap-1.5">
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-sm overflow-hidden">
                      <div
                        className={`${cfg.barBg} h-full rounded-sm transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {productsBreakdown.length > 0 && (
        <div className="rounded-lg border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
            <span className="w-8 h-8 rounded-lg bg-success/10 text-success border border-success/20 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Product Performance Matrix</h2>
              <p className="text-xs text-muted-foreground">
                Delivery stats per product suite under this client account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsBreakdown.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-lg border border-border/70 bg-surface-subtle/50 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-xs text-foreground truncate">{p.name}</span>
                  {p.version && (
                    <span className="text-xs font-mono bg-surface-elevated px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground">
                      v{p.version}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="text-foreground font-semibold">{p.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-150"
                      style={{ width: `${p.completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-card p-1.5 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Total</span>
                    <span className="font-semibold">{p.totalTasks}</span>
                  </div>
                  <div className="bg-card p-1.5 rounded-lg border border-border/50">
                    <span className="text-xs text-success block">Done</span>
                    <span className="font-semibold text-success">{p.doneTasks}</span>
                  </div>
                  <div className="bg-card p-1.5 rounded-lg border border-border/50">
                    <span className="text-xs text-destructive block">Blocked</span>
                    <span className="font-semibold text-destructive">{p.blockedTasks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
