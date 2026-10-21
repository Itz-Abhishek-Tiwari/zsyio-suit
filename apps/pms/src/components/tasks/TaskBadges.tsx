"use client";

import * as React from "react";
import { formatTicketId } from "@/lib/utils";
import { Badge } from "@zsyio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zsyio/ui";
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
    icon: <ArrowDown className="w-3 h-3 text-notion-gray-fg" />,
    bgClass: "bg-notion-gray",
    textClass: "text-notion-gray-fg font-normal",
    borderClass: "border-transparent",
  },
  MEDIUM: {
    label: "Medium",
    icon: <Equal className="w-3 h-3 text-notion-blue-fg" />,
    bgClass: "bg-notion-blue",
    textClass: "text-notion-blue-fg font-normal",
    borderClass: "border-transparent",
  },
  HIGH: {
    label: "High",
    icon: <ArrowUp className="w-3 h-3 text-notion-orange-fg" />,
    bgClass: "bg-notion-orange",
    textClass: "text-notion-orange-fg font-normal",
    borderClass: "border-transparent",
  },
  CRITICAL: {
    label: "Urgent",
    icon: <Flame className="w-3 h-3 text-notion-red-fg" />,
    bgClass: "bg-notion-red",
    textClass: "text-notion-red-fg font-medium",
    borderClass: "border-transparent",
  },
};

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }
> = {
  FEATURE: {
    label: "Feature",
    icon: <Boxes className="w-3 h-3 text-notion-blue-fg" />,
    bgClass: "bg-notion-blue",
    textClass: "text-notion-blue-fg",
    borderClass: "border-transparent",
  },
  BUG: {
    label: "Bug",
    icon: <Bug className="w-3 h-3 text-notion-red-fg" />,
    bgClass: "bg-notion-red",
    textClass: "text-notion-red-fg",
    borderClass: "border-transparent",
  },
  SUPPORT_REQUEST: {
    label: "Support",
    icon: <LifeBuoy className="w-3 h-3 text-notion-purple-fg" />,
    bgClass: "bg-notion-purple",
    textClass: "text-notion-purple-fg",
    borderClass: "border-transparent",
  },
  CUSTOMIZATION: {
    label: "Custom",
    icon: <Sliders className="w-3 h-3 text-notion-yellow-fg" />,
    bgClass: "bg-notion-yellow",
    textClass: "text-notion-yellow-fg",
    borderClass: "border-transparent",
  },
  DEPLOYMENT: {
    label: "Deploy",
    icon: <Rocket className="w-3 h-3 text-notion-green-fg" />,
    bgClass: "bg-notion-green",
    textClass: "text-notion-green-fg",
    borderClass: "border-transparent",
  },
  MAINTENANCE: {
    label: "Infra",
    icon: <Wrench className="w-3 h-3 text-notion-gray-fg" />,
    bgClass: "bg-notion-gray",
    textClass: "text-notion-gray-fg",
    borderClass: "border-transparent",
  },
  NEW_DESIGN: {
    label: "New Design",
    icon: <Paintbrush className="w-3 h-3 text-notion-purple-fg" />,
    bgClass: "bg-notion-purple",
    textClass: "text-notion-purple-fg",
    borderClass: "border-transparent",
  },
  DESIGN_CHANGE: {
    label: "Design Changes",
    icon: <Layers className="w-3 h-3 text-notion-pink-fg" />,
    bgClass: "bg-notion-pink",
    textClass: "text-notion-pink-fg",
    borderClass: "border-transparent",
  },
  DESIGN_CHANGES: {
    label: "Design Changes",
    icon: <Layers className="w-3 h-3 text-notion-pink-fg" />,
    bgClass: "bg-notion-pink",
    textClass: "text-notion-pink-fg",
    borderClass: "border-transparent",
  },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; bgClass: string; textClass: string; borderClass: string }
> = {
  BACKLOG: {
    label: "Backlog",
    icon: "BACKLOG",
    bgClass: "bg-notion-gray",
    textClass: "text-notion-gray-fg font-normal",
    borderClass: "border-transparent",
  },
  TODO: {
    label: "To Do",
    icon: "TODO",
    bgClass: "bg-notion-blue",
    textClass: "text-notion-blue-fg font-normal",
    borderClass: "border-transparent",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: "IN_PROGRESS",
    bgClass: "bg-notion-yellow",
    textClass: "text-notion-yellow-fg font-normal",
    borderClass: "border-transparent",
  },
  IN_REVIEW: {
    label: "In Review",
    icon: "IN_REVIEW",
    bgClass: "bg-notion-orange",
    textClass: "text-notion-orange-fg font-normal",
    borderClass: "border-transparent",
  },
  QA: {
    label: "QA",
    icon: "QA",
    bgClass: "bg-notion-purple",
    textClass: "text-notion-purple-fg font-normal",
    borderClass: "border-transparent",
  },
  BLOCKED: {
    label: "Blocked",
    icon: "BLOCKED",
    bgClass: "bg-notion-red",
    textClass: "text-notion-red-fg font-normal",
    borderClass: "border-transparent",
  },
  DONE: {
    label: "Done",
    icon: "DONE",
    bgClass: "bg-notion-green",
    textClass: "text-notion-green-fg font-normal",
    borderClass: "border-transparent",
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
      className={`font-mono text-xs font-medium tracking-wide text-notion-blue-fg bg-notion-blue px-1.5 py-0.5 rounded-[3px] border border-transparent whitespace-nowrap inline-flex items-center shrink-0 select-none ${className ?? ""}`}
    >
      {shortId}
    </span>
  );
}

/**
 * 2. Task Status Badge — static display or inline-editable dropdown.
 *
 * Pass `onStatusChange` to make it interactive: clicking opens a menu with
 * every status in STATUS_CONFIG. Active status is highlighted with a check.
 */
export function TaskStatusBadge({
  status,
  className,
  onStatusChange,
}: {
  status: TaskStatus | string;
  className?: string;
  /** When provided the badge becomes a dropdown trigger to change status. */
  onStatusChange?: (newStatus: string) => void;
}) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    icon: "clipboard",
    bgClass: "bg-muted",
    textClass: "text-foreground",
    borderClass: "border-border/90",
  };

  const badgeEl = (
    <Badge
      variant="outline"
      className={`${
        onStatusChange ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${className ?? ""}`}
    >
      <ColumnIcon iconKey={cfg.icon} className="w-3 h-3" />
      <span>{cfg.label}</span>
      {onStatusChange && (
        <svg
          className="w-2.5 h-2.5 ml-0.5 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </Badge>
  );

  if (!onStatusChange) return badgeEl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badgeEl}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 text-xs shadow-md">
        <DropdownMenuLabel className="text-xs  text-muted-foreground font-semibold">
          Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(STATUS_CONFIG).map(([key, statusCfg]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onStatusChange(key)}
            className={`cursor-pointer flex items-center gap-2 text-xs ${
              key === status ? "font-semibold" : ""
            }`}
          >
            <span className={`${statusCfg.bgClass} ${statusCfg.textClass} p-1 rounded-md shrink-0`}>
              <ColumnIcon iconKey={statusCfg.icon} className="w-3 h-3" />
            </span>
            <span className="flex-1">{statusCfg.label}</span>
            {key === status && (
              <svg
                className="w-3 h-3 text-primary shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 3. Task Priority Badge — static display or inline-editable dropdown.
 *
 * Pass `onPriorityChange` to make it interactive: clicking opens a menu with
 * every priority in PRIORITY_CONFIG. Active priority is highlighted with a check.
 */
export function TaskPriorityBadge({
  priority,
  className,
  onPriorityChange,
}: {
  priority: Priority;
  className?: string;
  /** When provided the badge becomes a dropdown trigger to change priority. */
  onPriorityChange?: (newPriority: Priority) => void;
}) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;

  const badgeEl = (
    <Badge
      variant="outline"
      className={`${
        onPriorityChange ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${className ?? ""}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
      {onPriorityChange && (
        <svg
          className="w-2.5 h-2.5 ml-0.5 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </Badge>
  );

  if (!onPriorityChange) return badgeEl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badgeEl}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 text-xs shadow-md">
        <DropdownMenuLabel className="text-xs  text-muted-foreground font-semibold">
          Priority
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(
          ([key, priCfg]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onPriorityChange(key)}
              className={`cursor-pointer flex items-center gap-2 text-xs ${
                key === priority ? "font-semibold" : ""
              }`}
            >
              <span className={`${priCfg.bgClass} ${priCfg.textClass} p-1 rounded-md shrink-0`}>
                {priCfg.icon}
              </span>
              <span className="flex-1">{priCfg.label}</span>
              {key === priority && (
                <svg
                  className="w-3 h-3 text-primary shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/**
 * 4. Task Type Badge — static display or inline-editable dropdown.
 *
 * Pass `onTypeChange` to make it interactive: clicking the badge opens a menu
 * listing every type in TYPE_CONFIG. The active type is highlighted with a
 * check. Without `onTypeChange` it renders as a plain read-only badge.
 */
export function TaskTypeBadge({
  type,
  className,
  compact = false,
  onTypeChange,
}: {
  type: string;
  className?: string;
  compact?: boolean;
  /** When provided, the badge becomes a dropdown trigger to change the type. */
  onTypeChange?: (newType: string) => void;
}) {
  const cfg = TYPE_CONFIG[type] ?? {
    label: type,
    icon: <Tag className="w-3 h-3 text-notion-purple-fg" />,
    bgClass: "bg-notion-purple",
    textClass: "text-notion-purple-fg",
    borderClass: "border-notion-purple-fg/90",
  };

  const badgeEl = (
    <Badge
      variant="outline"
      className={`${
        onTypeChange ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} ${
        compact ? "text-xs px-1.5 py-0 gap-1 font-medium" : ""
      } ${className ?? ""}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
      {onTypeChange && (
        <svg
          className="w-2.5 h-2.5 ml-0.5 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </Badge>
  );

  if (!onTypeChange) return badgeEl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{badgeEl}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 text-xs shadow-md">
        <DropdownMenuLabel className="text-xs  text-muted-foreground font-semibold">
          Task Type
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(TYPE_CONFIG).map(([key, typeCfg]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onTypeChange(key)}
            className={`cursor-pointer flex items-center gap-2 text-xs ${
              key === type ? "font-semibold" : ""
            }`}
          >
            <span className={`${typeCfg.bgClass} ${typeCfg.textClass} p-1 rounded-md shrink-0`}>
              {typeCfg.icon}
            </span>
            <span className="flex-1">{typeCfg.label}</span>
            {key === type && (
              <svg
                className="w-3 h-3 text-primary shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Returns today's date normalised to midnight — cached per unique calendar day. */
function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 5. Task Due Date Badge (Overdue / Due Today / Date String)
 */
export const TaskDueDateBadge = React.memo(function TaskDueDateBadge({
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
  const today = getTodayMidnight();
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
    ? "bg-notion-green text-notion-green-fg border-transparent"
    : isOverdue
    ? "bg-notion-red text-notion-red-fg border-transparent"
    : isDueToday
    ? "bg-notion-orange text-notion-orange-fg border-transparent"
    : "bg-notion-gray text-notion-gray-fg border-transparent";

  return (
    <Badge
      variant="outline"
      className={`${badgeClass} ${
        compact ? "text-xs px-1.5 py-0 gap-1 font-normal" : "font-normal"
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
});

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
    <Badge variant="outline" className={`bg-card text-foreground border-border/80 shadow-2xs font-normal ${className ?? ""}`}>
      <span className="w-4 h-4 rounded-full bg-notion-purple text-notion-purple-fg text-xs font-medium flex items-center justify-center shrink-0">
        {initials}
      </span>
      <span>{name}</span>
    </Badge>
  );
}

const TEAM_COLOR_MAP: Record<string, { badgeVariant: "purple" | "info" | "warning" | "success" | "destructive" | "default"; dotClass: string }> = {
  purple: { badgeVariant: "purple", dotClass: "bg-notion-purple-fg" },
  blue: { badgeVariant: "info", dotClass: "bg-notion-blue-fg" },
  amber: { badgeVariant: "warning", dotClass: "bg-warning" },
  emerald: { badgeVariant: "success", dotClass: "bg-success" },
  red: { badgeVariant: "destructive", dotClass: "bg-destructive" },
  cyan: { badgeVariant: "info", dotClass: "bg-notion-blue-fg" },
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
