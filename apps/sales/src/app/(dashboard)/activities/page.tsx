"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  StickyNote,
  ArrowRight,
  Check,
  Trash2,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Plus,
} from "lucide-react";
import {
  useGetSalesActivitiesQuery,
  useUpdateSalesActivityMutation,
  useDeleteSalesActivityMutation,
} from "@/store/api/salesActivitiesApi";
import { PageHeader, EmptyState, UserAvatar, ConfirmDialog } from "@/components/shared";
import { SalesPriorityBadge } from "@/components/shared/SalesStageBadge";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  Modal,
} from "@zsyio/ui";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { SalesActivityType, SalesActivity } from "@zsyio/types";
import { SALES_ACTIVITY_LABELS } from "@zsyio/types";
import { toast } from "sonner";

const ACTIVITY_ICONS: Record<SalesActivityType, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  FOLLOWUP: Clock,
  TASK: CheckCircle2,
  NOTE: StickyNote,
  STAGE_CHANGE: ArrowRight,
  SYSTEM: TrendingUp,
};

const ACTIVITY_COLORS: Record<SalesActivityType, string> = {
  CALL: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  EMAIL: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  MEETING: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  FOLLOWUP: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  TASK: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  NOTE: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  STAGE_CHANGE: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  SYSTEM: "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

export default function ActivitiesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<SalesActivity | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetSalesActivitiesQuery({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const [updateActivity] = useUpdateSalesActivityMutation();
  const [deleteActivity, { isLoading: isDeleting }] = useDeleteSalesActivityMutation();

  const activities = useMemo(() => {
    let list = data ?? [];
    if (typeFilter !== "ALL") {
      list = list.filter((a) => a.type === typeFilter);
    }
    return list;
  }, [data, typeFilter]);

  const handleToggleComplete = async (activity: SalesActivity) => {
    const isCompleted = activity.status === "DONE";
    try {
      await updateActivity({
        id: activity.id,
        body: {
          status: isCompleted ? "PENDING" : "DONE",
          completedAt: isCompleted ? null : new Date().toISOString(),
        },
      }).unwrap();
      toast.success(isCompleted ? "Marked as pending" : "Activity completed");
    } catch {
      toast.error("Failed to update activity");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteActivity(deleteTarget.id).unwrap();
      toast.success("Activity deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete activity");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Activities"
        description="Unified log of all client touchpoints, follow-ups, calls, and upcoming tasks."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Activity
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {(Object.keys(SALES_ACTIVITY_LABELS) as SalesActivityType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {SALES_ACTIVITY_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="DONE">Completed</SelectItem>
          </SelectContent>
        </Select>

        {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="h-9 text-xs text-muted-foreground"
          >
            Reset filters
          </Button>
        )}
      </div>

      {/* Activities List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm">Failed to load sales activities</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-10 h-10 text-muted-foreground/60" />}
          title="No activities found"
          description="There are no sales activities matching your filters."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] || Clock;
            const colorClass =
              ACTIVITY_COLORS[activity.type] ||
              "text-gray-500 bg-gray-500/10 border-gray-500/20";
            const isCompleted = activity.status === "DONE";
            const isOverdue =
              activity.dueAt &&
              !isCompleted &&
              new Date(activity.dueAt) < new Date();
            const leadClient = (activity as unknown as { lead?: { client?: { id: string; name: string } } }).lead?.client;

            return (
              <div
                key={activity.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card transition-all ${
                  isCompleted
                    ? "opacity-60 border-border/60 bg-muted/20"
                    : "border-border hover:border-primary/30 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold text-foreground ${
                          isCompleted ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {activity.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {SALES_ACTIVITY_LABELS[activity.type]}
                      </span>
                      <SalesPriorityBadge priority={activity.priority} size="sm" />
                    </div>

                    {activity.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      {leadClient && (
                        <Link
                          href={`/leads/${activity.leadId}`}
                          className="flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{leadClient.name}</span>
                        </Link>
                      )}

                      {activity.dueAt && (
                        <div
                          className={`flex items-center gap-1 ${
                            isOverdue
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : ""
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Due: {formatDate(activity.dueAt)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        </div>
                      )}

                      {activity.assignedTo && (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            user={activity.assignedTo}
                            name={
                              activity.assignedTo.name ??
                              activity.assignedTo.email
                            }
                            size="xs"
                          />
                          <span>
                            {activity.assignedTo.name ??
                              activity.assignedTo.email}
                          </span>
                        </div>
                      )}

                      <span>•</span>
                      <span>{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant={isCompleted ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleComplete(activity)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isCompleted ? "Mark Pending" : "Complete"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(activity)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Activity Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Activity"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Log Activity Modal */}
      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Log Sales Activity"
        description="Record a call, meeting, email, follow-up, or note for a sales lead."
        size="lg"
      >
        <ActivityForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
