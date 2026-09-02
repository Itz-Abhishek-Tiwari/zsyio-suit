"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as PieChartIcon, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ChartCard } from "./chart-card";
import { SegmentedTabs } from "../segmented-tabs";

export interface DistributionChartItem {
  key: string;
  label: string;
  count: number;
  color?: string;
  hexColor?: string;
  colorClass?: string;
}

export interface ChartDimension {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  items: DistributionChartItem[];
  totalCount?: number;
  formatValue?: (val: number) => string;
}

export interface DonutDistributionChartProps {
  items?: DistributionChartItem[];
  dimensions?: ChartDimension[];
  defaultDimensionId?: string;
  totalCount?: number;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  centerLabel?: string;
  emptyText?: string;
  headerAction?: React.ReactNode;
  className?: string;
  chartHeight?: number;
  maxLegendHeight?: number;
  showLegendProgress?: boolean;
  formatValue?: (val: number) => string;
}

// Fallback color palette matching design system
const DEFAULT_PALETTE = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--color-purple-500, var(--primary))",
  "var(--color-orange-500, var(--warning))",
  "var(--muted-foreground)",
];

export function DonutDistributionChart({
  items: directItems,
  dimensions,
  defaultDimensionId,
  totalCount: customTotal,
  title = "Distribution",
  description = "Category breakdown and spread.",
  icon = <PieChartIcon className="w-4 h-4" />,
  centerLabel = "Total",
  emptyText = "No data available in this category",
  headerAction,
  className,
  chartHeight = 210,
  formatValue: directFormatValue,
}: DonutDistributionChartProps) {
  const isMultiMode = Boolean(dimensions && dimensions.length > 1);
  const [activeDimensionId, setActiveDimensionId] = useState<string>(
    defaultDimensionId || dimensions?.[0]?.id || ""
  );
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const activeDimension = useMemo(() => {
    if (!dimensions || dimensions.length === 0) return null;
    return dimensions.find((d) => d.id === activeDimensionId) || dimensions[0];
  }, [dimensions, activeDimensionId]);

  const activeItems = useMemo(() => {
    if (activeDimension) return activeDimension.items;
    return directItems ?? [];
  }, [activeDimension, directItems]);

  const formatValueFn = useMemo(() => {
    if (activeDimension?.formatValue) return activeDimension.formatValue;
    if (directFormatValue) return directFormatValue;
    return (v: number) => String(v);
  }, [activeDimension, directFormatValue]);

  const calculatedTotal = useMemo(() => {
    if (activeDimension?.totalCount !== undefined) return activeDimension.totalCount;
    if (typeof customTotal === "number") return customTotal;
    return activeItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [activeDimension, customTotal, activeItems]);

  // Non-zero items for the SVG arcs
  const activeSlices = useMemo(() => {
    return activeItems
      .filter((item) => item.count > 0)
      .map((item, idx) => ({
        ...item,
        resolvedColor: item.hexColor || item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
        percentage: calculatedTotal > 0 ? (item.count / calculatedTotal) * 100 : 0,
      }));
  }, [activeItems, calculatedTotal]);

  const activeSlice = hoveredKey ? activeSlices.find((s) => s.key === hoveredKey) : null;
  const displayCount = activeSlice ? activeSlice.count : calculatedTotal;
  const displayLabel = activeSlice ? activeSlice.label : centerLabel;
  const displayPct = activeSlice
    ? Math.round(activeSlice.percentage)
    : 100;

  // SVG Geometry
  const size = 180;
  const strokeWidth = 14;
  const hoveredStrokeWidth = 18;
  const radius = (size - hoveredStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate arc offsets with small gap
  const gapAngleDegrees = activeSlices.length > 1 ? 2.5 : 0;
  const totalGapLength = (gapAngleDegrees / 360) * circumference * activeSlices.length;
  const availableCircumference = circumference - totalGapLength;

  let cumulativeOffset = 0;
  const arcSegments = activeSlices.map((slice) => {
    const arcLength = (slice.percentage / 100) * availableCircumference;
    const dashArray = `${arcLength} ${circumference - arcLength}`;
    const offset = -cumulativeOffset;
    cumulativeOffset += arcLength + (gapAngleDegrees / 360) * circumference;

    return {
      ...slice,
      dashArray,
      dashOffset: offset,
    };
  });

  const dimensionTabsHeader = isMultiMode && dimensions ? (
    <SegmentedTabs
      value={activeDimensionId || ""}
      onChange={(val) => {
        setActiveDimensionId(val);
        setHoveredKey(null);
      }}
      size="sm"
      className="self-start sm:self-auto"
      tabs={dimensions.map((dim) => {
        const IconComponent = dim.icon;
        const iconNode = React.isValidElement(IconComponent)
          ? IconComponent
          : typeof IconComponent === "function"
          ? <IconComponent className="w-3.5 h-3.5" />
          : undefined;

        return {
          id: dim.id,
          label: dim.label,
          icon: iconNode,
        };
      })}
    />
  ) : null;

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      headerAction={headerAction || dimensionTabsHeader}
      className={className}
    >
      <div className="flex flex-col gap-4">
        {/* Modern Segmented Track Preview */}
        {calculatedTotal > 0 && activeSlices.length > 0 && (
          <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden flex p-0.5 border border-border/60 shadow-2xs">
            {activeSlices.map((slice) => {
              const isHovered = hoveredKey === slice.key;
              return (
                <div
                  key={slice.key}
                  style={{ width: `${slice.percentage}%`, backgroundColor: slice.resolvedColor }}
                  className={cn(
                    "h-full first:rounded-l-full last:rounded-r-full transition-all duration-200 cursor-pointer",
                    isHovered ? "brightness-125 scale-y-125 shadow-xs" : "opacity-85 hover:opacity-100"
                  )}
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  title={`${slice.label}: ${slice.count} (${Math.round(slice.percentage)}%)`}
                />
              );
            })}
          </div>
        )}

        {/* Center Donut Ring */}
        <div
          className="relative w-full flex items-center justify-center my-1"
          style={{ height: chartHeight }}
        >
          {calculatedTotal === 0 || activeSlices.length === 0 ? (
            <div className="text-xs text-muted-foreground italic text-center flex flex-col items-center gap-1.5 py-8">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground/50" />
              <span className="font-medium">{emptyText}</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 origin-center transition-all duration-300"
              >
                {/* Background Track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="var(--surface-subtle)"
                  strokeWidth={strokeWidth}
                  className="opacity-60"
                />

                {/* Animated Arc Segments */}
                {arcSegments.map((segment) => {
                  const isHovered = hoveredKey === segment.key;
                  const isDimmed = hoveredKey !== null && !isHovered;

                  return (
                    <motion.circle
                      key={segment.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={segment.resolvedColor}
                      strokeWidth={isHovered ? hoveredStrokeWidth : strokeWidth}
                      strokeDasharray={segment.dashArray}
                      strokeDashoffset={segment.dashOffset}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        opacity: isDimmed ? 0.35 : 1,
                        filter: isHovered
                          ? "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2))"
                          : "none",
                      }}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: segment.dashOffset }}
                      transition={{ type: "spring", stiffness: 90, damping: 16 }}
                      onMouseEnter={() => setHoveredKey(segment.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    />
                  );
                })}
              </svg>

              {/* Central Dynamic Stat HUD */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2 z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayCount + displayLabel}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl font-extrabold text-foreground font-mono tracking-tight leading-none">
                      {formatValueFn(displayCount)}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground truncate max-w-[120px] mt-1 uppercase tracking-widest font-mono">
                      {displayLabel}
                    </span>
                    {activeSlice && (
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-1 border transition-all shadow-2xs"
                        style={{
                          backgroundColor: `${activeSlice.resolvedColor}18`,
                          color: activeSlice.resolvedColor,
                          borderColor: `${activeSlice.resolvedColor}33`,
                        }}
                      >
                        {displayPct}%
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* High-Density Streamlined Legend */}
        {activeItems.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            {/* Active Items List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeItems
                .filter((item) => item.count > 0)
                .map((item, idx) => {
                  const color = item.hexColor || item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
                  const pct = calculatedTotal > 0 ? Math.round((item.count / calculatedTotal) * 100) : 0;
                  const isHovered = hoveredKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer select-none",
                        isHovered
                          ? "bg-surface-elevated border-border shadow-xs scale-101"
                          : "bg-surface-subtle/40 border-border/40 hover:bg-surface-subtle/80"
                      )}
                      onMouseEnter={() => setHoveredKey(item.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 ring-2 ring-background"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                        <span className="font-bold text-foreground">{formatValueFn(item.count)}</span>
                        <span className="text-[10px] text-muted-foreground px-1 py-0.5 rounded bg-surface-subtle border border-border/40">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Zero-count Items: Subtle Inline Tags */}
            {activeItems.some((i) => i.count === 0) && (
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                {activeItems
                  .filter((item) => item.count === 0)
                  .map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground/70 bg-surface-subtle/30 border border-border/30"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{item.label}: 0</span>
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ChartCard>
  );
}
