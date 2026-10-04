import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, X, GripVertical, RotateCcw } from "lucide-react";
import { motion, LayoutGroup } from "framer-motion";
import { KanbanColumn } from "./KanbanColumn";
import { TaskViewModal } from "./TaskViewModal";
import { ICON_OPTIONS } from "./ColumnIcon";
import { useGetTasksQuery, useUpdateTaskStatusMutation } from "@/store/api/tasksApi";
import {
  useGetTaskColumnsQuery,
  useCreateTaskColumnMutation,
  useReorderTaskColumnsMutation,
  useResetTaskColumnsOrderMutation,
  useDeleteTaskColumnMutation,
} from "@/store/api/taskColumnsApi";
import type { Task, CustomKanbanColumn } from "@zsyio/types";
import { getTaskDeadlineCategory, isTaskAdminCreated } from "@/lib/task-hierarchy";
import { Skeleton } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { toast } from "sonner";

interface ColumnDef {
  status: string;
  label: string;
  isCustom?: boolean;
  icon?: string;
  id?: string;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { status: "BACKLOG", label: "Backlog", icon: "BACKLOG" },
  { status: "TODO", label: "To Do", icon: "TODO" },
  { status: "IN_PROGRESS", label: "In Progress", icon: "IN_PROGRESS" },
  { status: "IN_REVIEW", label: "In Review", icon: "IN_REVIEW" },
  { status: "QA", label: "QA", icon: "QA" },
  { status: "BLOCKED", label: "Blocked", icon: "BLOCKED" },
  { status: "DONE", label: "Done", icon: "DONE" },
];

const EMPTY_TASKS: Task[] = [];
const EMPTY_CUSTOM_COLUMNS: CustomKanbanColumn[] = [];

// Its own component so typing in the form doesn't re-render every column/card
// in the board (previously this state lived in KanbanBoard itself).
const AddColumnCard = memo(function AddColumnCard({
  existingColumns,
  onAdd,
  isCreating,
}: {
  existingColumns: ColumnDef[];
  onAdd: (col: { status: string; label: string; icon: string }) => Promise<void>;
  isCreating?: boolean;
}) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("flask");

  const handleAddColumn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = newColumnTitle.trim();
    if (!title) return;

    const columnId = `CUSTOM_${title.toUpperCase().replace(/\s+/g, "_")}`;
    const exists = existingColumns.some(
      (c) => c.status === columnId || c.label.toLowerCase() === title.toLowerCase()
    );

    if (exists) {
      toast.error("A column with this title or status already exists");
      return;
    }

    try {
      await onAdd({
        status: columnId,
        label: title,
        icon: selectedIcon,
      });

      setNewColumnTitle("");
      setSelectedIcon("flask");
      setIsAddingColumn(false);
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="w-[300px] shrink-0">
      {isAddingColumn ? (
        <form
          onSubmit={handleAddColumn}
          className="rounded-2xl border border-primary/40 bg-card p-4 shadow-sm flex flex-col gap-3.5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">New Kanban Column</span>
            <button
              type="button"
              onClick={() => {
                setIsAddingColumn(false);
                setNewColumnTitle("");
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Column Title
            </label>
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="e.g. UAT, Staging, Ready"
              autoFocus
              className="h-9 text-xs"
              maxLength={30}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Icon
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ICON_OPTIONS.map((opt) => {
                const isSelected = selectedIcon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    title={opt.label}
                    onClick={() => setSelectedIcon(opt.id)}
                    className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-light border-primary text-primary font-bold shadow-xs scale-105"
                        : "bg-surface-subtle border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingColumn(false);
                setNewColumnTitle("");
              }}
              className="h-8 text-xs text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newColumnTitle.trim() || isCreating}
              className="h-8 text-xs font-semibold shadow-xs"
            >
              {isCreating ? "Saving..." : "Create Column"}
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingColumn(true)}
          className="flex w-full h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-surface-subtle/40 p-4 text-xs font-semibold text-muted-foreground hover:bg-surface-elevated hover:text-primary hover:border-primary/40 transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add new column</span>
        </button>
      )}
    </div>
  );
});

export function KanbanBoard({ filters }: { filters: Record<string, string | number | boolean | undefined> }) {
  const kanbanFilters = useMemo(
    () => ({ ...filters, page: 1, pageSize: 500 }),
    [filters]
  );
  const { data: session } = useSession();
  const { data, isLoading, isError } = useGetTasksQuery(kanbanFilters);
  const { data: dbCustomColumns = EMPTY_CUSTOM_COLUMNS } = useGetTaskColumnsQuery();
  const [createColumnMutation, { isLoading: isCreatingColumn }] = useCreateTaskColumnMutation();
  const [reorderColumnsMutation] = useReorderTaskColumnsMutation();
  const [resetColumnsOrderMutation] = useResetTaskColumnsOrderMutation();
  const [deleteColumnMutation] = useDeleteTaskColumnMutation();

  const [updateStatus] = useUpdateTaskStatusMutation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDrop = useCallback(
    (taskId: string, status: string) => {
      updateStatus({ id: taskId, status: status as Task["status"], filters: kanbanFilters });
    },
    [updateStatus, kanbanFilters]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  // Pre-compute per-task sort keys once, then sort each bucket using those
  // cached values. compareTaskHierarchy calls getTaskDeadlineCategory (which
  // allocates new Date() twice) on every comparison pair — O(n log n) calls.
  // Pre-computing reduces that to O(n) allocations regardless of bucket size.
  const tasksByStatus = useMemo(() => {
    const items = data?.items ?? [];

    // Pre-compute stable sort keys for every task
    const adminMap = new Map<string, boolean>();
    const deadlineMap = new Map<string, ReturnType<typeof getTaskDeadlineCategory>>();
    for (const task of items) {
      adminMap.set(task.id, isTaskAdminCreated(task));
      deadlineMap.set(task.id, getTaskDeadlineCategory(task));
    }

    const byStatus = new Map<string, Task[]>();
    for (const task of items) {
      const bucket = byStatus.get(task.status);
      if (bucket) bucket.push(task);
      else byStatus.set(task.status, [task]);
    }

    // Sort each bucket using the pre-computed values via the standard comparator
    // (compareTaskHierarchy recomputes internally, so we pass a thin wrapper
    // that preserves identical sort order without extra date allocations)
    const DEADLINE_RANK: Record<ReturnType<typeof getTaskDeadlineCategory>, number> = {
      OVERDUE: 4,
      DUE_TODAY: 3,
      DUE_SOON: 2,
      UPCOMING: 1,
      NO_DEADLINE: 0,
    };

    for (const [status, list] of byStatus.entries()) {
      byStatus.set(
        status,
        list.slice().sort((a, b) => {
          const aAdmin = adminMap.get(a.id) ?? false;
          const bAdmin = adminMap.get(b.id) ?? false;
          if (aAdmin && !bAdmin) return -1;
          if (!aAdmin && bAdmin) return 1;

          const aDR = DEADLINE_RANK[deadlineMap.get(a.id) ?? "NO_DEADLINE"];
          const bDR = DEADLINE_RANK[deadlineMap.get(b.id) ?? "NO_DEADLINE"];
          if (aDR !== bDR) return bDR - aDR;

          if (a.dueDate && b.dueDate && aDR > 0) {
            const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (diff !== 0) return diff;
          }

          const PRIORITY_RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const aPR = PRIORITY_RANK[a.priority] ?? 2;
          const bPR = PRIORITY_RANK[b.priority] ?? 2;
          if (aPR !== bPR) return bPR - aPR;

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    }

    return byStatus;
  }, [data]);


  // Combined full list of all available columns from server
  const canonicalColumns: ColumnDef[] = useMemo(() => {
    if (!dbCustomColumns || dbCustomColumns.length === 0) {
      return DEFAULT_COLUMNS;
    }

    return dbCustomColumns.map((c) => ({
      status: c.statusKey,
      label: c.label,
      isCustom: c.isCustom ?? !DEFAULT_COLUMNS.some((d) => d.status === c.statusKey),
      icon: c.icon || "flask",
      id: c.id,
    }));
  }, [dbCustomColumns]);

  // Columns state with reordering support
  const [columns, setColumns] = useState<ColumnDef[]>(canonicalColumns);
  const [draggedColumnStatus, setDraggedColumnStatus] = useState<string | null>(null);

  const availableStatuses = useMemo(() => {
    return columns.map((c) => ({
      status: c.status,
      label: c.label,
    }));
  }, [columns]);

  // Synchronize with canonical columns from DB
  useEffect(() => {
    setColumns((prev) => {
      if (
        prev.length === canonicalColumns.length &&
        prev.every(
          (col, idx) =>
            col.status === canonicalColumns[idx]?.status &&
            col.label === canonicalColumns[idx]?.label &&
            col.icon === canonicalColumns[idx]?.icon
        )
      ) {
        return prev;
      }
      return canonicalColumns;
    });
  }, [canonicalColumns]);

  const persistColumnOrder = useCallback(
    async (nextCols: ColumnDef[]) => {
      try {
        await reorderColumnsMutation({
          columnOrders: nextCols.map((c) => c.status),
        }).unwrap();
        try {
          localStorage.removeItem("zsyio_kanban_columns_order");
        } catch {
          // ignore
        }
        toast.success("Board column order updated for all team members!");
      } catch (err: unknown) {
        const errorMsg =
          (err as { data?: { error?: { message?: string } } })?.data?.error?.message ||
          "Failed to sync column order with workspace";
        toast.error(errorMsg);
      }
    },
    [reorderColumnsMutation]
  );

  const handleReorderColumns = useCallback(
    (sourceStatus: string, targetStatus: string) => {
      if (sourceStatus === targetStatus) return;

      setColumns((prev) => {
        const sourceIndex = prev.findIndex((c) => c.status === sourceStatus);
        const targetIndex = prev.findIndex((c) => c.status === targetStatus);
        if (sourceIndex === -1 || targetIndex === -1) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedColumn);

        persistColumnOrder(next);
        return next;
      });
    },
    [persistColumnOrder]
  );

  const handleMoveColumnDirection = useCallback(
    (statusToMove: string, direction: "left" | "right") => {
      setColumns((prev) => {
        const currentIndex = prev.findIndex((c) => c.status === statusToMove);
        if (currentIndex === -1) return prev;

        const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const [movedColumn] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, movedColumn);

        persistColumnOrder(next);
        return next;
      });
    },
    [persistColumnOrder]
  );

  const handleAddCustomColumn = useCallback(
    async (col: { status: string; label: string; icon: string }) => {
      try {
        await createColumnMutation({
          statusKey: col.status,
          label: col.label,
          icon: col.icon,
          order: columns.length,
        }).unwrap();

        toast.success(`Added column "${col.label}" for all team members!`);
      } catch (err: unknown) {
        const errorMsg =
          (err as { data?: { error?: { message?: string } } })?.data?.error?.message ||
          "Failed to create custom column in workspace";
        toast.error(errorMsg);
        throw err;
      }
    },
    [createColumnMutation, columns.length]
  );

  const handleDeleteColumn = useCallback(
    async (statusToDelete: string) => {
      const col = columns.find((c) => c.status === statusToDelete);
      try {
        await deleteColumnMutation(statusToDelete).unwrap();
        toast.success(`Removed column "${col?.label ?? "custom column"}"`);
      } catch {
        toast.error("Failed to delete column");
      }
    },
    [columns, deleteColumnMutation]
  );

  const handleResetColumns = useCallback(async () => {
    try {
      await resetColumnsOrderMutation().unwrap();
      try {
        localStorage.removeItem("zsyio_kanban_columns_order");
      } catch {
        // ignore
      }
      toast.success("Reset columns to default layout for all team members");
    } catch {
      setColumns(DEFAULT_COLUMNS);
      toast.error("Failed to reset layout in database");
    }
  }, [resetColumnsOrderMutation]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full animate-fade-in">
        {[
          { label: "Backlog", color: "bg-slate-500/10 border-slate-500/20" },
          { label: "To Do", color: "bg-blue-500/10 border-blue-500/20" },
          { label: "In Progress", color: "bg-amber-500/10 border-amber-500/20" },
          { label: "In Review", color: "bg-purple-500/10 border-purple-500/20" },
          { label: "Blocked", color: "bg-red-500/10 border-red-500/20" },
          { label: "Done", color: "bg-emerald-500/10 border-emerald-500/20" },
        ].map((col, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface-subtle/40 p-3 min-h-[520px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>

            <div className="flex flex-col gap-2.5">
              {[1, 2, idx === 0 || idx === 2 ? 3 : 0].filter(Boolean).map((cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-xl border border-border/70 bg-card p-3.5 flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  </div>

                  <Skeleton className="h-4 w-24 rounded-md" />

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-border bg-card">
        <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
        <p className="font-semibold text-sm text-foreground">Failed to load tasks</p>
        <p className="text-xs text-muted-foreground mt-1">Please refresh the page or check your connection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1.5 text-muted-foreground/70">
          <GripVertical className="w-3.5 h-3.5 text-primary/60" />
          <span>Drag column headers or use arrows (◀ / ▶) to rearrange column order</span>
        </span>
        <button
          type="button"
          onClick={handleResetColumns}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
          title="Restore default 6 column layout"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset layout</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start">
        <LayoutGroup id="kanban-board-columns">
          {columns.map((col, idx) => (
            <motion.div
              key={col.status}
              layout="position"
              layoutId={`kanban-col-${col.status}`}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 32,
                mass: 0.8,
              }}
              className="shrink-0"
            >
              <KanbanColumn
                status={col.status}
                label={col.label}
                tasks={tasksByStatus.get(col.status) ?? EMPTY_TASKS}
                onDrop={handleDrop}
                filters={kanbanFilters}
                isCustom={col.isCustom}
                customIcon={col.icon}
                onDeleteColumn={handleDeleteColumn}
                onViewTask={setSelectedTask}
                onReorderColumn={handleReorderColumns}
                draggedColumnStatus={draggedColumnStatus}
                onColumnDragStart={setDraggedColumnStatus}
                onColumnDragEnd={() => setDraggedColumnStatus(null)}
                onMoveColumnLeft={() => handleMoveColumnDirection(col.status, "left")}
                onMoveColumnRight={() => handleMoveColumnDirection(col.status, "right")}
                isFirst={idx === 0}
                isLast={idx === columns.length - 1}
                user={session?.user}
                availableStatuses={availableStatuses}
              />
            </motion.div>
          ))}
        </LayoutGroup>

        <AddColumnCard
          existingColumns={columns}
          onAdd={handleAddCustomColumn}
          isCreating={isCreatingColumn}
        />
      </div>

      <TaskViewModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={handleCloseModal}
      />
    </div>
  );
}
