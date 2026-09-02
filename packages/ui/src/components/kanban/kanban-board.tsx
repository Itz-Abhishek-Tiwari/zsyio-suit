"use client";

import React, { useId } from "react";
import { LayoutGroup } from "framer-motion";
import { GripVertical, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KanbanBoardProps {
  children: React.ReactNode;
  className?: string;
  layoutGroupId?: string;
  showHelperBar?: boolean;
  instructionText?: React.ReactNode;
  onResetOrder?: () => void;
  resetButtonLabel?: string;
  resetButtonTitle?: string;
  headerActions?: React.ReactNode;
  extraColumnNode?: React.ReactNode;
}

export function KanbanBoard({
  children,
  className,
  layoutGroupId,
  showHelperBar = true,
  instructionText = "Drag column headers or use arrows (◀ / ▶) to rearrange column order",
  onResetOrder,
  resetButtonLabel = "Reset layout",
  resetButtonTitle = "Restore default column order",
  headerActions,
  extraColumnNode,
}: KanbanBoardProps) {
  const generatedId = useId();
  const activeLayoutId = layoutGroupId || `kanban-layout-${generatedId}`;

  return (
    <div className={cn("flex flex-col gap-3.5 w-full", className)}>
      {/* Top Helper Bar */}
      {showHelperBar && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 select-none">
          <div className="flex items-center gap-1.5 text-muted-foreground/70">
            <GripVertical className="w-3.5 h-3.5 text-primary/60 shrink-0" />
            <span>{instructionText}</span>
          </div>

          <div className="flex items-center gap-3">
            {headerActions}

            {onResetOrder && (
              <button
                type="button"
                onClick={onResetOrder}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
                title={resetButtonTitle}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{resetButtonLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Columns Container */}
      <LayoutGroup id={activeLayoutId}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[500px] scrollbar-thin">
          {children}
          {extraColumnNode}
        </div>
      </LayoutGroup>
    </div>
  );
}
