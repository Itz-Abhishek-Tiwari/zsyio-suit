"use client";

import { useMemo } from "react";
import { formatDuration } from "@zsyio/ui";
import { Calendar, Clock } from "lucide-react";
import { useGetMonthlyTimesheetQuery, type MonthlyTimesheetResponse } from "@/store/api/timesheetApi";

interface WeekAttendanceBarometerProps {
  initialMonthlyData?: MonthlyTimesheetResponse | null;
  loading?: boolean;
}

export function WeekAttendanceBarometer({
  initialMonthlyData,
  loading: propLoading,
}: WeekAttendanceBarometerProps = {}) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const monthStr = `${yyyy}-${mm}`;

  const { data: fetchedMonthlyData, isLoading: queryLoading } = useGetMonthlyTimesheetQuery(
    { month: monthStr },
    { skip: !!initialMonthlyData }
  );

  const monthlyData = initialMonthlyData || fetchedMonthlyData;
  const isLoading = propLoading !== undefined ? propLoading : (queryLoading && !monthlyData);

  // Compute current week's days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const current = new Date();
    const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const currentYyyy = current.getFullYear();
    const currentMm = String(current.getMonth() + 1).padStart(2, "0");
    const currentDd = String(current.getDate()).padStart(2, "0");
    const todayStr = `${currentYyyy}-${currentMm}-${currentDd}`;

    const monday = new Date(current.getFullYear(), current.getMonth(), current.getDate() + distanceToMon);

    const days = [];
    const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;
      const isWeekend = i >= 5;

      const monthlyItem = monthlyData?.days.find((m) => m.date === dateStr);

      let resolvedStatus = monthlyItem?.status;
      if (!resolvedStatus || (resolvedStatus === "UPCOMING" && isPast)) {
        if (isWeekend) {
          resolvedStatus = "WEEKEND";
        } else if (isPast) {
          resolvedStatus = "ABSENT";
        } else {
          resolvedStatus = "UPCOMING";
        }
      }

      days.push({
        name: DAY_NAMES[i],
        dayNumber: d.getDate(),
        date: dateStr,
        isToday,
        isPast,
        isFuture,
        isWeekend,
        workedMinutes: monthlyItem?.netWorkingMinutes || 0,
        status: resolvedStatus,
      });
    }

    return days;
  }, [monthlyData]);

  const totalWeekMinutes = weekDays.reduce((acc, d) => acc + d.workedMinutes, 0);
  const targetWeekMinutes = 40 * 60; // 2400 minutes
  const progressPercent = Math.min(100, Math.round((totalWeekMinutes / targetWeekMinutes) * 100));

  if (isLoading) {
    return (
      <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-40 bg-surface-subtle animate-pulse rounded" />
            <div className="h-3 w-56 bg-surface-subtle animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-surface-subtle/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg bg-card border border-border/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Week Attendance Barometer</h3>
            <p className="text-[11px] text-muted-foreground">
              Monday – Sunday shift rhythm & accumulated weekly hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-foreground">{formatDuration(totalWeekMinutes)}</span>
            <span className="text-muted-foreground">/ 40h Target</span>
          </div>

          <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-md bg-primary-light border border-primary/20">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Week Day Pills */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          let bgClass = "bg-surface-subtle/50 border-border/70 text-muted-foreground";
          let statusText = d.isWeekend ? "Weekend" : d.isFuture ? "Upcoming" : "Off";

          if (d.isToday) {
            bgClass =
              "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary/30";
            statusText = d.workedMinutes > 0 ? formatDuration(d.workedMinutes) : "Today";
          } else if (d.workedMinutes >= 480) {
            bgClass =
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
            statusText = formatDuration(d.workedMinutes);
          } else if (d.workedMinutes > 0) {
            bgClass = "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
            statusText = formatDuration(d.workedMinutes);
          } else if (d.isWeekend) {
            bgClass = "bg-surface-subtle/30 border-dashed border-border/50 text-muted-foreground/60";
            statusText = "Off";
          }

          return (
            <div
              key={d.date}
              className={`p-2.5 rounded-md border flex flex-col items-center justify-between text-center transition-all ${bgClass}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {d.name}
              </span>
              <span className="text-sm font-extrabold my-0.5">{d.dayNumber}</span>
              <span className="text-[9px] font-mono font-semibold truncate max-w-full">
                {statusText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
