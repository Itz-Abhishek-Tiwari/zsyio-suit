"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Clock,
  Coffee,
  Briefcase,
  Target,
  Timer,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatDuration } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";
import { SegmentedTabs } from "@zsyio/ui";
import type { DailyTimesheetResponse } from "@/store/api/timesheetApi";

interface CircularShiftChartProps {
  timesheet: DailyTimesheetResponse;
  selectedDate: string;
}

// Convert Date or ISO string into minutes from midnight (0 to 1440) for the given baseDate & timezone
function getMinutesFromMidnight(
  dateStr: string | Date,
  baseDateStr: string,
  timeZone?: string
): number {
  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
        timeZone,
      }).formatToParts(dateObj);
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      return Math.max(0, Math.min(1440, h * 60 + m));
    } catch {
      // fallback
    }
  }
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const baseStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const diffMins = (dateObj.getTime() - baseStart) / 60000;
  return Math.max(0, Math.min(1440, diffMins));
}

// SVG Arc path generator
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  let sweep = endAngleDeg - startAngleDeg;
  if (sweep < 0) sweep += 360;

  // Handle nearly full or full circle
  if (sweep >= 359.9) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;
  }

  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = sweep > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

const HOUR_MARKS = [
  { hour: 0, label: "12 AM", angle: 0 },
  { hour: 3, label: "3 AM", angle: 45 },
  { hour: 6, label: "6 AM", angle: 90 },
  { hour: 9, label: "9 AM", angle: 135 },
  { hour: 12, label: "12 PM", angle: 180 },
  { hour: 15, label: "3 PM", angle: 225 },
  { hour: 18, label: "6 PM", angle: 270 },
  { hour: 21, label: "9 PM", angle: 315 },
];

export function CircularShiftChart({ timesheet, selectedDate }: CircularShiftChartProps) {
  const { formatTime, timeZone, timeZoneConfig, getTodayDateStr } = useTimeZone();
  const [chartMode, setChartMode] = useState<"CLOCK" | "RINGS">("RINGS");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterHighlight, setFilterHighlight] = useState<"ALL" | "WORK" | "OOO">("ALL");

  const todayStr = getTodayDateStr();
  const isToday = selectedDate === todayStr;

  // Target shift duration (standard 8h = 480 minutes)
  const targetMinutes = 480;
  const netMinutes = timesheet.summary.netWorkingMinutes || 0;
  const targetPct = Math.round((netMinutes / targetMinutes) * 100);
  const overtimeMinutes = Math.max(0, netMinutes - targetMinutes);

  // Helper for current minute of the day in selected timezone
  const getNowMinutes = useCallback(() => {
    const now = new Date();
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
        timeZone,
      }).formatToParts(now);
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      return h * 60 + m;
    } catch {
      return now.getHours() * 60 + now.getMinutes();
    }
  }, [timeZone]);

  // Current time angle on 24h clock
  const currentTimeAngle = useMemo(() => {
    if (!isToday) return null;
    const mins = getNowMinutes();
    return (mins / 1440) * 360;
  }, [isToday, getNowMinutes]);

  // Prepared circular dial segments
  const segments = useMemo(() => {
    return timesheet.timeline
      .filter((item) => {
        // Exclude completed 0-duration/instant punch tests (e.g. clocked in and out within same second/minute)
        // so they don't produce misleading, colliding blobs on the dial
        const isCompletedZero = Boolean(item.endTime) && (item.durationMinutes ?? 0) <= 0;
        return !isCompletedZero;
      })
      .map((item) => {
        const sMins = getMinutesFromMidnight(item.startTime, selectedDate, timeZone);
        let eMins = sMins;

        if (item.endTime) {
          eMins = getMinutesFromMidnight(item.endTime, selectedDate, timeZone);
        } else if (isToday) {
          eMins = getNowMinutes();
        } else {
          eMins = sMins + (item.durationMinutes || 0);
        }

        const isActiveSession = !item.endTime && isToday;
        const duration = Math.max(0, eMins - sMins);
        // For active session, ensure minimal arc so it renders, but don't project into the future
        const visualEndMins = Math.max(sMins + (isActiveSession && duration < 2 ? 2 : duration > 0 ? duration : 2), eMins);
        const startAngle = (sMins / 1440) * 360;
        const endAngle = (visualEndMins / 1440) * 360;

        return {
          ...item,
          startMins: sMins,
          endMins: eMins,
          startAngle,
          endAngle,
          isActiveSession,
        };
      });
  }, [timesheet.timeline, selectedDate, isToday, timeZone, getNowMinutes]);

  const activeHoveredItem = useMemo(() => {
    if (!hoveredId) return null;
    return segments.find((s) => s.id === hoveredId) || null;
  }, [hoveredId, segments]);

  // Metrics for Concentric Rings mode
  const ringWorkCircumference = 2 * Math.PI * 116;
  const ringWorkProgress = Math.min(1, netMinutes / targetMinutes);
  const ringWorkOffset = ringWorkCircumference * (1 - ringWorkProgress);

  const ringBreakCircumference = 2 * Math.PI * 98;
  const ringBreakProgress = Math.min(1, (timesheet.summary.totalOooMinutes || 0) / 60);
  const ringBreakOffset = ringBreakCircumference * (1 - ringBreakProgress);

  const ringGrossCircumference = 2 * Math.PI * 80;
  const ringGrossProgress = Math.min(1, (timesheet.summary.totalSessionMinutes || 0) / 540);
  const ringGrossOffset = ringGrossCircumference * (1 - ringGrossProgress);

  return (
    <div className="p-5 sm:p-6 rounded-md bg-card border border-border shadow-none space-y-6">
      {/* Header with Mode Switcher & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary-light text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Shift Visual Timeline</span>
              {isToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-success/10 text-success border border-success/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Live Today
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {chartMode === "CLOCK"
                ? "24-Hour radial clock dial displaying logged working intervals and breaks"
                : "Shift progress ring gauges tracking work duration against target"}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="shrink-0 self-start sm:self-auto">
          <SegmentedTabs
            value={chartMode}
            onChange={setChartMode}
            size="sm"
            tabs={[
              { id: "RINGS", label: "Target Rings", icon: <Target className="w-3.5 h-3.5" /> },
              { id: "CLOCK", label: "24h Shift Dial", icon: <Clock className="w-3.5 h-3.5" /> },
            ]}
          />
        </div>
      </div>

      {/* Main Chart Presentation & KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left / Center: The Circular Dial SVG */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] flex items-center justify-center select-none">
            <svg
              viewBox="0 0 320 320"
              role="img" aria-label={`Shift summary for ${selectedDate}: ${formatDuration(netMinutes)} worked, ${Math.round(targetPct)} percent of target`}
              className="w-full h-full transform transition-transform duration-150"
            >
              {chartMode === "CLOCK" ? (
                <>
                  {/* Outer Clock Dial Base Track */}
                  <circle
                    cx="160"
                    cy="160"
                    r="118"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-surface-subtle/70 transition-colors"
                  />

                  {/* Inner Guide Circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="98"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    className="text-border/60"
                  />

                  {/* 24-Hour Tick Marks (every hour) */}
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i / 24) * 360;
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const isMajor = i % 3 === 0;
                    const rInner = isMajor ? 128 : 126;
                    const rOuter = 132;
                    const x1 = 160 + rInner * Math.cos(rad);
                    const y1 = 160 + rInner * Math.sin(rad);
                    const x2 = 160 + rOuter * Math.cos(rad);
                    const y2 = 160 + rOuter * Math.sin(rad);

                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth={isMajor ? "1.8" : "1"}
                        className={isMajor ? "text-muted-foreground/70" : "text-border/50"}
                      />
                    );
                  })}

                  {/* Major Hour Labels */}
                  {HOUR_MARKS.map((mark) => {
                    const rad = ((mark.angle - 90) * Math.PI) / 180;
                    const rLabel = 147;
                    const x = 160 + rLabel * Math.cos(rad);
                    const y = 160 + rLabel * Math.sin(rad);

                    return (
                      <text
                        key={mark.hour}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-xs font-mono font-medium fill-muted-foreground/80 select-none"
                      >
                        {mark.label}
                      </text>
                    );
                  })}

                  {/* Work Session Arcs */}
                  {segments
                    .filter((s) => s.type === "WORK")
                    .map((s) => {
                      const isHovered = hoveredId === s.id;
                      const isDimmed = filterHighlight === "OOO" || (hoveredId && hoveredId !== s.id);
                      const pathData = describeArc(160, 160, 118, s.startAngle, s.endAngle);

                      return (
                        <path
                          key={s.id}
                          d={pathData}
                          fill="none"
                          stroke="var(--success)"
                          strokeWidth={isHovered ? 16 : 14}
                          strokeLinecap="butt"
                          className={`cursor-pointer transition-all duration-200 ${
                            isDimmed ? "opacity-30" : "opacity-100"
                          } `}
                          onMouseEnter={() => setHoveredId(s.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        />
                      );
                    })}

                  {/* OOO Break Arcs (Overlaid with vibrant amber) */}
                  {segments
                    .filter((s) => s.type === "OOO")
                    .map((s) => {
                      const isHovered = hoveredId === s.id;
                      const isDimmed = filterHighlight === "WORK" || (hoveredId && hoveredId !== s.id);
                      const pathData = describeArc(160, 160, 118, s.startAngle, s.endAngle);

                      return (
                        <path
                          key={s.id}
                          d={pathData}
                          fill="none"
                          stroke="var(--warning)"
                          strokeWidth={isHovered ? 16 : 14}
                          strokeLinecap="butt"
                          className={`cursor-pointer transition-all duration-200 ${
                            isDimmed ? "opacity-30" : "opacity-100"
                          } `}
                          onMouseEnter={() => setHoveredId(s.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        />
                      );
                    })}

                  {/* Current Live Time Needle (if today) */}
                  {currentTimeAngle !== null && (
                    <g className="pointer-events-none">
                      {(() => {
                        const rad = ((currentTimeAngle - 90) * Math.PI) / 180;
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);

                        // Inner needle guide line from hub to inner edge of track (stops at r=104 before track at r=111)
                        const x1 = 160 + 80 * cos;
                        const y1 = 160 + 80 * sin;
                        const x2 = 160 + 104 * cos;
                        const y2 = 160 + 104 * sin;

                        // Outer bezel marker pip on tick ring (r=130, cleanly outside the r=111-125 work track)
                        const pipX = 160 + 130 * cos;
                        const pipY = 160 + 130 * sin;

                        return (
                          <>
                            {/* Inner indicator guide line (stays inside, never crosses data arcs) */}
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#f43f5e"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                              className="opacity-70"
                            />

                            {/* Outer Bezel Indicator Marker (cleanly in tick bezel) */}
                            <circle
                              cx={pipX}
                              cy={pipY}
                              r="3"
                              fill="#f43f5e"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="text-destructive"
                            />
                          </>
                        );
                      })()}
                    </g>
                  )}
                </>
              ) : (
                <>
                  {/* Concentric Rings Mode (Apple Health / Target Rings Style) */}
                  {/* Outer Ring: Work Progress vs 8h Target */}
                  <circle
                    cx="160"
                    cy="160"
                    r="116"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="13"
                    className="text-surface-subtle/70"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="116"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="13"
                    strokeLinecap="butt"
                    strokeDasharray={ringWorkCircumference}
                    strokeDashoffset={ringWorkOffset}
                    transform="rotate(-90 160 160)"
                    className="transition-all duration-150 ease-out"
                  />

                  {/* Middle Ring: Break Duration (OOO) */}
                  <circle
                    cx="160"
                    cy="160"
                    r="98"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="11"
                    className="text-surface-subtle/70"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="98"
                    fill="none"
                    stroke="var(--warning)"
                    strokeWidth="11"
                    strokeLinecap="butt"
                    strokeDasharray={ringBreakCircumference}
                    strokeDashoffset={ringBreakOffset}
                    transform="rotate(-90 160 160)"
                    className="transition-all duration-150 ease-out"
                  />

                  {/* Inner Ring: Total Session Span */}
                  <circle
                    cx="160"
                    cy="160"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="9"
                    className="text-surface-subtle/70"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="80"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="9"
                    strokeLinecap="butt"
                    strokeDasharray={ringGrossCircumference}
                    strokeDashoffset={ringGrossOffset}
                    transform="rotate(-90 160 160)"
                    className="transition-all duration-150 ease-out"
                  />
                </>
              )}

              {/* Center Circle Hub Background */}
              <circle
                cx="160"
                cy="160"
                r="70"
                className="fill-card stroke-border"
                strokeWidth="0"
              />
            </svg>

            {/* Dynamic Center Hub HTML Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              {activeHoveredItem ? (
                <div className="space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold   ${
                      activeHoveredItem.type === "WORK"
                        ? "bg-success/15 text-success"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {activeHoveredItem.type === "WORK" ? "Work Session" : "Break"}
                  </span>
                  <div className="text-xl sm:text-2xl font-semibold font-mono tracking-tight text-foreground">
                    {formatDuration(activeHoveredItem.durationMinutes)}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground flex items-center justify-center gap-1">
                    <span>{formatTime(activeHoveredItem.startTime)}</span>
                    <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    <span>{activeHoveredItem.endTime ? formatTime(activeHoveredItem.endTime) : "Now"}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold   text-muted-foreground">
                    Net Worked
                  </span>
                  <div className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-foreground">
                    {formatDuration(netMinutes)}
                  </div>
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        targetPct >= 100
                          ? "bg-success/15 text-success border border-success/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                    >
                      {targetPct >= 100 ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Goal Met ({targetPct}%)</span>
                        </>
                      ) : (
                        <span>{targetPct}% of 8h Goal</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Chart Legend */}
          <div className="flex items-center justify-center gap-3 text-xs pt-3 flex-wrap">
            <SegmentedTabs
              value={filterHighlight}
              onChange={setFilterHighlight}
              size="sm"
              tabs={[
                { id: "ALL", label: "All Activity" },
                { id: "WORK", label: "Work Intervals" },
                { id: "OOO", label: "Breaks" },
              ]}
            />

            {isToday && chartMode === "CLOCK" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-muted-foreground text-xs bg-surface-subtle/50 rounded-lg border border-border/50">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse shadow-xs" />
                <span>Live Indicator</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Key Shift KPI Metrics in 2x2 Grid */}
        <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Net Work Hours vs Target */}
          <div className="p-4 rounded-md bg-surface-subtle/50 border border-border/80 space-y-2 hover:border-success/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-success" />
                <span>Net Work Time</span>
              </span>
              <span className="text-xs font-semibold font-mono text-success bg-success/10 px-1.5 py-0.5 rounded">
                {targetPct}%
              </span>
            </div>
            <div className="text-xl font-semibold font-mono text-foreground">
              {formatDuration(netMinutes)}
            </div>
            {/* Progress track */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-sm bg-border/60 overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-150 bg-success"
                  style={{ width: `${Math.min(100, targetPct)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground flex justify-between">
                <span>Standard Goal: 8h 00m</span>
                {overtimeMinutes > 0 ? (
                  <span className="text-success font-semibold">+{formatDuration(overtimeMinutes)} OT</span>
                ) : (
                  <span>{formatDuration(Math.max(0, targetMinutes - netMinutes))} left</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 2: Break Deductions */}
          <div className="p-4 rounded-md bg-surface-subtle/50 border border-border/80 space-y-2 hover:border-warning/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-warning" />
                <span>Breaks</span>
              </span>
              <span className="text-xs font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                {timesheet.timeline.filter((t) => t.type === "OOO").length} break(s)
              </span>
            </div>
            <div className="text-xl font-semibold font-mono text-warning">
              {formatDuration(timesheet.summary.totalOooMinutes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Deducted automatically from gross work session span
            </p>
          </div>

          {/* Card 3: Clock In & Out Timestamps */}
          <div className="p-4 rounded-md bg-surface-subtle/50 border border-border/80 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground   flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Punches ({timeZoneConfig.code})</span>
            </span>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">First In:</span>
                <span className="font-semibold text-foreground">
                  {formatTime(timesheet.summary.firstClockIn)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Out:</span>
                <span className="font-semibold text-foreground">
                  {formatTime(timesheet.summary.lastClockOut)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Gross Session Span */}
          <div className="p-4 rounded-md bg-surface-subtle/50 border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground   flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-notion-blue-fg" />
                <span>Gross Session</span>
              </span>
              <span className="text-xs font-semibold text-notion-blue-fg bg-notion-blue-fg/10 px-1.5 py-0.5 rounded">
                Elapsed
              </span>
            </div>
            <div className="text-xl font-semibold font-mono text-foreground">
              {formatDuration(timesheet.summary.totalSessionMinutes)}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Work ({formatDuration(netMinutes)}) + Breaks ({formatDuration(timesheet.summary.totalOooMinutes)})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
