"use client";

import React, { useState, useEffect } from "react";
import { Clock, Square, Loader2 } from "lucide-react";
import { Button } from "@zsyio/ui";
import {
  useGetActiveTimerQuery,
  useStopTimeEntryMutation,
} from "@/store/api/timeEntriesApi";
import { formatTicketId } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export function GlobalActiveTimerWidget() {
  const { data, isLoading } = useGetActiveTimerQuery(undefined, {
    pollingInterval: 30000, // Re-check every 30s
    skipPollingIfUnfocused: true,
  });
  const [stopTimer, { isLoading: isStopping }] = useStopTimeEntryMutation();

  const activeEntry = data?.active;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeEntry?.startedAt) {
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
  }, [activeEntry?.startedAt]);

  if (isLoading || !activeEntry) {
    return null;
  }

  const formatStopwatch = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const shortId = activeEntry.task ? formatTicketId(activeEntry.task) : "TASK";

  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await stopTimer({
        entryId: activeEntry.id,
        taskId: activeEntry.taskId,
      }).unwrap();
      toast.success("Timer stopped and session saved!");
    } catch {
      toast.error("Failed to stop timer.");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in pointer-events-auto">
      <div className="flex items-center gap-3 bg-card/95 dark:bg-card/90 backdrop-blur-md border border-success/40 rounded-full py-1.5 pl-3.5 pr-1.5 shadow-md ring-1 ring-success/20 hover:border-success/70 transition-all duration-150">
        {/* Pulsing indicator */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className=" absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
        </span>

        {/* Task link and title */}
        <Link
          href={`/tasks?taskId=${activeEntry.taskId}`}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors max-w-[200px] truncate"
          title={`Active on: ${activeEntry.task?.title || "Task"}`}
        >
          <span className="font-mono font-semibold text-success shrink-0">
            {shortId}
          </span>
          <span className="truncate text-muted-foreground">{activeEntry.task?.title}</span>
        </Link>

        {/* Monospace Digital Counter */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground bg-success/10 px-2.5 py-0.5 rounded-full border border-success/30 shrink-0 ">
          <Clock className="w-3 h-3 text-success" />
          <span>{formatStopwatch(elapsedSeconds)}</span>
        </div>

        {/* Stop button */}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleStop}
          disabled={isStopping}
          className="h-7 w-7 p-0 rounded-full shadow-2xs shrink-0 cursor-pointer  transition-transform"
          title="Stop & Log Timer"
        >
          {isStopping ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Square className="w-2.5 h-2.5 fill-current" />
          )}
        </Button>
      </div>
    </div>
  );
}
