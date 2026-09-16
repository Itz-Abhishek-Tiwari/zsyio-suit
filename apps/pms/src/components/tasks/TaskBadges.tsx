"use client";

import * as React from "react";
import { formatTicketId } from "@/lib/utils";
import { Badge } from "@zsyio/ui";
import type { Priority, TaskStatus } from "@zsyio/types";
import { ColumnIcon } from "./ColumnIcon";
import {
  ArrowDown,
  Equal,
  ArrowUp,
  Flame,
  Bug,
  LifeBuoy,
  Sliders,
  Rocket,
  Wrench,
  Tag,
  Clock,
  CheckCircle2,
  Paintbrush,
  Layers,
  Boxes,
} from "lucide-react";

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
> = {
  LOW: {
    label: "Low",
    icon: <ArrowDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />,
    bgClass: "bg-slate-100 dark:bg-slate-500/15",
    textClass: "text-slate-700 dark:text-slate-300 font-medium",
    borderClass: "border-slate-200/90 dark:border-slate-500/30",
  },
  MEDIUM: {
    label: "Medium",
    icon: <Equal className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />,
    bgClass: "bg-cyan-50 dark:bg-cyan-500/15",
    textClass: "text-cyan-800 dark:text-cyan-400 font-medium",
    borderClass: "border-cyan-200/90 dark:border-cyan-500/30",
  },
  HIGH: {
    label: "High",
    icon: <ArrowUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
    bgClass: "bg-orange-50 dark:bg-orange-500/15",
    textClass: "text-orange-800 dark:text-orange-400 font-medium",
    borderClass: "border-orange-200/90 dark:border-orange-500/30",
  },
  CRITICAL: {
    label: "Urgent",
    icon: <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />,
    bgClass: "bg-red-50 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400 font-bold",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
};

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
> = {
  FEATURE: {
    label: "Feature",
    icon: <Boxes className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />,
    bgClass: "bg-cyan-50 dark:bg-cyan-500/15",
    textClass: "text-cyan-800 dark:text-cyan-400",
    borderClass: "border-cyan-200/90 dark:border-cyan-500/30",
  },
  BUG: {
    label: "Bug",
    icon: <Bug className="w-3 h-3 text-red-600 dark:text-red-400" />,
    bgClass: "bg-red-50 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
  SUPPORT_REQUEST: {
    label: "Support",
    icon: <LifeBuoy className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
    bgClass: "bg-blue-50 dark:bg-blue-500/15",
    textClass: "text-blue-700 dark:text-blue-400",
    borderClass: "border-blue-200/90 dark:border-blue-500/30",
  },
  CUSTOMIZATION: {
    label: "Custom",
    icon: <Sliders className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    textClass: "text-amber-800 dark:text-amber-400",
    borderClass: "border-amber-200/90 dark:border-amber-500/30",
  },
  DEPLOYMENT: {
    label: "Deploy",
    icon: <Rocket className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    bgClass: "bg-emerald-50 dark:bg-emerald-500/15",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-200/90 dark:border-emerald-500/30",
  },
  MAINTENANCE: {
    label: "Infra",
    icon: <Wrench className="w-3 h-3 text-slate-600 dark:text-slate-400" />,
    bgClass: "bg-slate-100 dark:bg-slate-500/15",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-200/90 dark:border-slate-500/30",
  },
  NEW_DESIGN: {
    label: "New Design",
    icon: <Paintbrush className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />,
    bgClass: "bg-indigo-50 dark:bg-indigo-500/15",
    textClass: "text-indigo-700 dark:text-indigo-400",
    borderClass: "border-indigo-200/90 dark:border-indigo-500/30",
  },
  DESIGN_CHANGE: {
    label: "Design Changes",
    icon: <Layers className="w-3 h-3 text-pink-600 dark:text-pink-400" />,
    bgClass: "bg-pink-50 dark:bg-pink-500/15",
    textClass: "text-pink-700 dark:text-pink-400",
    borderClass: "border-pink-200/90 dark:border-pink-500/30",
  },
  DESIGN_CHANGES: {
    label: "Design Changes",
    icon: <Layers className="w-3 h-3 text-pink-600 dark:text-pink-400" />,
    bgClass: "bg-pink-50 dark:bg-pink-500/15",
    textClass: "text-pink-700 dark:text-pink-400",
    borderClass: "border-pink-200/90 dark:border-pink-500/30",
  },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; bgClass: string; textClass: string; borderClass: string }
> = {
  BACKLOG: {
    label: "Backlog",
    icon: "BACKLOG",
    bgClass: "bg-slate-100 dark:bg-slate-500/15",
    textClass: "text-slate-700 dark:text-slate-300 font-medium",
    borderClass: "border-slate-200/90 dark:border-slate-500/30",
  },
  TODO: {
    label: "To Do",
    icon: "TODO",
    bgClass: "bg-blue-50 dark:bg-blue-500/15",
    textClass: "text-blue-700 dark:text-blue-400 font-medium",
    borderClass: "border-blue-200/90 dark:border-blue-500/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: "IN_PROGRESS",
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    textClass: "text-amber-800 dark:text-amber-400 font-medium",
    borderClass: "border-amber-200/90 dark:border-amber-500/30",
  },
  IN_REVIEW: {
    label: "In Review",
    icon: "IN_REVIEW",
    bgClass: "bg-orange-50 dark:bg-orange-500/15",
    textClass: "text-orange-800 dark:text-orange-400 font-medium",
    borderClass: "border-orange-200/90 dark:border-orange-500/30",
  },
  QA: {
    label: "QA",
    icon: "QA",
    bgClass: "bg-purple-50 dark:bg-purple-500/15",
    textClass: "text-purple-700 dark:text-purple-400 font-medium",
    borderClass: "border-purple-200/90 dark:border-purple-500/30",
  },
  BLOCKED: {
    label: "Blocked",
    icon: "BLOCKED",
    bgClass: "bg-red-50 dark:bg-red-500/15",
    textClass: "text-red-700 dark:text-red-400 font-bold",
    borderClass: "border-red-200/90 dark:border-red-500/30",
  },
  DONE: {
    label: "Done",
    icon: "DONE",
    bgClass: "bg-emerald-50 dark:bg-emerald-500/15",
    textClass: "text-emerald-700 dark:text-emerald-400 font-medium",
    borderClass: "border-emerald-200/90 dark:border-emerald-500/30",
  },
};

export function TaskShortIdBadge({
  taskId,
  ticketNumber,
  task,
  className,
}: {
  taskId?: string;
  ticketNumber?: number;
  task?: { id?: string | null; ticketNumber?: number | null };
  className?: string;
}) {
  const shortId = formatTicketId(task ?? (typeof ticketNumber === "number" ? ticketNumber : taskId));
  return (
    <span
      className={`font-mono text-[11px] font-semibold tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30 dark:border-cyan-500/35 whitespace-nowrap inline-flex items-center shrink-0 select-none shadow-2xs ${className ?? ""}`}
    >
      {shortId}
    </span>
  );
}

/**
 * 2. Task Status Badge (e.g. Backlog, In Progress, Done)
 */
export function TaskStatusBadge({ status, className }: { status: TaskStatus | string; className?: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    icon: "clipboard",
    bgClass: "bg-slate-100 dark:bg-slate-800/80",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-200/90 dark:border-slate-700/80",
  };

  return (
    <Badge
      variant="outline"
      className={`${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${className ?? ""}`}
    >
      <ColumnIcon iconKey={cfg.icon} className="w-3 h-3" />
      <span>{cfg.label}</span>
    </Badge>
  );
}

/**
 * 3. Task Priority Badge (e.g. Low, Medium, High, Urgent)
 */
export function TaskPriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <Badge
      variant="outline"
      className={`${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${className ?? ""}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </Badge>
  );
}

/**
 * 4. Task Type Badge (e.g. Feature, Bug, Support, Custom)
 */
export function TaskTypeBadge({
  type,
  className,
  compact = false,
}: {
  type: string;
  className?: string;
  compact?: boolean;
}) {
  const cfg = TYPE_CONFIG[type] ?? {
    label: type,
    icon: <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
    bgClass: "bg-purple-50 dark:bg-purple-500/15",
    textClass: "text-purple-700 dark:text-purple-400",
    borderClass: "border-purple-200/90 dark:border-purple-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={`${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${
        compact ? "text-[10px] px-1.5 py-0 gap-1 font-medium" : ""
      } ${className ?? ""}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </Badge>
  );
}

/**
 * 5. Task Due Date Badge (Overdue / Due Today / Date String)
 */
export function TaskDueDateBadge({
  dueDate,
  status,
  className,
  compact = false,
}: {
  dueDate?: string | null;
  status?: TaskStatus | string;
  className?: string;
  compact?: boolean;
}) {
  if (!dueDate) return null;

  const isDone = status === "DONE" || status?.toUpperCase() === "DONE";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 3600 * 24));

  let text = "";
  let isOverdue = false;
  let isDueToday = false;

  if (isDone) {
    text = compact
      ? `Done (${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
      : `Completed • Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else if (diffDays < 0) {
    isOverdue = true;
    text = compact ? `${Math.abs(diffDays)}d late` : `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    isDueToday = true;
    text = compact ? "Today" : "Due today";
  } else {
    text = compact
      ? due.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : due.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }

  const badgeClass = isDone
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-500/30"
    : isOverdue
    ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200/90 dark:border-red-500/30"
    : isDueToday
    ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200/90 dark:border-amber-500/30"
    : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200/90 dark:border-slate-500/30";

  return (
    <Badge
      variant="outline"
      className={`${badgeClass} ${
        compact ? "text-[10px] px-1.5 py-0 gap-1 font-medium" : ""
      } ${className ?? ""}`}
    >
      {isDone ? (
        <CheckCircle2 className="w-3 h-3 shrink-0" />
      ) : (
        <Clock className="w-3 h-3 shrink-0" />
      )}
      <span className="truncate">{text}</span>
    </Badge>
  );
}

/**
 * 6. Assigned Developer Badge
 */
export function DeveloperBadge({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Badge variant="outline" className={`bg-card text-foreground border-border/80 shadow-2xs ${className ?? ""}`}>
      <span className="w-4 h-4 rounded-full bg-primary-light text-primary text-[9px] font-bold flex items-center justify-center shrink-0 border border-primary/20">
        {initials}
      </span>
      <span>{name}</span>
    </Badge>
  );
}

const TEAM_COLOR_MAP: Record<string, { badgeVariant: "purple" | "info" | "warning" | "success" | "destructive" | "default"; dotClass: string }> = {
  purple: { badgeVariant: "purple", dotClass: "bg-purple-500" },
  blue: { badgeVariant: "info", dotClass: "bg-blue-500" },
  amber: { badgeVariant: "warning", dotClass: "bg-amber-500" },
  emerald: { badgeVariant: "success", dotClass: "bg-emerald-500" },
  red: { badgeVariant: "destructive", dotClass: "bg-red-500" },
  cyan: { badgeVariant: "info", dotClass: "bg-cyan-500" },
};

/**
 * 7. Assigned Team Badge
 */
export function TeamBadge({ name, color, className }: { name: string; color?: string | null; className?: string }) {
  const cfg = (color && TEAM_COLOR_MAP[color.toLowerCase()]) || TEAM_COLOR_MAP.purple;
  return (
    <Badge variant={cfg.badgeVariant} className={className}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      <span>{name}</span>
    </Badge>
  );
}
