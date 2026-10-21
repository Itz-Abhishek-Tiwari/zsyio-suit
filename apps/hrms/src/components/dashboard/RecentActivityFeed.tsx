"use client";

import Link from "next/link";
import { Clock, Briefcase, Coffee, ArrowRight } from "lucide-react";
import { useGetDailyTimesheetQuery, type DailyTimesheetResponse } from "@/store/api/timesheetApi";
import { formatDuration, Skeleton } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import { TimesheetStatusBadge } from "@zsyio/ui";

interface RecentActivityFeedProps {
  initialTimesheet?: DailyTimesheetResponse | null;
  loading?: boolean;
}

export function RecentActivityFeed({
  initialTimesheet,
  loading: propLoading,
}: RecentActivityFeedProps = {}) {
  const { formatTime, getTodayDateStr } = useTimeZone();
  const todayStr = getTodayDateStr();
  const { data: fetchedTimesheet, isLoading: queryLoading } = useGetDailyTimesheetQuery(
    { date: todayStr },
    { skip: !!initialTimesheet }
  );

  const timesheet = initialTimesheet || fetchedTimesheet;
  const isLoading = propLoading !== undefined ? propLoading : (queryLoading && !timesheet);

  const timeline = timesheet?.timeline || [];

  return (
    <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Today&apos;s Activity Feed</h3>
            <p className="text-xs text-muted-foreground">
              Live intervals of logged work and breaks
            </p>
          </div>
        </div>

        <Link
          href="/timeline"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
        >
          <span>Detailed Timeline</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      ) : timeline.length === 0 ? (
        <div className="py-8 text-center space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">No punches recorded yet today.</p>
          <p className="text-xs text-muted-foreground/70">
            Use the Punch Station above to Clock In and begin tracking your session.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {timeline.slice(0, 5).map((item) => {
            const isWork = item.type === "WORK";
            return (
              <div
                key={item.id}
                className={`p-3 rounded-md border flex items-center justify-between gap-3 transition-all ${
                  isWork
                    ? "bg-surface-subtle/40 border-border/70 hover:bg-card"
                    : "bg-warning/5 border-warning/20 hover:bg-warning/10"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                      isWork
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }`}
                  >
                    {isWork ? <Briefcase className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {isWork ? "Work Session" : "Break"}
                      </span>
                      {item.entryType === "MANUAL" && (
                        <TimesheetStatusBadge status="MANUAL" size="xs" />
                      )}
                      {item.status === "ACTIVE" && (
                        <TimesheetStatusBadge status="WORKING" size="xs" customLabel="Active" />
                      )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5" suppressHydrationWarning>
                      <span>{formatTime(item.startTime)}</span>
                      <span>→</span>
                      <span>{item.endTime ? formatTime(item.endTime) : "Ongoing"}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold shrink-0 ${
                    isWork
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {formatDuration(item.durationMinutes)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
