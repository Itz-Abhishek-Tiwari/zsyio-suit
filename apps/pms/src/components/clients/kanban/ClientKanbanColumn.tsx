"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ColumnIcon } from "@/components/tasks/ColumnIcon";
import { ClientKanbanCard } from "./ClientKanbanCard";
import { AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Plus,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import type { Client, ClientStatus } from "@zsyio/types";

export interface ColumnDef {
  status: ClientStatus;
  label: string;
  icon?: string;
  isCustom?: boolean;
}

export const CLIENT_STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; icon: string; dotClass: string; description: string }
> = {
  INTAKE: {
    label: "Intake",
    icon: "INTAKE",
    dotClass: "text-notion-purple-fg bg-notion-purple border border-notion-purple-fg/80",
    description: "In-taking stage, discovery & requirements",
  },
  ONBOARDING: {
    label: "Onboarding",
    icon: "ONBOARDING",
    dotClass: "text-notion-blue-fg bg-notion-blue border border-notion-blue-fg/80",
    description: "Account setup & integration",
  },
  ACTIVE: {
    label: "Active",
    icon: "ACTIVE",
    dotClass: "text-success bg-success-light border border-success/80",
    description: "Healthy active contracts",
  },
  PAUSED: {
    label: "Paused",
    icon: "PAUSED",
    dotClass: "text-warning bg-warning-light border border-warning/80",
    description: "Requires review or follow-up",
  },
  CHURNED: {
    label: "Churned",
    icon: "CHURNED",
    dotClass: "text-foreground bg-muted border border-border",
    description: "Ended client engagements",
  },
};

interface ClientKanbanColumnProps {
  status: ClientStatus;
  label: string;
  clients: Client[];
  onDrop: (clientId: string, status: ClientStatus) => void;
  onOpenNotesModal?: (client: Client) => void;
  onStatusChange: (client: Client, newStatus: ClientStatus) => void;
  onOpenQuickIntake?: () => void;
  onReorderColumn?: (sourceStatus: string, targetStatus: string) => void;
  draggedColumnStatus?: string | null;
  onColumnDragStart?: (status: string) => void;
  onColumnDragEnd?: () => void;
  onMoveColumnLeft?: () => void;
  onMoveColumnRight?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  onDeleteClient?: (client: Client) => void;
}

function ClientKanbanColumnImpl({
  status,
  label,
  clients,
  onDrop,
  onOpenNotesModal,
  onStatusChange,
  onDeleteClient,
  onOpenQuickIntake,
  onReorderColumn,
  draggedColumnStatus,
  onColumnDragStart,
  onColumnDragEnd,
  onMoveColumnLeft,
  onMoveColumnRight,
  isFirst = false,
  isLast = false,
  canEdit = true,
  canCreate = true,
  canDelete = false,
}: ClientKanbanColumnProps) {
  const [isClientDragOver, setIsClientDragOver] = useState(false);
  const [isColumnDragOver, setIsColumnDragOver] = useState(false);

  const isSelfDragging = draggedColumnStatus === status;

  const config = CLIENT_STATUS_CONFIG[status] ?? {
    label,
    icon: "building",
    dotClass: "text-primary bg-primary-light border border-primary/20",
    description: "",
  };

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
          setIsClientDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsClientDragOver(false);
        setIsColumnDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsClientDragOver(false);
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

        const clientId = e.dataTransfer.getData("text/client-id");
        if (clientId) {
          onDrop(clientId, status);
        } else {
          // Fallback to JSON payload if available
          try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data?.clientId) onDrop(data.clientId, status);
          } catch {
            // no-op
          }
        }
      }}
      className={`
        flex w-[280px] sm:w-[300px] shrink-0 flex-col gap-3 rounded-lg border p-3.5
        bg-surface-subtle/50 transition-all duration-200 select-none
        ${
          isSelfDragging
            ? "opacity-35 grayscale-[20%] border-dashed border-border bg-surface-subtle/30 scale-[0.98]"
            : isColumnDragOver
            ? "border-primary ring-2 ring-primary/20 bg-primary-light/40 dark:bg-primary-light/10 shadow-md  scale-[1.015]"
            : isClientDragOver
            ? "border-primary/80 ring-2 ring-primary/25 bg-primary-light/30 dark:bg-primary-light/10 shadow-md scale-[1.01]"
            : "border-border/70 hover:border-border/90 shadow-2xs"
        }
      `}
    >
      {/* Column Header matching Task KanbanColumn */}
      <div
        draggable={canEdit}
        onDragStart={handleColumnDragStart}
        onDragEnd={handleColumnDragEnd}
        title="Drag column to rearrange order"
        className="flex items-center justify-between px-1 py-1 shrink-0 cursor-grab active:cursor-grabbing group/header hover:bg-surface-elevated/80 rounded-lg transition-colors -mx-1"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/header:text-primary transition-colors shrink-0" />
          <span
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${config.dotClass}`}
          >
            <ColumnIcon iconKey={config.icon} className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-xs font-semibold   text-foreground-secondary truncate max-w-[120px]">
            {label}
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
            {clients.length}
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

          {canCreate && (
            status === "INTAKE" && onOpenQuickIntake ? (
              <button
                type="button"
                onClick={onOpenQuickIntake}
                className="w-5 h-5 rounded flex items-center justify-center text-notion-purple-fg hover:text-notion-purple-fg hover:bg-notion-purple transition-all cursor-pointer"
                title="Add new intake lead"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/clients/new"
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary-light transition-all cursor-pointer"
                title={`Add new ${label} client`}
              >
                <Plus className="w-3.5 h-3.5" />
              </Link>
            )
          )}
        </div>
      </div>

      {/* Cards List matching Task KanbanColumn */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 min-h-[300px] max-h-[calc(100vh-280px)] scrollbar-thin">
        <AnimatePresence initial={false} mode="popLayout">
          {clients.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-10 px-4 rounded-lg border border-dashed text-center transition-all ${
                isClientDragOver
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border/60 text-muted-foreground/60"
              }`}
            >
              <Building2 className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-xs font-semibold text-foreground/80">No {label} Clients</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "INTAKE"
                  ? "Add prospective leads in discussion"
                  : canEdit
                  ? "Drag client cards here to update status"
                  : "No clients in this stage"}
              </p>
              {status === "INTAKE" && onOpenQuickIntake && canCreate && (
                <button
                  type="button"
                  onClick={onOpenQuickIntake}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-notion-purple-fg hover:bg-notion-purple-fg text-white shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Intake Lead</span>
                </button>
              )}
            </div>
          ) : (
            clients.map((client) => (
              <ClientKanbanCard
                key={client.id}
                client={client}
                onOpenNotesModal={onOpenNotesModal}
                onStatusChange={onStatusChange}
                onDeleteClient={onDeleteClient}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const ClientKanbanColumn = memo(ClientKanbanColumnImpl);
