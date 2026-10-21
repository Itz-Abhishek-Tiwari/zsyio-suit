"use client";

import { useState, useMemo } from "react";
import { Button, TimesheetStatusBadge } from "@zsyio/ui";
import { ChevronLeft, ChevronRight, Clock, Coffee, TrendingUp, Loader2 } from "lucide-react";
import { useGetMonthlyTimesheetQuery } from "@/store/api/timesheetApi";
import { formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";

interface WeeklyTimesheetTableProps {
  userId?: string;
  onSelectDay?: (date: string) => void;
}

export function WeeklyTimesheetTable({ userId, onSelectDay }: WeeklyTimesheetTableProps) {
  const { formatTime, timeZone, timeZoneConfig, getTodayDateStr } = useTimeZone();
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute Monday date for the selected week offset in active timezone
  const { monday, sunday, monthKey, sunMonthKey } = useMemo(() => {
    const now = new Date();
    const dayStr = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(now);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentDay = dayMap[dayStr] ?? now.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const tzDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const [currY, currM, currD] = tzDateStr.split("-").map(Number);

    const mon = new Date(currY, currM - 1, currD + distanceToMon + weekOffset * 7);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const yyyy = mon.getFullYear();
    const mm = String(mon.getMonth() + 1).padStart(2, "0");

    const sunYyyy = sun.getFullYear();
    const sunMm = String(sun.getMonth() + 1).padStart(2, "0");

    return {
      monday: mon,
      sunday: sun,
      monthKey: `${yyyy}-${mm}`,
      sunMonthKey: `${sunYyyy}-${sunMm}`,
    };
  }, [weekOffset, timeZone]);

  const { data: monthlyData, isLoading: isCurrentLoading } = useGetMonthlyTimesheetQuery({
    month: monthKey,
    userId,
  });

  const { data: nextMonthData, isLoading: isNextLoading } = useGetMonthlyTimesheetQuery(
    { month: sunMonthKey, userId },
    { skip: sunMonthKey === monthKey }
  );

  const isLoading = isCurrentLoading || (sunMonthKey !== monthKey && isNextLoading);

  const allMonthDays = useMemo(() => {
    const days = [...(monthlyData?.days || [])];
    if (nextMonthData?.days && sunMonthKey !== monthKey) {
      days.push(...nextMonthData.days);
    }
    return days;
  }, [monthlyData, nextMonthData, sunMonthKey, monthKey]);

  const weekRows = useMemo(() => {
    const rows = [];
    const DAY_NAMES = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const todayStr = getTodayDateStr();

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const localDateStr = `${yyyy}-${mm}-${dd}`;
      const isWeekend = i >= 5;
      const isPast = localDateStr < todayStr;

      const dayData = allMonthDays.find((item) => item.date === localDateStr);

      let resolvedStatus = dayData?.status;
      if (!resolvedStatus || (resolvedStatus === "UPCOMING" && isPast)) {
        if (isWeekend) {
          resolvedStatus = "WEEKEND";
        } else if (isPast) {
          resolvedStatus = "ABSENT";
        } else {
          resolvedStatus = "UPCOMING";
        }
      }

      rows.push({
        dayName: DAY_NAMES[i],
        date: localDateStr,
        dayNumber: d.getDate(),
        isWeekend,
        firstClockIn: dayData?.firstClockIn || null,
        lastClockOut: dayData?.lastClockOut || null,
        totalOooMinutes: dayData?.totalOooMinutes || 0,
        netWorkingMinutes: dayData?.netWorkingMinutes || 0,
        status: resolvedStatus,
      });
    }

    return rows;
  }, [monday, allMonthDays, getTodayDateStr]);

  const totalWeekMinutes = weekRows.reduce((acc, r) => acc + r.netWorkingMinutes, 0);
  const totalBreakMinutes = weekRows.reduce((acc, r) => acc + r.totalOooMinutes, 0);
  const daysWorked = weekRows.filter((r) => r.netWorkingMinutes > 0).length;
  const overtimeMinutes = Math.max(0, totalWeekMinutes - 40 * 60);

  const formatWeekRange = () => {
    const monStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
    const sunStr = sunday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    });
    return `${monStr} – ${sunStr}`;
  };

  return (
    <div className="space-y-4">
      {/* Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p - 1)}
            className="h-9 w-9 p-0 rounded-md"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className={`h-9 px-3.5 rounded-md text-xs font-semibold ${
              weekOffset === 0 ? "bg-primary-light border-primary/30 text-primary font-semibold" : ""
            }`}
          >
            This Week
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p + 1)}
            disabled={weekOffset >= 0}
            className="h-9 w-9 p-0 rounded-md"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-xs font-semibold text-foreground ml-2 font-mono" suppressHydrationWarning>
            {formatWeekRange()}
          </span>
        </div>

        {/* Weekly Metric Chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-subtle/80 border border-border/60 text-xs">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Worked:</span>
            <span className="font-semibold text-foreground font-mono">
              {isLoading ? "-" : `${formatDuration(totalWeekMinutes)} (${daysWorked}d)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-subtle/80 border border-border/60 text-xs">
            <Coffee className="w-3.5 h-3.5 text-warning" />
            <span className="text-muted-foreground">Breaks:</span>
            <span className="font-semibold text-foreground font-mono">
              {isLoading ? "-" : formatDuration(totalBreakMinutes)}
            </span>
          </div>

          {overtimeMinutes > 0 && !isLoading && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-success/10 border border-success/25 text-xs text-success font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{formatDuration(overtimeMinutes)} Overtime</span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Table */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-subtle/60 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Day & Date</th>
                <th className="py-3 px-4">
                  First In <span className="text-xs font-mono opacity-75">({timeZoneConfig.code})</span>
                </th>
                <th className="py-3 px-4">
                  Last Out <span className="text-xs font-mono opacity-75">({timeZoneConfig.code})</span>
                </th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-4">Net Worked Hours</th>
                <th className="py-3 px-4">Shift Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading weekly timesheet breakdown...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                weekRows.map((r) => {
                return (
                  <tr
                    key={r.date}
                    className={`hover:bg-surface-subtle/40 transition-colors ${
                      r.isWeekend ? "bg-surface-subtle/20" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{r.dayName}</span>
                        <span className="text-muted-foreground font-mono text-xs" suppressHydrationWarning>
                          {r.date}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-foreground" suppressHydrationWarning>
                      {r.firstClockIn ? formatTime(r.firstClockIn) : "--:--"}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-foreground" suppressHydrationWarning>
                      {r.lastClockOut ? formatTime(r.lastClockOut) : "--:--"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {r.totalOooMinutes > 0 ? formatDuration(r.totalOooMinutes) : "0m"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-semibold px-2 py-0.5 rounded-md ${
                          r.netWorkingMinutes >= 480
                            ? "bg-success/10 text-success"
                            : r.netWorkingMinutes > 0
                            ? "bg-warning/10 text-warning"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDuration(r.netWorkingMinutes)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <TimesheetStatusBadge status={r.status} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {onSelectDay && (
                        <button
                          type="button"
                          onClick={() => onSelectDay(r.date)}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          View Day
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
