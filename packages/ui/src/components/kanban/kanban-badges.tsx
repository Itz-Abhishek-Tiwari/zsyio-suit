"use client";

import * as React from "react";
import { Zap, Sparkles, Flame, AlertOctagon, Clock } from "lucide-react";
import { Badge } from "../badge";
import { cn } from "../../lib/utils";

export function KanbanIdentifierBadge({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-semibold tracking-wider text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0 select-none",
        className
      )}
    >
      {id}
    </span>
  );
}

export type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT";

export const KANBAN_PRIORITY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
> = {
  LOW: {
    label: "Low",
    icon: <Zap className="w-3 h-3 text-slate-500 dark:text-slate-400" />,
    bgClass: "bg-slate-100 dark:bg-slate-500/15",
    textClass: "text-slate-700 dark:text-slate-300 font-medium",
    borderClass: "border-slate-200/90 dark:border-slate-500/30",
  },
  MEDIUM: {
    label: "Medium",
    icon: <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    textClass: "text-amber-800 dark:text-amber-400 font-medium",
    borderClass: "border-amber-200/90 dark:border-amber-500/30",
  },
  HIGH: {
    label: "High",
    icon: <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
    bgClass: "bg-orange-50 dark:bg-orange-500/15",
    textClass: "text-orange-800 dark:text-orange-400 font-medium",
    borderClass: "border-orange-200/90 dark:border-orange-500/30",
  },
  CRITICAL: {
    label: "Urgent",
    icon: <AlertOctagon className="w-3 h-3 text-red-600 dark:text-red-400 animate-pulse" />,
    bgClass: "bg-red-50 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400 font-bold",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
  URGENT: {
    label: "Urgent",
    icon: <AlertOctagon className="w-3 h-3 text-red-600 dark:text-red-400 animate-pulse" />,
    bgClass: "bg-red-50 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400 font-bold",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
};

export function KanbanPriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const cfg = KANBAN_PRIORITY_CONFIG[priority?.toUpperCase()] ?? KANBAN_PRIORITY_CONFIG.MEDIUM;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] py-0 px-1.5 font-semibold gap-1 shrink-0",
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
        className
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function KanbanMetricBadge({
  icon,
  children,
  variant = "default",
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}) {
  const variantMap: Record<string, string> = {
    default: "bg-muted/80 text-muted-foreground border-border/50",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-500/30 font-semibold",
    warning: "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200/90 dark:border-amber-500/30",
    destructive: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200/90 dark:border-red-500/30 font-semibold",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200/90 dark:border-blue-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 font-medium gap-1 shrink-0",
        variantMap[variant] || variantMap.default,
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </Badge>
  );
}

export function KanbanDueDateBadge({
  dueDate,
  isDone = false,
  className,
}: {
  dueDate?: string | Date | null;
  isDone?: boolean;
  className?: string;
}) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 3600 * 24));

  let text = "";
  let variant: "default" | "success" | "warning" | "destructive" = "default";

  if (isDone) {
    text = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    variant = "success";
  } else if (diffDays < 0) {
    text = `${Math.abs(diffDays)}d late`;
    variant = "destructive";
  } else if (diffDays === 0) {
    text = "Today";
    variant = "warning";
  } else {
    text = `${diffDays}d`;
    variant = "default";
  }

  return (
    <KanbanMetricBadge
      icon={<Clock className="w-2.5 h-2.5 shrink-0" />}
      variant={variant}
      className={className}
    >
      {text}
    </KanbanMetricBadge>
  );
}
