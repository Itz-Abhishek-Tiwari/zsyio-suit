import { useState, memo, useCallback } from "react";
import Link from "next/link";
import { TaskCard } from "./TaskCard";
import { ColumnIcon } from "./ColumnIcon";
import type { Task } from "@zsyio/types";
import { AnimatePresence } from "framer-motion";
import { Inbox, GripVertical, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; dotClass: string }
> = {
  BACKLOG: { label: "Backlog", icon: "BACKLOG", dotClass: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" },
  TODO: { label: "To Do", icon: "TODO", dotClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30" },
  IN_PROGRESS: { label: "In Progress", icon: "IN_PROGRESS", dotClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30" },
  IN_REVIEW: { label: "In Review", icon: "IN_REVIEW", dotClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/15 border border-orange-200/80 dark:border-orange-500/30" },
  QA: { label: "QA", icon: "QA", dotClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15 border border-purple-200/80 dark:border-purple-500/30" },
  BLOCKED: { label: "Blocked", icon: "BLOCKED", dotClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-200/80 dark:border-red-500/30" },
  DONE: { label: "Done", icon: "DONE", dotClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30" },
};

function KanbanColumnImpl({
  status,
  label,
  tasks,
  onDrop,
  filters = {},
  isCustom = false,
  customIcon,
  onDeleteColumn,
  onViewTask,
  onReorderColumn,
  draggedColumnStatus,
  onColumnDragStart,
  onColumnDragEnd,
  onMoveColumnLeft,
  onMoveColumnRight,
  isFirst = false,
  isLast = false,
  user,
  availableStatuses,
}: {
  status: string;
  label: string;
  tasks: Task[];
  onDrop: (taskId: string, status: string) => void;
  filters?: Record<string, string | number | boolean | undefined>;
  isCustom?: boolean;
  customIcon?: string;
  onDeleteColumn?: (columnId: string) => void;
  onViewTask?: (task: Task) => void;
  onReorderColumn?: (sourceStatus: string, targetStatus: string) => void;
  draggedColumnStatus?: string | null;
  onColumnDragStart?: (status: string) => void;
  onColumnDragEnd?: () => void;
  onMoveColumnLeft?: () => void;
  onMoveColumnRight?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  user?: { id?: string; role?: string; permissions?: string[] | null } | null;
  availableStatuses?: { status: string; label: string }[];
}) {
  const [isTaskDragOver, setIsTaskDragOver] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const isSelfDragging = draggedColumnStatus === status;

  const config = STATUS_CONFIG[status] ?? {
    label,
    icon: customIcon || "clipboard",
    dotClass: "text-primary bg-primary-light border border-primary/20",
  };

  const handleTaskDragStart = useCallback((e: React.DragEvent) => {
    const taskId = (e.currentTarget as HTMLElement).dataset.taskId;
    if (taskId) {
      e.dataTransfer.setData("text/task-id", taskId);
      e.dataTransfer.effectAllowed = "move";
    }
  }, []);

  const handleColumnDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/column-status", status);
    e.dataTransfer.setData("text/plain", status);
    e.dataTransfer.effectAllowed = "move";
    onColumnDragStart?.(status);
  };

  const handleColumnDragEnd = () => {
    onColumnDragEnd?.();
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedColumnStatus) {
          if (draggedColumnStatus !== status) {
            setIsColumnDragOver(true);
          }
        } else if (e.dataTransfer.types.includes("text/column-status")) {
          setIsColumnDragOver(true);
        } else {
          setIsTaskDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsTaskDragOver(false);
        setIsColumnDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTaskDragOver(false);
        setIsColumnDragOver(false);

        // Column reorder via active state or dataTransfer
        const sourceCol = draggedColumnStatus || e.dataTransfer.getData("text/column-status");
        if (sourceCol) {
          if (sourceCol !== status && onReorderColumn) {
            onReorderColumn(sourceCol, status);
          }
          onColumnDragEnd?.();
          return;
        }

        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) onDrop(taskId, status);
      }}
      className={`
        flex w-[264px] sm:w-[284px] shrink-0 flex-col gap-2.5 rounded-lg border p-3
        bg-surface-subtle/40 dark:bg-card/30 backdrop-blur-sm transition-all duration-200 select-none
        ${
          isSelfDragging
            ? "opacity-35 grayscale-[20%] border-dashed border-slate-300 dark:border-slate-700 bg-surface-subtle/30 scale-[0.98]"
            : isColumnDragOver
            ? "border-primary ring-2 ring-primary/20 bg-primary-light/30 dark:bg-primary-light/10 shadow-md shadow-primary/5 scale-[1.015]"
            : isTaskDragOver
            ? "border-primary/70 ring-2 ring-primary/20 bg-primary-light/20 dark:bg-primary-light/10 shadow-sm scale-[1.01]"
            : "border-border/60 hover:border-border/90 shadow-none"
        }
      `}
    >
      <div
        draggable
        onDragStart={handleColumnDragStart}
        onDragEnd={handleColumnDragEnd}
        title="Drag column to rearrange order"
        className="flex items-center justify-between px-1 py-1 shrink-0 cursor-grab active:cursor-grabbing group/header hover:bg-surface-elevated/60 rounded-md transition-colors -mx-1"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/header:text-primary transition-colors shrink-0" />
          <span
            className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 ${config.dotClass}`}
          >
            <ColumnIcon iconKey={config.icon} className="w-3 h-3" />
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground-secondary truncate max-w-[100px]">
            {label}
          </h2>
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-muted/80 border border-border/50 text-muted-foreground shrink-0">
            {tasks.length}
          </span>
        </div>

        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!isFirst && onMoveColumnLeft && (
            <button
              type="button"
              onClick={onMoveColumnLeft}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Move column left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {!isLast && onMoveColumnRight && (
            <button
              type="button"
              onClick={onMoveColumnRight}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Move column right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isCustom && onDeleteColumn && (
            <button
              type="button"
              onClick={() => onDeleteColumn(status)}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-destructive-light hover:text-destructive transition-all cursor-pointer"
              title="Delete custom column"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <Link
            href={`/tasks/new?status=${status}`}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={`Add task to ${label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 min-h-[140px] pr-0.5">
        {tasks.length > 0 ? (
          <AnimatePresence mode="popLayout" initial={false}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                draggable
                onDragStart={handleTaskDragStart}
                filters={filters}
                onViewTask={onViewTask}
                user={user}
                availableStatuses={availableStatuses}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div
            className={`
              flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center
              transition-all duration-200
              ${
                isTaskDragOver
                  ? "border-primary/60 bg-primary-light/20 dark:bg-primary-light/10 ring-1 ring-primary/20 text-primary"
                  : "border-border/50 text-muted-foreground/50 bg-surface-elevated/20"
              }
            `}
          >
            <Inbox className="w-4 h-4 text-muted-foreground/30" />
            <p className="text-[11px] font-medium text-muted-foreground/60">No tasks</p>
            <p className="text-[10px] text-muted-foreground/40">Drop tasks here</p>
          </div>
        )}
      </div>

      <Link
        href={`/tasks/new?status=${status}`}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 py-1.5 text-[11px] font-semibold text-muted-foreground/70 hover:bg-surface-elevated hover:text-foreground hover:border-border transition-all duration-150 shrink-0"
      >
        <Plus className="w-3 h-3" />
        <span>Add task</span>
      </Link>
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnImpl);

