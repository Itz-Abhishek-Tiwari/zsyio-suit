"use client";

import React, { useState } from "react";
import { Filter } from "lucide-react";
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
  title = "Pipeline overview",
  description = "Compare the volume and value held at each stage.",
  icon = <Filter className="w-4 h-4" />,
  headerAction,
  className,
  showProgressionBar = true,
  showStageMetrics = true,
}: PipelineFunnelChartProps) {
  const [viewMode, setViewMode] = useState<"funnel" | "waterfall">("funnel");
  const total = stages.reduce((sum, stage) => sum + Math.max(0, stage.count), 0);
  const max = Math.max(1, ...stages.map(stage => stage.count));
  return (
    <ChartCard title={title} description={description} icon={icon} className={className}
      headerAction={headerAction || <div className="flex items-center gap-1 border-b border-border">
        {(["funnel", "waterfall"] as const).map(mode => <button key={mode} type="button" aria-pressed={viewMode === mode}
          onClick={() => setViewMode(mode)} className={cn("px-3 py-2 text-xs transition-colors border-b-2", viewMode === mode ? "border-primary text-foreground bg-accent" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {mode === "funnel" ? "Stages" : "Columns"}
        </button>)}
      </div>}>
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <span className="text-3xl font-[family-name:var(--font-editorial)] text-foreground">{total.toLocaleString()} <span className="text-xs font-sans text-muted-foreground">leads in pipeline</span></span>
        <span className="text-xs text-muted-foreground">{stages.length} stages</span>
      </div>
      {showProgressionBar && total > 0 && <div className="flex h-2 gap-0.5 mb-6 overflow-hidden rounded-sm" aria-label="Pipeline share by stage">
        {stages.filter(stage => stage.count > 0).map(stage => <div key={stage.stageKey} style={{width: `${stage.count / total * 100}%`, backgroundColor: stage.color}}><title>{stage.name}: {stage.count}</title></div>)}
      </div>}
      {total === 0 && <p className="py-3 text-sm text-muted-foreground">No leads in this pipeline yet.</p>}
      {viewMode === "funnel" ? <div className="space-y-4">
        {stages.map((stage, index) => <div key={stage.stageKey} className="group" tabIndex={0} aria-label={`${stage.name}: ${stage.count} leads`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-foreground"><span className="text-muted-foreground mr-3 tabular-nums">{String(index + 1).padStart(2, "0")}</span>{stage.name}</span>
            <span className="text-xs tabular-nums text-foreground">{stage.count.toLocaleString()} <span className="text-muted-foreground ml-2">{total > 0 ? Math.round(stage.count / total * 100) : 0}%</span>{showStageMetrics && stage.formattedValue && <span className="ml-3 text-muted-foreground">{stage.formattedValue}</span>}</span>
          </div>
          <div className="h-5 bg-surface-subtle rounded-sm overflow-hidden"><div className="h-full rounded-sm transition-opacity group-hover:opacity-80" style={{width: `${Math.max(0, stage.count) / max * 100}%`, backgroundColor: stage.color}} /></div>
        </div>)}
        <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums pt-2 border-t border-border"><span>0 leads</span><span>{max} leads</span></div>
      </div> : <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
        {stages.map(stage => <div key={stage.stageKey} className="flex-1 min-w-20 flex flex-col" tabIndex={0} aria-label={`${stage.name}: ${stage.count} leads`}>
          <span className="text-lg tabular-nums text-foreground mb-3">{stage.count}</span>
          <div className="h-40 flex items-end bg-surface-subtle border-b border-border"><div className="w-full rounded-t-sm" style={{height: `${Math.max(0, stage.count) / max * 100}%`, backgroundColor: stage.color}} /></div>
          <span className="text-xs text-foreground mt-3 leading-relaxed">{stage.name}</span>
          {showStageMetrics && stage.formattedValue && <span className="text-[10px] text-muted-foreground mt-1">{stage.formattedValue}</span>}
        </div>)}
      </div>}
    </ChartCard>
  );
}
