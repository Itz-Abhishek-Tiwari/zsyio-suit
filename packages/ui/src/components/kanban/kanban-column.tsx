"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KanbanColumnEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  isDragOver?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function KanbanColumnEmpty({
  title = "No items",
  description = "Drag items here to update status",
  icon,
  isDragOver = false,
  action,
  className,
}: KanbanColumnEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-4 rounded-md border border-dashed text-center transition-all min-h-[140px]",
        isDragOver
          ? "border-primary bg-primary/5 text-primary scale-[1.01]"
          : "border-border/50 text-muted-foreground/50 hover:border-border/70",
        className
      )}
    >
      <div className="mb-2 opacity-40 flex items-center justify-center">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <p className="text-[11px] font-semibold text-foreground/70">{title}</p>
      {description && (
        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
          {description}
        </p>
      )}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}

export interface KanbanColumnProps {
  status: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  iconBadgeClass?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  cardListClassName?: string;
  draggable?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  draggedColumnStatus?: string | null;
  onColumnDragStart?: (status: string) => void;
  onColumnDragEnd?: () => void;
  onReorderColumn?: (sourceStatus: string, targetStatus: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onDropItem?: (e: React.DragEvent) => void;
  onItemDragOver?: (e: React.DragEvent) => boolean | void;
  animateLayout?: boolean;
}

export function KanbanColumn({
  status,
  label,
  count,
  icon,
  iconBadgeClass,
  subtitle,
  action,
  footer,
  children,
  emptyState,
  className,
  cardListClassName,
  draggable = true,
  isFirst = false,
  isLast = false,
  draggedColumnStatus,
  onColumnDragStart,
  onColumnDragEnd,
  onReorderColumn,
  onMoveLeft,
  onMoveRight,
  onDropItem,
  onItemDragOver,
  animateLayout = true,
}: KanbanColumnProps) {
  const [isItemDragOver, setIsItemDragOver] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const isSelfDragging = draggedColumnStatus === status;

  const handleColumnDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/column-status", status);
    e.dataTransfer.setData("text/plain", status);
    e.dataTransfer.effectAllowed = "move";
    onColumnDragStart?.(status);
  };

  const handleColumnDragEnd = () => {
    onColumnDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedColumnStatus) {
      if (draggedColumnStatus !== status) {
        setIsColumnDragOver(true);
      }
    } else if (e.dataTransfer.types.includes("text/column-status")) {
      setIsColumnDragOver(true);
    } else {
      setIsItemDragOver(true);
      onItemDragOver?.(e);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsItemDragOver(false);
    setIsColumnDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsItemDragOver(false);
    setIsColumnDragOver(false);

    // Column reordering drop
    const sourceCol = draggedColumnStatus || e.dataTransfer.getData("text/column-status");
    if (sourceCol) {
      if (sourceCol !== status && onReorderColumn) {
        onReorderColumn(sourceCol, status);
      }
      onColumnDragEnd?.();
      return;
    }

    // Item drop
    onDropItem?.(e);
  };

  const columnContent = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex w-[272px] sm:w-[292px] shrink-0 flex-col gap-2.5 rounded-lg border p-3",
        "bg-surface-subtle/40 dark:bg-card/30 backdrop-blur-sm transition-all duration-200 select-none",
        isSelfDragging
          ? "opacity-35 grayscale-[20%] border-dashed border-border bg-surface-subtle/30 scale-[0.98]"
          : isColumnDragOver
          ? "border-primary ring-2 ring-primary/20 bg-primary-light/30 dark:bg-primary-light/10 shadow-md shadow-primary/5 scale-[1.015]"
          : isItemDragOver
          ? "border-primary/70 ring-2 ring-primary/20 bg-primary-light/20 dark:bg-primary-light/10 shadow-sm scale-[1.01]"
          : "border-border/60 hover:border-border/90 shadow-none",
        className
      )}
    >
      {/* Column Header */}
      <div
        draggable={draggable}
        onDragStart={draggable ? handleColumnDragStart : undefined}
        onDragEnd={draggable ? handleColumnDragEnd : undefined}
        title={draggable ? "Drag column to rearrange order" : undefined}
        className={cn(
          "flex items-center justify-between px-1 py-1 shrink-0 group/header rounded-md transition-colors -mx-1",
          draggable ? "cursor-grab active:cursor-grabbing hover:bg-surface-elevated/60" : ""
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {draggable && (
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/header:text-primary transition-colors shrink-0" />
          )}

          {icon && (
            <span
              className={cn(
                "w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold shrink-0",
                iconBadgeClass || "text-primary bg-primary-light border border-primary/20"
              )}
            >
              {icon}
            </span>
          )}

          <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground-secondary truncate max-w-[130px]">
            {label}
          </h2>

          {typeof count === "number" && (
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-muted/80 border border-border/50 text-muted-foreground shrink-0">
              {count}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!isFirst && onMoveLeft && (
            <button
              type="button"
              onClick={onMoveLeft}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Move column left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {!isLast && onMoveRight && (
            <button
              type="button"
              onClick={onMoveRight}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Move column right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {action}
        </div>
      </div>

      {/* Subtitle / Metrics Header */}
      {subtitle && <div className="px-1 -mt-1.5">{subtitle}</div>}

      {/* Cards List Container */}
      <div
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto pt-1.5 pb-1 px-1 -mx-1 pr-0.5 min-h-[300px] max-h-[calc(100vh-280px)] scrollbar-thin",
          cardListClassName
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {count === 0 && emptyState ? emptyState : children}
        </AnimatePresence>
      </div>

      {footer && <div className="shrink-0">{footer}</div>}
    </div>
  );

  if (!animateLayout) {
    return <div className="shrink-0">{columnContent}</div>;
  }

  return (
    <motion.div
      layout="position"
      layoutId={`kanban-col-${status}`}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 32,
        mass: 0.8,
      }}
      className="shrink-0"
    >
      {columnContent}
    </motion.div>
  );
}
