"use client";

import React, { useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
  Timer,
} from "lucide-react";
import { Button, Badge, UserAvatar, ConfirmDialog } from "@zsyio/ui";
import {
  useGetTimeEntriesQuery,
  useDeleteTimeEntryMutation,
} from "@/store/api/timeEntriesApi";
import { ManualTimeEntryModal } from "../modal/ManualTimeEntryModal";
import type { Task, TaskTimeEntry } from "@zsyio/types";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { can } from "@zsyio/auth/permissions";
import { cn } from "@/lib/utils";

interface TaskTimeLogsTabProps {
  task: Task;
  canEdit: boolean;
}

function formatDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDecimalHours(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "0.0h";
  return `${(minutes / 60).toFixed(1)}h`;
}

function formatTime(isoString?: string | null) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString?: string | null) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TaskTimeLogsTab({ task, canEdit }: TaskTimeLogsTabProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const { data: entries = [], isLoading } = useGetTimeEntriesQuery(task.id);
  const [deleteTimeEntry, { isLoading: isDeleting }] = useDeleteTimeEntryMutation();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TaskTimeEntry | null>(null);

  const totalMinutes = entries.reduce((acc, e) => acc + (e.durationMin || 0), 0);
  const billableMinutes = entries
    .filter((e) => e.isBillable)
    .reduce((acc, e) => acc + (e.durationMin || 0), 0);
  const billablePercent = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 100;
  const avgSessionMinutes = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      await deleteTimeEntry({
        entryId: entryToDelete.id,
        taskId: task.id,
      }).unwrap();
      toast.success("Time log entry deleted.");
      setEntryToDelete(null);
    } catch {
      toast.error("Failed to delete time log.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Top 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Effort Card */}
          <div className="rounded-lg border border-border/80 p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   font-display">
                Total Effort Logged
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-foreground">
                {formatDuration(totalMinutes)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({formatDecimalHours(totalMinutes)})
              </span>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {task.estimatedHours ? (
                <span>
                  Budget: <strong className="text-foreground font-mono">{task.estimatedHours}h</strong> est.
                </span>
              ) : (
                <span>Recorded across {entries.length} logged sessions</span>
              )}
            </div>
          </div>

          {/* Billable Ratio Card */}
          <div className="rounded-lg border border-border/80 p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   font-display">
                Billable Time
              </span>
              <div className="p-2 rounded-lg bg-success/10 text-success border border-success/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-semibold text-success">
                {formatDuration(billableMinutes)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({billablePercent}% of total)
              </span>
            </div>

            {/* Billable vs Non-Billable Mini Ratio Bar */}
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-success h-full rounded-full transition-all duration-150"
                  style={{ width: `${billablePercent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {billablePercent}%
              </span>
            </div>
          </div>

          {/* Sessions & Quick Action Card */}
          <div className="rounded-lg border border-border/80 p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   font-display">
                Work Sessions
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Timer className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold text-foreground">
                  {entries.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">sessions</span>
              </div>

              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsManualModalOpen(true)}
                  className="h-7 text-xs font-semibold gap-1 shadow-2xs rounded-lg px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Time</span>
                </Button>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {entries.length > 0 ? (
                <span>Avg: ~{formatDuration(avgSessionMinutes)} per session</span>
              ) : (
                <span>No sessions tracked yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Ledger Header & Entries */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold   text-muted-foreground font-display">
                Session Ledger
              </h4>
              <Badge variant="secondary" className="font-mono text-xs py-0 px-1.5">
                {entries.length}
              </Badge>
            </div>

            {entries.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                Showing all time records
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            /* Professional Empty State */
            <div className="rounded-lg border border-dashed border-border/80 p-10 text-center flex flex-col items-center justify-center gap-3.5 bg-card/40">
              <div className="p-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-xs">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-sm font-semibold text-foreground font-display">
                  No work sessions logged yet
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start the live stopwatch from the sidebar or record offline work sessions manually to track progress against estimates.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsManualModalOpen(true)}
                className="text-xs font-semibold gap-1.5 mt-2 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log First Session</span>
              </Button>
            </div>
          ) : (
            /* Session List */
            <div className="flex flex-col gap-2.5">
              {entries.map((entry) => {
                const isOwner = user?.id === entry.userId;
                const hasManagePermission = can(user?.role, "task:edit:any", user?.permissions);
                const canDelete = isOwner || hasManagePermission;
                const isRunning = !entry.endedAt;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "rounded-lg border bg-card p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all duration-200 hover:border-border",
                      isRunning
                        ? "border-success/40 bg-success/5 ring-1 ring-success/20"
                        : "border-border/70"
                    )}
                  >
                    {/* Left: User details & Description */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative shrink-0 mt-0.5">
                        {entry.user && <UserAvatar user={entry.user} size="sm" />}
                        {isRunning && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className=" absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {entry.user?.name || "Team Member"}
                          </span>

                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-muted-foreground/60" />
                            {formatDate(entry.startedAt)}
                          </span>

                          {entry.isBillable ? (
                            <Badge
                              variant="secondary"
                              className="text-xs py-0 px-1.5 font-mono font-medium bg-success/10 text-success border border-success/20"
                            >
                              Billable
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs py-0 px-1.5 font-mono font-medium text-muted-foreground"
                            >
                              Non-Billable
                            </Badge>
                          )}

                          {isRunning && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
                              Active Stopwatch
                            </span>
                          )}
                        </div>

                        {entry.description ? (
                          <div className="rounded-md bg-muted/30 border border-border/40 px-2.5 py-1.5 mt-0.5">
                            <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                              {entry.description}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            No work notes provided
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Duration, Time Range & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="flex flex-col items-start sm:items-end font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-semibold text-foreground">
                            {isRunning ? "Tracking..." : formatDuration(entry.durationMin)}
                          </span>
                          {!isRunning && entry.durationMin && entry.durationMin > 0 && (
                            <span className="text-xs text-muted-foreground font-semibold">
                              ({(entry.durationMin / 60).toFixed(1)}h)
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {formatTime(entry.startedAt)}
                          {entry.endedAt && ` → ${formatTime(entry.endedAt)}`}
                        </span>
                      </div>

                      {canDelete && !isRunning && (
                        <button
                          type="button"
                          onClick={() => setEntryToDelete(entry)}
                          className="text-muted-foreground/40 hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete time log entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ManualTimeEntryModal
        taskId={task.id}
        open={isManualModalOpen}
        onOpenChange={setIsManualModalOpen}
      />

      <ConfirmDialog
        open={Boolean(entryToDelete)}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        title="Delete Time Log"
        description="Are you sure you want to remove this logged work session? The task's total actual hours will be recalculated."
        variant="destructive"
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
