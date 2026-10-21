"use client";

import React from "react";
import Link from "next/link";
import { Activity, Plus, CheckCircle2, RefreshCw, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import type { LogAction } from "@zsyio/types";

export interface ActivityItem {
  id: string;
  action: LogAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string | Date;
  actor: {
    id: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
  };
}

interface DashboardActivityFeedProps {
  activities: ActivityItem[];
}

function getActionDetails(action: LogAction, newValue?: string | null) {
  switch (action) {
    case "CREATED":
      return {
        text: "created task",
        icon: <Plus className="w-3 h-3 text-success" />,
        badgeClass: "bg-success/10 text-success border-success/20",
      };
    case "STATUS_CHANGED":
      return {
        text: `changed status to ${newValue?.replace("_", " ") ?? ""}`,
        icon: <CheckCircle2 className="w-3 h-3 text-notion-blue-fg" />,
        badgeClass: "bg-notion-blue-fg/10 text-notion-blue-fg border-notion-blue-fg/20",
      };
    case "REASSIGNED":
      return {
        text: "reassigned task",
        icon: <RefreshCw className="w-3 h-3 text-notion-purple-fg" />,
        badgeClass: "bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/20",
      };
    case "COMMENTED":
      return {
        text: "commented on task",
        icon: <MessageSquare className="w-3 h-3 text-warning" />,
        badgeClass: "bg-warning/10 text-warning border-warning/20",
      };
    case "ATTACHMENT_ADDED":
      return {
        text: "uploaded an attachment",
        icon: <Paperclip className="w-3 h-3 text-notion-purple-fg" />,
        badgeClass: "bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/20",
      };
    case "ATTACHMENT_REMOVED":
      return {
        text: "removed an attachment",
        icon: <Trash2 className="w-3 h-3 text-destructive" />,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
      };
    case "DELETED":
      return {
        text: "deleted task",
        icon: <Trash2 className="w-3 h-3 text-destructive" />,
        badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
      };
    default:
      return {
        text: "updated task",
        icon: <Activity className="w-3 h-3 text-muted-foreground" />,
        badgeClass: "bg-muted text-muted-foreground border-border/60",
      };
  }
}

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
        <span className="w-8 h-8 rounded-md bg-notion-blue-fg/10 text-notion-blue-fg border border-notion-blue-fg/20 flex items-center justify-center">
          <Activity className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Real-time audit log across tasks.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activities.map((act) => {
          const actionInfo = getActionDetails(act.action, act.newValue);
          const initials = act.actor.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Link
              key={act.id}
              href={`/tasks?taskId=${act.task.id}`}
              className="flex gap-2.5 items-start text-xs p-2 -mx-2 rounded-md hover:bg-surface-subtle/70 transition-all group"
            >
              <div className="w-7 h-7 rounded-md bg-surface-subtle border border-border/60 font-semibold text-xs flex items-center justify-center text-foreground shrink-0 mt-0.5 group-hover:border-primary/40 transition-colors">
                {initials}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-foreground leading-snug">
                  <strong className="font-semibold">{act.actor.name}</strong>{" "}
                  <span className="text-muted-foreground">{actionInfo.text}</span>
                </p>
                <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors truncate mt-0.5">
                  {act.task.title}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                  {formatRelativeTime(act.createdAt)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
