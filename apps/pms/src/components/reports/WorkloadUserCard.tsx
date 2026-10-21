"use client";

import React, { useCallback } from "react";
import { Card } from "@zsyio/ui";
import { Progress } from "@zsyio/ui";
import { CheckCircle2, Zap, Clock, ExternalLink } from "lucide-react";
import type { WorkloadUserEntry } from "@/store/api/reportsApi";
import { tasksApi } from "@/store/api/tasksApi";
import { UserRoleBadge } from "@zsyio/ui";

interface WorkloadUserCardProps {
  entry: WorkloadUserEntry;
  onInspect?: (entry: WorkloadUserEntry) => void;
}

export function WorkloadUserCard({ entry, onInspect }: WorkloadUserCardProps) {
  const prefetchTasks = tasksApi.usePrefetch("getTasks");

  const {
    user,
    totalTasks,
    doneTasks,
    activeTasks = totalTasks - doneTasks,
    overdueTasks = 0,
    completionRate,
    byStatus,
  } = entry;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Determine Capacity Level Band
  const getCapacityBand = (active: number) => {
    if (active >= 7)
      return {
        label: "Overloaded",
        style: "bg-destructive-light text-destructive border-destructive/90",
      };
    if (active >= 4)
      return {
        label: "Heavy Load",
        style: "bg-warning-light text-warning border-warning/90",
      };
    if (active >= 2)
      return {
        label: "Optimal",
        style: "bg-success-light text-success border-success/90",
      };
    return {
      label: "Available",
      style: "bg-muted text-foreground border-border/90",
    };
  };

  const capacity = getCapacityBand(activeTasks);

  const handleMouseEnter = useCallback(() => {
    if (user.id) {
      prefetchTasks({ assignedToId: user.id, pageSize: 100 });
    }
  }, [prefetchTasks, user.id]);

  return (
    <Card
      onClick={() => onInspect?.(entry)}
      onMouseEnter={handleMouseEnter}
      className="p-5 rounded-lg shadow-xs flex flex-col justify-between gap-4 border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all group relative cursor-pointer overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold text-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {user.name}
            </h4>
            <div className="mt-0.5">
              <UserRoleBadge role={user.role} className="text-xs px-1.5 py-0" />
            </div>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border   shrink-0 ${capacity.style}`}
        >
          {capacity.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground text-xs font-medium">Completion Rate</span>
          <span className="text-foreground font-semibold">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-border/50">
        <div className="bg-surface-subtle p-2 rounded-lg border border-border/60 flex flex-col justify-center">
          <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-primary" /> Active
          </span>
          <span className="font-semibold text-foreground text-sm">{activeTasks}</span>
        </div>

        <div className="bg-surface-subtle p-2 rounded-lg border border-border/60 flex flex-col justify-center">
          <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" /> Done
          </span>
          <span className="font-semibold text-success text-sm">{doneTasks}</span>
        </div>

        <div
          className={`p-2 rounded-lg border flex flex-col justify-center ${
            overdueTasks > 0
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-surface-subtle border-border/60 text-muted-foreground"
          }`}
        >
          <span className="text-xs font-semibold opacity-90 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-primary" /> Overdue
          </span>
          <span className="font-semibold text-sm">{overdueTasks}</span>
        </div>
      </div>

      {byStatus.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-border/40">
          {byStatus.map((st) => (
            <span
              key={st.status}
              className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-subtle border border-border/50 text-muted-foreground"
            >
              {st.status.replace("_", " ")}: <strong className="text-foreground">{st.count}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-semibold text-primary">
        <span className="flex items-center gap-1.5 group-hover:underline">
          Inspect Workload
        </span>
        <ExternalLink className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Card>
  );
}

