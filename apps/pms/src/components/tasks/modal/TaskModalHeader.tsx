"use client";

import { SheetHeader, SheetTitle } from "@zsyio/ui";
import { UserAvatar } from "@zsyio/ui";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TaskTypeBadge,
  TaskDueDateBadge,
} from "../TaskBadges";
import { TaskTimeBadge } from "../TaskTimeBadge";
import type { TaskStatus, Priority, Client, Product, User } from "@zsyio/types";
import { Building2, Package, ChevronRight, Copy, Check } from "lucide-react";

export interface TaskModalHeaderProps {
  currentClient?: Client | null;
  product?: Product | null;
  taskId: string;
  title: string;
  shortId: string;
  status: TaskStatus;
  priority: Priority;
  type: string;
  dueDate: string | null;
  assignedUsers: User[];
  actualHours?: number | null;
  estimatedHours?: number | null;
  hasCopiedId: boolean;
  onCopyId: () => void;
}

export function TaskModalHeader({
  currentClient,
  product,
  title,
  shortId,
  status,
  priority,
  type,
  dueDate,
  assignedUsers,
  actualHours,
  estimatedHours,
  hasCopiedId,
  onCopyId,
}: TaskModalHeaderProps) {
  return (
    <div className="p-5 sm:p-6 pb-4 border-b border-border/80 bg-card/95 backdrop-blur-md flex flex-col gap-3.5 shrink-0 pr-14">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {currentClient && (
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{currentClient.name}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            </div>
          )}

          {product && (
            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Package className="w-3.5 h-3.5 text-orange-500" />
              <span>{product.name}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            </div>
          )}

          <button
            type="button"
            onClick={onCopyId}
            title="Click to copy Ticket ID"
            className="group inline-flex items-center gap-1 font-mono text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md border border-primary/20 transition-all cursor-pointer select-none active:scale-95"
          >
            <span>{shortId}</span>
            {hasCopiedId ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>
      </div>

      <SheetHeader className="p-0 border-none space-y-0 text-left">
        <SheetTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold font-display text-foreground leading-snug tracking-tight">
          {title}
        </SheetTitle>
      </SheetHeader>

      <div className="flex items-center gap-2 flex-wrap pt-1">
        <TaskStatusBadge status={status} />
        <TaskPriorityBadge priority={priority} />
        <TaskTypeBadge type={type} />
        <TaskDueDateBadge dueDate={dueDate} status={status} />
        <TaskTimeBadge actualHours={actualHours} estimatedHours={estimatedHours} />

        {assignedUsers.length > 0 && (
          <div className="flex items-center gap-1 bg-muted/50 border border-border/50 px-2 py-0.5 rounded-sm text-xs">
            <div className="flex -space-x-1.5 overflow-hidden">
              {assignedUsers.slice(0, 3).map((u) => (
                <UserAvatar key={u.id} user={u} size="xs" />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground ml-1">
              {assignedUsers.length === 1 ? assignedUsers[0].name : `${assignedUsers.length} assignees`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
