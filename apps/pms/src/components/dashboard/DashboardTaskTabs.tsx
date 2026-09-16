"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  User,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Input } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { PRIORITY_CONFIG } from "@/components/tasks/TaskBadges";
import { formatTicketId } from "@/lib/utils";

import type { Priority, TaskStatus } from "@zsyio/types";

export interface DashboardTaskItem {
  id: string;
  ticketNumber?: number | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  type: string;
  dueDate: string | null;
  blockedReason?: string | null;
  product?: {
    id: string;
    name: string;
    client?: {
      id: string;
      name: string;
    } | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  reviewer?: {
    id: string;
    name: string;
  } | null;
  reviewers?: Array<{
    userId?: string;
    user?: { id: string; name: string } | null;
  }>;
  assignees?: Array<{
    userId?: string;
    user?: { id: string; name: string } | null;
  }>;
}

interface DashboardTaskTabsProps {
  urgentTasks: DashboardTaskItem[];
  myTasks: DashboardTaskItem[];
  blockedTasks: DashboardTaskItem[];
  dueSoonTasks: DashboardTaskItem[];
  currentUserName?: string;
  defaultTab?: TabKey;
  userRole?: string;
}

type TabKey = "urgent" | "myTasks" | "blocked" | "dueSoon";

export function DashboardTaskTabs({
  urgentTasks,
  myTasks,
  blockedTasks,
  dueSoonTasks,
  defaultTab = "myTasks",
}: DashboardTaskTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");


  const currentList = useMemo(() => {
    switch (activeTab) {
      case "urgent":
        return urgentTasks;
      case "myTasks":
        return myTasks;
      case "blocked":
        return blockedTasks;
      case "dueSoon":
        return dueSoonTasks;
      default:
        return urgentTasks;
    }
  }, [activeTab, urgentTasks, myTasks, blockedTasks, dueSoonTasks]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.toLowerCase().trim();
    const ticketMatchExact = query.match(/^(?:tsk[-\s]?|#)?(\d+)$/i);
    const targetTicketNum = ticketMatchExact ? parseInt(ticketMatchExact[1], 10) : null;

    return currentList.filter((task) => {
      const shortId = formatTicketId(task, "tsk").toLowerCase();
      const ticketMatch =
        targetTicketNum !== null
          ? (typeof task.ticketNumber === "number" ? task.ticketNumber === targetTicketNum : shortId === `tsk-${targetTicketNum}`)
          : shortId.includes(query);
      const titleMatch = task.title.toLowerCase().includes(query);
      const clientMatch = task.product?.client?.name.toLowerCase().includes(query) ?? false;
      const productMatch = task.product?.name.toLowerCase().includes(query) ?? false;
      const assigneeMatch =
        (task.assignedTo?.name.toLowerCase().includes(query) ?? false) ||
        (task.assignees?.some((a) => a.user?.name.toLowerCase().includes(query)) ?? false);
      const reviewerMatch =
        (task.reviewer?.name.toLowerCase().includes(query) ?? false) ||
        (task.reviewers?.some((r) => r.user?.name.toLowerCase().includes(query)) ?? false);
      return titleMatch || clientMatch || productMatch || assigneeMatch || reviewerMatch || ticketMatch;
    });
  }, [currentList, searchQuery]);

  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Actionable Tasks</span>
            <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-surface-subtle px-2 py-0.5 rounded-md border border-border/60">
              {currentList.length} items
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prioritized task backlog filtered by immediacy and assignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs font-semibold gap-1.5 text-primary hover:text-primary h-8 px-2.5 rounded-md"
          >
            <Link href="/tasks">
              <span>View Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <SegmentedTabs<TabKey>
            value={activeTab}
            onChange={setActiveTab}
            size="md"
            tabs={[
              {
                id: "urgent",
                label: "Urgent & High",
                icon: <Flame className="w-3.5 h-3.5" />,
                count: urgentTasks.length,
                badgeVariant: "rose",
              },
              {
                id: "myTasks",
                label: "My Focus",
                icon: <User className="w-3.5 h-3.5" />,
                count: myTasks.length,
                badgeVariant: "primary",
              },
              {
                id: "blocked",
                label: "Blocked",
                icon: <AlertTriangle className="w-3.5 h-3.5" />,
                count: blockedTasks.length,
                badgeVariant: "amber",
              },
              {
                id: "dueSoon",
                label: "Due Soon",
                icon: <Clock className="w-3.5 h-3.5" />,
                count: dueSoonTasks.length,
              },
            ]}
          />
        </div>


        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 text-xs pl-8 pr-2.5 rounded-md bg-surface-subtle/50 border-border/60 focus:bg-card"
          />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-2.5 rounded-md bg-surface-subtle/30 border border-dashed border-border/70">
          <CheckCircle2 className="w-9 h-9 text-emerald-500/80" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-bold text-foreground">
              {searchQuery ? "No matching tasks found" : "All clear in this view!"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm">
              {searchQuery
                ? `No tasks matched "${searchQuery}". Try clearing the search.`
                : activeTab === "urgent"
                ? "No urgent or high priority tasks currently open."
                : activeTab === "myTasks"
                ? "You have no active tasks currently assigned to you."
                : activeTab === "blocked"
                ? "No blocked tasks currently recorded across projects."
                : "No tasks due within the next 7 days."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/60">
          {filteredTasks.map((task) => {
            const clientName = task.product?.client?.name ?? "Internal";
            const productName = task.product?.name ?? "General";
            const priorityInfo = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

            const isOverdue =
              task.dueDate &&
              task.status !== "DONE" &&
              task.status?.toUpperCase() !== "DONE" &&
              new Date(task.dueDate) < new Date();
            const dueDateFormatted = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : null;

            return (
              <Link
                key={task.id}
                href={`/tasks?taskId=${task.id}`}
                className="py-3.5 px-2.5 -mx-2.5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group hover:bg-surface-subtle/70 transition-all"
              >
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${priorityInfo.bgClass} ${priorityInfo.textClass} ${priorityInfo.borderClass}`}
                    >
                      {priorityInfo.icon}
                      <span>{priorityInfo.label}</span>
                    </span>

                    <span className="font-mono text-[10px] font-bold text-muted-foreground bg-surface-subtle px-1.5 py-0.5 rounded border border-border/60">
                      {formatTicketId(task)}
                    </span>

                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    <span className="font-semibold text-foreground/80">{clientName}</span>
                    <span>•</span>
                    <span className="truncate max-w-[140px]">{productName}</span>
                    {(() => {
                      const allAssignees = [
                        ...(task.assignedTo ? [task.assignedTo] : []),
                        ...(task.assignees?.map((a) => a.user).filter((u): u is { id: string; name: string } => Boolean(u && u.id !== task.assignedTo?.id)) ?? []),
                      ];
                      if (allAssignees.length === 0) return null;
                      if (allAssignees.length === 1) {
                        return (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-foreground/90">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium truncate max-w-[120px]">{allAssignees[0].name}</span>
                            </span>
                          </>
                        );
                      }
                      return (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-foreground/90">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[120px]">{allAssignees[0].name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                              +{allAssignees.length - 1}
                            </span>
                          </span>
                        </>
                      );
                    })()}
                    {(() => {
                      const allReviewers = [
                        ...(task.reviewer ? [task.reviewer] : []),
                        ...(task.reviewers?.map((r) => r.user).filter((u): u is { id: string; name: string } => Boolean(u && u.id !== task.reviewer?.id)) ?? []),
                      ];
                      if (allReviewers.length === 0) return null;
                      return (
                        <>
                          <span>•</span>
                          <span
                            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                            title={`Reviewer${allReviewers.length > 1 ? "s" : ""}: ${allReviewers.map((r) => r.name).join(", ")}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-semibold text-[10px]">Rev:</span>
                            <span className="font-medium truncate max-w-[100px]">{allReviewers[0].name}</span>
                            {allReviewers.length > 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                +{allReviewers.length - 1}
                              </span>
                            )}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {task.status === "BLOCKED" && task.blockedReason && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        <strong>Reason:</strong> {task.blockedReason}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {dueDateFormatted && (
                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                        isOverdue
                          ? "bg-red-500/10 text-red-600 border-red-500/20 font-bold"
                          : "bg-surface-subtle text-muted-foreground border-border/60"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {dueDateFormatted} {isOverdue && "(Overdue)"}
                    </span>
                  )}

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-surface-subtle border border-border/60 text-foreground">
                    {task.status.replace(/_/g, " ")}
                  </span>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
