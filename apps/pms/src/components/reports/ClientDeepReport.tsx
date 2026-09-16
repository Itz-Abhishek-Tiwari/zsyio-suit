"use client";

import Link from "next/link";
import { useGetClientReportQuery, type ClientReportResponse } from "@/store/api/reportsApi";
import { ClientStatusBadge } from "@/components/clients/ClientStatusBadge";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import { Button, Skeleton, KpiCard, MetricBarChart } from "@zsyio/ui";

import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Package,
  Globe,
  Mail,
  ShieldAlert,
  Target,
} from "lucide-react";
import {
  TaskDistributionChart,
  type StatusDistributionItem,
} from "@/components/dashboard/TaskDistributionChart";
import { STATUS_COLORS, CHART_THEME } from "@/lib/chart-tokens";

import {
  TASK_TYPE_CONFIG as TYPE_CONFIG,
  PRIORITY_COLOR_MAP,
} from "./reports-chart-config";


interface ClientDeepReportProps {
  clientId: string;
  initialData?: ClientReportResponse;
  hideHeader?: boolean;
}

export function ClientDeepReport({ clientId, initialData, hideHeader = false }: ClientDeepReportProps) {
  const { data: fetchedData, isLoading } = useGetClientReportQuery(clientId, {
    skip: Boolean(initialData),
  });

  const data = initialData || fetchedData;

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-6 py-2 animate-fade-in">
        <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-4.5 flex flex-col gap-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="w-8 h-8 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-14 rounded-lg" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col gap-4 shadow-xs">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((p) => (
                <Skeleton key={p} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { client, stats, byStatus, byPriority, byType = [], products } = data;

  // Format status for TaskDistributionChart
  const statusCountsMap: Record<string, number> = {};
  for (const s of byStatus) {
    statusCountsMap[s.status] = s.count;
  }

  const statusItems: StatusDistributionItem[] = [
    {
      status: "IN_PROGRESS",
      ...STATUS_COLORS.IN_PROGRESS,
      count: statusCountsMap["IN_PROGRESS"] ?? 0,
    },
    {
      status: "TODO",
      ...STATUS_COLORS.TODO,
      count: statusCountsMap["TODO"] ?? 0,
    },
    {
      status: "IN_REVIEW",
      ...STATUS_COLORS.IN_REVIEW,
      count: statusCountsMap["IN_REVIEW"] ?? 0,
    },
    {
      status: "BLOCKED",
      ...STATUS_COLORS.BLOCKED,
      count: statusCountsMap["BLOCKED"] ?? 0,
    },
    {
      status: "DONE",
      ...STATUS_COLORS.DONE,
      count: statusCountsMap["DONE"] ?? 0,
    },
    {
      status: "BACKLOG",
      ...STATUS_COLORS.BACKLOG,
      count: statusCountsMap["BACKLOG"] ?? 0,
    },
  ];

  // Priority chart data
  const priorityItems = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((pr) => {
    const item = byPriority.find((p) => p.priority === pr);
    const cfg = PRIORITY_COLOR_MAP[pr] || { label: pr, color: CHART_THEME.fallbackColor };
    return {
      key: pr,
      label: cfg.label,
      value: item?.count ?? 0,
      color: cfg.color,
    };
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-2">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary border border-primary/25 flex items-center justify-center font-bold text-sm shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-foreground text-base truncate">
                  {client.name}
                </h3>
                <ClientStatusBadge status={client.status} className="shrink-0 text-[10px] font-bold" />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {client.domain && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.domain}
                  </span>
                )}
                {client.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border">
              <Link href={`/clients/${client.id}`}>
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
                <span>Client Settings</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          subtext={`${stats.doneTasks}/${stats.totalTasks} completed`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />

        <KpiCard
          label="Active Workload"
          value={stats.activeTasks}
          subtext={`${stats.totalTasks} total tickets`}
          icon={<Zap className="w-5 h-5" />}
          variant="sky"
        />

        <KpiCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          subtext={stats.overdueTasks > 0 ? "past due date" : "all clear"}
          icon={<Clock className="w-5 h-5" />}
          variant={stats.overdueTasks > 0 ? "rose" : "default"}
        />

        <KpiCard
          label="Blocked Issues"
          value={stats.blockedTasks}
          subtext={stats.blockedTasks > 0 ? "requires unblocking" : "none blocked"}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={stats.blockedTasks > 0 ? "amber" : "default"}
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TaskDistributionChart
          title="Task Status Spread"
          description="Status distribution for this client."
          items={statusItems}
          totalTasks={stats.totalTasks}
        />

        <div className="flex flex-col gap-6">
          <MetricBarChart
            title="Priority Spread"
            description="Urgency breakdown for this client."
            icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
            items={priorityItems}
          />

          <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Task Category Breakdown
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {byType.map((t) => {
                const cfg = TYPE_CONFIG[t.type] ?? {
                  label: t.type,
                  icon: <Target className="w-3.5 h-3.5 text-muted-foreground" />,
                  barBg: "bg-muted-foreground",
                };
                const pct = stats.totalTasks ? Math.round((t.count / stats.totalTasks) * 100) : 0;
                return (
                  <div key={t.type} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-semibold flex items-center gap-1.5">
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {t.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${cfg.barBg} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-sm font-bold text-foreground">
              Product Suites Delivery Matrix ({products.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    {p.version && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        v{p.version}
                      </span>
                    )}
                  </div>
                  <ProductEnvironmentBadge environment={p.environment} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      {p.doneTasks}/{p.totalTasks} tasks completed
                    </span>
                    <span className="font-extrabold text-foreground">{p.completionRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${p.completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  {p.blockedTasks > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                      {p.blockedTasks} blocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      All tasks moving smoothly
                    </span>
                  )}

                  {p.deployedUrl && (
                    <a
                      href={p.deployedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Live App
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
