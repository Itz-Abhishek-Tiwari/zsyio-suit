"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@zsyio/ui";
import {
  Mail,
  CheckCircle2,
  Clock,
  Zap,
  Briefcase,
  Layers,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useGetTasksQuery } from "@/store/api/tasksApi";
import type { WorkloadUserEntry } from "@/store/api/reportsApi";
import { Skeleton } from "@zsyio/ui";

import { TaskPriorityBadge, TaskStatusBadge } from "@/components/tasks/TaskBadges";
import { UserRoleBadge } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { KpiCard } from "@zsyio/ui";



interface UserWorkloadModalProps {
  userEntry: WorkloadUserEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserWorkloadModal({
  userEntry,
  isOpen,
  onClose,
}: UserWorkloadModalProps) {
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "OVERDUE" | "DONE">("ALL");

  const userId = userEntry?.user.id;
  const { data: tasksData, isLoading } = useGetTasksQuery(
    { assignedToId: userId, pageSize: 100 },
    { skip: !isOpen || !userId }
  );

  const {
    user,
    totalTasks = 0,
    doneTasks = 0,
    activeTasks = (totalTasks - doneTasks),
    overdueTasks = 0,
    completionRate = 0,
  } = userEntry ?? {};

  // Capacity Band Helper
  const capacity = useMemo(() => {
    if (activeTasks >= 7) return { label: "Overloaded", color: "bg-red-50 text-red-700 border-red-200/90 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30" };
    if (activeTasks >= 4) return { label: "Heavy Load", color: "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30" };
    if (activeTasks >= 2) return { label: "Optimal Load", color: "bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30" };
    return { label: "Available Bandwidth", color: "bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80" };
  }, [activeTasks]);

  const initials = useMemo(() => {
    if (!user?.name) return "??";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  const allTasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return allTasks.filter((t) => {
      if (filterTab === "ACTIVE") return t.status !== "DONE";
      if (filterTab === "DONE") return t.status === "DONE";
      if (filterTab === "OVERDUE") {
        return (
          t.status !== "DONE" &&
          t.dueDate &&
          new Date(t.dueDate) < now
        );
      }
      return true;
    });
  }, [allTasks, filterTab]);

  if (!userEntry || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[96vw] sm:w-[92vw] max-h-[90vh] overflow-y-auto rounded-3xl p-0 bg-card border-border/80 shadow-2xl flex flex-col">
        <div className="sticky top-0 z-30 bg-card border-b border-border/80 px-6 sm:px-8 py-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-xl font-extrabold text-foreground truncate tracking-tight">
                  {user.name}
                </DialogTitle>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${capacity.color}`}>
                  {capacity.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap font-medium">
                <UserRoleBadge role={user.role} showIcon />
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Active Load"
              value={activeTasks}
              icon={<Zap className="w-4 h-4" />}
              variant="primary"
            />

            <KpiCard
              label="Completed"
              value={doneTasks}
              icon={<CheckCircle2 className="w-4 h-4" />}
              variant="emerald"
            />

            <KpiCard
              label="Overdue"
              value={overdueTasks}
              icon={<Clock className="w-4 h-4" />}
              variant={overdueTasks > 0 ? "rose" : "default"}
            />

            <KpiCard
              label="Completion Rate"
              value={`${completionRate}%`}
              icon={<Layers className="w-4 h-4" />}
              variant="indigo"
            />
          </div>


          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/60 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Work Items ({filteredTasks.length})
              </h4>

              <SegmentedTabs<"ALL" | "ACTIVE" | "OVERDUE" | "DONE">
                value={filterTab}
                onChange={setFilterTab}
                size="sm"
                tabs={[
                  { id: "ALL", label: "All" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "OVERDUE", label: "Overdue", badgeVariant: "rose", count: overdueTasks > 0 ? overdueTasks : undefined },
                  { id: "DONE", label: "Done", badgeVariant: "emerald" },
                ]}
              />
            </div>


            {isLoading ? (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl text-muted-foreground text-xs">
                No tasks found matching the selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTasks.map((task) => {
                  const isTaskOverdue =
                    task.status !== "DONE" &&
                    task.dueDate &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <Link
                      key={task.id}
                      href={`/tasks?taskId=${task.id}`}
                      className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col gap-2 shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TaskPriorityBadge priority={task.priority} />
                          <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {task.title}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <TaskStatusBadge status={task.status} />
                          <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-medium">
                        <span className="flex items-center gap-1.5 truncate max-w-[50%]">
                          <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {task.product?.name ?? "General Work Item"}
                          </span>
                        </span>

                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 shrink-0 ${
                              isTaskOverdue ? "text-primary font-bold" : ""
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                            {isTaskOverdue && " (Overdue)"}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

