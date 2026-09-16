import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@zsyio/auth";
import { prisma } from "@zsyio/database";
import { can } from "@zsyio/auth/permissions";
import type { Role } from "@zsyio/auth/permissions";
import { Button, DashboardHero } from "@zsyio/ui";
import { CheckSquare, Workflow, AlertTriangle, TrendingUp } from "lucide-react";
import { DashboardNotesFeed } from "@/components/dashboard/DashboardNotesFeed";
import {
  TaskDistributionChart,
  MetricDistributionItem,
} from "@/components/dashboard/TaskDistributionChart";
import { STATUS_COLORS, PRIORITY_COLORS, TASK_TYPE_COLORS, CHART_THEME } from "@/lib/chart-tokens";
import {
  DashboardTaskTabs,
  DashboardTaskItem,
} from "@/components/dashboard/DashboardTaskTabs";
import {
  ClientPortfolioCard,
  DashboardClientItem,
} from "@/components/dashboard/ClientPortfolioCard";
import { DeveloperFocusCard } from "@/components/dashboard/DeveloperFocusCard";
import {
  DashboardActivityFeed,
  ActivityItem,
} from "@/components/dashboard/DashboardActivityFeed";
import {
  getRoleDashboardMeta,
  getRoleKPICards,
  getRoleQuickActions,
  getRoleQuickNav,
  MetricDataInputs,
} from "@/lib/dashboard-role-config";
export const dynamic = "force-dynamic";

async function getDashboardData(
  userId: string,
  role: Role | string,
  taskWhere: object,
  permissions?: string[] | null
) {
  try {
    const [
    statusGroupCounts,
    priorityGroupCounts,
    typeGroupCounts,
    clientCount,
    productCount,
    clientPortfolio,
    urgentTasks,
    myTasks,
    blockedTasks,
    dueSoonTasks,
    recentActivities,
    myStatusGroupCounts,
    myUrgentTasksCount,
    supportStatusGroupCounts,
    supportCriticalCount,
    overdueTasksCount,
  ] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: taskWhere,
      _count: { status: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: taskWhere,
      _count: { priority: true },
    }),
    prisma.task.groupBy({
      by: ["type"],
      where: taskWhere,
      _count: { type: true },
    }),
    can(role, "client:view", permissions)
      ? prisma.client.count({ where: { deletedAt: null } })
      : null,
    prisma.product.count({ where: { deletedAt: null } }),
    can(role, "client:view", permissions)
      ? prisma.client.findMany({
          where: { deletedAt: null },
          take: 5,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            domain: true,
            products: {
              where: { deletedAt: null },
              select: {
                id: true,
                _count: {
                  select: {
                    tasks: {
                      where: {
                        deletedAt: null,
                        status: { notIn: ["DONE"] },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : null,
    prisma.task.findMany({
      where: {
        ...taskWhere,
        priority: { in: ["CRITICAL", "HIGH"] },
        status: { notIn: ["DONE"] },
      },
      take: 15,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        product: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        reviewers: { select: { user: { select: { id: true, name: true } } } },
        assignees: { select: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        OR: [
          { assignedToId: userId },
          { reviewerId: userId },
          { reviewers: { some: { userId } } },
          { assignees: { some: { userId } } },
        ],
        status: { notIn: ["DONE"] },
      },
      take: 15,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        product: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        reviewers: { select: { user: { select: { id: true, name: true } } } },
        assignees: { select: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.task.findMany({
      where: {
        ...taskWhere,
        status: "BLOCKED",
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        reviewers: { select: { user: { select: { id: true, name: true } } } },
        assignees: { select: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.task.findMany({
      where: {
        ...taskWhere,
        status: { notIn: ["DONE"] },
        dueDate: { not: null },
      },
      take: 15,
      orderBy: { dueDate: "asc" },
      include: {
        product: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        reviewers: { select: { user: { select: { id: true, name: true } } } },
        assignees: { select: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        OR: [
          { assignedToId: userId },
          { assignees: { some: { userId } } },
        ],
      },
      _count: { status: true },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        OR: [
          { assignedToId: userId },
          { assignees: { some: { userId } } },
        ],
        priority: { in: ["CRITICAL", "HIGH"] },
        status: { notIn: ["DONE"] },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: {
        ...taskWhere,
        type: "SUPPORT_REQUEST",
      },
      _count: { status: true },
    }),
    prisma.task.count({
      where: {
        ...taskWhere,
        type: "SUPPORT_REQUEST",
        priority: "CRITICAL",
        status: { notIn: ["DONE"] },
      },
    }),
    prisma.task.count({
      where: {
        ...taskWhere,
        status: { notIn: ["DONE"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    statusGroupCounts,
    priorityGroupCounts,
    typeGroupCounts,
    clientCount,
    productCount,
    clientPortfolio,
    urgentTasks,
    myTasks,
    blockedTasks,
    dueSoonTasks,
    recentActivities,
    myStatusGroupCounts,
    myUrgentTasksCount,
    supportStatusGroupCounts,
    supportCriticalCount,
    overdueTasksCount,
  };
  } catch (error) {
    console.error("[PMS Dashboard] Failed to load dashboard metrics:", error);
    return {
      statusGroupCounts: [],
      priorityGroupCounts: [],
      typeGroupCounts: [],
      clientCount: 0,
      productCount: 0,
      clientPortfolio: [],
      urgentTasks: [],
      myTasks: [],
      blockedTasks: [],
      dueSoonTasks: [],
      recentActivities: [],
      myStatusGroupCounts: [],
      myUrgentTasksCount: 0,
      supportStatusGroupCounts: [],
      supportCriticalCount: 0,
      overdueTasksCount: 0,
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions;
  const userId = session.user.id;
  const name = session.user.name ?? session.user.email ?? "there";

  // Enforce dashboard:view permission
  if (!can(role, "dashboard:view", permissions)) {
    if (can(role, "task:view:all", permissions) || can(role, "task:view:own", permissions)) {
      redirect("/tasks");
    } else if (can(role, "client:view", permissions)) {
      redirect("/clients");
    } else if (can(role, "report:view", permissions)) {
      redirect("/reports");
    } else if (can(role, "user:manage", permissions)) {
      redirect(process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003");
    } else {
      redirect("/login");
    }
  }

  const taskWhere = can(role, "task:view:all", permissions)
    ? { deletedAt: null }
    : {
        deletedAt: null,
        OR: [
          { assignedToId: userId },
          { assignees: { some: { userId } } },
        ],
      };

  const {
    statusGroupCounts,
    priorityGroupCounts,
    typeGroupCounts,
    clientCount,
    productCount,
    clientPortfolio,
    urgentTasks,
    myTasks,
    blockedTasks,
    dueSoonTasks,
    recentActivities,
    myStatusGroupCounts,
    myUrgentTasksCount,
    supportStatusGroupCounts,
    supportCriticalCount,
    overdueTasksCount,
  } = await getDashboardData(userId, role, taskWhere, permissions);

  const roleMeta = getRoleDashboardMeta(role);
  const BadgeIcon = roleMeta.badgeIcon;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statusCountsMap: Record<string, number> = {
    BACKLOG: 0,
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    QA: 0,
    BLOCKED: 0,
    DONE: 0,
  };
  for (const group of statusGroupCounts) {
    statusCountsMap[group.status] = group._count.status;
  }

  const priorityCountsMap: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const group of priorityGroupCounts) {
    priorityCountsMap[group.priority] = group._count.priority;
  }

  const typeCountsMap: Record<string, number> = {};
  for (const group of typeGroupCounts) {
    typeCountsMap[group.type] = group._count.type;
  }

  const doneTasks = statusCountsMap["DONE"] ?? 0;
  const totalTasks = Object.values(statusCountsMap).reduce((s, v) => s + v, 0);
  const openTasks = totalTasks - doneTasks;
  const blockedCount = statusCountsMap["BLOCKED"] ?? 0;
  const overdueTasks = overdueTasksCount;
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const myStatusMap: Record<string, number> = {
    BACKLOG: 0,
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    QA: 0,
    BLOCKED: 0,
    DONE: 0,
  };
  for (const group of myStatusGroupCounts) {
    myStatusMap[group.status] = group._count.status;
  }
  const myDoneTasks = myStatusMap["DONE"] ?? 0;
  const myTotalTasks = Object.values(myStatusMap).reduce((s, v) => s + v, 0);
  const myOpenTasks = myTotalTasks - myDoneTasks;
  const myInReviewTasks = (myStatusMap["IN_REVIEW"] ?? 0) + (myStatusMap["QA"] ?? 0);
  const myCompletionRate =
    myTotalTasks > 0 ? Math.round((myDoneTasks / myTotalTasks) * 100) : 0;

  const supportStatusMap: Record<string, number> = {
    BACKLOG: 0,
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    QA: 0,
    BLOCKED: 0,
    DONE: 0,
  };
  for (const group of supportStatusGroupCounts) {
    supportStatusMap[group.status] = group._count.status;
  }
  const supportDoneTasks = supportStatusMap["DONE"] ?? 0;
  const supportTotalTasks = Object.values(supportStatusMap).reduce((s, v) => s + v, 0);
  const supportOpenTasks = supportTotalTasks - supportDoneTasks;
  const supportResolutionRate =
    supportTotalTasks > 0 ? Math.round((supportDoneTasks / supportTotalTasks) * 100) : 0;

  const metricInputs: MetricDataInputs = {
    openTasks,
    totalTasks,
    overdueTasks,
    clientCount,
    productCount,
    completionRate,
    doneTasks,
    blockedCount,
    myOpenTasks,
    myTotalTasks,
    myDoneTasks,
    myInReviewTasks,
    myUrgentTasks: myUrgentTasksCount,
    myCompletionRate,
    supportOpenTasks,
    supportCriticalTasks: supportCriticalCount,
    supportDoneTasks,
    supportTotalTasks,
    supportResolutionRate,
  };

  const kpiCards = getRoleKPICards(role, metricInputs, permissions);
  const quickActions = getRoleQuickActions(role, permissions);
  const quickNavItems = getRoleQuickNav(role, permissions);

  const standardStatusOrder = [
    "IN_PROGRESS",
    "TODO",
    "IN_REVIEW",
    "QA",
    "BLOCKED",
    "DONE",
    "BACKLOG",
  ];
  const statusMetricItems: MetricDistributionItem[] = standardStatusOrder.map((stKey) => {
    const config = STATUS_COLORS[stKey as keyof typeof STATUS_COLORS] ?? {
      label: stKey.replace(/_/g, " "),
      hexColor: CHART_THEME.fallbackColor,
      colorClass: "bg-primary",
    };
    return {
      key: stKey,
      label: config.label,
      hexColor: config.hexColor,
      colorClass: config.colorClass,
      count: statusCountsMap[stKey] ?? 0,
    };
  });
  // Include any custom or extra statuses present in the database
  for (const [stKey, count] of Object.entries(statusCountsMap)) {
    if (!standardStatusOrder.includes(stKey) && count > 0) {
      statusMetricItems.push({
        key: stKey,
        label: stKey.replace(/_/g, " "),
        hexColor: CHART_THEME.fallbackColor,
        colorClass: "bg-primary",
        count,
      });
    }
  }

  const priorityMetricItems: MetricDistributionItem[] = [
    { key: "CRITICAL", ...PRIORITY_COLORS.CRITICAL, count: priorityCountsMap["CRITICAL"] ?? 0 },
    { key: "HIGH", ...PRIORITY_COLORS.HIGH, count: priorityCountsMap["HIGH"] ?? 0 },
    { key: "MEDIUM", ...PRIORITY_COLORS.MEDIUM, count: priorityCountsMap["MEDIUM"] ?? 0 },
    { key: "LOW", ...PRIORITY_COLORS.LOW, count: priorityCountsMap["LOW"] ?? 0 },
  ];

  const typeMetricItems: MetricDistributionItem[] = Object.entries(typeCountsMap).map(
    ([type, count]) => {
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
    }
  );

  const formattedClientPortfolio: DashboardClientItem[] = (
    clientPortfolio ?? []
  ).map((c) => {
    const productCount = c.products?.length ?? 0;
    const openTaskCount =
      c.products?.reduce((acc, p) => acc + (p._count?.tasks ?? 0), 0) ?? 0;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      domain: c.domain,
      productCount,
      openTaskCount,
    };
  });

  const mapTaskForTab = (t: typeof urgentTasks[number]): DashboardTaskItem => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    status: t.status as DashboardTaskItem["status"],
    priority: t.priority,
    type: t.type,
    dueDate: t.dueDate
      ? t.dueDate instanceof Date
        ? t.dueDate.toISOString()
        : String(t.dueDate)
      : null,
    blockedReason: t.blockedReason,
    product: t.product
      ? {
          id: t.product.id,
          name: t.product.name,
          client: t.product.client
            ? {
                id: t.product.client.id,
                name: t.product.client.name,
              }
            : null,
        }
      : null,
    assignedTo: t.assignedTo
      ? {
          id: t.assignedTo.id,
          name: t.assignedTo.name,
        }
      : null,
    reviewer: t.reviewer
      ? {
          id: t.reviewer.id,
          name: t.reviewer.name,
        }
      : null,
    reviewers: t.reviewers?.map((r) => ({
      userId: r.user.id,
      user: { id: r.user.id, name: r.user.name },
    })),
    assignees: t.assignees?.map((a) => ({
      userId: a.user.id,
      user: { id: a.user.id, name: a.user.name },
    })),
  });

  const formattedUrgentTasks = urgentTasks.map(mapTaskForTab);
  const formattedMyTasks = myTasks.map(mapTaskForTab);
  const formattedBlockedTasks = blockedTasks.map(mapTaskForTab);
  const formattedDueSoonTasks = dueSoonTasks.map(mapTaskForTab);

  const formattedActivities: ActivityItem[] = recentActivities
    .filter((act) => act.task && act.actor)
    .map((act) => ({
      id: act.id,
      action: act.action,
      field: act.field,
      oldValue: act.oldValue,
      newValue: act.newValue,
      createdAt:
        act.createdAt instanceof Date
          ? act.createdAt.toISOString()
          : String(act.createdAt),
      actor: {
        id: act.actor.id,
        name: act.actor.name,
      },
      task: {
        id: act.task.id,
        title: act.task.title,
      },
    }));


  const canViewClients = can(role, "client:view", permissions);
  const isDeveloperRole = roleMeta.roleCategory === "DEVELOPER";

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <DashboardHero
        badge={{
          label: roleMeta.badgeLabel,
          icon: <BadgeIcon className="w-3.5 h-3.5" />,
          variant: "cyan",
        }}
        systemStatus={{
          label: "FLOW ENGINE ACTIVE",
        }}
        userName={name}
        userRole={roleMeta.roleName}
        greeting={greeting}
        accentTone="cyan"
        description={roleMeta.welcomeSubtitle}
        metrics={[
          {
            label: "Open Tasks",
            value: openTasks,
            icon: <CheckSquare className="w-3 h-3" />,
            subtext: `${totalTasks} total tasks`,
          },
          {
            label: "In Progress",
            value: (statusCountsMap["IN_PROGRESS"] ?? 0) + (statusCountsMap["IN_REVIEW"] ?? 0),
            icon: <Workflow className="w-3 h-3" />,
            subtext: "Active sprints",
          },
          {
            label: "Blocked",
            value: blockedCount,
            icon: <AlertTriangle className="w-3 h-3" />,
            trend: blockedCount > 0 ? "down" : "neutral",
            subtext: blockedCount === 0 ? "Zero blockers" : "Requires attention",
          },
          {
            label: "Sprint Health",
            value: `${completionRate}%`,
            icon: <TrendingUp className="w-3 h-3" />,
            trend: completionRate >= 70 ? "up" : "neutral",
            subtext: `${doneTasks} completed`,
          },
        ]}
        actions={
          <>
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={idx}
                  asChild
                  variant={action.variant}
                  size="sm"
                  className={`font-semibold text-xs h-8.5 px-3.5 gap-2 rounded-md transition-all ${
                    action.variant === "default"
                      ? "shadow-xs bg-primary hover:bg-primary-hover text-primary-foreground"
                      : "border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle"
                  }`}
                >
                  <Link href={action.href}>
                    <ActionIcon className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </Link>
                </Button>
              );
            })}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((card) => {
          const CardIcon = card.icon;
          const CardWrapper = card.linkHref ? Link : "div";

          return (
            <CardWrapper
              key={card.id}
              href={card.linkHref ?? "#"}
              className={`rounded-lg border p-4.5 flex flex-col gap-3.5 bg-card/90 dark:bg-card/60 backdrop-blur-sm transition-all duration-200 group relative overflow-hidden ${
                card.linkHref ? "cursor-pointer hover:border-primary/40 hover:shadow-md" : ""
              } ${
                card.highlightAlert
                  ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
                  : "border-border/80 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </span>
                <span
                  className={`w-7.5 h-7.5 rounded-md flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${card.iconBgClass} ${card.iconTextClass} ${card.iconBorderClass}`}
                >
                  <CardIcon className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums ${
                    card.highlightAlert ? "text-red-600 dark:text-red-400" : "text-foreground"
                  }`}
                >
                  {card.value}
                </div>
                {card.statusBadge ? (
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      card.highlightAlert
                        ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    {card.statusBadge}
                  </span>
                ) : card.subtitle ? (
                  <span className="text-xs font-mono text-muted-foreground">
                    {card.subtitle}
                  </span>
                ) : null}
              </div>

              {card.progressPercentage !== undefined && card.progressBarColor ? (
                <div className="w-full h-1 rounded-sm bg-surface-subtle overflow-hidden">
                  <div
                    className={`h-full ${card.progressBarColor} rounded-sm transition-all duration-500`}
                    style={{ width: `${card.progressPercentage}%` }}
                  />
                </div>
              ) : null}

              {card.sublabel ? (
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {card.sublabel}
                </p>
              ) : null}
            </CardWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <DashboardNotesFeed userRole={role} />

          <DashboardTaskTabs
            urgentTasks={formattedUrgentTasks}
            myTasks={formattedMyTasks}
            blockedTasks={formattedBlockedTasks}
            dueSoonTasks={formattedDueSoonTasks}
            currentUserName={name}
            defaultTab={roleMeta.defaultTab}
            userRole={role}
          />
        </div>

        <div className="flex flex-col gap-8">
          <TaskDistributionChart
            statusItems={statusMetricItems}
            priorityItems={priorityMetricItems}
            typeItems={typeMetricItems}
            totalTasks={totalTasks}
            defaultDimension={roleMeta.defaultChartDimension}
          />

          {isDeveloperRole && !canViewClients ? (
            <DeveloperFocusCard
              myOpenTasks={myOpenTasks}
              myDoneTasks={myDoneTasks}
              myInReviewTasks={myInReviewTasks}
              myUrgentTasks={myUrgentTasksCount}
              myCompletionRate={myCompletionRate}
            />
          ) : (
            <ClientPortfolioCard
              clients={formattedClientPortfolio}
              canViewClients={canViewClients}
            />
          )}

          <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
              <span className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center">
                <BadgeIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Quick Navigation</h2>
                <p className="text-[11px] text-muted-foreground">
                  Role-specific workspace shortcuts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {quickNavItems.map((nav, idx) => {
                const NavIcon = nav.icon;
                return (
                  <Link
                    key={idx}
                    href={nav.href}
                    className={`p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle flex flex-col gap-1.5 transition-all group ${
                      nav.borderColorClass ?? "hover:border-primary/40"
                    }`}
                  >
                    <NavIcon
                      className={`w-4 h-4 ${nav.iconColorClass} group-hover:scale-110 transition-transform`}
                    />
                    <span className="text-xs font-bold text-foreground truncate">
                      {nav.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {nav.description}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <DashboardActivityFeed activities={formattedActivities} />
        </div>
      </div>
    </div>
  );
}
