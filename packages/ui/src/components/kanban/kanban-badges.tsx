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
        "font-mono text-xs font-semibold  text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0 select-none",
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
    icon: <Zap className="w-3 h-3 text-muted-foreground" />,
    bgClass: "bg-muted",
    textClass: "text-foreground font-medium",
    borderClass: "border-border/90",
  },
  MEDIUM: {
    label: "Medium",
    icon: <Sparkles className="w-3 h-3 text-warning" />,
    bgClass: "bg-warning-light",
    textClass: "text-warning font-medium",
    borderClass: "border-warning/90",
  },
  HIGH: {
    label: "High",
    icon: <Flame className="w-3 h-3 text-notion-orange-fg" />,
    bgClass: "bg-notion-orange",
    textClass: "text-notion-orange-fg font-medium",
    borderClass: "border-notion-orange-fg/90",
  },
  CRITICAL: {
    label: "Urgent",
    icon: <AlertOctagon className="w-3 h-3 text-destructive animate-pulse" />,
    bgClass: "bg-destructive-light",
    textClass: "text-destructive font-semibold",
    borderClass: "border-destructive/90",
  },
  URGENT: {
    label: "Urgent",
    icon: <AlertOctagon className="w-3 h-3 text-destructive animate-pulse" />,
    bgClass: "bg-destructive-light",
    textClass: "text-destructive font-semibold",
    borderClass: "border-destructive/90",
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
        "text-xs py-0 px-1.5 font-semibold gap-1 shrink-0",
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
    success: "bg-success-light text-success border-success/90 font-semibold",
    warning: "bg-warning-light text-warning border-warning/90",
    destructive: "bg-destructive-light text-destructive border-destructive/90 font-semibold",
    info: "bg-notion-blue text-notion-blue-fg border-notion-blue-fg/90",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs px-1.5 py-0 font-medium gap-1 shrink-0",
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
