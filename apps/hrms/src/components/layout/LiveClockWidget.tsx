"use client";

import { useState, useEffect } from "react";
import { Button } from "@zsyio/ui";
import { Play, Loader2 } from "lucide-react";
import {
  useGetTimesheetStatusQuery,
  useClockInMutation,
  useClockOutMutation,
  useEndOooMutation,
} from "@/store/api/timesheetApi";
import { StartOooModal } from "../timesheet/modals/StartOooModal";
import { toast } from "sonner";

export function LiveClockWidget() {
  const { data: statusData } = useGetTimesheetStatusQuery();

  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();
  const [endOoo, { isLoading: isEndingOoo }] = useEndOooMutation();
  const [startOooOpen, setStartOooOpen] = useState(false);

  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!statusData) return;

    const getStartTime = () => {
      if (statusData.state === "OOO" && statusData.activeOooSession) {
        return new Date(statusData.activeOooSession.startTime).getTime();
      }
      if (statusData.state === "WORKING" && statusData.activeWorkSession) {
        return new Date(statusData.activeWorkSession.startTime).getTime();
      }
      return null;
    };

    const updateTimer = () => {
      const startMs = getStartTime();
      if (startMs) {
        setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      } else {
        setElapsedSec(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [statusData]);

  if (!statusData) return null;

  const { state } = statusData;

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleClockIn = async () => {
    try {
      await clockIn().unwrap();
      toast.success("Clocked In!");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut().unwrap();
      toast.success("Clocked Out!");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to clock out.");
    }
  };

  const handleEndOoo = async () => {
    try {
      await endOoo().unwrap();
      toast.success("Break Ended!");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || "Failed to end break.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {state === "WORKING" ? (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs">{formatStopwatch(elapsedSec)}</span>
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => setStartOooOpen(true)}
              className="px-2 py-0.5 rounded-lg text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
              title="Start Break"
            >
              Break
            </button>
            <button
              type="button"
              onClick={handleClockOut}
              disabled={isClockingOut}
              className="px-2 py-0.5 rounded-lg text-[11px] bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 transition-colors"
              title="Clock Out"
            >
              {isClockingOut ? <Loader2 className="w-3 h-3 animate-spin" /> : "Out"}
            </button>
          </div>
        </div>
      ) : state === "OOO" ? (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Break: {formatStopwatch(elapsedSec)}</span>
          <button
            type="button"
            onClick={handleEndOoo}
            disabled={isEndingOoo}
            className="px-2 py-0.5 rounded-lg text-[11px] bg-amber-500 text-white hover:bg-amber-600 transition-colors ml-1"
          >
            {isEndingOoo ? <Loader2 className="w-3 h-3 animate-spin" /> : "End"}
          </button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={handleClockIn}
          disabled={isClockingIn}
          className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          {isClockingIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
          <span>Clock In</span>
        </Button>
      )}

      <StartOooModal open={startOooOpen} onOpenChange={setStartOooOpen} />
    </div>
  );
}
