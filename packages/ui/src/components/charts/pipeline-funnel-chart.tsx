"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Layers, BarChart2, TrendingDown, TrendingUp, ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { ChartCard } from "./chart-card";

export interface PipelineStageItem {
  stageKey: string;
  name: string;
  count: number;
  value?: number;
  formattedValue?: string;
  color: string;
}

export interface PipelineFunnelChartProps {
  stages: PipelineStageItem[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  chartHeight?: number;
  showProgressionBar?: boolean;
  showStageMetrics?: boolean;
}

export function PipelineFunnelChart({
  stages,
  title = "Pipeline Velocity Funnel",
  description = "Lead progression and conversion across active sales stages.",
  icon = <Filter className="w-4 h-4" />,
  headerAction,
  className,
  showProgressionBar = true,
}: PipelineFunnelChartProps) {
  const [viewMode, setViewMode] = useState<"funnel" | "waterfall">("funnel");
  const [hoveredStageKey, setHoveredStageKey] = useState<string | null>(null);

  const totalLeads = stages.reduce((sum, s) => sum + (s.count || 0), 0);
  const totalValue = stages.reduce((sum, s) => sum + (s.value || 0), 0);
  const maxStageCount = Math.max(...stages.map((s) => s.count || 0), 1);

  const hoveredStage = stages.find((s) => s.stageKey === hoveredStageKey);

  // SVG Funnel Geometry Calculations
  const svgWidth = 620;
  const stageCount = stages.length;
  const stageHeight = 44;
  const stageGap = 12;
  const paddingTop = 20;
  const svgHeight = paddingTop * 2 + stageCount * stageHeight + (stageCount - 1) * stageGap;
  const centerX = svgWidth / 2;

  const maxFunnelWidth = 280;
  const minFunnelWidth = 100;

  return (
    <ChartCard
      title={title}
      description={description}
      icon={icon}
      headerAction={
        headerAction || (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface-subtle border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("funnel")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all",
                  viewMode === "funnel"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Tapered Funnel View"
              >
                <Layers className="w-3 h-3" />
                <span>Funnel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("waterfall")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all",
                  viewMode === "waterfall"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Stage Waterfall View"
              >
                <BarChart2 className="w-3 h-3" />
                <span>Flow</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-subtle/80 border border-border/60 text-xs font-mono">
              <span className="text-muted-foreground text-[11px]">In Funnel:</span>
              <span className="font-bold text-foreground text-xs">{totalLeads} leads</span>
            </div>
          </div>
        )
      }
      className={className}
    >
      <div className="flex flex-col gap-4">
        {/* Proportional Stage Progression Ribbon */}
        {showProgressionBar && totalLeads > 0 && (
          <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden flex p-0.5 border border-border/60 shadow-2xs">
            {stages.map((stg) => {
              const pct = (stg.count / totalLeads) * 100;
              if (pct === 0) return null;
              const isHovered = hoveredStageKey === stg.stageKey;

              return (
                <div
                  key={stg.stageKey}
                  style={{ width: `${pct}%`, backgroundColor: stg.color }}
                  className={cn(
                    "h-full first:rounded-l-full last:rounded-r-full transition-all duration-200 cursor-pointer",
                    isHovered ? "brightness-125 scale-y-125 shadow-xs" : "opacity-85 hover:opacity-100"
                  )}
                  onMouseEnter={() => setHoveredStageKey(stg.stageKey)}
                  onMouseLeave={() => setHoveredStageKey(null)}
                  title={`${stg.name}: ${stg.count} leads (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        )}

        {/* View 1: True Tapered Geometric SVG Funnel */}
        {viewMode === "funnel" && (
          <div className="w-full relative flex flex-col items-center select-none py-1">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[360px] overflow-visible"
            >
              <defs>
                {stages.map((stg) => (
                  <linearGradient
                    key={`funnel-grad-${stg.stageKey}`}
                    id={`funnel-grad-${stg.stageKey}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={stg.color} stopOpacity="0.22" />
                    <stop offset="50%" stopColor={stg.color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={stg.color} stopOpacity="0.18" />
                  </linearGradient>
                ))}
                {stages.map((stg) => (
                  <linearGradient
                    key={`funnel-grad-hover-${stg.stageKey}`}
                    id={`funnel-grad-hover-${stg.stageKey}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={stg.color} stopOpacity="0.38" />
                    <stop offset="50%" stopColor={stg.color} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={stg.color} stopOpacity="0.30" />
                  </linearGradient>
                ))}
              </defs>

              {stages.map((stg, index) => {
                const isHovered = hoveredStageKey === stg.stageKey;
                const isDimmed = hoveredStageKey !== null && !isHovered;

                const yTop = paddingTop + index * (stageHeight + stageGap);
                const yBot = yTop + stageHeight;
                const yMid = yTop + stageHeight / 2;

                // Dynamic taper widths
                const t1 = index / Math.max(stageCount, 1);
                const t2 = (index + 0.85) / Math.max(stageCount, 1);
                const wTop = maxFunnelWidth - t1 * (maxFunnelWidth - minFunnelWidth);
                const wBot = maxFunnelWidth - t2 * (maxFunnelWidth - minFunnelWidth);

                const x1 = centerX - wTop / 2;
                const x2 = centerX + wTop / 2;
                const x3 = centerX + wBot / 2;
                const x4 = centerX - wBot / 2;

                const pctOfTotal = totalLeads > 0 ? Math.round((stg.count / totalLeads) * 100) : 0;
                const prevStage = index > 0 ? stages[index - 1] : null;
                const dropoff = prevStage && prevStage.count > 0 && prevStage.count > stg.count
                  ? Math.round(((prevStage.count - stg.count) / prevStage.count) * 100)
                  : null;

                const polygonPoints = `${x1},${yTop} ${x2},${yTop} ${x3},${yBot} ${x4},${yBot}`;

                return (
                  <g
                    key={stg.stageKey}
                    className="cursor-pointer transition-opacity duration-200"
                    style={{ opacity: isDimmed ? 0.35 : 1 }}
                    onMouseEnter={() => setHoveredStageKey(stg.stageKey)}
                    onMouseLeave={() => setHoveredStageKey(null)}
                  >
                    {/* Left Guide Line */}
                    <line
                      x1={175}
                      y1={yMid}
                      x2={x1 - 8}
                      y2={yMid}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-border/70"
                      strokeWidth={1}
                    />

                    {/* Left Stage Label Group */}
                    <g transform={`translate(15, ${yMid - 10})`}>
                      {/* Step Number Badge */}
                      <rect
                        x={0}
                        y={0}
                        width={22}
                        height={20}
                        rx={5}
                        fill={stg.color}
                      />
                      <text
                        x={11}
                        y={14}
                        textAnchor="middle"
                        className="text-[10px] font-bold font-mono fill-white"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </text>

                      {/* Stage Name */}
                      <text
                        x={28}
                        y={14}
                        className={cn(
                          "text-xs font-bold transition-colors",
                          isHovered ? "fill-foreground" : "fill-foreground/90"
                        )}
                      >
                        {stg.name}
                      </text>
                    </g>

                    {/* Funnel Trapezoid Polygon */}
                    <polygon
                      points={polygonPoints}
                      fill={`url(#funnel-grad-${isHovered ? "hover-" : ""}${stg.stageKey})`}
                      stroke={stg.color}
                      strokeWidth={isHovered ? 2.5 : 1.25}
                      strokeLinejoin="round"
                      className="transition-all duration-200"
                    />

                    {/* Center Pill: Lead Count */}
                    <rect
                      x={centerX - 36}
                      y={yMid - 10}
                      width={72}
                      height={20}
                      rx={10}
                      fill="var(--color-card)"
                      stroke={stg.color}
                      strokeWidth={1}
                      className="dark:fill-slate-900 shadow-2xs"
                    />
                    <text
                      x={centerX}
                      y={yMid + 4}
                      textAnchor="middle"
                      className="text-[11px] font-extrabold fill-foreground font-mono"
                    >
                      {stg.count} {stg.count === 1 ? "lead" : "leads"}
                    </text>

                    {/* Right Guide Line */}
                    <line
                      x1={x2 + 8}
                      y1={yMid}
                      x2={475}
                      y2={yMid}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-border/70"
                      strokeWidth={1}
                    />

                    {/* Right Metric Group */}
                    <g transform={`translate(485, ${yMid - 10})`}>
                      {stg.formattedValue && (
                        <text
                          x={0}
                          y={10}
                          className="text-xs font-bold font-mono fill-emerald-600 dark:fill-emerald-400"
                        >
                          {stg.formattedValue}
                        </text>
                      )}
                      <text
                        x={0}
                        y={23}
                        className="text-[10px] font-mono fill-muted-foreground"
                      >
                        {pctOfTotal}% of pipeline
                      </text>
                    </g>

                    {/* Inter-stage drop-off connector bridge */}
                    {index < stageCount - 1 && (
                      <g transform={`translate(${centerX}, ${yBot + stageGap / 2})`}>
                        {dropoff !== null && dropoff > 0 ? (
                          <g transform="translate(0, -6)">
                            <rect
                              x={-28}
                              y={0}
                              width={56}
                              height={14}
                              rx={7}
                              fill="var(--color-card)"
                              stroke="var(--color-border)"
                              strokeWidth={1}
                              className="dark:fill-slate-900"
                            />
                            <text
                              x={0}
                              y={10}
                              textAnchor="middle"
                              className="text-[9px] font-mono font-bold fill-muted-foreground"
                            >
                              ▼ -{dropoff}%
                            </text>
                          </g>
                        ) : (
                          <line
                            x1={0}
                            y1={-4}
                            x2={0}
                            y2={4}
                            stroke={stg.color}
                            strokeWidth={1.5}
                            opacity={0.4}
                          />
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* View 2: Flow Columns / Waterfall View */}
        {viewMode === "waterfall" && (
          <div className="w-full flex flex-col gap-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {stages.map((stg, index) => {
                const isHovered = hoveredStageKey === stg.stageKey;
                const isDimmed = hoveredStageKey !== null && !isHovered;
                const pctOfTotal = totalLeads > 0 ? Math.round((stg.count / totalLeads) * 100) : 0;
                const heightPct = Math.max((stg.count / maxStageCount) * 100, 12);

                return (
                  <div
                    key={stg.stageKey}
                    className={cn(
                      "flex flex-col p-3 rounded-xl border transition-all cursor-pointer",
                      isHovered
                        ? "bg-surface-elevated border-border shadow-xs scale-[1.02]"
                        : "bg-surface-subtle/40 border-border/60 hover:bg-surface-subtle/80",
                      isDimmed && "opacity-35"
                    )}
                    onMouseEnter={() => setHoveredStageKey(stg.stageKey)}
                    onMouseLeave={() => setHoveredStageKey(null)}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono text-white shrink-0"
                        style={{ backgroundColor: stg.color }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {pctOfTotal}%
                      </span>
                    </div>

                    <span className="text-xs font-bold text-foreground truncate mb-2">
                      {stg.name}
                    </span>

                    {/* Vertical Flow Column */}
                    <div className="w-full h-24 bg-surface-subtle/70 rounded-lg p-1 flex items-end relative overflow-hidden">
                      <motion.div
                        className="w-full rounded-md"
                        style={{ backgroundColor: stg.color }}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 16 }}
                      />
                    </div>

                    <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-border/50">
                      <span className="text-sm font-extrabold font-mono text-foreground">
                        {stg.count}
                      </span>
                      {stg.formattedValue && (
                        <span className="text-[11px] font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                          {stg.formattedValue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Telemetry HUD on Hover */}
        <AnimatePresence>
          {hoveredStage && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/80 border border-border/70 text-xs shadow-2xs flex-wrap gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: hoveredStage.color }}
                />
                <span className="font-bold text-foreground">{hoveredStage.name}</span>
                <span className="text-muted-foreground text-[11px]">
                  ({hoveredStage.count} {hoveredStage.count === 1 ? "lead" : "leads"} ·{" "}
                  {totalLeads > 0 ? Math.round((hoveredStage.count / totalLeads) * 100) : 0}% of pipeline)
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                {hoveredStage.formattedValue && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {hoveredStage.formattedValue}
                  </span>
                )}
                {hoveredStage.value && hoveredStage.count > 0 && (
                  <span className="text-muted-foreground text-[11px]">
                    avg: €{Math.round((hoveredStage.value / hoveredStage.count) / 1000)}K/lead
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ChartCard>
  );
}
