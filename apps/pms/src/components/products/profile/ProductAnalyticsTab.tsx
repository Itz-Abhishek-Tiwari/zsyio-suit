"use client";

import {
  TaskDistributionChart,
  type MetricDistributionItem,
} from "@/components/dashboard/TaskDistributionChart";
import { motion } from "framer-motion";
import { Activity, Users } from "lucide-react";

export interface StageMetric {
  label: string;
  count: number;
  color: string;
  hexColor: string;
  text: string;
}

export interface DeveloperWorkloadEntry {
  name: string;
  email: string;
  total: number;
  active: number;
  done: number;
}

export interface ProductAnalyticsTabProps {
  totalCount: number;
  doneCount: number;
  stages: StageMetric[];
  statusMetricItems: MetricDistributionItem[];
  priorityMetricItems: MetricDistributionItem[];
  typeMetricItems: MetricDistributionItem[];
  developerWorkloadData: DeveloperWorkloadEntry[];
}

export function ProductAnalyticsTab({
  totalCount,
  doneCount,
  stages,
  statusMetricItems,
  priorityMetricItems,
  typeMetricItems,
  developerWorkloadData,
}: ProductAnalyticsTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Delivery Pipeline & Stages</h3>
              <p className="text-xs text-muted-foreground">
                Workflow progression across all {totalCount} tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Completion Rate:</span>
            <span className="font-semibold text-foreground font-mono text-sm">
              {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-surface-subtle overflow-hidden flex p-0.5 border border-border/60">
          {stages.map((stg) => {
            const pct = totalCount > 0 ? (stg.count / totalCount) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={stg.label}
                style={{ width: `${pct}%`, backgroundColor: stg.hexColor }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-150"
                title={`${stg.label}: ${stg.count} tasks (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {stages.map((stg) => {
            const pct = totalCount > 0 ? Math.round((stg.count / totalCount) * 100) : 0;
            return (
              <div
                key={stg.label}
                className="flex flex-col p-3 rounded-lg bg-surface-subtle/50 border border-border/60 gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stg.hexColor }}
                  />
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    {stg.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-base font-semibold font-mono ${stg.text}`}>
                    {stg.count}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TaskDistributionChart
          title="Distribution Donut"
          description="Interactive spread across status, priority, or type dimensions."
          statusItems={statusMetricItems}
          priorityItems={priorityMetricItems}
          typeItems={typeMetricItems}
          totalTasks={totalCount}
          defaultDimension="status"
        />

        <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Developer Workload</h3>
                <p className="text-xs text-muted-foreground">
                  Task assignments and completion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-warning">
                <span className="w-2 h-2 rounded bg-warning" />
                Active
              </span>
              <span className="flex items-center gap-1 text-success">
                <span className="w-2 h-2 rounded bg-success" />
                Done
              </span>
            </div>
          </div>

          {developerWorkloadData.length === 0 ? (
            <div className="text-xs text-muted-foreground italic text-center py-12">
              No assigned developer workload data for this product.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-surface-subtle/60 border border-border/60 text-center">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground">Team Active</span>
                  <span className="text-base font-semibold font-mono text-warning">
                    {developerWorkloadData.reduce((acc, d) => acc + d.active, 0)}
                  </span>
                </div>
                <div className="flex flex-col border-x border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground">Team Done</span>
                  <span className="text-base font-semibold font-mono text-success">
                    {developerWorkloadData.reduce((acc, d) => acc + d.done, 0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground">Avg Completion</span>
                  <span className="text-base font-semibold font-mono text-foreground">
                    {(() => {
                      const total = developerWorkloadData.reduce((acc, d) => acc + d.total, 0);
                      const done = developerWorkloadData.reduce((acc, d) => acc + d.done, 0);
                      return total > 0 ? Math.round((done / total) * 100) : 0;
                    })()}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {developerWorkloadData.map((dev) => {
                  const devPct = dev.total > 0 ? Math.round((dev.done / dev.total) * 100) : 0;
                  const activePct = dev.total > 0 ? Math.round((dev.active / dev.total) * 100) : 0;
                  return (
                    <div
                      key={dev.email}
                      className="flex flex-col gap-2 p-3 rounded-lg bg-surface-subtle/40 border border-border/60 text-xs hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-primary-light text-primary border border-primary/20 flex items-center justify-center font-semibold text-xs shrink-0">
                            {dev.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">{dev.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{dev.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="text-warning font-semibold">{dev.active} active</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-success font-semibold">{dev.done} done</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                            {dev.total} total
                          </span>
                        </div>
                      </div>

                      {/* Stacked Spring Progress Bar */}
                      <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden flex">
                        <motion.div
                          className="bg-success h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${devPct}%` }}
                          transition={{ type: "spring", stiffness: 90, damping: 15 }}
                          title={`Completed: ${dev.done} (${devPct}%)`}
                        />
                        <motion.div
                          className="bg-warning h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${activePct}%` }}
                          transition={{ type: "spring", stiffness: 90, damping: 15 }}
                          title={`Active: ${dev.active} (${activePct}%)`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
