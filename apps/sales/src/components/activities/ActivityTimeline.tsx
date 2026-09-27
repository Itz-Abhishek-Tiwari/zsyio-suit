"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  Mail,
  Users2,
  Clock,
  CheckSquare,
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
  Trash2,
  Search,
  X,
  Plus,
  ShieldCheck,
  Calendar,
  Building2,
  History,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import type {
  SalesActivity,
  SalesAuditLog,
  SalesActivityType,
  SalesPriority,
} from "@zsyio/types";
import { SALES_STAGE_LABELS } from "@zsyio/types";
import { UserAvatar, KanbanPriorityBadge, Button, getErrorMessage, SegmentedTabs } from "@zsyio/ui";
import {
  useUpdateSalesActivityMutation,
  useDeleteSalesActivityMutation,
} from "@/store/api/salesActivitiesApi";
import { cn, formatRelativeTime, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ActivityTimelineProps {
  activities: SalesActivity[];
  auditLogs: SalesAuditLog[];
  leadId?: string;
  onLogActivity?: () => void;
  onRefresh?: () => void;
}

type TimelineItem =
  | { kind: "activity"; data: SalesActivity; date: string }
  | { kind: "audit"; data: SalesAuditLog; date: string };

const ACTIVITY_TYPE_CONFIG: Record<
  SalesActivityType,
  { label: string; icon: typeof PhoneCall; badgeClass: string; nodeClass: string }
> = {
  CALL: {
    label: "Call",
    icon: PhoneCall,
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25",
    nodeClass: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  EMAIL: {
    label: "Email",
    icon: Mail,
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
    nodeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  MEETING: {
    label: "Meeting",
    icon: Users2,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    nodeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FOLLOWUP: {
    label: "Follow-up",
    icon: Clock,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    nodeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  TASK: {
    label: "Task",
    icon: CheckSquare,
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    nodeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  NOTE: {
    label: "Note",
    icon: FileText,
    badgeClass: "bg-surface-subtle text-foreground-secondary border-border/80",
    nodeClass: "border-border bg-surface-subtle text-foreground-secondary",
  },
  STAGE_CHANGE: {
    label: "Stage",
    icon: ArrowRight,
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
    nodeClass: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  SYSTEM: {
    label: "System",
    icon: Sparkles,
    badgeClass: "bg-primary/10 text-primary border-primary/25",
    nodeClass: "border-primary/30 bg-primary/10 text-primary",
  },
};

export function ActivityTimeline({
  activities,
  auditLogs,
  onLogActivity,
  onRefresh,
}: ActivityTimelineProps) {
  const [activeTab, setActiveTab] = useState<"all" | "activities" | "history">("all");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [updateActivity] = useUpdateSalesActivityMutation();
  const [deleteActivity] = useDeleteSalesActivityMutation();

  const handleToggleDone = async (activity: SalesActivity) => {
    const newStatus = activity.status === "DONE" ? "PENDING" : "DONE";
    try {
      await updateActivity({
        id: activity.id,
        body: {
          status: newStatus,
          completedAt: newStatus === "DONE" ? new Date().toISOString() : null,
        },
      }).unwrap();
      toast.success(
        newStatus === "DONE" ? "Activity marked as completed" : "Activity reopened"
      );
      onRefresh?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update activity"));
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id).unwrap();
      toast.success("Activity removed");
      onRefresh?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete activity"));
    }
  };

  // Combine and sort chronologically (most recent first)
  const allTimelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      ...activities.map((a) => ({
        kind: "activity" as const,
        data: a,
        date: a.createdAt,
      })),
      ...auditLogs.map((l) => ({
        kind: "audit" as const,
        data: l,
        date: l.createdAt,
      })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, auditLogs]);

  // Filter based on tab, type, and search keyword
  const filteredItems = useMemo(() => {
    return allTimelineItems.filter((item) => {
      // 1. Tab check
      if (activeTab === "activities" && item.kind !== "activity") return false;
      if (activeTab === "history" && item.kind !== "audit") return false;

      // 2. Type filter (activities only)
      if (typeFilter !== "ALL") {
        if (item.kind === "activity" && item.data.type !== typeFilter) {
          return false;
        }
      }

      // 3. Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (item.kind === "activity") {
          const matchTitle = item.data.title?.toLowerCase().includes(query);
          const matchDesc = item.data.description?.toLowerCase().includes(query);
          const matchUser = item.data.assignedTo?.name?.toLowerCase().includes(query);
          const matchType = item.data.type?.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchUser && !matchType) return false;
        } else {
          const matchAction = item.data.action?.toLowerCase().includes(query);
          const matchActor = item.data.actor?.name?.toLowerCase().includes(query);
          const matchPrev = item.data.prevValue?.toLowerCase().includes(query);
          const matchNext = item.data.nextValue?.toLowerCase().includes(query);
          if (!matchAction && !matchActor && !matchPrev && !matchNext) return false;
        }
      }

      return true;
    });
  }, [allTimelineItems, activeTab, typeFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        {/* Navigation Tabs with Count Badges */}
        <SegmentedTabs<"all" | "activities" | "history">
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            if (val !== "activities") {
              setTypeFilter("ALL");
            }
          }}
          size="sm"
          tabs={[
            {
              id: "all",
              label: "All Updates",
              count: allTimelineItems.length,
            },
            {
              id: "activities",
              label: "Activities",
              icon: <PhoneCall className="w-3.5 h-3.5 text-sky-500" />,
              count: activities.length,
              badgeVariant: "primary",
            },
            {
              id: "history",
              label: "Audit Trail",
              icon: <ShieldCheck className="w-3.5 h-3.5 text-primary" />,
              count: auditLogs.length,
              badgeVariant: "primary",
            },
          ]}
        />

        {/* Search & Quick Action */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 h-8.5 text-xs rounded-xl border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Filters: Activity Types (when in All or Activities mode) */}
      {activeTab !== "history" && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer",
              typeFilter === "ALL"
                ? "bg-foreground text-background border-foreground font-semibold shadow-2xs"
                : "bg-surface-subtle/50 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
            )}
          >
            All Types
          </button>
          {(["CALL", "EMAIL", "MEETING", "FOLLOWUP", "TASK", "NOTE"] as SalesActivityType[]).map(
            (t) => {
              const cfg = ACTIVITY_TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const isSelected = typeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(isSelected ? "ALL" : t)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-foreground text-background border-foreground font-semibold shadow-2xs"
                      : "bg-surface-subtle/50 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{cfg.label}</span>
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Timeline Stream */}
      <div className="relative pl-12 flex flex-col gap-6 before:absolute before:left-4.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={`${item.kind}-${item.data.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="relative flex items-start group"
            >
              {/* Node Bubble positioned exactly on the vertical rail */}
              <div className="absolute -left-12 top-0.5 z-10">
                {item.kind === "activity" ? (
                  <ActivityNodeBubble type={item.data.type} isDone={item.data.status === "DONE"} />
                ) : (
                  <AuditNodeBubble action={item.data.action} />
                )}
              </div>

              {/* Event Body */}
              <div className="flex-1 min-w-0">
                {item.kind === "activity" ? (
                  <ActivityItemCard
                    activity={item.data}
                    onToggleDone={() => handleToggleDone(item.data)}
                    onDelete={() => handleDeleteActivity(item.data.id)}
                  />
                ) : (
                  <AuditItemCard log={item.data} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border border-dashed border-border/80 bg-surface-subtle/30 text-center -ml-12 sm:ml-0">
            <span className="w-12 h-12 rounded-md bg-surface-subtle border border-border/80 text-muted-foreground flex items-center justify-center mb-3 shadow-2xs">
              <History className="w-6 h-6 opacity-60" />
            </span>
            <p className="text-sm font-bold text-foreground">
              {searchQuery
                ? "No matching updates found"
                : activeTab === "activities"
                ? "No sales activities logged"
                : activeTab === "history"
                ? "No audit records available"
                : "No timeline events recorded yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? "Try clearing your search query or selecting another filter tab."
                : "Log phone calls, discovery meetings, emails, or internal notes to build an audit trail."}
            </p>
            {onLogActivity && activeTab !== "history" && !searchQuery && (
              <Button
                size="sm"
                onClick={onLogActivity}
                className="mt-4 h-8.5 px-4 text-xs font-semibold rounded-md gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log First Activity</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node Icons on the Timeline Rail
// ---------------------------------------------------------------------------

function ActivityNodeBubble({
  type,
  isDone,
}: {
  type: SalesActivityType;
  isDone?: boolean;
}) {
  const cfg = ACTIVITY_TYPE_CONFIG[type] || ACTIVITY_TYPE_CONFIG.NOTE;
  const Icon = isDone ? Check : cfg.icon;

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 bg-card select-none",
        isDone
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : cfg.nodeClass
      )}
      title={isDone ? "Completed Activity" : cfg.label}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
}

function AuditNodeBubble({ action }: { action: string }) {
  let icon = <Clock className="w-4 h-4" />;
  let colorClass = "border-border/80 bg-surface-subtle text-muted-foreground";

  if (action === "CREATED" || action === "TYPE_CONVERTED") {
    icon = <Sparkles className="w-4 h-4" />;
    colorClass = "border-primary/30 bg-primary/10 text-primary";
  } else if (action === "STAGE_CHANGED") {
    icon = <TrendingUp className="w-4 h-4" />;
    colorClass = "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
  } else if (action === "DEAL_VALUE_CHANGED") {
    icon = <ArrowRight className="w-4 h-4" />;
    colorClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  } else if (action === "ASSIGNED" || action === "REASSIGNED") {
    icon = <UserCheck className="w-4 h-4" />;
    colorClass = "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 bg-card select-none",
        colorClass
      )}
      title={action}
    >
      {icon}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Item Card
// ---------------------------------------------------------------------------

function ActivityItemCard({
  activity,
  onToggleDone,
  onDelete,
}: {
  activity: SalesActivity;
  onToggleDone: () => void;
  onDelete: () => void;
}) {
  const cfg = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.NOTE;
  const Icon = cfg.icon;
  const isDone = activity.status === "DONE";
  const isOverdue = !isDone && activity.dueAt && new Date(activity.dueAt) < new Date();

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-2xs transition-all duration-150 flex flex-col gap-3 group/card",
        isDone
          ? "border-border/60 bg-surface-subtle/40 opacity-80"
          : "border-border/80 hover:border-border hover:shadow-xs"
      )}
    >
      {/* Header Row: Category Badge, Priority, Toggle, Timestamp & Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border shadow-2xs",
              cfg.badgeClass
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{cfg.label}</span>
          </span>

          {activity.priority && (
            <KanbanPriorityBadge priority={activity.priority as SalesPriority} />
          )}

          {isDone ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3" />
              <span>Done</span>
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>Overdue</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Complete / Reopen Toggle */}
          <button
            type="button"
            onClick={onToggleDone}
            className={cn(
              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs",
              isDone
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                : "bg-surface-subtle border-border/80 text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40 hover:bg-emerald-500/10"
            )}
            title={isDone ? "Click to reopen" : "Click to mark done"}
          >
            <Check className="w-3.5 h-3.5" />
          </button>

          <span
            className="text-[11px] font-medium text-muted-foreground whitespace-nowrap"
            title={formatDate(activity.createdAt)}
          >
            {formatRelativeTime(activity.createdAt)}
          </span>

          {/* Delete activity trigger */}
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover/card:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
            title="Delete activity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Notes */}
      <div className="space-y-1">
        <h4
          className={cn(
            "text-sm font-bold text-foreground leading-snug",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {activity.title}
        </h4>
        {activity.description && (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {activity.description}
          </p>
        )}
      </div>

      {/* Footer Meta Row: Due Date, Assignee, Creator */}
      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border/50 text-xs flex-wrap">
        <div className="flex items-center gap-3">
          {activity.dueAt && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-medium",
                isOverdue
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-surface-subtle text-muted-foreground border-border/60"
              )}
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Due: {formatDate(activity.dueAt)}</span>
            </div>
          )}

          {activity.assignedTo && (
            <div className="flex items-center gap-1.5">
              <UserAvatar user={activity.assignedTo} size="xs" />
              <span className="text-xs font-semibold text-foreground">
                {activity.assignedTo.name ?? activity.assignedTo.email}
              </span>
            </div>
          )}
        </div>

        {activity.createdBy?.name && (
          <span className="text-[11px] text-muted-foreground/80">
            logged by <strong className="font-semibold text-foreground">{activity.createdBy.name}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit Item Card
// ---------------------------------------------------------------------------

function AuditItemCard({ log }: { log: SalesAuditLog }) {
  const formattedTime = formatRelativeTime(log.createdAt);

  const renderAuditDiff = () => {
    switch (log.action) {
      case "STAGE_CHANGED": {
        const prevLabel = log.prevValue
          ? SALES_STAGE_LABELS[log.prevValue as keyof typeof SALES_STAGE_LABELS] ?? log.prevValue
          : "-";
        const nextLabel = log.nextValue
          ? SALES_STAGE_LABELS[log.nextValue as keyof typeof SALES_STAGE_LABELS] ?? log.nextValue
          : "-";

        return (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground font-medium border border-border/60">
              {prevLabel}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold border border-primary/25 shadow-2xs">
              {nextLabel}
            </span>
          </div>
        );
      }

      case "DEAL_VALUE_CHANGED": {
        const prevVal = log.prevValue ? Number(log.prevValue) : null;
        const nextVal = log.nextValue ? Number(log.nextValue) : null;
        return (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 font-mono">
            <span className="px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground line-through border border-border/60">
              {prevVal !== null ? formatCurrency(prevVal) : "-"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 shadow-2xs">
              {nextVal !== null ? formatCurrency(nextVal) : "-"}
            </span>
          </div>
        );
      }

      case "PRIORITY_CHANGED": {
        return (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            {log.prevValue && (
              <KanbanPriorityBadge priority={log.prevValue as SalesPriority} />
            )}
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
            {log.nextValue && (
              <KanbanPriorityBadge priority={log.nextValue as SalesPriority} />
            )}
          </div>
        );
      }

      case "ASSIGNED":
      case "REASSIGNED": {
        return (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-surface-subtle text-foreground font-semibold border border-border/80 shadow-2xs">
              {log.nextValue || "Unassigned"}
            </span>
          </div>
        );
      }

      case "TYPE_CONVERTED": {
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/25 shadow-2xs mt-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Successfully provisioned white-label client in PMS workspace</span>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getActionHeadline = () => {
    switch (log.action) {
      case "CREATED":
        return "created this sales lead";
      case "STAGE_CHANGED":
        return "advanced pipeline stage";
      case "DEAL_VALUE_CHANGED":
        return "updated deal value";
      case "PRIORITY_CHANGED":
        return "updated priority";
      case "ASSIGNED":
        return "assigned salesperson";
      case "REASSIGNED":
        return "reassigned salesperson";
      case "TYPE_CONVERTED":
        return "converted lead to PMS client";
      case "ACTIVITY_CREATED":
        return `logged activity: ${log.nextValue || ""}`;
      case "ACTIVITY_COMPLETED":
        return `completed activity: ${log.nextValue || ""}`;
      case "UPDATED":
        return "updated lead information";
      case "DELETED":
        return "deleted lead";
      default:
        return String(log.action || "").toLowerCase().replace(/_/g, " ");
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-surface-subtle/30 p-3.5 hover:bg-surface-subtle/50 transition-all flex flex-col gap-1.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          {log.actor ? (
            <UserAvatar user={log.actor} size="xs" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
              SYS
            </span>
          )}
          <span className="font-bold text-foreground">
            {log.actor?.name || "System"}
          </span>
          <span className="text-muted-foreground">{getActionHeadline()}</span>
        </div>

        <span
          className="text-[11px] font-medium text-muted-foreground whitespace-nowrap ml-auto"
          title={formatDate(log.createdAt)}
        >
          {formattedTime}
        </span>
      </div>

      {renderAuditDiff()}
    </div>
  );
}
