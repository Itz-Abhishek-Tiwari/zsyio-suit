"use client";

import { useState, useMemo } from "react";
import {
  Button,
  KpiCard,
  Progress,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SegmentedTabs,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  EmptyState,
} from "@zsyio/ui";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  CalendarDays,
  Download,
  ShieldCheck,
  CalendarCheck,
  Coffee,
  Sparkles,
  Palmtree,
  ArrowUpRight,
  ListFilter,
  Eye,
} from "lucide-react";
import { useGetMonthlyTimesheetQuery, MonthlyDayItem } from "@/store/api/timesheetApi";
import { formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import { RegularizeAttendanceModal } from "./modals/RegularizeAttendanceModal";

interface MonthlyAttendanceCalendarProps {
  userId?: string;
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
}

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];

type CalendarFilterType = "ALL" | "PRESENT" | "HALF_DAY" | "LEAVE_HOLIDAY" | "ABSENT";

interface PaddingDay {
  date: string;
  dayNumber: number;
  isPadding: true;
  monthStr: string;
}

export function MonthlyAttendanceCalendar({
  userId,
  onSelectDate,
  selectedDate: propSelectedDate,
}: MonthlyAttendanceCalendarProps) {
  const { formatTime, formatDate, timeZone, timeZoneConfig } = useTimeZone();
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [month, setMonth] = useState(currentMonthStr);
  const [activeFilter, setActiveFilter] = useState<CalendarFilterType>("ALL");
  const [viewMode, setViewMode] = useState<string>("GRID");
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [regularizeDate, setRegularizeDate] = useState<string | undefined>(undefined);

  const { data, isLoading } = useGetMonthlyTimesheetQuery({ month, userId });

  const [yearNum, monthNum] = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return [y, m];
  }, [month]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (monthNum === 1) {
      setMonth(`${yearNum - 1}-12`);
    } else {
      setMonth(`${yearNum}-${String(monthNum - 1).padStart(2, "0")}`);
    }
  };

  const handleNextMonth = () => {
    if (monthNum === 12) {
      setMonth(`${yearNum + 1}-01`);
    } else {
      setMonth(`${yearNum}-${String(monthNum + 1).padStart(2, "0")}`);
    }
  };

  const handleCurrentMonth = () => {
    setMonth(currentMonthStr);
  };

  const handleSelectMonth = (newMonthNum: number) => {
    setMonth(`${yearNum}-${String(newMonthNum).padStart(2, "0")}`);
  };

  const handleSelectYear = (newYearNum: number) => {
    setMonth(`${newYearNum}-${String(monthNum).padStart(2, "0")}`);
  };

  // Export report handler
  const handleExport = (format: "csv" | "xlsx") => {
    const totalDays = new Date(yearNum, monthNum, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(totalDays).padStart(2, "0")}`;
    const userParam = userId ? `&userId=${userId}` : "";
    const tzParam = timeZone ? `&timezone=${encodeURIComponent(timeZone)}` : "";
    const url = `/api/timesheet/export?startDate=${startDate}&endDate=${endDate}&format=${format}&type=detailed${userParam}${tzParam}`;
    window.open(url, "_blank");
  };

  // Compute leading padding days from previous month
  const leadingDays = useMemo<PaddingDay[]>(() => {
    const firstDayOfWeek = new Date(Date.UTC(yearNum, monthNum - 1, 1)).getUTCDay();
    // Monday = 0, Sunday = 6
    const leadingCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const prevMonthLastDay = new Date(Date.UTC(yearNum, monthNum - 1, 0)).getUTCDate();
    const pYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const pMonth = monthNum === 1 ? 12 : monthNum - 1;
    const pMonthStr = `${pYear}-${String(pMonth).padStart(2, "0")}`;

    const days: PaddingDay[] = [];
    for (let i = leadingCount - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dStr = `${pMonthStr}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        date: dStr,
        dayNumber: dayNum,
        isPadding: true,
        monthStr: pMonthStr,
      });
    }
    return days;
  }, [yearNum, monthNum]);

  // Compute trailing padding days to fill 35 or 42 grid cells
  const trailingDays = useMemo<PaddingDay[]>(() => {
    const totalDaysInMonth = data?.days.length ?? new Date(yearNum, monthNum, 0).getDate();
    const totalCellsSoFar = leadingDays.length + totalDaysInMonth;
    const totalGridSlots = totalCellsSoFar > 35 ? 42 : 35;
    const trailingCount = totalGridSlots - totalCellsSoFar;

    const nYear = monthNum === 12 ? yearNum + 1 : yearNum;
    const nMonth = monthNum === 12 ? 1 : monthNum + 1;
    const nMonthStr = `${nYear}-${String(nMonth).padStart(2, "0")}`;

    const days: PaddingDay[] = [];
    for (let i = 1; i <= trailingCount; i++) {
      const dStr = `${nMonthStr}-${String(i).padStart(2, "0")}`;
      days.push({
        date: dStr,
        dayNumber: i,
        isPadding: true,
        monthStr: nMonthStr,
      });
    }
    return days;
  }, [yearNum, monthNum, leadingDays.length, data?.days.length]);

  // Filter helper
  const matchesFilter = (day: MonthlyDayItem, filter: CalendarFilterType): boolean => {
    if (filter === "ALL") return true;
    if (filter === "PRESENT") return day.status === "PRESENT" || day.status === "ACTIVE";
    if (filter === "HALF_DAY") return day.status === "HALF_DAY" || day.status === "SHORT_HOURS";
    if (filter === "LEAVE_HOLIDAY") return day.status === "HOLIDAY" || day.status === "ON_LEAVE";
    if (filter === "ABSENT") return day.status === "ABSENT" || day.status === "INCOMPLETE";
    return true;
  };

  // Currently inspected day item
  const inspectedDayItem = useMemo(() => {
    if (!inspectedDate || !data?.days) return null;
    return data.days.find((d) => d.date === inspectedDate) || null;
  }, [inspectedDate, data?.days]);

  // Drawer day navigation
  const handleInspectPrevDay = () => {
    if (!inspectedDayItem || !data?.days) return;
    const currIdx = data.days.findIndex((d) => d.date === inspectedDayItem.date);
    if (currIdx > 0) {
      setInspectedDate(data.days[currIdx - 1].date);
    }
  };

  const handleInspectNextDay = () => {
    if (!inspectedDayItem || !data?.days) return;
    const currIdx = data.days.findIndex((d) => d.date === inspectedDayItem.date);
    if (currIdx >= 0 && currIdx < data.days.length - 1) {
      setInspectedDate(data.days[currIdx + 1].date);
    }
  };

  const formatMonthTitle = `${MONTH_NAMES[monthNum - 1]} ${yearNum}`;

  return (
    <div className="space-y-5">
      {/* Month Toolbar & Quick Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4.5 rounded-lg bg-card border border-border/80 shadow-xs">
        {/* Left: Navigation Buttons & Month/Year Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-9 w-9 p-0 rounded-md"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCurrentMonth}
            className={`h-9 px-3.5 rounded-md text-xs font-semibold ${
              month === currentMonthStr ? "bg-primary-light border-primary/30 text-primary font-bold shadow-xs" : ""
            }`}
          >
            This Month
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-9 w-9 p-0 rounded-md"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Quick Selectors for Month and Year */}
          <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-border/70">
            <Select value={String(monthNum)} onValueChange={(val) => handleSelectMonth(Number(val))}>
              <SelectTrigger className="h-9 w-[125px] rounded-md text-xs font-semibold">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, idx) => (
                  <SelectItem key={name} value={String(idx + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(yearNum)} onValueChange={(val) => handleSelectYear(Number(val))}>
              <SelectTrigger className="h-9 w-[90px] rounded-md text-xs font-semibold">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: View Mode Toggle & Export Menu */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <SegmentedTabs
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            tabs={[
              { id: "GRID", label: "Month Grid", icon: <CalendarDays className="w-3.5 h-3.5" /> },
              { id: "LEDGER", label: "Ledger Table", icon: <ListFilter className="w-3.5 h-3.5" /> },
            ]}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            className="h-9 px-3 rounded-md text-xs font-semibold gap-1.5 cursor-pointer"
            title="Export detailed timesheet CSV for this month"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 rounded-lg bg-card border border-border/80 flex items-center justify-center text-xs text-muted-foreground gap-2.5 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading monthly attendance matrix...</span>
        </div>
      ) : !data ? (
        <div className="p-12 rounded-lg bg-card border border-border/80 text-center shadow-xs">
          <EmptyState
            title="No Attendance Records"
            description={`No attendance or punch logs found for ${formatMonthTitle}.`}
            icon={<CalendarIcon className="w-8 h-8 text-muted-foreground" />}
          />
        </div>
      ) : (
        <>
          {/* Monthly KPI Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Working Days"
              value={`${data.summary.pastWorkingDays} / ${data.summary.totalDays} Days`}
              variant="primary"
              icon={<CalendarIcon className="w-5 h-5" />}
              subtext={`Target: ${data.summary.targetWorkingHours}h standard shift`}
            />

            <KpiCard
              label="Days Present"
              value={`${data.summary.presentDays} Days`}
              variant="emerald"
              icon={<CheckCircle2 className="w-5 h-5" />}
              subtext={`+ ${data.summary.halfDays} half-day • ${data.summary.leaveDays} on leave`}
            />

            <KpiCard
              label="Avg. Daily Hours"
              value={`${data.summary.averageDailyHours} hrs`}
              variant="sky"
              icon={<Clock className="w-5 h-5" />}
              subtext={`${formatDuration(data.summary.totalWorkingMinutes)} total shift logged`}
            />

            <KpiCard
              label="Overtime & Exceptions"
              value={`+${formatDuration(data.summary.totalOvertimeMinutes)}`}
              variant="amber"
              icon={<TrendingUp className="w-5 h-5" />}
              subtext={`${data.summary.absentDays} unexcused • ${data.summary.holidayDays} holidays`}
            />
          </div>

          {/* Attendance Compliance Progress Ribbon */}
          <div className="p-4.5 rounded-lg bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Monthly Attendance Rate
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                    data.summary.attendancePercentage >= 90
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : data.summary.attendancePercentage >= 75
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {data.summary.attendancePercentage}% Compliance
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.summary.presentDays} full shifts + {data.summary.halfDays} half-days across{" "}
                {data.summary.pastWorkingDays} expected working days.
              </p>
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <Progress
                value={data.summary.attendancePercentage}
                max={100}
                size="md"
                variant={
                  data.summary.attendancePercentage >= 90
                    ? "success"
                    : data.summary.attendancePercentage >= 75
                    ? "warning"
                    : "destructive"
                }
              />
            </div>
          </div>

          {/* Filter Bar / Legend Bar */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-card border border-border/80 shadow-xs flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Filter:</span>
              <SegmentedTabs
                value={activeFilter}
                onChange={setActiveFilter}
                size="sm"
                tabs={[
                  { id: "ALL", label: `All (${data.days.length})` },
                  { id: "PRESENT", label: `Present (${data.summary.presentDays})` },
                  { id: "HALF_DAY", label: `Half Day (${data.summary.halfDays})` },
                  { id: "LEAVE_HOLIDAY", label: `Leaves & Hol (${data.summary.leaveDays + data.summary.holidayDays})` },
                  { id: "ABSENT", label: `Absent (${data.summary.absentDays})` },
                ]}
              />
            </div>

            <div className="text-[11px] text-muted-foreground italic hidden sm:block">
              Click any cell to inspect breakdown &bull; Double-click to open Day view
            </div>
          </div>

          {/* VIEW MODE 1: Calendar Grid */}
          {viewMode === "GRID" && (
            <div className="p-4 sm:p-6 rounded-lg bg-card border border-border/80 shadow-xs space-y-3">
              {/* Weekday Header */}
              <div className="grid grid-cols-7 gap-2 text-center pb-2.5 border-b border-border/60">
                {WEEK_DAYS.map((day, idx) => (
                  <div
                    key={day}
                    className={`text-xs font-bold uppercase tracking-wider ${
                      idx >= 5 ? "text-muted-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Month Days Matrix */}
              <div className="grid grid-cols-7 gap-2">
                {/* Previous Month Leading Padding Days */}
                {leadingDays.map((pad) => (
                  <div
                    key={`lead-${pad.date}`}
                    onClick={() => {
                      setMonth(pad.monthStr);
                      setInspectedDate(pad.date);
                    }}
                    className="min-h-[105px] rounded-xl border border-dashed border-border/30 bg-surface-subtle/15 p-2 flex flex-col justify-between opacity-35 hover:opacity-75 transition-all cursor-pointer group"
                    title={`Jump to ${pad.date}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        {pad.dayNumber}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/30">Prev</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/30 font-mono">-</div>
                  </div>
                ))}

                {/* Current Month Active Days */}
                {data.days.map((day: MonthlyDayItem) => {
                  const now = new Date();
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                  const isPast = day.date < todayStr;
                  const isUpcoming = !isPast && (day.status === "UPCOMING" || day.date > todayStr);
                  const isSelected = inspectedDate === day.date || (!inspectedDate && propSelectedDate === day.date);
                  const isDimmed = activeFilter !== "ALL" && !matchesFilter(day, activeFilter);

                  let cellBorder = "border-border/60";
                  let badgeClass = "bg-surface-subtle text-muted-foreground";
                  let badgeText = "Off";

                  if (isUpcoming) {
                    cellBorder = "border-dashed border-border/40";
                    badgeClass = "bg-transparent text-muted-foreground/40";
                    badgeText = "-";
                  } else if (day.status === "ACTIVE") {
                    cellBorder = "border-primary/50 hover:border-primary ring-1 ring-primary/30";
                    badgeClass = "bg-primary-light text-primary border border-primary/30 animate-pulse";
                    badgeText = "Active";
                  } else if (day.status === "PRESENT") {
                    cellBorder = "border-emerald-500/30 hover:border-emerald-500/60";
                    badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
                    badgeText = "P";
                  } else if (day.status === "HALF_DAY") {
                    cellBorder = "border-amber-500/30 hover:border-amber-500/60";
                    badgeClass = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20";
                    badgeText = "HD";
                  } else if (day.status === "SHORT_HOURS") {
                    cellBorder = "border-amber-500/20 hover:border-amber-500/40";
                    badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
                    badgeText = "Short";
                  } else if (day.status === "HOLIDAY") {
                    cellBorder = "border-sky-500/30 hover:border-sky-500/60";
                    badgeClass = "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20";
                    badgeText = "Holiday";
                  } else if (day.status === "ON_LEAVE") {
                    cellBorder = "border-purple-500/30 hover:border-purple-500/60";
                    badgeClass = "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20";
                    badgeText = "Leave";
                  } else if (day.status === "INCOMPLETE") {
                    cellBorder = "border-rose-500/40 hover:border-rose-500/70";
                    badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25";
                    badgeText = "Err";
                  } else if (day.status === "ABSENT") {
                    cellBorder = "border-border/40 hover:border-rose-500/30";
                    badgeClass = "bg-rose-500/5 text-rose-500/70";
                    badgeText = "A";
                  } else if (day.isWeekend) {
                    badgeText = "WO";
                  } else {
                    badgeText = "-";
                  }

                  return (
                    <div
                      key={day.date}
                      onClick={() => setInspectedDate(day.date)}
                      onDoubleClick={() => onSelectDate?.(day.date)}
                      className={`min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition-all select-none relative cursor-pointer ${
                        isUpcoming
                          ? "opacity-40 bg-surface-subtle/25"
                          : isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xs"
                          : isDimmed
                          ? "opacity-25 saturate-50 hover:opacity-80"
                          : "hover:bg-surface-elevated/80 hover:shadow-2xs"
                      } ${cellBorder} ${!isUpcoming && day.isWeekend ? "bg-surface-subtle/30" : !isUpcoming ? "bg-card" : ""}`}
                    >
                      {/* Top: Day Number & Status Badge */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isUpcoming
                              ? "text-muted-foreground/40"
                              : day.isToday
                              ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-xs ring-2 ring-primary/25"
                              : day.isWeekend
                              ? "text-muted-foreground/60"
                              : "text-foreground"
                          }`}
                        >
                          {day.dayNumber}
                        </span>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider truncate max-w-[55px] ${badgeClass}`}
                          title={day.holidayName || day.leaveType || badgeText}
                        >
                          {day.status === "HOLIDAY" ? "Hol" : day.status === "ON_LEAVE" ? "Leave" : badgeText}
                        </span>
                      </div>

                      {/* Middle: Work Duration / Holiday / Leave Details */}
                      <div className="py-1 min-h-[28px] flex flex-col justify-center">
                        {isUpcoming ? (
                          <span className="text-[10px] text-muted-foreground/30 font-mono">-</span>
                        ) : day.netWorkingMinutes > 0 ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {formatDuration(day.netWorkingMinutes)}
                            </div>
                            {day.firstClockIn && (
                              <div className="text-[10px] text-muted-foreground font-mono truncate">
                                In {formatTime(day.firstClockIn)}
                              </div>
                            )}
                          </div>
                        ) : day.status === "HOLIDAY" ? (
                          <div className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 truncate flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{day.holidayName || "Holiday"}</span>
                          </div>
                        ) : day.status === "ON_LEAVE" ? (
                          <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate flex items-center gap-1">
                            <Palmtree className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{day.leaveType || "Leave"}</span>
                          </div>
                        ) : day.isWeekend ? (
                          <span className="text-[10px] text-muted-foreground/50 italic">Weekend</span>
                        ) : day.status === "ABSENT" ? (
                          <span className="text-[10px] text-rose-500/80 font-semibold">Absent</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 font-mono">-</span>
                        )}
                      </div>

                      {/* Bottom: Overtime or Break tags */}
                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-muted-foreground/70">
                        {(day.overtimeMinutes ?? 0) > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
                            +{formatDuration(day.overtimeMinutes)} OT
                          </span>
                        ) : day.totalOooMinutes > 0 ? (
                          <span className="flex items-center gap-0.5 truncate" title={`Break: ${formatDuration(day.totalOooMinutes)}`}>
                            <Coffee className="w-2.5 h-2.5 shrink-0" />
                            <span>{formatDuration(day.totalOooMinutes)}</span>
                          </span>
                        ) : (
                          <span />
                        )}

                        {day.sessionCount > 1 && (
                          <span className="text-muted-foreground/40">
                            {day.sessionCount}x
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Next Month Trailing Padding Days */}
                {trailingDays.map((pad) => (
                  <div
                    key={`trail-${pad.date}`}
                    onClick={() => {
                      setMonth(pad.monthStr);
                      setInspectedDate(pad.date);
                    }}
                    className="min-h-[105px] rounded-xl border border-dashed border-border/30 bg-surface-subtle/15 p-2 flex flex-col justify-between opacity-35 hover:opacity-75 transition-all cursor-pointer group"
                    title={`Jump to ${pad.date}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        {pad.dayNumber}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/30">Next</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/30 font-mono">-</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Monthly Ledger Table */}
          {viewMode === "LEDGER" && (
            <div className="rounded-lg bg-card border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-surface-subtle/50 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">
                        First Clock In <span className="text-[10px] font-mono opacity-75">({timeZoneConfig.code})</span>
                      </th>
                      <th className="py-3 px-4">
                        Last Clock Out <span className="text-[10px] font-mono opacity-75">({timeZoneConfig.code})</span>
                      </th>
                      <th className="py-3 px-4">Net Working Time</th>
                      <th className="py-3 px-4">Breaks</th>
                      <th className="py-3 px-4">Overtime / Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.days
                      .filter((day) => matchesFilter(day, activeFilter))
                      .map((day) => {
                        const isToday = day.isToday;
                        const isSelected = inspectedDate === day.date;

                        return (
                          <tr
                            key={day.date}
                            onClick={() => setInspectedDate(day.date)}
                            className={`hover:bg-surface-elevated/70 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/5 font-medium"
                                : isToday
                                ? "bg-primary-light/20"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isToday && (
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                )}
                                <span>{formatDate(day.date)}</span>
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  ({WEEK_DAYS[day.dayOfWeek === 0 ? 6 : day.dayOfWeek - 1]})
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  day.status === "PRESENT"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                    : day.status === "ACTIVE"
                                    ? "bg-primary-light text-primary border border-primary/30"
                                    : day.status === "HALF_DAY" || day.status === "SHORT_HOURS"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                    : day.status === "HOLIDAY"
                                    ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                                    : day.status === "ON_LEAVE"
                                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                    : day.status === "ABSENT"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                    : "bg-surface-subtle text-muted-foreground"
                                }`}
                              >
                                {day.status.replace("_", " ")}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                              {day.firstClockIn ? formatTime(day.firstClockIn) : "--:--"}
                            </td>

                            <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                              {day.status === "ACTIVE"
                                ? "In Progress"
                                : day.lastClockOut
                                ? formatTime(day.lastClockOut)
                                : "--:--"}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                              {day.netWorkingMinutes > 0
                                ? formatDuration(day.netWorkingMinutes)
                                : "-"}
                            </td>

                            <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                              {day.totalOooMinutes > 0
                                ? formatDuration(day.totalOooMinutes)
                                : "-"}
                            </td>

                            <td className="py-3 px-4 text-xs whitespace-nowrap">
                              {day.holidayName ? (
                                <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {day.holidayName}
                                </span>
                              ) : day.leaveType ? (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                                  <Palmtree className="w-3 h-3" />
                                  {day.leaveType}
                                </span>
                              ) : (day.overtimeMinutes ?? 0) > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                  +{formatDuration(day.overtimeMinutes)} Overtime
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 font-mono">-</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectedDate(day.date);
                                  }}
                                  className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Inspect
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectDate?.(day.date);
                                  }}
                                  className="h-7 px-2.5 text-xs rounded-lg text-primary font-semibold"
                                >
                                  View Day
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive Day Details Inspector (Drawer / Sheet) */}
          <Sheet
            open={Boolean(inspectedDayItem)}
            onOpenChange={(open) => {
              if (!open) setInspectedDate(null);
            }}
          >
            <SheetContent side="right" className="sm:max-w-md w-full flex flex-col justify-between p-0">
              {inspectedDayItem && (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Drawer Header */}
                  <SheetHeader className="p-5 border-b border-border/80 bg-card">
                    <div className="flex items-center justify-between gap-2 pr-6">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-primary" />
                        <SheetTitle className="text-base font-bold text-foreground">
                          Day Attendance Details
                        </SheetTitle>
                      </div>

                      {/* Day Flipper buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleInspectPrevDay}
                          className="h-7 w-7 p-0 rounded-lg"
                          title="Previous Day"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleInspectNextDay}
                          className="h-7 w-7 p-0 rounded-lg"
                          title="Next Day"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <SheetDescription className="text-xs text-muted-foreground">
                      {formatDate(inspectedDayItem.date)} &bull;{" "}
                      {WEEK_DAYS[inspectedDayItem.dayOfWeek === 0 ? 6 : inspectedDayItem.dayOfWeek - 1]}
                      {inspectedDayItem.isToday && " (Today)"}
                    </SheetDescription>
                  </SheetHeader>

                  {/* Drawer Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Status Highlight Banner */}
                    <div
                      className={`p-4 rounded-lg border ${
                        inspectedDayItem.status === "PRESENT"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                          : inspectedDayItem.status === "ACTIVE"
                          ? "bg-primary-light border-primary/40 text-primary"
                          : inspectedDayItem.status === "HALF_DAY" || inspectedDayItem.status === "SHORT_HOURS"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200"
                          : inspectedDayItem.status === "HOLIDAY"
                          ? "bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"
                          : inspectedDayItem.status === "ON_LEAVE"
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-200"
                          : inspectedDayItem.status === "ABSENT"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
                          : inspectedDayItem.status === "INCOMPLETE"
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-100"
                          : "bg-surface-subtle border-border/80 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Attendance Status
                        </span>
                        <span className="font-extrabold text-sm">
                          {inspectedDayItem.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs mt-1.5 opacity-85">
                        {inspectedDayItem.status === "PRESENT"
                          ? "Completed standard 8-hour workday shift requirements."
                          : inspectedDayItem.status === "ACTIVE"
                          ? "Session currently running. Remember to clock out when done."
                          : inspectedDayItem.status === "HALF_DAY"
                          ? "Half-day shift completed (between 4 and 8 hours logged)."
                          : inspectedDayItem.status === "SHORT_HOURS"
                          ? "Fewer than 4 hours logged. May require attendance regularization."
                          : inspectedDayItem.status === "HOLIDAY"
                          ? `Official company holiday: ${inspectedDayItem.holidayName || "Public Holiday"}`
                          : inspectedDayItem.status === "ON_LEAVE"
                          ? `Approved leave of absence: ${inspectedDayItem.leaveType || "Leave"}`
                          : inspectedDayItem.status === "ABSENT"
                          ? "No clock-in recorded for this workday. If worked, submit a regularization request."
                          : inspectedDayItem.status === "INCOMPLETE"
                          ? "Incomplete session detected. Clock-out timestamp was not recorded."
                          : "Scheduled off-day or non-working weekend."}
                      </p>
                    </div>

                    {/* Timing Metrics 4-Box Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/70 space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          First Clock In
                        </span>
                        <div className="text-sm font-bold font-mono text-foreground">
                          {inspectedDayItem.firstClockIn
                            ? formatTime(inspectedDayItem.firstClockIn)
                            : "--:--"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/70 space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          Last Clock Out
                        </span>
                        <div className="text-sm font-bold font-mono text-foreground">
                          {inspectedDayItem.status === "ACTIVE"
                            ? "In Progress"
                            : inspectedDayItem.lastClockOut
                            ? formatTime(inspectedDayItem.lastClockOut)
                            : "--:--"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/70 space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-sky-500" />
                          Net Working Time
                        </span>
                        <div className="text-sm font-bold font-mono text-foreground">
                          {inspectedDayItem.netWorkingMinutes > 0
                            ? formatDuration(inspectedDayItem.netWorkingMinutes)
                            : "0m"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-subtle/50 border border-border/70 space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-amber-500" />
                          Breaks
                        </span>
                        <div className="text-sm font-bold font-mono text-foreground">
                          {inspectedDayItem.totalOooMinutes > 0
                            ? formatDuration(inspectedDayItem.totalOooMinutes)
                            : "0m"}
                        </div>
                      </div>
                    </div>

                    {/* Overtime & Sessions summary strip */}
                    <div className="p-3.5 rounded-xl bg-surface-subtle/30 border border-border/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sessions Recorded:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {inspectedDayItem.sessionCount} session{inspectedDayItem.sessionCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overtime Accrued:</span>
                        <span
                          className={`font-mono font-bold ${
                            (inspectedDayItem.overtimeMinutes ?? 0) > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {(inspectedDayItem.overtimeMinutes ?? 0) > 0
                            ? `+${formatDuration(inspectedDayItem.overtimeMinutes)}`
                            : "None"}
                        </span>
                      </div>

                      {inspectedDayItem.holidayName && (
                        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-sky-600 dark:text-sky-400">
                          <span>Holiday Event:</span>
                          <span className="font-semibold">{inspectedDayItem.holidayName}</span>
                        </div>
                      )}

                      {inspectedDayItem.leaveType && (
                        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-purple-600 dark:text-purple-400">
                          <span>Leave Type:</span>
                          <span className="font-semibold">
                            {inspectedDayItem.leaveType}
                            {inspectedDayItem.leaveReason ? ` (${inspectedDayItem.leaveReason})` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <SheetFooter className="p-4 border-t border-border/80 bg-card gap-2 flex-col sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRegularizeDate(inspectedDayItem.date);
                        setRegularizeModalOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs font-semibold gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Regularize Punch</span>
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (onSelectDate) onSelectDate(inspectedDayItem.date);
                        setInspectedDate(null);
                      }}
                      className="w-full sm:w-auto text-xs font-bold gap-1.5 shadow-xs"
                    >
                      <span>Open Day Timeline</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </SheetFooter>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Regularize Attendance Modal */}
          {regularizeModalOpen && (
            <RegularizeAttendanceModal
              open={regularizeModalOpen}
              onOpenChange={setRegularizeModalOpen}
              defaultDate={regularizeDate}
            />
          )}
        </>
      )}
    </div>
  );
}
