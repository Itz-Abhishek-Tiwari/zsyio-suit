"use client";

import Link from "next/link";
import {
  Plus,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  FileText,
  Handshake,
  Trophy,
  XCircle,
  CircleDot,
} from "lucide-react";
import type { SalesLead, SalesStage, PipelineStage } from "@zsyio/types";
import { SalesKanbanCard } from "./SalesKanbanCard";
import { formatCurrency } from "@/lib/utils";
import { KanbanColumn, KanbanColumnEmpty } from "@zsyio/ui";

const STAGE_ICON_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; dotClass: string }
> = {
  NEW_LEAD: {
    icon: Sparkles,
    dotClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15 border border-purple-200/80 dark:border-purple-500/30",
  },
  CONTACTED: {
    icon: PhoneCall,
    dotClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30",
  },
  QUALIFIED: {
    icon: CheckCircle2,
    dotClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200/80 dark:border-cyan-500/30",
  },
  PROPOSAL_SENT: {
    icon: FileText,
    dotClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30",
  },
  NEGOTIATION: {
    icon: Handshake,
    dotClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/15 border border-orange-200/80 dark:border-orange-500/30",
  },
  WON: {
    icon: Trophy,
    dotClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30",
  },
  LOST: {
    icon: XCircle,
    dotClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-200/80 dark:border-red-500/30",
  },
};

interface SalesKanbanColumnProps {
  stage: PipelineStage;
  leads: SalesLead[];
  onStageChange: (lead: SalesLead, newStage: SalesStage) => void;
  onDrop: (leadId: string, currentStage: SalesStage, targetStage: SalesStage) => void;
  onDelete?: (lead: SalesLead) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  draggedColumnStatus?: string | null;
  onColumnDragStart?: (status: string) => void;
  onColumnDragEnd?: () => void;
  onReorderColumn?: (sourceStatus: string, targetStatus: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export function SalesKanbanColumn({
  stage,
  leads,
  onStageChange,
  onDrop,
  onDelete,
  canEdit = true,
  canDelete = false,
  canCreate = true,
  isFirst = false,
  isLast = false,
  draggedColumnStatus,
  onColumnDragStart,
  onColumnDragEnd,
  onReorderColumn,
  onMoveLeft,
  onMoveRight,
}: SalesKanbanColumnProps) {
  const totalValue = leads.reduce((sum, l) => sum + (l.dealValue ?? 0), 0);
  const iconCfg = STAGE_ICON_CONFIG[stage.stageKey] ?? {
    icon: CircleDot,
    dotClass: "text-primary bg-primary-light border border-primary/20",
  };
  const IconComponent = iconCfg.icon;

  return (
    <KanbanColumn
      status={stage.stageKey}
      label={stage.name}
      count={leads.length}
      icon={<IconComponent className="w-3.5 h-3.5" />}
      iconBadgeClass={iconCfg.dotClass}
      subtitle={
        totalValue > 0 ? (
          <span className="text-[10px] font-medium text-muted-foreground/70">
            {formatCurrency(totalValue)}
          </span>
        ) : undefined
      }
      action={
        canCreate && stage.stageKey === "NEW_LEAD" ? (
          <Link
            href={`/leads/new?stage=${stage.stageKey}`}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary-light transition-all cursor-pointer"
            title={`Add new lead to ${stage.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        ) : undefined
      }
      emptyState={
        <KanbanColumnEmpty
          title={`No ${stage.name} Leads`}
          description={
            stage.stageKey === "NEW_LEAD"
              ? "Create new inbound sales opportunities"
              : canEdit
              ? "Drag lead cards here to advance stage"
              : "No leads in this stage"
          }
        />
      }
      footer={
        canCreate ? (
          <Link
            href={`/leads/new?stage=${stage.stageKey}`}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/70 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground hover:border-border transition-all duration-150 shrink-0 cursor-pointer w-full"
          >
            <Plus className="w-3 h-3" />
            <span>Add lead</span>
          </Link>
        ) : undefined
      }
      isFirst={isFirst}
      isLast={isLast}
      draggable={canEdit}
      draggedColumnStatus={draggedColumnStatus}
      onColumnDragStart={onColumnDragStart}
      onColumnDragEnd={onColumnDragEnd}
      onReorderColumn={onReorderColumn}
      onMoveLeft={onMoveLeft}
      onMoveRight={onMoveRight}
      onDropItem={(e) => {
        const leadId = e.dataTransfer.getData("leadId");
        const currentStage = e.dataTransfer.getData("currentStage") as SalesStage;
        if (leadId && currentStage !== stage.stageKey) {
          onDrop(leadId, currentStage, stage.stageKey);
        }
      }}
    >
      {leads.map((lead) => (
        <SalesKanbanCard
          key={lead.id}
          lead={lead}
          onStageChange={onStageChange}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </KanbanColumn>
  );
}
