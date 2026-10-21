"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { parseMermaidToFlow, type FlowNodeData } from "./mermaid-to-flow";
import { Database, Server, Workflow, Cpu, Layers } from "lucide-react";
import { cn } from "@zsyio/ui";

function getNodeIcon(label: string, shape?: string) {
  const l = label.toLowerCase();
  if (shape === "cylinder" || l.includes("database") || l.includes("postgres") || l.includes("sql") || l.includes("store")) {
    return <Database className="w-4 h-4 text-primary" />;
  }
  if (l.includes("broker") || l.includes("kafka") || l.includes("queue") || l.includes("connector")) {
    return <Cpu className="w-4 h-4 text-warning" />;
  }
  if (l.includes("api") || l.includes("service") || l.includes("gateway") || l.includes("server") || l.includes("engine")) {
    return <Server className="w-4 h-4 text-success" />;
  }
  if (l.includes("flow") || l.includes("pms") || l.includes("task") || l.includes("sprint") || l.includes("app")) {
    return <Workflow className="w-4 h-4 text-notion-blue-fg" />;
  }
  return <Layers className="w-4 h-4 text-muted-foreground" />;
}

export function CustomArchitectureNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const icon = getNodeIcon(data.label, data.shape);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 rounded-lg border border-border/80 bg-card shadow-xs hover:border-primary/50 hover:shadow-md transition-all select-none min-w-[170px] max-w-[280px]",
        data.shape === "cylinder" && "border-primary/40 bg-primary/5",
        data.shape === "stadium" && "rounded-full px-5"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-primary !border !border-card !-left-1.5"
      />

      <div className="w-7 h-7 rounded-lg bg-surface-subtle border border-border/60 flex items-center justify-center shrink-0 shadow-2xs">
        {icon}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-xs text-foreground truncate font-mono tracking-tight leading-snug">
          {data.label}
        </span>
        {data.shape === "cylinder" && (
          <span className="text-xs font-mono text-muted-foreground font-semibold  mt-0.5">
            Data Storage
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-primary !border !border-card !-right-1.5"
      />
    </div>
  );
}

const nodeTypes = {
  customArchitectureNode: CustomArchitectureNode,
};

export interface InteractiveFlowDiagramProps {
  code: string;
  className?: string;
  height?: number | string;
}

export function InteractiveFlowDiagram({
  code,
  className,
  height = 500,
}: InteractiveFlowDiagramProps) {
  const parsed = useMemo(() => parseMermaidToFlow(code), [code]);

  if (!parsed) {
    return null;
  }

  const styledEdges: Edge[] = parsed.edges.map((e) => ({
    ...e,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--primary)",
      width: 16,
      height: 16,
    },
    style: {
      stroke: "var(--primary)",
      strokeWidth: 1.75,
    },
    labelStyle: {
      fill: "var(--foreground)",
      fontSize: 11,
      fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
      fontWeight: 600,
    },
    labelBgStyle: {
      fill: "var(--card)",
      fillOpacity: 0.95,
      stroke: "var(--border)",
      strokeWidth: 1,
      rx: 6,
      ry: 6,
    },
    labelBgPadding: [8, 4] as [number, number],
  }));

  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-border/80 bg-surface-subtle overflow-hidden select-none",
        className
      )}
      style={{ height }}
    >
      <ReactFlow
        defaultNodes={parsed.nodes}
        defaultEdges={styledEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, minZoom: 0.65, maxZoom: 1.4 }}
        minZoom={0.35}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--border-strong)" />
        <Controls
          showInteractive={false}
          className="!bg-card !border !border-border/80 !rounded-lg !shadow-xs !p-0.5 fill-foreground [&>button]:!bg-transparent [&>button]:!border-b [&>button]:!border-border/60 [&>button:last-child]:!border-b-0"
        />
      </ReactFlow>
    </div>
  );
}
