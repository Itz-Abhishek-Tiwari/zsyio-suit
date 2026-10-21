"use client";

import React, { useState, useMemo, useId } from "react";
import { motion } from "framer-motion";
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
  showAverageLine = false,
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
  const padding = { top: 16, bottom: 28, left: 58, right: 16 };

  const chartBounds = {
    xMin: padding.left,
    xMax: width - padding.right,
    yMin: padding.top,
    yMax: height - padding.bottom,
  };

  const minVal = Math.min(...activeData.flatMap(d => [d.value, d.secondaryValue ?? d.value]), 0);
  const rawMax = Math.max(...activeData.flatMap(d => [d.value, d.secondaryValue ?? d.value]), 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const maxVal = Math.ceil(rawMax / magnitude / 0.5) * magnitude * 0.5;
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
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      d += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
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
          <div className="flex items-center gap-1 p-0.5 rounded-sm bg-surface-subtle border border-border/60">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRangeId(r.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-all",
                  activeRangeId === r.id
                    ? "bg-card text-foreground font-medium"
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
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-normal font-[family-name:var(--font-editorial)] tracking-tight text-foreground">
            {formatValue(activePoint ? activePoint.data.value : stats.current)}
          </span>
          {unitLabel && (
            <span className="text-xs text-muted-foreground font-mono">{unitLabel}</span>
          )}
          {activePoint && (
            <span className="text-xs text-muted-foreground font-mono ml-2">
              ({activePoint.data.label || activePoint.data.date})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-sm",
              isPositive
                ? "bg-success/10 text-success border-success/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? `+${stats.deltaPct}%` : `${stats.deltaPct}%`}
          </span>
          <span className="text-xs text-muted-foreground">vs period start</span>
        </div>
      </div>

      {activeData.length === 0 && <p className="py-8 text-sm text-muted-foreground text-center">No trend data yet</p>}
      {(showAverageLine || activeData.some(d => d.secondaryValue !== undefined)) && <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground py-2">
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2" style={{borderColor:strokeColor}} />Actual</span>
        {activeData.some(d => d.secondaryValue !== undefined) && <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-muted-foreground" />Comparison</span>}
        {showAverageLine && <span>Average: {formatValue(stats.average)}</span>}
      </div>}
      <div className="w-full relative pt-2" style={{ height }}>
        <svg
          role="img" aria-label={title}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.12} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((fraction) => {
            const y = chartBounds.yMax - fraction * (chartBounds.yMax - chartBounds.yMin);
            return <g key={fraction}>
              <line x1={chartBounds.xMin} x2={chartBounds.xMax} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.7} />
              <text x={chartBounds.xMin - 10} y={y + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize={10}>{formatValue(minVal + fraction * valRange)}</text>
            </g>;
          })}
          {points.filter((_, i) => i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2))).map((point, i) =>
            <text key={point.data.date + i} x={point.x} y={height - 5} textAnchor={i === 0 ? "start" : point === points[points.length - 1] ? "end" : "middle"} fill="var(--muted-foreground)" fontSize={10}>{point.data.label || point.data.date}</text>
          )}
          {showAverageLine && <line x1={chartBounds.xMin} x2={chartBounds.xMax} y1={chartBounds.yMax - ((stats.average - minVal) / valRange) * (chartBounds.yMax - chartBounds.yMin)} y2={chartBounds.yMax - ((stats.average - minVal) / valRange) * (chartBounds.yMax - chartBounds.yMin)} stroke="var(--muted-foreground)" strokeDasharray="4 4"><title>Average: {formatValue(stats.average)}</title></line>}
          {/* Area Fill with Spring Appearance */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="transition-opacity duration-150"
            />
          )}

          {activeData.some(d => d.secondaryValue !== undefined) && <path d={activeData.map((d, i) => d.secondaryValue === undefined ? "" : `${i === 0 || activeData[i - 1].secondaryValue === undefined ? "M" : "L"} ${points[i].x} ${chartBounds.yMax - ((d.secondaryValue - minVal) / valRange) * (chartBounds.yMax - chartBounds.yMin)}`).join(" ")} fill="none" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4"><title>Comparison series</title></path>}
          {/* Primary trend */}
          {linePath && (
            <motion.path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: 1 }}
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
            />
          )}

          {points.length === 1 && <circle cx={points[0].x} cy={points[0].y} r={3} fill={strokeColor} />}
          {/* Interactive Crosshair & Nodes */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                tabIndex={0}
                role="img"
                aria-label={`${pt.data.label || pt.data.date}: ${formatValue(pt.data.value)}`}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
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
                      strokeWidth={2}
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
