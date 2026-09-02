"use client";

import React, { useState, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "../../lib/utils";
import { ChartCard } from "./chart-card";

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
  secondaryValue?: number;
}

export interface TrendTimeRange {
  id: string;
  label: string;
  data: TrendDataPoint[];
}

export interface TrendAreaChartProps {
  data?: TrendDataPoint[];
  ranges?: TrendTimeRange[];
  defaultRangeId?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  chartHeight?: number;
  strokeColor?: string;
  fillColor?: string;
  showAverageLine?: boolean;
  formatValue?: (val: number) => string;
  unitLabel?: string;
}

export function TrendAreaChart({
  data: directData,
  ranges,
  defaultRangeId,
  title = "Trend & Velocity",
  description,
  icon = <Activity className="w-4 h-4" />,
  headerAction,
  className,
  chartHeight = 160,
  strokeColor = "var(--primary)",
  formatValue = (v) => String(v),
  unitLabel,
}: TrendAreaChartProps) {
  const gradientId = useId();
  const [activeRangeId, setActiveRangeId] = useState<string>(
    defaultRangeId || ranges?.[0]?.id || ""
  );
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeData = useMemo(() => {
    if (ranges && ranges.length > 0) {
      const match = ranges.find((r) => r.id === activeRangeId);
      return match ? match.data : ranges[0].data;
    }
    return directData || [];
  }, [ranges, activeRangeId, directData]);

  const stats = useMemo(() => {
    if (!activeData || activeData.length === 0) {
      return { current: 0, previous: 0, deltaPct: 0, average: 0 };
    }
    const current = activeData[activeData.length - 1].value;
    const previous = activeData[0].value;
    const sum = activeData.reduce((acc, pt) => acc + pt.value, 0);
    const average = Math.round((sum / activeData.length) * 10) / 10;
    const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return {
      current,
      previous,
      deltaPct: Math.round(delta * 10) / 10,
      average,
    };
  }, [activeData]);

  const isPositive = stats.deltaPct >= 0;

  // Build SVG path coordinates
  const width = 500;
  const height = chartHeight;
  const padding = { top: 16, bottom: 24, left: 16, right: 16 };

  const chartBounds = {
    xMin: padding.left,
    xMax: width - padding.right,
    yMin: padding.top,
    yMax: height - padding.bottom,
  };

  const minVal = Math.min(...activeData.map((d) => d.value), 0);
  const maxVal = Math.max(...activeData.map((d) => d.value), 1);
  const valRange = maxVal - minVal || 1;

  const points = useMemo(() => {
    if (activeData.length === 0) return [];
    return activeData.map((d, i) => {
      const x =
        chartBounds.xMin +
        (i / Math.max(activeData.length - 1, 1)) *
          (chartBounds.xMax - chartBounds.xMin);
      const y =
        chartBounds.yMax -
        ((d.value - minVal) / valRange) *
          (chartBounds.yMax - chartBounds.yMin);
      return { x, y, data: d };
    });
  }, [activeData, minVal, valRange, chartBounds.xMin, chartBounds.xMax, chartBounds.yMin, chartBounds.yMax]);

  // Smooth cubic spline path generator
  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) return { linePath: "", areaPath: "" };

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i != points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const area = `${d} L ${points[points.length - 1].x} ${chartBounds.yMax} L ${points[0].x} ${chartBounds.yMax} Z`;
    return { linePath: d, areaPath: area };
  }, [points, chartBounds.yMax]);

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      headerAction={
        ranges && ranges.length > 1 ? (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-subtle border border-border/60">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRangeId(r.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-all",
                  activeRangeId === r.id
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : headerAction
      }
      className={className}
    >
      <div className="flex items-baseline justify-between pb-2 border-b border-border/50">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
            {formatValue(activePoint ? activePoint.data.value : stats.current)}
          </span>
          {unitLabel && (
            <span className="text-xs text-muted-foreground font-mono">{unitLabel}</span>
          )}
          {activePoint && (
            <span className="text-[11px] text-muted-foreground font-mono ml-2">
              ({activePoint.data.label || activePoint.data.date})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border shadow-2xs",
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? `+${stats.deltaPct}%` : `${stats.deltaPct}%`}
          </span>
          <span className="text-[10px] text-muted-foreground">vs period start</span>
        </div>
      </div>

      <div className="w-full relative pt-2" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Baseline track */}
          <line
            x1={chartBounds.xMin}
            y1={chartBounds.yMax}
            x2={chartBounds.xMax}
            y2={chartBounds.yMax}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />

          {/* Area Fill with Spring Appearance */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="transition-opacity duration-300"
            />
          )}

          {/* Line Spline with PathLength Animation */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
            />
          )}

          {/* Interactive Crosshair & Nodes */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Invisible larger hover hit area */}
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                {isHovered && (
                  <>
                    <line
                      x1={pt.x}
                      y1={chartBounds.yMin}
                      x2={pt.x}
                      y2={chartBounds.yMax}
                      stroke="var(--border-strong)"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={5}
                      fill="var(--card)"
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      className="shadow-sm"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </ChartCard>
  );
}
