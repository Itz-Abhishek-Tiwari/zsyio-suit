"use client";

import { useState, memo, useMemo } from "react";
import { formatTicketId, cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import { useSession } from "next-auth/react";
import { can } from "@zsyio/auth/permissions";
import type { Task } from "@zsyio/types";
import { useUpdateTaskStatusMutation, useDeleteTaskMutation } from "@/store/api/tasksApi";
import { useGetTaskColumnsQuery } from "@/store/api/taskColumnsApi";
import { TaskTypeBadge, TaskDueDateBadge } from "./TaskBadges";
import { TaskTagBadge } from "./TaskTagBadge";
import { TaskTimeBadge } from "./TaskTimeBadge";
import { UserAvatarGroup, ConfirmDialog } from "@/components/shared";
import { toast } from "sonner";
import {
  ArrowDown,
  Equal,
  ArrowUp,
  Flame,
  MoreHorizontal,
  Building2,
  Package,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { TASK_STATUS_LIST } from "@zsyio/types";
import { getTaskVisualHierarchy } from "@/lib/task-hierarchy";

// Sleek, minimal priority indicators
const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string }
> = {
  LOW: {
    label: "Low",
    icon: <ArrowDown className="w-3 h-3 text-slate-500" />,
    colorClass: "text-slate-600 dark:text-slate-400",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-500/20",
  },
  MEDIUM: {
    label: "Medium",
    icon: <Equal className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />,
    colorClass: "text-cyan-700 dark:text-cyan-300",
    bgClass: "bg-cyan-500/10",
    borderClass: "border-cyan-500/20",
  },
  HIGH: {
    label: "High",
    icon: <ArrowUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
    colorClass: "text-orange-700 dark:text-orange-300",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
  },
  CRITICAL: {
    label: "Urgent",
    icon: <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />,
    colorClass: "text-red-700 dark:text-red-300 font-bold",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/25",
  },
};

const STATUSES = TASK_STATUS_LIST;

export interface TaskCardProps {
  task: Task;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  filters?: Record<string, string | number | boolean | undefined>;
  onViewTask?: (task: Task) => void;
  onClick?: () => void;
  user?: { id?: string; role?: string; permissions?: string[] | null } | null;
  availableStatuses?: { status: string; label: string }[];
}

function TaskCardImpl({
  task,
  draggable,
  onDragStart,
  filters,
  onViewTask,
  onClick,
  user: propUser,
  availableStatuses: propAvailableStatuses,
}: TaskCardProps) {
  const { data: session } = useSession();
  const user = propUser !== undefined ? propUser : session?.user;

  const { data: dbColumns } = useGetTaskColumnsQuery(undefined, {
    skip: Boolean(propAvailableStatuses),
  });
  const availableStatuses = useMemo(() => {
    if (propAvailableStatuses) return propAvailableStatuses;
    if (dbColumns && dbColumns.length > 0) {
      return dbColumns.map((c) => ({
        status: c.statusKey,
        label: c.label,
      }));
    }
    return STATUSES;
  }, [propAvailableStatuses, dbColumns]);

  const [isDragging, setIsDragging] = useState(false);
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const shortId = formatTicketId(task);

  // Multi-assignees resolution with fallback
  const assignedUsers =
    task.assignees && task.assignees.length > 0
      ? task.assignees.map((a) => a.user)
      : task.assignedTo
      ? [task.assignedTo]
      : [];

  const assignedReviewers =
    task.reviewers && task.reviewers.length > 0
      ? task.reviewers.map((r) => r.user).filter(Boolean)
      : task.reviewer
      ? [task.reviewer]
      : [];

  const canDelete = user ? can(user.role, "task:delete", user.permissions) : false;
  const canEditAny = user ? can(user.role, "task:edit:any", user.permissions) : false;
  const canEditOwn = user ? can(user.role, "task:edit:own", user.permissions) : false;
  const isAssignee = user
    ? task.assignedToId === user.id ||
      task.reviewerId === user.id ||
      task.reviewers?.some(
        (r) => r.user?.id === user.id || (r as unknown as { userId: string }).userId === user.id
      ) ||
      task.assignees?.some(
        (a) => a.user?.id === user.id || (a as unknown as { userId: string }).userId === user.id
      )
    : false;
  const canMove = canEditAny || (canEditOwn && isAssignee);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks?taskId=${task.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Task link copied to clipboard");
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTask(task.id).unwrap();
      toast.success("Task deleted");
      setIsDeleteConfirmOpen(false);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    if (!canMove) {
      toast.error("You don't have permission to edit or move this task.");
      return;
    }
    try {
      await updateStatus({ id: task.id, status: newStatus, filters: filters ?? {} }).unwrap();
      const statusLabel = availableStatuses.find((s) => s.status === newStatus)?.label ?? newStatus;
      toast.success(`Moved to ${statusLabel}`);
    } catch {
      toast.error("Failed to move task");
    }
  };

  const { cardBgClass, isOverdue, isAdmin } = getTaskVisualHierarchy(task);

  const handleCardClick = () => {
    if (onViewTask) {
      onViewTask(task);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <motion.div
        layout
        layoutId={`task-card-${task.id}`}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16, ease: "easeOut" } }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.7,
        }}
        whileHover={!isDragging ? { y: -2, transition: { type: "spring", stiffness: 450, damping: 25 } } : undefined}
        whileTap={{ scale: 0.99 }}
        data-task-id={task.id}
        draggable={draggable && canMove}
        onDragStart={(e) => {
          if (!canMove) {
            e.preventDefault();
            toast.error("You can only move tasks assigned to you.");
            return;
          }
          setIsDragging(true);
          onDragStart?.(e as unknown as React.DragEvent);
        }}
        onDragEnd={() => setIsDragging(false)}
        onClick={handleCardClick}
        title={!canMove ? "Only assignees or managers can move this task" : undefined}
        className={cn(
          "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 shadow-2xs transition-all duration-200 select-none",
          cardBgClass,
          canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          isDragging
            ? "opacity-50 scale-[0.98] border-dashed border-primary shadow-lg ring-2 ring-primary/20"
            : "opacity-100"
        )}
      >
        {/* Top Header: ID, Priority, Overdue indicator, and Actions */}
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {/* Ticket Identifier */}
            <span className="font-mono text-[11px] font-bold text-muted-foreground/80 group-hover:text-primary transition-colors shrink-0">
              {shortId}
            </span>

            {/* Admin Created Dot */}
            {isAdmin && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"
                title="Executive / Admin created ticket"
              />
            )}

            {/* Priority Indicator Pill */}
            <div
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.25 rounded-md border select-none transition-colors shrink-0",
                priorityCfg.bgClass,
                priorityCfg.colorClass,
                priorityCfg.borderClass
              )}
              title={`Priority: ${priorityCfg.label}`}
            >
              {priorityCfg.icon}
              <span>{priorityCfg.label}</span>
            </div>

            {/* Overdue Alert Pill */}
            {isOverdue && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.25 rounded-md shrink-0">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>Overdue</span>
              </span>
            )}
          </div>

          {/* 3-Dot Actions Menu */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  title="Task options"
                >
                  <span className="sr-only">Actions</span>
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs shadow-xl">
                <DropdownMenuLabel className="text-xs">Task Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onViewTask ? (
                  <DropdownMenuItem onClick={() => onViewTask(task)} className="cursor-pointer">
                    View Details
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/tasks?taskId=${task.id}`}>View Details</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                  Copy Link
                </DropdownMenuItem>
                
                {canMove && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer text-xs">
                      Move Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="text-xs w-36 shadow-lg">
                      {availableStatuses.map((s) => (
                        <DropdownMenuItem
                          key={s.status}
                          disabled={s.status === task.status}
                          onClick={() => handleStatusChange(s.status)}
                          className="cursor-pointer"
                        >
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      Delete Task
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-xs sm:text-[13px] font-semibold text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
          {onViewTask ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewTask(task);
              }}
              className="text-left hover:underline focus:outline-hidden cursor-pointer"
            >
              {task.title}
            </button>
          ) : (
            <Link href={`/tasks?taskId=${task.id}`}>{task.title}</Link>
          )}
        </h3>

        {/* Client & Product Context */}
        {(task.product || task.assignedTeam) && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium truncate">
            {task.product?.client && (
              <span className="flex items-center gap-1 truncate text-foreground/80" title={task.product.client.name}>
                <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
                <span className="truncate">{task.product.client.name}</span>
              </span>
            )}

            {task.product?.client && task.product && (
              <span className="text-muted-foreground/40 text-[10px]">/</span>
            )}

            {task.product && (
              <span className="flex items-center gap-1 truncate text-foreground/80" title={task.product.name}>
                <Package className="w-3 h-3 text-orange-500/70 shrink-0" />
                <span className="truncate">{task.product.name}</span>
              </span>
            )}

            {task.assignedTeam && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span className="truncate text-muted-foreground/70">{task.assignedTeam.name}</span>
              </>
            )}
          </div>
        )}

        {/* Custom Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {task.tags.slice(0, 3).map(({ tag }) => (
              <TaskTagBadge
                key={tag.id}
                name={tag.name}
                color={tag.color}
                size="xs"
              />
            ))}
            {task.tags.length > 3 && (
              <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/50">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer Tray: Badges on left, Team/Avatars on right */}
        <div className="flex items-center justify-between gap-2 pt-2.5 mt-0.5 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-wrap">
            <TaskTypeBadge type={task.type} compact />
            {task.dueDate && (
              <TaskDueDateBadge dueDate={task.dueDate} status={task.status} compact />
            )}
            <TaskTimeBadge
              actualHours={task.actualHours}
              estimatedHours={task.estimatedHours}
              compact
            />
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {assignedReviewers.length > 0 && (
              <div
                className="relative flex items-center shrink-0"
                title={`Reviewer${assignedReviewers.length > 1 ? "s" : ""}: ${assignedReviewers.map((r) => r.name).join(", ")}`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[8px] font-bold flex items-center justify-center">
                  {assignedReviewers[0].name.slice(0, 2).toUpperCase()}
                </div>
                {assignedReviewers.length > 1 ? (
                  <span className="absolute -top-1 -right-1 text-[8px] px-1 font-bold bg-emerald-600 text-white rounded-full ring-1 ring-background">
                    +{assignedReviewers.length - 1}
                  </span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                )}
              </div>
            )}
            <UserAvatarGroup users={assignedUsers} max={3} size="xs" />
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action will remove the ticket permanently.`}
        variant="destructive"
        confirmText="Delete Task"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export const TaskCard = memo(TaskCardImpl);
