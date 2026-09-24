"use client";

import { useState, useEffect, memo } from "react";
import { Button, KpiCard, TimesheetStatusBadge, Skeleton } from "@zsyio/ui";
import {
  Play,
  Square,
  Coffee,
  Clock,
  Timer,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  useGetTimesheetStatusQuery,
  useClockInMutation,
  useClockOutMutation,
  useEndOooMutation,
  type TimesheetStatusResponse,
} from "@/store/api/timesheetApi";
import { formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import { StartOooModal } from "./modals/StartOooModal";
import { RegularizeAttendanceModal } from "./modals/RegularizeAttendanceModal";
import { toast } from "sonner";

function formatStopwatch(totalSec: number) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

const LiveStopwatch = memo(function LiveStopwatch({
  startTime,
  isActive,
}: {
  startTime?: string | null;
  isActive: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }
    const startMs = new Date(startTime).getTime();
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, isActive]);

  if (!isActive || !startTime) {
    return <span>--:--:--</span>;
  }
  return <span>{formatStopwatch(elapsed)}</span>;
});

interface TodayStatusCardProps {
  initialData?: TimesheetStatusResponse | null;
  loading?: boolean;
}

export function TodayStatusCard({ initialData, loading: propLoading }: TodayStatusCardProps = {}) {
  const { timeZone, timeZoneConfig, formatTime } = useTimeZone();
  const { data: fetchedData, isLoading: queryLoading } = useGetTimesheetStatusQuery(undefined, {
    skip: !!initialData,
  });
  const statusData = initialData || fetchedData;
  const isLoading = propLoading !== undefined ? propLoading : (queryLoading && !statusData);

  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();
  const [endOoo, { isLoading: isEndingOoo }] = useEndOooMutation();

  const [startOooOpen, setStartOooOpen] = useState(false);
  const [regularizeOpen, setRegularizeOpen] = useState(false);

  const handleClockIn = async () => {
    try {
      await clockIn().unwrap();
      toast.success("Clocked in successfully. Working session started!");
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut().unwrap();
      toast.success("Clocked out successfully. Working session completed!");
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to clock out.");
    }
  };

  const handleEndOoo = async () => {
    try {
      await endOoo().unwrap();
      toast.success("Break ended. You are back to Working status!");
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e?.data?.error?.message || "Failed to end break.");
    }
  };

  if (isLoading || !statusData) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card/95 dark:bg-card/75 p-6 sm:p-7 shadow-xs before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-emerald-500 before:via-emerald-400/70 before:to-transparent">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl w-full">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="h-12 w-52 rounded-md" />
              <Skeleton className="h-3.5 w-72 rounded-md" />
              <div className="pt-2 space-y-2">
                <Skeleton className="h-3.5 w-48 rounded-md" />
                <Skeleton className="h-2 w-full max-w-md rounded-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Skeleton className="h-11 w-32 rounded-md" />
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-border/60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-md border border-border/60 bg-surface-subtle/50 space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { state, todayWorkedMinutes, todayOooMinutes, todayTotalSessionMinutes } = statusData;

  const activeStartTime =
    state === "OOO" && statusData.activeOooSession
      ? statusData.activeOooSession.startTime
      : state === "WORKING" && statusData.activeWorkSession
      ? statusData.activeWorkSession.startTime
      : null;

  const todayFormattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date());

  return (
    <div className="space-y-4">
      {/* Punch Console Hero */}
      <div className="relative overflow-hidden rounded-lg border border-border/80 bg-card/95 dark:bg-card/75 backdrop-blur-xl p-6 sm:p-7 shadow-xs before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-emerald-500 before:via-emerald-400/70 before:to-transparent dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_0%_0%,rgba(16,185,129,0.09),transparent_65%)] pointer-events-none" />
        <div className="absolute right-0 top-0 w-80 h-full opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none [mask-image:linear-gradient(to_left,white,transparent)] z-0" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left Column: Greeting, Live Status, and Timer Display */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5" suppressHydrationWarning>
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{todayFormattedDate}</span>
                <span className="text-[10px] font-mono font-bold bg-surface-subtle px-1.5 py-0.5 rounded border border-border/70 text-muted-foreground">
                  {timeZoneConfig.flag} {timeZoneConfig.code}
                </span>
              </span>
              <span className="text-muted-foreground/50">•</span>
              <TimesheetStatusBadge status={state} size="sm" />

              {state === "OOO" && statusData.activeOooSession?.reason && (
                <span className="text-xs text-muted-foreground italic bg-surface-subtle px-2 py-0.5 rounded-md border border-border/60">
                  &ldquo;{statusData.activeOooSession.reason}&rdquo;
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-foreground drop-shadow-xs"
                  suppressHydrationWarning
                >
                  <LiveStopwatch startTime={activeStartTime} isActive={state !== "CLOCKED_OUT"} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {state === "WORKING"
                    ? "Current Working Session"
                    : state === "OOO"
                    ? "Break Duration"
                    : "Not Clocked In"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {state === "WORKING" && statusData.activeWorkSession
                  ? `Active session started at ${formatTime(statusData.activeWorkSession.startTime)} (${timeZoneConfig.code})`
                  : state === "OOO" && statusData.activeOooSession
                  ? `Break started at ${formatTime(statusData.activeOooSession.startTime)} (${timeZoneConfig.code})`
                  : "You are currently off the clock. Click Clock In to begin tracking your hours."}
              </p>

              {/* Zoho-style Daily Shift & Target Hours Progress */}
              <div className="pt-2.5 space-y-1.5 max-w-md">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Standard 8h Shift:</span>
                    <span className="font-mono font-bold text-primary">
                      {formatDuration(todayWorkedMinutes)} / 8h 00m
                    </span>
                    <span className="text-muted-foreground font-mono">({Math.min(100, Math.round((todayWorkedMinutes / 480) * 100))}%)</span>
                  </div>

                  {todayWorkedMinutes >= 480 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-2xs">
                      <TrendingUp className="w-3 h-3" />
                      {todayWorkedMinutes > 480 ? `+${formatDuration(todayWorkedMinutes - 480)} Overtime` : "Target Met"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDuration(480 - todayWorkedMinutes)} remaining
                    </span>
                  )}
                </div>

                <div className="h-2 w-full rounded-sm bg-surface-subtle border border-border/70 overflow-hidden relative">
                  <div
                    className={`h-full rounded-sm transition-all duration-500 ${
                      todayWorkedMinutes >= 480
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-primary to-sky-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.round((todayWorkedMinutes / 480) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {state === "CLOCKED_OUT" ? (
              <Button
                size="lg"
                onClick={handleClockIn}
                disabled={isClockingIn}
                className="h-11 px-6 rounded-md gap-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {isClockingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Clock In Now</span>
              </Button>
            ) : state === "WORKING" ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStartOooOpen(true)}
                  className="h-11 px-4 rounded-md gap-2 font-semibold text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
                >
                  <Coffee className="w-4 h-4 text-amber-500" />
                  <span>Take Break</span>
                </Button>
                <Button
                  size="lg"
                  onClick={handleClockOut}
                  disabled={isClockingOut}
                  className="h-11 px-6 rounded-md gap-2 font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                >
                  {isClockingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 fill-white" />
                  )}
                  <span>Clock Out</span>
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={handleEndOoo}
                disabled={isEndingOoo}
                className="h-11 px-6 rounded-md gap-2 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
              >
                {isEndingOoo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>End Break & Resume Work</span>
              </Button>
            )}

            {/* Regularization Action */}
            <div className="flex items-center pl-0 sm:pl-2 sm:border-l border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegularizeOpen(true)}
                className="h-9 px-3 text-xs font-semibold gap-1.5 rounded-md hover:bg-surface-elevated border-border/80 text-foreground shadow-2xs transition-all"
                title="Request Attendance Regularization"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Regularize Attendance</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Standardized KpiCard Metrics from @zsyio/ui */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Actual Work"
          value={formatDuration(todayWorkedMinutes)}
          variant="emerald"
          icon={<Clock className="w-5 h-5" />}
          subtext={`Net time excluding ${formatDuration(todayOooMinutes)} breaks`}
        />

        <KpiCard
          label="Total Breaks"
          value={formatDuration(todayOooMinutes)}
          variant="amber"
          icon={<Coffee className="w-5 h-5" />}
          subtext="Deducted from daily work total"
        />

        <KpiCard
          label="Total Session Span"
          value={formatDuration(todayTotalSessionMinutes)}
          variant="sky"
          icon={<Timer className="w-5 h-5" />}
          subtext="First In to Last Out span"
        />

        <KpiCard
          label="Attendance Status"
          value={state === "WORKING" ? "Working" : state === "OOO" ? "On Break" : "Clocked Out"}
          variant={state === "WORKING" ? "emerald" : state === "OOO" ? "amber" : "default"}
          icon={<CheckCircle2 className="w-5 h-5" />}
          subtext={
            statusData.incompleteSessions?.length > 0
              ? `${statusData.incompleteSessions.length} incomplete punch pending`
              : "All punches logged cleanly"
          }
        />
      </div>

      {/* Modals */}
      <StartOooModal open={startOooOpen} onOpenChange={setStartOooOpen} />
      <RegularizeAttendanceModal open={regularizeOpen} onOpenChange={setRegularizeOpen} />
    </div>
  );
}
