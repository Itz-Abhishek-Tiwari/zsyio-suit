import React from "react";
import type { Role } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import {
  ShieldCheck,
  Briefcase,
  Code2,
  Headphones,
  SquareCheckBig,
  AlertCircle,
  UsersRound,
  TrendingUp,
  CheckCircle2,
  Columns3,
  Building2,
  FileText,
  Clock,
  Layers,
  Plus,
  GitPullRequest,
  LifeBuoy,
  Sliders,
  Flame,
  Boxes,
} from "lucide-react";

export type RoleCategory = "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" | "CUSTOM";

export interface DashboardKPICard {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconTextClass: string;
  iconBorderClass: string;
  progressBarColor?: string;
  progressPercentage?: number;
  highlightAlert?: boolean;
  statusBadge?: string;
  linkHref?: string;
}

export interface DashboardQuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "outline" | "secondary";
  className?: string;
}

export interface DashboardQuickNavItem {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColorClass: string;
  borderColorClass?: string;
}

export interface RoleDashboardMeta {
  roleCategory: RoleCategory;
  roleName: string;
  badgeLabel: string;
  badgeIcon: React.ComponentType<{ className?: string }>;
  badgeColorClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  welcomeSubtitle: string;
  defaultTab: "urgent" | "myTasks" | "blocked" | "dueSoon";
  defaultChartDimension: "status" | "priority" | "type";
}

export function getRoleCategory(role: Role | string | undefined | null): RoleCategory {
  if (!role) return "DEVELOPER";
  const upper = role.toUpperCase();
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") return "ADMIN";
  if (upper === "MANAGER") return "MANAGER";
  if (upper === "DEVELOPER") return "DEVELOPER";
  if (upper === "SUPPORT") return "SUPPORT";
  return "CUSTOM";
}

export function getRoleDashboardMeta(
  role: Role | string | undefined | null
): RoleDashboardMeta {
  const category = getRoleCategory(role);

  switch (category) {
    case "ADMIN":
      return {
        roleCategory: "ADMIN",
        roleName: role === "SUPER_ADMIN" ? "Super Admin" : "Administrator",
        badgeLabel: "Workspace Administration",
        badgeIcon: ShieldCheck,
        badgeBgClass: "bg-emerald-500/10",
        badgeColorClass: "text-emerald-600 dark:text-emerald-400",
        badgeBorderClass: "border-emerald-500/20",
        welcomeSubtitle:
          "Full operational oversight: team throughput, client accounts, operational metrics, and user management.",
        defaultTab: "myTasks",
        defaultChartDimension: "status",
      };

    case "MANAGER":
      return {
        roleCategory: "MANAGER",
        roleName: "Project Manager",
        badgeLabel: "Project & Delivery Hub",
        badgeIcon: Briefcase,
        badgeBgClass: "bg-blue-500/10",
        badgeColorClass: "text-blue-600 dark:text-blue-400",
        badgeBorderClass: "border-blue-500/20",
        welcomeSubtitle:
          "Track delivery milestones, clear team blockers, monitor client portfolio health, and manage SLA timelines.",
        defaultTab: "myTasks",
        defaultChartDimension: "priority",
      };

    case "DEVELOPER":
      return {
        roleCategory: "DEVELOPER",
        roleName: "Software Engineer",
        badgeLabel: "Engineering Workspace",
        badgeIcon: Code2,
        badgeBgClass: "bg-purple-500/10",
        badgeColorClass: "text-purple-600 dark:text-purple-400",
        badgeBorderClass: "border-purple-500/20",
        welcomeSubtitle:
          "Your engineering workbench: focused on your assigned sprint tasks, active code reviews, and priority bugs.",
        defaultTab: "myTasks",
        defaultChartDimension: "type",
      };

    case "SUPPORT":
      return {
        roleCategory: "SUPPORT",
        roleName: "Support Specialist",
        badgeLabel: "Support & Incident Desk",
        badgeIcon: Headphones,
        badgeBgClass: "bg-amber-500/10",
        badgeColorClass: "text-amber-600 dark:text-amber-400",
        badgeBorderClass: "border-amber-500/20",
        welcomeSubtitle:
          "Customer ticket triage, incident management, client request tracking, and SLA resolution.",
        defaultTab: "myTasks",
        defaultChartDimension: "type",
      };

    case "CUSTOM":
    default:
      return {
        roleCategory: "CUSTOM",
        roleName: typeof role === "string" ? role : "Team Member",
        badgeLabel: "Custom Workspace",
        badgeIcon: ShieldCheck,
        badgeBgClass: "bg-primary/10",
        badgeColorClass: "text-primary",
        badgeBorderClass: "border-primary/20",
        welcomeSubtitle:
          "Real-time operational hub tailored with your custom organization permissions.",
        defaultTab: "myTasks",
        defaultChartDimension: "status",
      };
  }
}

export interface MetricDataInputs {
  openTasks: number;
  totalTasks: number;
  overdueTasks: number;
  clientCount: number | null;
  productCount: number;
  completionRate: number;
  doneTasks: number;
  blockedCount: number;
  // Developer-specific
  myOpenTasks: number;
  myTotalTasks: number;
  myDoneTasks: number;
  myInReviewTasks: number;
  myUrgentTasks: number;
  myCompletionRate: number;
  // Support-specific
  supportOpenTasks: number;
  supportCriticalTasks: number;
  supportDoneTasks: number;
  supportTotalTasks: number;
  supportResolutionRate: number;
}

export function getRoleKPICards(
  role: Role | string | undefined | null,
  metrics: MetricDataInputs,
  permissions?: string[] | null
): DashboardKPICard[] {
  const category = getRoleCategory(role);

  switch (category) {
    case "DEVELOPER":
      return [
        {
          id: "my-tasks",
          title: "My Active Tasks",
          value: metrics.myOpenTasks,
          subtitle: `of ${metrics.myTotalTasks} assigned`,
          sublabel: metrics.myOpenTasks === 0 ? "All tasks completed!" : `${metrics.myOpenTasks} tasks pending action`,
          icon: SquareCheckBig,
          iconBgClass: "bg-purple-500/10",
          iconTextClass: "text-purple-600 dark:text-purple-400",
          iconBorderClass: "border-purple-500/20",
          progressPercentage:
            metrics.myTotalTasks > 0
              ? Math.min(100, Math.round((metrics.myOpenTasks / metrics.myTotalTasks) * 100))
              : 0,
          progressBarColor: "bg-purple-500",
          linkHref: "/tasks",
        },
        {
          id: "in-review",
          title: "In Review / QA",
          value: metrics.myInReviewTasks,
          subtitle: "Code reviews & testing",
          sublabel:
            metrics.myInReviewTasks > 0
              ? `${metrics.myInReviewTasks} task${metrics.myInReviewTasks > 1 ? "s" : ""} awaiting review`
              : "No pending reviews",
          icon: GitPullRequest,
          iconBgClass: "bg-blue-500/10",
          iconTextClass: "text-blue-600 dark:text-blue-400",
          iconBorderClass: "border-blue-500/20",
          progressPercentage:
            metrics.myTotalTasks > 0
              ? Math.min(100, Math.round((metrics.myInReviewTasks / metrics.myTotalTasks) * 100))
              : 0,
          progressBarColor: "bg-blue-500",
          linkHref: "/tasks",
        },
        {
          id: "my-urgent",
          title: "My Urgent & High",
          value: metrics.myUrgentTasks,
          subtitle: "High priority tickets",
          highlightAlert: metrics.myUrgentTasks > 0,
          statusBadge: metrics.myUrgentTasks > 0 ? "Action Needed" : "On Track",
          sublabel:
            metrics.myUrgentTasks > 0
              ? `${metrics.myUrgentTasks} critical/high priority item${metrics.myUrgentTasks > 1 ? "s" : ""}`
              : "No high priority tasks",
          icon: Flame,
          iconBgClass: metrics.myUrgentTasks > 0 ? "bg-red-500/15" : "bg-muted",
          iconTextClass: metrics.myUrgentTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          iconBorderClass: metrics.myUrgentTasks > 0 ? "border-red-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        {
          id: "my-completion",
          title: "My Completion Rate",
          value: `${metrics.myCompletionRate}%`,
          subtitle: `${metrics.myDoneTasks} completed`,
          sublabel: `Personal sprint throughput`,
          icon: TrendingUp,
          iconBgClass: "bg-emerald-500/10",
          iconTextClass: "text-emerald-600 dark:text-emerald-400",
          iconBorderClass: "border-emerald-500/20",
          progressPercentage: metrics.myCompletionRate,
          progressBarColor: "bg-emerald-500",
          linkHref: "/tasks",
        },
      ];

    case "MANAGER":
      return [
        {
          id: "open-tasks",
          title: "Project Workload",
          value: metrics.openTasks,
          subtitle: `of ${metrics.totalTasks} total tasks`,
          sublabel: "Active deliverables across products",
          icon: Boxes,
          iconBgClass: "bg-blue-500/10",
          iconTextClass: "text-blue-600 dark:text-blue-400",
          iconBorderClass: "border-blue-500/20",
          progressPercentage:
            metrics.totalTasks > 0
              ? Math.min(100, Math.round((metrics.openTasks / metrics.totalTasks) * 100))
              : 0,
          progressBarColor: "bg-blue-500",
          linkHref: "/tasks",
        },
        {
          id: "blocked-tasks",
          title: "Blocked Tasks",
          value: metrics.blockedCount,
          subtitle: "Requiring manager unblock",
          highlightAlert: metrics.blockedCount > 0,
          statusBadge: metrics.blockedCount > 0 ? "Action Required" : "None Blocked",
          sublabel:
            metrics.blockedCount > 0
              ? `${metrics.blockedCount} task${metrics.blockedCount > 1 ? "s" : ""} stuck on blockers`
              : "Smooth delivery flow",
          icon: AlertCircle,
          iconBgClass: metrics.blockedCount > 0 ? "bg-amber-500/15" : "bg-muted",
          iconTextClass: metrics.blockedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          iconBorderClass: metrics.blockedCount > 0 ? "border-amber-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        {
          id: "overdue-tasks",
          title: "SLA / Overdue",
          value: metrics.overdueTasks,
          subtitle: "Past target due date",
          highlightAlert: metrics.overdueTasks > 0,
          statusBadge: metrics.overdueTasks > 0 ? "SLA Risk" : "On Schedule",
          sublabel:
            metrics.overdueTasks > 0
              ? `${metrics.overdueTasks} task${metrics.overdueTasks > 1 ? "s" : ""} missed deadline`
              : "All deadlines on schedule",
          icon: Clock,
          iconBgClass: metrics.overdueTasks > 0 ? "bg-red-500/15" : "bg-muted",
          iconTextClass: metrics.overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          iconBorderClass: metrics.overdueTasks > 0 ? "border-red-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        {
          id: "delivery-rate",
          title: "Delivery Rate",
          value: `${metrics.completionRate}%`,
          subtitle: `${metrics.doneTasks} closed`,
          sublabel: "Overall workspace completion",
          icon: TrendingUp,
          iconBgClass: "bg-primary/10",
          iconTextClass: "text-primary",
          iconBorderClass: "border-primary/20",
          progressPercentage: metrics.completionRate,
          progressBarColor: "bg-primary",
          linkHref: "/reports",
        },
      ];

    case "SUPPORT":
      return [
        {
          id: "support-tickets",
          title: "Support Inquiries",
          value: metrics.supportOpenTasks,
          subtitle: `of ${metrics.supportTotalTasks} total`,
          sublabel: "Active client support requests",
          icon: Headphones,
          iconBgClass: "bg-amber-500/10",
          iconTextClass: "text-amber-600 dark:text-amber-400",
          iconBorderClass: "border-amber-500/20",
          progressPercentage:
            metrics.supportTotalTasks > 0
              ? Math.min(100, Math.round((metrics.supportOpenTasks / metrics.supportTotalTasks) * 100))
              : 0,
          progressBarColor: "bg-amber-500",
          linkHref: "/tasks",
        },
        {
          id: "critical-incidents",
          title: "Critical Incidents",
          value: metrics.supportCriticalTasks,
          subtitle: "Emergency priority tickets",
          highlightAlert: metrics.supportCriticalTasks > 0,
          statusBadge: metrics.supportCriticalTasks > 0 ? "Immediate Triage" : "All Clear",
          sublabel:
            metrics.supportCriticalTasks > 0
              ? `${metrics.supportCriticalTasks} urgent issue${metrics.supportCriticalTasks > 1 ? "s" : ""}`
              : "No critical incidents",
          icon: Flame,
          iconBgClass: metrics.supportCriticalTasks > 0 ? "bg-red-500/15" : "bg-muted",
          iconTextClass: metrics.supportCriticalTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          iconBorderClass: metrics.supportCriticalTasks > 0 ? "border-red-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        {
          id: "overdue-tickets",
          title: "Overdue Tickets",
          value: metrics.overdueTasks,
          subtitle: "Past resolution SLA",
          highlightAlert: metrics.overdueTasks > 0,
          statusBadge: metrics.overdueTasks > 0 ? "SLA Overdue" : "In SLA",
          sublabel:
            metrics.overdueTasks > 0
              ? `${metrics.overdueTasks} ticket${metrics.overdueTasks > 1 ? "s" : ""} overdue`
              : "All tickets within SLA target",
          icon: Clock,
          iconBgClass: metrics.overdueTasks > 0 ? "bg-red-500/15" : "bg-muted",
          iconTextClass: metrics.overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          iconBorderClass: metrics.overdueTasks > 0 ? "border-red-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        {
          id: "resolution-rate",
          title: "Resolution Rate",
          value: `${metrics.supportResolutionRate}%`,
          subtitle: `${metrics.supportDoneTasks} resolved`,
          sublabel: "Resolved ticket SLA rate",
          icon: CheckCircle2,
          iconBgClass: "bg-emerald-500/10",
          iconTextClass: "text-emerald-600 dark:text-emerald-400",
          iconBorderClass: "border-emerald-500/20",
          progressPercentage: metrics.supportResolutionRate,
          progressBarColor: "bg-emerald-500",
          linkHref: "/tasks",
        },
      ];

    case "ADMIN":
    case "CUSTOM":
    default:
      return [
        {
          id: "open-tasks",
          title: "Open Tasks",
          value: metrics.openTasks,
          subtitle: `of ${metrics.totalTasks} total`,
          sublabel: `${metrics.openTasks} active across organization`,
          icon: SquareCheckBig,
          iconBgClass: "bg-orange-500/10",
          iconTextClass: "text-orange-600 dark:text-orange-400",
          iconBorderClass: "border-orange-500/20",
          progressPercentage:
            metrics.totalTasks > 0
              ? Math.min(100, Math.round((metrics.openTasks / metrics.totalTasks) * 100))
              : 0,
          progressBarColor: "bg-orange-500",
          linkHref: "/tasks",
        },
        {
          id: "overdue-tasks",
          title: "Overdue Tasks",
          value: metrics.overdueTasks,
          subtitle: "Past deadline",
          highlightAlert: metrics.overdueTasks > 0,
          statusBadge: metrics.overdueTasks > 0 ? "Action Needed" : "All On Track",
          sublabel:
            metrics.overdueTasks > 0
              ? `${metrics.overdueTasks} task${metrics.overdueTasks > 1 ? "s" : ""} past deadline`
              : "No overdue deliverables",
          icon: AlertCircle,
          iconBgClass: metrics.overdueTasks > 0 ? "bg-red-500/15" : "bg-muted",
          iconTextClass: metrics.overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          iconBorderClass: metrics.overdueTasks > 0 ? "border-red-500/30" : "border-border/60",
          linkHref: "/tasks",
        },
        metrics.clientCount !== null
          ? {
              id: "active-clients",
              title: "Active Clients",
              value: metrics.clientCount,
              subtitle: `${metrics.productCount} active product${metrics.productCount !== 1 ? "s" : ""}`,
              sublabel: "Client orgs & product suites",
              icon: Building2,
              iconBgClass: "bg-emerald-500/10",
              iconTextClass: "text-emerald-600 dark:text-emerald-400",
              iconBorderClass: "border-emerald-500/20",
              linkHref: "/clients",
            }
          : {
              id: "active-products",
              title: "Active Products",
              value: metrics.productCount,
              subtitle: "Production suites",
              sublabel: "Integrated deployment environments",
              icon: Layers,
              iconBgClass: "bg-purple-500/10",
              iconTextClass: "text-purple-600 dark:text-purple-400",
              iconBorderClass: "border-purple-500/20",
            },
        {
          id: "completion-rate",
          title: "Completion Rate",
          value: `${metrics.completionRate}%`,
          subtitle: `${metrics.doneTasks} done`,
          sublabel: "Overall workspace velocity",
          icon: TrendingUp,
          iconBgClass: "bg-primary/10",
          iconTextClass: "text-primary",
          iconBorderClass: "border-primary/20",
          progressPercentage: metrics.completionRate,
          progressBarColor: "bg-primary",
          linkHref: can(role, "report:view", permissions) ? "/reports" : "/tasks",
        },
      ];
  }
}

export function getRoleQuickActions(
  role: Role | string | undefined | null,
  permissions?: string[] | null
): DashboardQuickAction[] {
  const category = getRoleCategory(role);
  const actions: DashboardQuickAction[] = [];

  const canCreateAny = can(role, "task:create:any", permissions);
  const canCreateSupport = can(role, "task:create:support", permissions);
  const canCreateClient = can(role, "client:create", permissions);
  const canViewReports = can(role, "report:view", permissions);

  if (category === "DEVELOPER") {
    if (canCreateAny) {
      actions.push({
        label: "New Task",
        href: "/tasks/new",
        icon: Plus,
        variant: "default",
      });
    }
    actions.push({
      label: "My Tasks Board",
      href: "/tasks",
      icon: Columns3,
      variant: "outline",
    });
  } else if (category === "SUPPORT") {
    if (canCreateSupport || canCreateAny) {
      actions.push({
        label: "New Support Ticket",
        href: "/tasks/new?type=SUPPORT_REQUEST",
        icon: Plus,
        variant: "default",
      });
    }
    if (can(role, "client:view", permissions)) {
      actions.push({
        label: "Client Directory",
        href: "/clients",
        icon: Building2,
        variant: "outline",
      });
    }
  } else if (category === "MANAGER") {
    if (canCreateAny) {
      actions.push({
        label: "New Task",
        href: "/tasks/new",
        icon: Plus,
        variant: "default",
      });
    }
    if (canCreateClient) {
      actions.push({
        label: "New Client",
        href: "/clients/new",
        icon: Building2,
        variant: "outline",
      });
    }
    if (canViewReports) {
      actions.push({
        label: "View Reports",
        href: "/reports",
        icon: FileText,
        variant: "outline",
      });
    }
  } else {
    // ADMIN / CUSTOM
    if (canCreateAny || canCreateSupport) {
      actions.push({
        label: "New Task",
        href: "/tasks/new",
        icon: Plus,
        variant: "default",
      });
    }
    if (canCreateClient) {
      actions.push({
        label: "New Client",
        href: "/clients/new",
        icon: Building2,
        variant: "outline",
      });
    }
  }

  return actions;
}

export function getRoleQuickNav(
  role: Role | string | undefined | null,
  permissions?: string[] | null
): DashboardQuickNavItem[] {
  const category = getRoleCategory(role);

  switch (category) {
    case "DEVELOPER":
      return [
        {
          label: "Kanban Board",
          description: "Interactive task board",
          href: "/tasks",
          icon: Columns3,
          iconColorClass: "text-primary",
          borderColorClass: "hover:border-primary/40",
        },
        {
          label: "My Focus",
          description: "Active sprint workload",
          href: "/tasks",
          icon: SquareCheckBig,
          iconColorClass: "text-purple-500",
          borderColorClass: "hover:border-purple-500/40",
        },
        {
          label: "Notes & Docs",
          description: "Workspace documentation",
          href: "/notes",
          icon: FileText,
          iconColorClass: "text-emerald-500",
          borderColorClass: "hover:border-emerald-500/40",
        },
        {
          label: "Notifications",
          description: "Alert preferences",
          href: "/settings/notifications",
          icon: Sliders,
          iconColorClass: "text-amber-500",
          borderColorClass: "hover:border-amber-500/40",
        },
      ];

    case "SUPPORT":
      return [
        {
          label: "Ticket Board",
          description: "Incident triage workflow",
          href: "/tasks",
          icon: Columns3,
          iconColorClass: "text-amber-500",
          borderColorClass: "hover:border-amber-500/40",
        },
        ...(can(role, "client:view", permissions)
          ? [
              {
                label: "Clients Directory",
                description: "Client contact & accounts",
                href: "/clients",
                icon: Building2,
                iconColorClass: "text-emerald-500",
                borderColorClass: "hover:border-emerald-500/40",
              },
            ]
          : [
              {
                label: "Notes & Docs",
                description: "Internal documentation",
                href: "/notes",
                icon: FileText,
                iconColorClass: "text-emerald-500",
                borderColorClass: "hover:border-emerald-500/40",
              },
            ]),
        {
          label: "Notifications",
          description: "Ticket SLA alerts",
          href: "/settings/notifications",
          icon: LifeBuoy,
          iconColorClass: "text-blue-500",
          borderColorClass: "hover:border-blue-500/40",
        },
      ];

    case "MANAGER":
      return [
        {
          label: "Kanban Board",
          description: "Sprint workflows",
          href: "/tasks",
          icon: Columns3,
          iconColorClass: "text-primary",
          borderColorClass: "hover:border-primary/40",
        },
        {
          label: "Clients",
          description: "Portfolio & accounts",
          href: "/clients",
          icon: Building2,
          iconColorClass: "text-emerald-500",
          borderColorClass: "hover:border-emerald-500/40",
        },
        {
          label: "Teams",
          description: "Rosters & workloads",
          href: "/settings/teams",
          icon: UsersRound,
          iconColorClass: "text-purple-500",
          borderColorClass: "hover:border-purple-500/40",
        },
        {
          label: "Analytics & Reports",
          description: "Team velocity & SLA",
          href: "/reports",
          icon: FileText,
          iconColorClass: "text-amber-500",
          borderColorClass: "hover:border-amber-500/40",
        },
      ];

    case "ADMIN":
    case "CUSTOM":
    default:
      return [
        {
          label: "Kanban Board",
          description: "Interactive workflows",
          href: "/tasks",
          icon: Columns3,
          iconColorClass: "text-primary",
          borderColorClass: "hover:border-primary/40",
        },
        ...(can(role, "client:view", permissions)
          ? [
              {
                label: "Clients",
                description: "Client management",
                href: "/clients",
                icon: Building2,
                iconColorClass: "text-emerald-500",
                borderColorClass: "hover:border-emerald-500/40",
              },
            ]
          : []),
        ...(can(role, "report:view", permissions)
          ? [
              {
                label: "Analytics & Reports",
                description: "Team SLA metrics",
                href: "/reports",
                icon: FileText,
                iconColorClass: "text-amber-500",
                borderColorClass: "hover:border-amber-500/40",
              },
            ]
          : [
              {
                label: "Notifications",
                description: "Alert preferences",
                href: "/settings/notifications",
                icon: Sliders,
                iconColorClass: "text-amber-500",
                borderColorClass: "hover:border-amber-500/40",
              },
            ]),
      ];
  }
}
