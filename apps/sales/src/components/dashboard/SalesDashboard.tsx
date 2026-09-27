"use client";

import Link from "next/link";
import {
  TrendingUp,
  Euro,
  Users,
  Calendar,
  AlertTriangle,
  Briefcase,
  Clock,
  ArrowUpRight,
  PhoneCall,
  Mail,
  FileText,
  Calendar as CalendarIcon,
  CheckSquare,
  Activity,
  ChevronRight,
  Plus,
  Kanban,
  Building2,
} from "lucide-react";
import { useGetSalesDashboardQuery } from "@/store/api/salesLeadsApi";
import {
  SALES_STAGE_COLORS,
  type SalesStage,
} from "@zsyio/types";
import { formatCurrency, formatLeadId, formatRelativeTime } from "@/lib/utils";
import { KpiCard } from "@/components/shared";
import { DonutDistributionChart, PipelineFunnelChart } from "@zsyio/ui";
import { SalesStageBadge } from "@/components/shared/SalesStageBadge";
import {
  Skeleton,
  Button,
  UserAvatar,
  KanbanIdentifierBadge,
  KanbanPriorityBadge,
  KanbanDueDateBadge,
  DashboardHero,
} from "@zsyio/ui";

const STAGE_STRIP: readonly { stage: SalesStage; label: string; color: string }[] = [
  { stage: "NEW_LEAD", label: "New Lead", color: SALES_STAGE_COLORS.NEW_LEAD },
  { stage: "CONTACTED", label: "Contacted", color: SALES_STAGE_COLORS.CONTACTED },
  { stage: "QUALIFIED", label: "Qualified", color: SALES_STAGE_COLORS.QUALIFIED },
  { stage: "PROPOSAL_SENT", label: "Proposal", color: SALES_STAGE_COLORS.PROPOSAL_SENT },
  { stage: "NEGOTIATION", label: "Negotiation", color: SALES_STAGE_COLORS.NEGOTIATION },
  { stage: "WON", label: "Won Deals", color: SALES_STAGE_COLORS.WON },
];

function getActivityIcon(type: string) {
  switch (type) {
    case "CALL":
      return <PhoneCall className="w-3.5 h-3.5 text-blue-500" />;
    case "EMAIL":
      return <Mail className="w-3.5 h-3.5 text-purple-500" />;
    case "MEETING":
      return <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />;
    case "NOTE":
      return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    case "TASK":
      return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-primary" />;
  }
}

interface SalesDashboardProps {
  userName?: string;
  userRole?: string;
}

export function SalesDashboard({ userName, userRole }: SalesDashboardProps) {
  const { data, isLoading, isError } = useGetSalesDashboardQuery();

  const heroActions = (
    <>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs"
      >
        <Link href="/kanban">
          <Kanban className="w-3.5 h-3.5 text-primary" />
          <span>Kanban Board</span>
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs"
      >
        <Link href="/leads">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>All Leads</span>
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="font-semibold text-xs h-8.5 px-3.5 gap-1.5 rounded-md shadow-xs bg-primary hover:bg-primary-hover text-primary-foreground"
      >
        <Link href="/leads/new">
          <Plus className="w-3.5 h-3.5" />
          <span>New Lead</span>
        </Link>
      </Button>
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHero
          badge={{
            label: "Sales & Pipeline Hub",
            icon: TrendingUp,
            variant: "amber",
          }}
          systemStatus={{
            label: "PULSE CRM ONLINE",
          }}
          userName={userName}
          userRole={userRole}
          accentTone="amber"
          description="Real-time pipeline velocity, conversion metrics, and revenue projections."
          metrics={[
            { label: "Pipeline", value: "...", icon: Euro },
            { label: "Active Deals", value: "...", icon: Briefcase },
            { label: "Win Rate", value: "...", icon: TrendingUp },
          ]}
          actions={heroActions}
        />

        {/* KPI Skeletons */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>

        {/* Stage Strip Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>

        {/* Action Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 rounded-lg lg:col-span-2" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-foreground-secondary border border-destructive/20 bg-destructive/5 rounded-lg p-8">
        <AlertTriangle className="w-9 h-9 text-destructive" />
        <p className="text-base font-semibold text-foreground">Failed to load sales dashboard stats</p>
        <p className="text-xs text-muted-foreground">Please check your network connection or try refreshing the page.</p>
      </div>
    );
  }

  const activeLeads = data.totalLeads - data.won - data.lost;
  const winRate =
    data.won + data.lost > 0
      ? Math.round((data.won / (data.won + data.lost)) * 100)
      : 0;

  // Funnel stages (active progression pipeline)
  const funnelStages: readonly SalesStage[] = [
    "NEW_LEAD",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "NEGOTIATION",
  ];

  const funnelData = funnelStages.map((stage) => {
    const breakdown = data.stageBreakdown.find((s) => s.stage === stage);
    const count = breakdown?.count ?? 0;
    const value = breakdown?.value ?? 0;
    return {
      stageKey: stage,
      name: breakdown?.label ?? stage,
      count,
      value,
      formattedValue: formatCurrency(value),
      color: SALES_STAGE_COLORS[stage],
    };
  });

  // Multi-dimension distribution data matching PMS TaskDistributionChart
  const stageDimensions = [
    {
      id: "count",
      label: "By Leads",
      icon: Users,
      items: data.stageBreakdown.map((s) => ({
        key: s.stage,
        label: s.label,
        count: s.count,
        color: SALES_STAGE_COLORS[s.stage],
        hexColor: SALES_STAGE_COLORS[s.stage],
      })),
      totalCount: data.totalLeads,
      formatValue: (v: number) => String(v),
    },
    {
      id: "value",
      label: "By Value",
      icon: Euro,
      items: data.stageBreakdown.map((s) => ({
        key: s.stage,
        label: s.label,
        count: s.value,
        color: SALES_STAGE_COLORS[s.stage],
        hexColor: SALES_STAGE_COLORS[s.stage],
      })),
      totalCount: data.totalPipelineValue + data.wonValue,
      formatValue: (v: number) => formatCurrency(v),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Command Hero Deck with Live Telemetry */}
      <DashboardHero
        badge={{
          label: "Sales & Pipeline Hub",
          icon: TrendingUp,
          variant: "amber",
        }}
        systemStatus={{
          label: "PULSE CRM ONLINE",
        }}
        userName={userName}
        userRole={userRole}
        accentTone="amber"
        description="Real-time pipeline velocity, conversion metrics, and revenue projections."
        actions={heroActions}
      />

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Leads"
          value={data.totalLeads}
          icon={<Users className="w-5 h-5" />}
          subtext={`${activeLeads} active in pipeline`}
          variant="primary"
        />
        <KpiCard
          label="Pipeline Value"
          value={formatCurrency(data.totalPipelineValue)}
          icon={<Euro className="w-5 h-5" />}
          subtext={`${formatCurrency(data.wonValue)} won`}
          variant="emerald"
        />
        <KpiCard
          label="Win Rate"
          value={`${winRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          subtext={`${data.won} won, ${data.lost} lost`}
          variant={winRate >= 50 ? "emerald" : "amber"}
        />
        <KpiCard
          label="Follow-ups Due"
          value={data.upcomingFollowUps}
          icon={<Calendar className="w-5 h-5" />}
          subtext="Due in next 7 days"
          variant={data.upcomingFollowUps > 5 ? "amber" : "default"}
        />
      </div>

      {/* 2. Pipeline Stages Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGE_STRIP.map((item) => {
          const breakdown = data.stageBreakdown.find((s) => s.stage === item.stage);
          const count = breakdown?.count ?? 0;
          const value = breakdown?.value ?? 0;

          return (
            <div
              key={item.stage}
              className="bg-card border border-border/80 hover:border-primary/40 rounded-lg p-3.5 flex flex-col justify-between gap-2 shadow-2xs transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xl font-bold font-mono text-foreground tracking-tight">
                  {count}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground font-mono">
                  {formatCurrency(value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Unified Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <PipelineFunnelChart
          stages={funnelData}
          title="Pipeline Velocity Funnel"
          description="Lead count and projected deal volume across active sales stages."
          chartHeight={220}
          showStageMetrics={false}
        />

        <DonutDistributionChart
          dimensions={stageDimensions}
          defaultDimensionId="count"
          title="Pipeline Stage Distribution"
          description="Interactive breakdown across lead volume and monetary deal value."
          centerLabel="Total Leads"
          chartHeight={220}
        />
      </div>

      {/* 4. Actionable Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Recent High-Value Opportunities (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-card border border-border/80 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Recent Opportunities</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Latest active leads and deal status updates.
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs font-semibold gap-1 text-primary hover:text-primary/80 h-8 rounded-md"
              >
                <Link href="/leads">
                  <span>View All Leads</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            {data.recentLeads && data.recentLeads.length > 0 ? (
              <div className="divide-y divide-border/60">
                {data.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group hover:bg-surface-subtle/50 -mx-3 px-3 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <KanbanIdentifierBadge id={formatLeadId(lead.id)} />
                      <div className="min-w-0">
                        <Link
                          href={`/leads/${lead.id}?from=dashboard`}
                          className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {lead.client?.name ?? "Unnamed Client"}
                        </Link>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {lead.client?.contactName || lead.client?.contactEmail || "No contact specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <SalesStageBadge stage={lead.currentStage} size="xs" />
                      <KanbanPriorityBadge priority={lead.priority} />

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold font-mono text-foreground block">
                          {formatCurrency(lead.dealValue)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {formatRelativeTime(lead.updatedAt)}
                        </span>
                      </div>

                      <UserAvatar
                        user={lead.assignedTo}
                        size="xs"
                        title={lead.assignedTo?.name ?? "Unassigned"}
                      />

                      <Link
                        href={`/leads/${lead.id}?from=dashboard`}
                        className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-md"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                <Briefcase className="w-8 h-8 opacity-40" />
                <p className="text-xs font-medium">No leads currently logged.</p>
                <Button asChild size="sm" variant="outline" className="mt-2 h-8 text-xs rounded-md">
                  <Link href="/leads/new">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create First Lead
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-ups, Activities & Quick Nav (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Outreach Card */}
          <div className="bg-card border border-border/80 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Upcoming Outreach</h2>
                  <p className="text-[11px] text-muted-foreground">Scheduled follow-up dates</p>
                </div>
              </div>

              <Link
                href="/kanban"
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                Board
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {data.upcomingFollowUpsList && data.upcomingFollowUpsList.length > 0 ? (
              <div className="divide-y divide-border/60">
                {data.upcomingFollowUpsList.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/leads/${lead.id}?from=dashboard`}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {lead.client?.name ?? "Lead"}
                      </Link>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatCurrency(lead.dealValue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <KanbanDueDateBadge dueDate={lead.nextFollowUpAt} />
                      <UserAvatar user={lead.assignedTo} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-xs">
                No immediate outreach scheduled.
              </div>
            )}
          </div>

          {/* Recent Activities Card */}
          {data.recentActivities && data.recentActivities.length > 0 && (
            <div className="bg-card border border-border/80 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
                <span className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Recent Activities</h2>
                  <p className="text-[11px] text-muted-foreground">Calls, meetings, notes & emails</p>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {data.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-md bg-surface-subtle border border-border/70 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {activity.lead?.client?.name ?? "Client"} • {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                    <UserAvatar user={activity.assignedTo ?? activity.createdBy} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Card matching PMS */}
          <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Sales Navigation</h2>
                <p className="text-[11px] text-muted-foreground">Quick pipeline workspace shortcuts.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/kanban"
                className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-primary/40 flex flex-col gap-1.5 transition-all group shadow-2xs"
              >
                <Kanban className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground truncate">Kanban Board</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">Drag & drop deals</span>
              </Link>

              <Link
                href="/leads"
                className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-primary/40 flex flex-col gap-1.5 transition-all group shadow-2xs"
              >
                <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground truncate">All Leads</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">Tabular lead directory</span>
              </Link>

              <Link
                href="/leads/new"
                className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-primary/40 flex flex-col gap-1.5 transition-all group shadow-2xs"
              >
                <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground truncate">New Lead</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">Add sales prospect</span>
              </Link>

              <Link
                href="/clients"
                className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-primary/40 flex flex-col gap-1.5 transition-all group shadow-2xs"
              >
                <Building2 className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground truncate">Clients</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">Accounts & contacts</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
