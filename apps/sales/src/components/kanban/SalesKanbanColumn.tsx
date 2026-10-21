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
    dotClass: "text-notion-purple-fg bg-notion-purple border border-notion-purple-fg/80",
  },
  CONTACTED: {
    icon: PhoneCall,
    dotClass: "text-notion-blue-fg bg-notion-blue border border-notion-blue-fg/80",
  },
  QUALIFIED: {
    icon: CheckCircle2,
    dotClass: "text-notion-blue-fg bg-notion-blue border border-notion-blue-fg/80",
  },
  PROPOSAL_SENT: {
    icon: FileText,
    dotClass: "text-warning bg-warning-light border border-warning/80",
  },
  NEGOTIATION: {
    icon: Handshake,
    dotClass: "text-notion-orange-fg bg-notion-orange border border-notion-orange-fg/80",
  },
  WON: {
    icon: Trophy,
    dotClass: "text-success bg-success-light border border-success/80",
  },
  LOST: {
    icon: XCircle,
    dotClass: "text-destructive bg-destructive-light border border-destructive/80",
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
          <span className="text-xs font-medium text-muted-foreground/70">
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
