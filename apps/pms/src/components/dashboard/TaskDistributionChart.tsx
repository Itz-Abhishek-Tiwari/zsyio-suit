"use client";

import React from "react";
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import {
  DonutDistributionChart,
  type ChartDimension,
  type DistributionChartItem,
} from "@zsyio/ui";

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  colorClass: string;
  hexColor: string;
}

export interface MetricDistributionItem {
  key: string;
  label: string;
  count: number;
  colorClass: string;
  hexColor: string;
}

type ViewDimension = "status" | "priority" | "type";

interface MultiModeTaskDistributionProps {
  items?: StatusDistributionItem[] | MetricDistributionItem[];
  statusItems?: MetricDistributionItem[];
  priorityItems?: MetricDistributionItem[];
  typeItems?: MetricDistributionItem[];
  totalTasks: number;
  title?: string;
  description?: string;
  className?: string;
  defaultDimension?: ViewDimension;
}

export function TaskDistributionChart({
  items,
  statusItems,
  priorityItems,
  typeItems,
  totalTasks,
  title = "Task Distribution",
  description,
  className,
  defaultDimension = "status",
}: MultiModeTaskDistributionProps) {
  const isMultiMode = Boolean(statusItems && (priorityItems || typeItems));

  const dimensions: ChartDimension[] | undefined = isMultiMode
    ? [
        {
          id: "status",
          label: "Status",
          icon: CheckCircle2,
          items: (statusItems ?? []).map((i) => ({
            key: i.key,
            label: i.label,
            count: i.count,
            hexColor: i.hexColor,
            colorClass: i.colorClass,
          })),
          totalCount: totalTasks,
        },
        {
          id: "priority",
          label: "Priority",
          icon: AlertCircle,
          items: (priorityItems ?? []).map((i) => ({
            key: i.key,
            label: i.label,
            count: i.count,
            hexColor: i.hexColor,
            colorClass: i.colorClass,
          })),
          totalCount: totalTasks,
        },
        {
          id: "type",
          label: "Type",
          icon: Tag,
          items: (typeItems ?? []).map((i) => ({
            key: i.key,
            label: i.label,
            count: i.count,
            hexColor: i.hexColor,
            colorClass: i.colorClass,
          })),
          totalCount: totalTasks,
        },
      ]
    : undefined;

  const normalizedSingleItems: DistributionChartItem[] = (items ?? []).map((i) => ({
    key: "status" in i ? i.status : i.key,
    label: i.label,
    count: i.count,
    colorClass: i.colorClass,
    hexColor: i.hexColor,
  }));

  return (
    <DonutDistributionChart
      title={title}
      description={
        description ??
        (isMultiMode
          ? "Spread by status, priority, or type."
          : "Current status spread across tasks.")
      }
      icon={<BarChart3 className="w-4.5 h-4.5" />}
      dimensions={dimensions}
      defaultDimensionId={defaultDimension}
      items={normalizedSingleItems}
      totalCount={totalTasks}
      centerLabel="Total Tasks"
      className={className}
    />
  );
}
