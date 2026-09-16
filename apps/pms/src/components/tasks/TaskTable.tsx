"use client";

import * as React from "react";
import { formatTicketId } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { EmptyState, TableSkeleton, UserAvatarGroup, ConfirmDialog } from "@/components/shared";
import { ColumnIcon } from "./ColumnIcon";
import { TaskViewModal } from "./TaskViewModal";
import { useGetTasksQuery, useUpdateTaskStatusMutation, useDeleteTaskMutation } from "@/store/api/tasksApi";
import { useGetTaskColumnsQuery } from "@/store/api/taskColumnsApi";
import { useAppDispatch } from "@/store/hooks";
import { setFilter } from "@/store/slices/filtersSlice";
import type { Task } from "@zsyio/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { can } from "@zsyio/auth/permissions";
import {
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  ArrowRight,
  UserCheck,
  Tag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
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
import {
  STATUS_CONFIG,
  TYPE_CONFIG,
  TaskStatusBadge,
  TaskPriorityBadge,
  TeamBadge,
  TaskDueDateBadge,
} from "./TaskBadges";
import { TaskTagBadge } from "./TaskTagBadge";
import { TaskTimeBadge } from "./TaskTimeBadge";
import { TASK_STATUS_LIST } from "@zsyio/types";
import { compareTaskHierarchy, getTaskVisualHierarchy } from "@/lib/task-hierarchy";
import { cn } from "@/lib/utils";

const STATUS_LIST = TASK_STATUS_LIST;

export interface TaskTableFilters {
  [key: string]: string | number | boolean | undefined;
  q?: string;
  status?: Task["status"] | string;
  priority?: Task["priority"] | string;
  type?: string;
  clientId?: string;
  productId?: string;
  assignedToId?: string;
  assignedToIds?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "dueDate" | "priority" | "status";
  sortDir?: "asc" | "desc";
}

export function TaskTable({ filters = {} }: { filters?: TaskTableFilters }) {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetTasksQuery(filters);
  const { data: dbColumns } = useGetTaskColumnsQuery();
  const [updateStatus] = useUpdateTaskStatusMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [taskToDelete, setTaskToDelete] = React.useState<{ id: string; title: string } | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const { data: session } = useSession();
  const currentUser = session?.user;

  const totalItems = data?.total ?? 0;
  const currentPage = Number(data?.page ?? filters.page ?? 1);
  const currentPageSize = Number(data?.pageSize ?? filters.pageSize ?? 25);
  const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endItem = Math.min(totalItems, currentPage * currentPageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    dispatch(setFilter({ page: newPage }));
  };

  const handlePageSizeChange = (val: string) => {
    const size = parseInt(val, 10);
    if (!isNaN(size)) {
      dispatch(setFilter({ pageSize: size, page: 1 }));
    }
  };

  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  const availableStatuses = React.useMemo(() => {
    if (dbColumns && dbColumns.length > 0) {
      return dbColumns.map((c) => ({
        status: c.statusKey,
        label: c.label,
        icon: c.icon || c.statusKey,
      }));
    }
    return STATUS_LIST.map((s) => ({ ...s, icon: s.status }));
  }, [dbColumns]);

  const displayTasks = React.useMemo(() => {
    const items = data?.items ?? [];
    if (!filters.sortBy) {
      return [...items].sort(compareTaskHierarchy);
    }
    return items;
  }, [data?.items, filters.sortBy]);

  if (isLoading) {
    return <TableSkeleton columns={6} rows={7} showHeader />;
  }

  if (!data?.items.length) {
    return <EmptyState title="No tasks match these filters" description="Try resetting your search or priority filters." />;
  }

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id).unwrap();
      toast.success("Task deleted successfully");
      setTaskToDelete(null);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden transition-all duration-200">
      <Table>
        <TableHeader className="bg-surface-subtle/60 border-b border-border/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[380px] font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5 pl-5">
              Task Title & Details
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5">
              Status
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5">
              Priority
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5">
              Assignee
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5">
              Effort / Time
            </TableHead>
            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-3.5">
              Due Date
            </TableHead>
            <TableHead className="w-[60px] text-right py-3.5 pr-4" />
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-border/40">
          {displayTasks.map((task) => {
            const shortId = formatTicketId(task);
            const typeCfg = TYPE_CONFIG[task.type as keyof typeof TYPE_CONFIG] ?? { label: task.type, icon: <Tag className="w-3 h-3 text-purple-500" /> };
            const { isAdmin, tableRowClass } = getTaskVisualHierarchy(task);

            const userPerms = currentUser?.permissions;
            const canEditAny = currentUser ? can(currentUser.role, "task:edit:any", userPerms) : false;
            const canEditOwn = currentUser ? can(currentUser.role, "task:edit:own", userPerms) : false;
            const isAssignee = currentUser
              ? task.assignedToId === currentUser.id ||
                task.reviewerId === currentUser.id ||
                task.reviewers?.some((r) => r.userId === currentUser.id || r.user?.id === currentUser.id) ||
                task.assignees?.some((a) => a.userId === currentUser.id || a.user?.id === currentUser.id)
              : false;
            const canModify = canEditAny || (canEditOwn && isAssignee);

            const assignedReviewers =
              task.reviewers && task.reviewers.length > 0
                ? task.reviewers.map((r) => r.user).filter(Boolean)
                : task.reviewer
                ? [task.reviewer]
                : [];

            const assignedUsers = task.assignees?.map((a) => a.user).filter(Boolean) ?? [];
            if (assignedUsers.length === 0 && task.assignedTo) {
              assignedUsers.push(task.assignedTo);
            }

            const assignedTeams = task.teams?.map((t) => t.team).filter(Boolean) ?? (task.assignedTeam ? [task.assignedTeam] : []);

            const handleStatusUpdate = async (newStatus: Task["status"]) => {
              if (!canModify) {
                toast.error("You don't have permission to edit this task.");
                return;
              }
              try {
                await updateStatus({ id: task.id, status: newStatus, filters }).unwrap();
                toast.success(`Updated status to ${STATUS_CONFIG[newStatus]?.label}`);
              } catch {
                toast.error("Failed to update status");
              }
            };

            const handleCopyLink = () => {
              const url = `${window.location.origin}/tasks?taskId=${task.id}`;
              navigator.clipboard.writeText(url);
              toast.success("Task link copied to clipboard");
            };

            return (
              <TableRow
                key={task.id}
                className={cn("transition-colors group cursor-pointer", tableRowClass || "hover:bg-muted/40")}
                onClick={() => setSelectedTask(task)}
              >
                <TableCell className="py-3.5 pl-5">
                  <div className="flex flex-col gap-1.5 max-w-[360px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                        {shortId}
                      </span>

                      {isAdmin && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0"
                          title={`Created by Admin${task.createdBy?.name ? ` (${task.createdBy.name})` : ""}`}
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-surface-subtle px-2 py-0.5 rounded-md border border-border/40">
                        {typeCfg.icon}
                        <span>{typeCfg.label}</span>
                      </span>

                      {task.product && (
                        <span className="text-[10px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20 truncate max-w-[110px]">
                          {task.product.name}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {task.title}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {task.tags.map(({ tag }) => (
                          <TaskTagBadge key={tag.id} name={tag.name} color={tag.color} size="xs" />
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <TaskStatusBadge status={task.status} />
                </TableCell>

                <TableCell className="py-3.5">
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>

                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-1.5">
                    {assignedTeams.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {assignedTeams.map((tm) => (
                          <TeamBadge key={tm.id} name={tm.name} color={tm.color} />
                        ))}
                      </div>
                    )}

                    {assignedUsers.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <UserAvatarGroup users={assignedUsers} max={3} size="xs" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                          {assignedUsers[0]?.name}
                          {assignedUsers.length > 1 && (
                            <span className="text-muted-foreground text-[11px] ml-1">
                              +{assignedUsers.length - 1}
                            </span>
                          )}
                        </span>
                      </div>
                    ) : assignedTeams.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-md border border-border/30 font-medium">
                        <UserCheck className="w-3 h-3 text-muted-foreground/40" />
                        Unassigned
                      </span>
                    ) : null}

                    {assignedReviewers.length > 0 && (
                      <div
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5"
                        title={`Reviewer${assignedReviewers.length > 1 ? "s" : ""}: ${assignedReviewers.map((r) => r.name).join(", ")}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Rev:</span>
                        <span className="truncate max-w-[100px]">{assignedReviewers[0].name}</span>
                        {assignedReviewers.length > 1 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            +{assignedReviewers.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <TaskTimeBadge
                    actualHours={task.actualHours}
                    estimatedHours={task.estimatedHours}
                    compact
                  />
                </TableCell>

                <TableCell className="py-3.5">
                  <TaskDueDateBadge dueDate={task.dueDate} status={task.status} compact />
                </TableCell>

                <TableCell className="py-3.5 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        Task Actions
                      </DropdownMenuLabel>

                      <DropdownMenuItem onClick={() => setSelectedTask(task)} className="text-xs cursor-pointer">
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handleCopyLink} className="text-xs cursor-pointer">
                        <Copy className="w-3.5 h-3.5 mr-2" />
                        Copy Link
                      </DropdownMenuItem>

                      {canModify && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs">
                              <ArrowRight className="w-3.5 h-3.5 mr-2" />
                              Move Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-40">
                              {availableStatuses.map((st) => (
                                <DropdownMenuItem
                                  key={st.status}
                                  disabled={task.status === st.status}
                                  onClick={() => handleStatusUpdate(st.status)}
                                  className="text-xs cursor-pointer"
                                >
                                  <ColumnIcon iconKey={st.icon || st.status} className="w-3.5 h-3.5 mr-2" />
                                  {st.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setTaskToDelete({ id: task.id, title: task.title })}
                            className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Task
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination Bar */}
      <div className="border-t border-border/60 bg-surface-subtle/40 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Rows per page:</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-7 w-[68px] text-xs rounded-lg bg-card border-border/80 px-2 shadow-2xs cursor-pointer">
                <SelectValue placeholder={String(currentPageSize)} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl min-w-[70px]">
                <SelectItem value="10" className="text-xs cursor-pointer">10</SelectItem>
                <SelectItem value="25" className="text-xs cursor-pointer">25</SelectItem>
                <SelectItem value="50" className="text-xs cursor-pointer">50</SelectItem>
                <SelectItem value="100" className="text-xs cursor-pointer">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-[11px]">
            Showing <span className="font-semibold text-foreground">{startItem}–{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> tasks
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={currentPage <= 1}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="First page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="flex items-center gap-1 px-1">
            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground/60 select-none">
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={cn(
                    "min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs font-bold pointer-events-none"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            title="Last page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete Task"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      <TaskViewModal
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
