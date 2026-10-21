"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ChartCard } from "./chart-card";

export interface MetricBarItem {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  target?: number;
  formattedValue?: string;
}

export interface MetricBarChartProps {
  items: MetricBarItem[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  chartHeight?: number;
  orientation?: "vertical" | "horizontal";
  barSize?: number;
  showGrid?: boolean;
  targetLine?: number;
  targetLabel?: string;
  formatValue?: (val: number) => string;
  secondaryLabel?: string;
}

export function MetricBarChart({
  items,
  title = "Metric Breakdown",
  description,
  icon = <BarChart3 className="w-4 h-4" />,
  headerAction,
  className,
  orientation = "horizontal",
  formatValue = (v) => String(v),
  secondaryLabel,
  chartHeight = 180,
  barSize = 28,
  showGrid = true,
  targetLine,
  targetLabel = "Target",
}: MetricBarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + (i.value || 0), 0);
  const maxValue = Math.max(...items.map((i) => Math.max(i.value || 0, i.target || 0)), targetLine || 0, 1);

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      headerAction={
        headerAction || (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-subtle/80 border border-border/60 text-xs font-mono">
            <span className="text-muted-foreground text-xs">Total:</span>
            <span className="font-semibold text-foreground">{formatValue(total)}</span>
          </div>
        )
      }
      className={className}
    >
      {orientation === "vertical" && items.length > 0 ? <div>
        <div className="relative flex items-end gap-4 border-b border-border pt-6" style={{height:chartHeight + 24}}>
          {showGrid && [0.5, 1].map(fraction => <div key={fraction} className="absolute inset-x-0 border-t border-border/50 pointer-events-none" style={{bottom: `${fraction * chartHeight}px`}} />)}
          {targetLine !== undefined && <div className="absolute inset-x-0 border-t border-dashed border-muted-foreground pointer-events-none" style={{bottom: `${targetLine / maxValue * chartHeight}px`}}><span className="absolute right-0 bottom-1 text-[10px] text-muted-foreground bg-card px-1">{targetLabel}: {formatValue(targetLine)}</span></div>}
          {items.map(item => <div key={item.key} className="relative flex-1 min-w-0 h-full flex flex-col justify-end items-center" tabIndex={0} aria-label={`${item.label}: ${item.formattedValue || formatValue(item.value)}`}>
            <span className="text-[10px] tabular-nums text-foreground mb-2">{item.formattedValue || formatValue(item.value)}</span>
            <div className="w-full rounded-t-sm" style={{maxWidth:barSize, height:Math.max(0, item.value) / maxValue * chartHeight, backgroundColor:item.color || "var(--primary)"}} />
          </div>)}
        </div>
        <div className="flex gap-4 pt-3">{items.map(item => <span key={item.key} className="flex-1 min-w-0 text-center text-[10px] leading-relaxed text-muted-foreground">{item.label}</span>)}</div>
      </div> : <div className="flex flex-col py-1">
        {items.length === 0 && <p className="py-8 text-sm text-muted-foreground text-center">No metrics yet</p>}
        {items.map((item, idx) => {
          const isHovered = hoveredKey === item.key;
          const isDimmed = hoveredKey !== null && !isHovered;
          const color = item.color || "var(--primary)";
          const pctOfMax = Math.max(0, (item.value / maxValue) * 100);
          const shareOfTotal = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div
              key={item.key}
              className={cn(
                "group flex flex-col py-3 border-b border-border/60 transition-colors duration-150 select-none",
                isHovered
                  ? "bg-surface-subtle/50"
                  : "hover:bg-surface-subtle/30",
                isDimmed && "opacity-75"
              )}
              tabIndex={0}
              onFocus={() => setHoveredKey(item.key)}
              onBlur={() => setHoveredKey(null)}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  {item.secondaryValue !== undefined && secondaryLabel && (
                    <span className="text-muted-foreground text-xs">
                      {secondaryLabel}: {formatValue(item.secondaryValue)}
                    </span>
                  )}
                  <span className="font-semibold text-foreground">
                    {item.formattedValue || formatValue(item.value)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono px-1 py-0.5 rounded bg-surface-subtle border border-border/40">
                    {shareOfTotal}%
                  </span>
                </div>
              </div>

              {/* All rows share a scale; zero values have zero width. */}
              <div className="relative w-full h-3 rounded-sm bg-surface-subtle">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: color }}
                  initial={false}
                  animate={{ width: `${pctOfMax}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 18, delay: idx * 0.04 }}
                />
                {(item.target !== undefined || targetLine !== undefined) && <span className="absolute inset-y-[-3px] w-px bg-muted-foreground" style={{left: `${(item.target ?? targetLine ?? 0) / maxValue * 100}%`}} title={`${targetLabel}: ${formatValue(item.target ?? targetLine ?? 0)}`} />}
              </div>
            </div>
          );
        })}
      </div>}
      {orientation === "horizontal" && showGrid && items.length > 0 && <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums pt-3"><span>0</span><span>{formatValue(maxValue)}</span></div>}
    </ChartCard>
  );
}
