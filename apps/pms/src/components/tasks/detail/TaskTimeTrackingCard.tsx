"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  Plus,
  Loader2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  History,
  Zap,
} from "lucide-react";
import { Button, Input, Badge } from "@zsyio/ui";
import {
  useGetActiveTimerQuery,
  useCreateTimeEntryMutation,
  useStopTimeEntryMutation,
} from "@/store/api/timeEntriesApi";
import { ManualTimeEntryModal } from "../modal/ManualTimeEntryModal";
import type { Task } from "@zsyio/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskTimeTrackingCardProps {
  task: Task;
  canEdit: boolean;
  onUpdateEstimatedHours?: (hours: number | null) => Promise<void>;
  onViewTimeLogs?: () => void;
}

export function TaskTimeTrackingCard({
  task,
  canEdit,
  onUpdateEstimatedHours,
  onViewTimeLogs,
}: TaskTimeTrackingCardProps) {
  const { data: activeTimerData, isLoading: isLoadingTimer } = useGetActiveTimerQuery();
  const [createTimeEntry, { isLoading: isStarting }] = useCreateTimeEntryMutation();
  const [stopTimeEntry, { isLoading: isStopping }] = useStopTimeEntryMutation();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState(
    task.estimatedHours !== null && task.estimatedHours !== undefined
      ? String(task.estimatedHours)
      : ""
  );
  const [quickLogging, setQuickLogging] = useState<number | null>(null);

  const activeEntry = activeTimerData?.active;
  const isThisTaskActive = activeEntry?.taskId === task.id;
  const isOtherTaskActive = Boolean(activeEntry && activeEntry.taskId !== task.id);

  // Real-time ticking stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isThisTaskActive || !activeEntry?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeEntry.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isThisTaskActive, activeEntry?.startedAt]);

  const formatStopwatch = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const actualHours = Number((task.actualHours ?? 0).toFixed(1));
  const estimatedHours = task.estimatedHours ? Number(task.estimatedHours.toFixed(1)) : 0;
  const progressRatio = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0;
  const isOverBudget = estimatedHours > 0 && actualHours > estimatedHours;
  const isNearBudget = estimatedHours > 0 && progressRatio >= 80 && !isOverBudget;
  const remainingHours = estimatedHours > 0 ? Math.max(0, Number((estimatedHours - actualHours).toFixed(1))) : 0;
  const overrunHours = isOverBudget ? Number((actualHours - estimatedHours).toFixed(1)) : 0;

  const handleStartTimer = async () => {
    try {
      await createTimeEntry({
        taskId: task.id,
      }).unwrap();
      toast.success("Stopwatch started for this task!");
    } catch {
      toast.error("Failed to start stopwatch.");
    }
  };

  const handleStopTimer = async () => {
    if (!activeEntry) return;
    try {
      await stopTimeEntry({
        entryId: activeEntry.id,
        taskId: task.id,
      }).unwrap();
      toast.success("Work session logged and saved!");
    } catch {
      toast.error("Failed to stop timer.");
    }
  };

  const handleSaveEstimate = async () => {
    if (!onUpdateEstimatedHours) return;
    const val = estimateInput.trim() ? parseFloat(estimateInput) : null;
    if (val !== null && (isNaN(val) || val < 0)) {
      toast.error("Please enter a valid positive number of hours.");
      return;
    }
    try {
      await onUpdateEstimatedHours(val);
      setIsEditingEstimate(false);
      toast.success("Estimate updated.");
    } catch {
      toast.error("Failed to update estimate.");
    }
  };

  const handleQuickLog = async (minutes: number) => {
    setQuickLogging(minutes);
    try {
      const now = new Date();
      const start = new Date(now.getTime() - minutes * 60 * 1000);
      await createTimeEntry({
        taskId: task.id,
        startedAt: start.toISOString(),
        endedAt: now.toISOString(),
        durationMin: minutes,
        description: `Quick log (+${minutes < 60 ? `${minutes}m` : `${minutes / 60}h`})`,
        isBillable: true,
      }).unwrap();
      toast.success(`Logged +${minutes < 60 ? `${minutes}m` : `${minutes / 60}h`} to task.`);
    } catch {
      toast.error("Failed to log time.");
    } finally {
      setQuickLogging(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border/80 shadow-sm p-4 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-200 bg-card">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold   text-foreground font-display">
                Time Tracking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Health pill */}
            {isOverBudget ? (
              <Badge
                variant="destructive"
                className="text-xs py-0 px-1.5 font-mono font-semibold flex items-center gap-1"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>+{overrunHours}h Over</span>
              </Badge>
            ) : isNearBudget ? (
              <Badge
                variant="secondary"
                className="text-xs py-0 px-1.5 font-mono font-semibold bg-warning/15 text-warning border-warning/30"
              >
                <span>{Math.round(progressRatio)}% Burned</span>
              </Badge>
            ) : estimatedHours > 0 ? (
              <Badge
                variant="secondary"
                className="text-xs py-0 px-1.5 font-mono font-semibold bg-success/15 text-success border-success/30"
              >
                <span>On Track</span>
              </Badge>
            ) : null}

            {onViewTimeLogs && (
              <button
                type="button"
                onClick={onViewTimeLogs}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted"
                title="View full session logs ledger"
              >
                <History className="w-3 h-3 text-muted-foreground" />
                <span>Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 bg-muted/40 border border-border/50 rounded-lg p-2.5 text-center">
          {/* Actual Logged */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-semibold   text-muted-foreground/80">
              Logged
            </span>
            <span className="font-mono text-sm font-semibold text-foreground mt-0.5">
              {actualHours}h
            </span>
          </div>

          {/* Estimate with quick inline edit */}
          <div className="flex flex-col items-center justify-center border-x border-border/50 px-1">
            <span className="text-xs font-semibold   text-muted-foreground/80">
              Estimate
            </span>
            {isEditingEstimate ? (
              <div className="flex items-center gap-0.5 mt-0.5">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimateInput}
                  onChange={(e) => setEstimateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEstimate();
                    if (e.key === "Escape") setIsEditingEstimate(false);
                  }}
                  className="w-12 h-5 text-xs px-1 font-mono text-center"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveEstimate}
                  className="p-0.5 text-success hover:text-success cursor-pointer"
                  title="Save estimate"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingEstimate(false)}
                  className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {estimatedHours > 0 ? `${estimatedHours}h` : "-"}
                </span>
                {canEdit && onUpdateEstimatedHours && (
                  <button
                    type="button"
                    onClick={() => {
                      setEstimateInput(estimatedHours ? String(estimatedHours) : "");
                      setIsEditingEstimate(true);
                    }}
                    className="text-muted-foreground/50 hover:text-primary p-0.5 rounded cursor-pointer transition-colors"
                    title="Click to edit estimate"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Remaining or Overrun */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-semibold   text-muted-foreground/80">
              {isOverBudget ? "Overrun" : "Remaining"}
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold mt-0.5",
                isOverBudget
                  ? "text-destructive"
                  : estimatedHours > 0
                  ? "text-success"
                  : "text-muted-foreground"
              )}
            >
              {isOverBudget
                ? `+${overrunHours}h`
                : estimatedHours > 0
                ? `${remainingHours}h`
                : "-"}
            </span>
          </div>
        </div>

        {/* Progress Burn Bar */}
        {estimatedHours > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/40">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-150",
                  isOverBudget
                    ? "bg-destructive shadow-xs "
                    : isNearBudget
                    ? "bg-warning shadow-xs "
                    : "shadow-xs  bg-primary"
                )}
                style={{ width: `${Math.min(100, Math.round(progressRatio))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>{Math.round(progressRatio)}% burned</span>
              <span>
                {isOverBudget
                  ? `Exceeded by ${overrunHours}h`
                  : `${remainingHours}h budget left`}
              </span>
            </div>
          </div>
        )}

        {/* Stopwatch & Action Section */}
        <div className="flex flex-col gap-2 pt-0.5">
          {isThisTaskActive ? (
            /* Active Live Stopwatch Display */
            <div className="rounded-lg border border-success/40 p-3 flex items-center justify-between shadow-xs bg-success/10">
              <div className="flex items-center gap-2.5">
                {/* Live pulsing radar dot */}
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className=" absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                </div>

                {/* Animated micro audio bars indicator */}
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 bg-success animate-pulse rounded-full h-2" />
                  <span className="w-0.5 bg-success animate-pulse delay-75 rounded-full h-3.5" />
                  <span className="w-0.5 bg-success animate-pulse delay-150 rounded-full h-2.5" />
                </div>

                <div className="flex flex-col">
                  <span className="font-mono text-base font-semibold text-foreground  leading-none">
                    {formatStopwatch(elapsedSeconds)}
                  </span>
                  <span className="text-xs text-success font-medium">
                    Tracking live session...
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleStopTimer}
                disabled={isStopping}
                className="h-8 text-xs font-semibold gap-1.5 px-3 shadow-xs  transition-transform"
              >
                {isStopping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3 h-3 fill-current" />
                )}
                <span>Stop &amp; Save</span>
              </Button>
            </div>
          ) : (
            /* Idle Actions: Start Timer & Log Time */
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleStartTimer}
                  disabled={isStarting || isLoadingTimer}
                  className="h-8.5 text-xs font-semibold gap-1.5 border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-foreground transition-all shadow-2xs"
                  title={
                    isOtherTaskActive
                      ? `Will stop timer on other task and start tracking this ticket`
                      : "Start active stopwatch"
                  }
                >
                  {isStarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-primary fill-primary/40" />
                  )}
                  <span>{isOtherTaskActive ? "Switch Timer" : "Start Timer"}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsManualModalOpen(true)}
                  className="h-8.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Log Time</span>
                </Button>
              </div>

              {/* Quick Log Presets Row (+15m, +30m, +1h) */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-warning" />
                  Quick Log:
                </span>

                <div className="flex items-center gap-1">
                  {[
                    { label: "+15m", mins: 15 },
                    { label: "+30m", mins: 30 },
                    { label: "+1h", mins: 60 },
                  ].map((preset) => (
                    <button
                      key={preset.mins}
                      type="button"
                      disabled={quickLogging !== null}
                      onClick={() => handleQuickLog(preset.mins)}
                      className="px-2 py-0.5 rounded text-xs font-mono font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border/50 transition-colors disabled:opacity-50 cursor-pointer "
                    >
                      {quickLogging === preset.mins ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin inline" />
                      ) : (
                        preset.label
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isOtherTaskActive && !isThisTaskActive && (
            <div className="text-xs text-warning bg-warning/10 px-2.5 py-1.5 rounded-md border border-warning/20 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-warning" />
              <span>
                Stopwatch active on another task. Starting here will automatically stop and save that session.
              </span>
            </div>
          )}
        </div>
      </div>

      <ManualTimeEntryModal
        taskId={task.id}
        open={isManualModalOpen}
        onOpenChange={setIsManualModalOpen}
      />
    </>
  );
}
