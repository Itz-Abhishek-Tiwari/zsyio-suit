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
}: MetricBarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + (i.value || 0), 0);
  const maxValue = Math.max(...items.map((i) => i.value || 0), 1);

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      headerAction={
        headerAction || (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-subtle/80 border border-border/60 text-xs font-mono">
            <span className="text-muted-foreground text-[11px]">Total:</span>
            <span className="font-bold text-foreground">{formatValue(total)}</span>
          </div>
        )
      }
      className={className}
    >
      <div className="flex flex-col gap-2.5 py-1">
        {items.map((item, idx) => {
          const isHovered = hoveredKey === item.key;
          const isDimmed = hoveredKey !== null && !isHovered;
          const color = item.color || "var(--primary)";
          const pctOfMax = Math.max((item.value / maxValue) * 100, 4);
          const shareOfTotal = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div
              key={item.key}
              className={cn(
                "group flex flex-col p-2 rounded-lg border transition-all duration-150 cursor-pointer select-none",
                isHovered
                  ? "bg-surface-elevated border-border shadow-xs scale-[1.01]"
                  : "bg-surface-subtle/30 border-border/40 hover:bg-surface-subtle/70",
                isDimmed && "opacity-45"
              )}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 ring-2 ring-background"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-foreground truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  {item.secondaryValue !== undefined && secondaryLabel && (
                    <span className="text-muted-foreground text-[11px]">
                      {secondaryLabel}: {formatValue(item.secondaryValue)}
                    </span>
                  )}
                  <span className="font-bold text-foreground">
                    {formatValue(item.value)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono px-1 py-0.5 rounded bg-surface-subtle border border-border/40">
                    {shareOfTotal}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pctOfMax}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 18, delay: idx * 0.04 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
