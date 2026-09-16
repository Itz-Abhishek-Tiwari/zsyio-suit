"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SegmentedTabs } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  TASK_TYPE_COLORS,
  CHART_THEME,
} from "@/lib/chart-tokens";
import type { MetricDistributionItem } from "@/components/dashboard/TaskDistributionChart";
import {
  ProductTasksTab,
  type SerializedProductTask,
} from "./profile/ProductTasksTab";
import {
  ProductAnalyticsTab,
  type StageMetric,
  type DeveloperWorkloadEntry,
} from "./profile/ProductAnalyticsTab";
import { ProductDetailsTab } from "./profile/ProductDetailsTab";
import { ListTodo, BarChart3, Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Environment } from "@zsyio/types";

export type { SerializedProductTask };

export interface ProductProfileTabsProps {
  productId: string;
  productName: string;
  clientId: string;
  clientName: string;
  clientDomain?: string | null;
  clientLogoUrl?: string | null;
  clientStatus?: string;
  version: string | null;
  deployedUrl: string | null;
  repoUrl: string | null;
  environment: Environment;
  lastDeployed: string | null;
  canCreateTask: boolean;
  canViewClients?: boolean;
  tasks: SerializedProductTask[];
}

export function ProductProfileTabs({
  productId,
  productName,
  clientId,
  clientName,
  clientDomain,
  clientLogoUrl,
  clientStatus = "ACTIVE",
  version,
  deployedUrl,
  repoUrl,
  environment,
  lastDeployed,
  canCreateTask,
  canViewClients = false,
  tasks,
}: ProductProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "analytics" | "overview">("tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignees?.some((a) => a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        task.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && task.status !== "DONE") ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReviewCount = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const backlogCount = tasks.filter((t) => t.status === "BACKLOG").length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;

  const statusMetricItems: MetricDistributionItem[] = useMemo(() => {
    return [
      { key: "DONE", ...STATUS_COLORS.DONE, count: doneCount },
      { key: "IN_PROGRESS", ...STATUS_COLORS.IN_PROGRESS, count: inProgressCount },
      { key: "IN_REVIEW", ...STATUS_COLORS.IN_REVIEW, count: inReviewCount },
      { key: "TODO", ...STATUS_COLORS.TODO, count: todoCount },
      { key: "BACKLOG", ...STATUS_COLORS.BACKLOG, count: backlogCount },
      { key: "BLOCKED", ...STATUS_COLORS.BLOCKED, count: blockedCount },
    ];
  }, [doneCount, inProgressCount, inReviewCount, todoCount, backlogCount, blockedCount]);

  const priorityCountsMap = useMemo(() => {
    const map: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach((t) => {
      map[t.priority] = (map[t.priority] || 0) + 1;
    });
    return map;
  }, [tasks]);

  const priorityMetricItems: MetricDistributionItem[] = useMemo(() => {
    return [
      { key: "CRITICAL", ...PRIORITY_COLORS.CRITICAL, count: priorityCountsMap["CRITICAL"] ?? 0 },
      { key: "HIGH", ...PRIORITY_COLORS.HIGH, count: priorityCountsMap["HIGH"] ?? 0 },
      { key: "MEDIUM", ...PRIORITY_COLORS.MEDIUM, count: priorityCountsMap["MEDIUM"] ?? 0 },
      { key: "LOW", ...PRIORITY_COLORS.LOW, count: priorityCountsMap["LOW"] ?? 0 },
    ];
  }, [priorityCountsMap]);

  const typeCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      map[t.type] = (map[t.type] || 0) + 1;
    });
    return map;
  }, [tasks]);

  const typeMetricItems: MetricDistributionItem[] = useMemo(() => {
    return Object.entries(typeCountsMap).map(([type, count]) => {
      const config = TASK_TYPE_COLORS[type] ?? {
        label: type.replace(/_/g, " "),
        hexColor: CHART_THEME.fallbackColor,
        colorClass: "bg-primary",
      };
      return {
        key: type,
        label: config.label,
        colorClass: config.colorClass,
        hexColor: config.hexColor,
        count,
      };
    });
  }, [typeCountsMap]);

  const developerWorkloadData: DeveloperWorkloadEntry[] = useMemo(() => {
    const map = new Map<string, DeveloperWorkloadEntry>();
    tasks.forEach((t) => {
      const user = t.assignedTo;
      if (user) {
        const existing = map.get(user.id) || { name: user.name, email: user.email, total: 0, active: 0, done: 0 };
        existing.total++;
        if (t.status === "DONE") {
          existing.done++;
        } else {
          existing.active++;
        }
        map.set(user.id, existing);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const stages: StageMetric[] = [
    { label: "Backlog", count: backlogCount, color: "bg-slate-400", hexColor: "var(--color-status-backlog)", text: "text-slate-500 dark:text-slate-400" },
    { label: "To Do", count: todoCount, color: "bg-blue-500", hexColor: "var(--color-status-todo)", text: "text-blue-600 dark:text-blue-400" },
    { label: "In Progress", count: inProgressCount, color: "bg-amber-500", hexColor: "var(--color-status-in-progress)", text: "text-amber-600 dark:text-amber-400" },
    { label: "In Review", count: inReviewCount, color: "bg-purple-500", hexColor: "var(--color-status-in-review)", text: "text-purple-600 dark:text-purple-400" },
    { label: "Blocked", count: blockedCount, color: "bg-red-500", hexColor: "var(--color-status-blocked)", text: "text-red-600 dark:text-red-400" },
    { label: "Completed", count: doneCount, color: "bg-emerald-500", hexColor: "var(--color-status-done)", text: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs<"tasks" | "analytics" | "overview">
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          tabs={[
            {
              id: "tasks",
              label: "Tasks & Roadmap",
              icon: <ListTodo className="w-3.5 h-3.5" />,
              count: tasks.length,
              badgeVariant: "primary",
            },
            {
              id: "analytics",
              label: "Analytics & Workload",
              icon: <BarChart3 className="w-3.5 h-3.5" />,
              badgeVariant: "default",
            },
            {
              id: "overview",
              label: "Overview & Deployment",
              icon: <Layers className="w-3.5 h-3.5" />,
              badgeVariant: "default",
            },
          ]}
        />

        {canCreateTask && activeTab === "tasks" && (
          <Button
            asChild
            size="sm"
            className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Link href={`/tasks/new?productId=${productId}&clientId=${clientId}`}>
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </Link>
          </Button>
        )}
      </div>

      {activeTab === "tasks" && (
        <ProductTasksTab
          productId={productId}
          clientId={clientId}
          productName={productName}
          canCreateTask={canCreateTask}
          tasks={tasks}
          filteredTasks={filteredTasks}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
        />
      )}

      {activeTab === "analytics" && (
        <ProductAnalyticsTab
          totalCount={totalCount}
          doneCount={doneCount}
          stages={stages}
          statusMetricItems={statusMetricItems}
          priorityMetricItems={priorityMetricItems}
          typeMetricItems={typeMetricItems}
          developerWorkloadData={developerWorkloadData}
        />
      )}

      {activeTab === "overview" && (
        <ProductDetailsTab
          clientId={clientId}
          clientName={clientName}
          clientDomain={clientDomain}
          clientLogoUrl={clientLogoUrl}
          clientStatus={clientStatus}
          version={version}
          deployedUrl={deployedUrl}
          repoUrl={repoUrl}
          environment={environment}
          lastDeployed={lastDeployed}
          totalCount={totalCount}
          canViewClients={canViewClients}
          copiedField={copiedField}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
