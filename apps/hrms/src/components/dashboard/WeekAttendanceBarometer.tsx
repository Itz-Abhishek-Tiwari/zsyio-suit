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
      <div className="p-5 rounded-md bg-card border border-border shadow-none space-y-4">
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
    <div className="p-5 rounded-md bg-card border border-border shadow-none space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">This week’s attendance</h3>
            <p className="text-xs text-muted-foreground">
              Daily hours, with your weekly total in view.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-foreground">{formatDuration(totalWeekMinutes)}</span>
            <span className="text-muted-foreground">/ 40h Target</span>
          </div>

          <span className="text-xs font-mono font-semibold text-primary px-2 py-0.5 rounded-md bg-primary-light border border-primary/20">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div className="relative pt-3" role="img" aria-label={`Weekly attendance: ${formatDuration(totalWeekMinutes)} worked against a 40 hour target`}>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-3"><span>Hours worked / day</span><span>8h daily target</span></div>
        <div className="relative grid grid-cols-7 gap-2 border-b border-border pb-0">
          <div className="absolute inset-x-0 border-t border-dashed border-border pointer-events-none" style={{bottom: `${480 / Math.max(600, ...weekDays.map(d => d.workedMinutes)) * 96}px`}} />
          {weekDays.map(day => {
            const color = day.workedMinutes >= 480 ? "var(--success)" : day.isToday ? "var(--primary)" : "var(--warning)";
            const maxMinutes = Math.max(600, ...weekDays.map(d => d.workedMinutes));
            return <div key={day.date} tabIndex={0} className="min-w-0 text-center relative group" title={`${day.name}, ${day.date}: ${formatDuration(day.workedMinutes)} · ${day.status}`}>
              <span className="block text-[10px] tabular-nums text-muted-foreground mb-2">{day.workedMinutes ? `${(day.workedMinutes / 60).toFixed(1)}h` : day.isFuture ? "—" : "0h"}</span>
              <div className="h-24 flex items-end justify-center bg-surface-subtle/40">
                <div className="w-full max-w-8 rounded-t-sm transition-opacity group-hover:opacity-75" style={{height: `${Math.max(0, day.workedMinutes) / maxMinutes * 100}%`, backgroundColor:color}} />
              </div>
            </div>;
          })}
        </div>
        <div className="grid grid-cols-7 gap-2 pt-3">
          {weekDays.map(day => <div key={day.date} className={`text-center text-[10px] ${day.isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}><span className="block">{day.name}</span><span className="block mt-1 tabular-nums opacity-70">{day.dayNumber}</span></div>)}
        </div>
      </div>
    </div>
  );
}
