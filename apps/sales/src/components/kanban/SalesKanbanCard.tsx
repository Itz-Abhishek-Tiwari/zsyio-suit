"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Eye,
  ArrowRight,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KanbanCard,
  KanbanPriorityBadge,
  KanbanMetricBadge,
  KanbanDueDateBadge,
  UserAvatar,
} from "@zsyio/ui";
import type { SalesLead, SalesStage } from "@zsyio/types";
import { SALES_STAGE_LABELS, SALES_STAGE_COLORS } from "@zsyio/types";
import { formatCurrency, getDaysUntil, formatLeadId } from "@/lib/utils";

interface SalesKanbanCardProps {
  lead: SalesLead;
  onStageChange: (lead: SalesLead, newStage: SalesStage) => void;
  onDelete?: (lead: SalesLead) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const STAGE_ORDER: SalesStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

function SalesKanbanCardImpl({
  lead,
  onStageChange,
  onDelete,
  canEdit = true,
  canDelete = false,
}: SalesKanbanCardProps) {
  const router = useRouter();

  const clientName = lead.client?.name ?? "Unknown Client";
  const contactName = lead.client?.contactName;
  const assigneeName = lead.assignedTo?.name;

  // Follow-up calculations
  const followUpDays = getDaysUntil(lead.nextFollowUpAt);
  const isOverdue = followUpDays !== null && followUpDays < 0;
  const isDueToday = followUpDays === 0;
  const isCritical = lead.priority === "CRITICAL";

  // Visual card hierarchy matching PMS Tasks
  const cardVariant = isCritical || isOverdue ? "urgent" : isDueToday ? "warning" : "default";
  const shortId = formatLeadId(lead.id);

  return (
    <KanbanCard
      id={lead.id}
      draggable={canEdit}
      variant={cardVariant}
      onDragStart={(e) => {
        const event = e as unknown as DragEvent;
        event.dataTransfer?.setData("leadId", lead.id);
        event.dataTransfer?.setData("currentStage", lead.currentStage);
      }}
      onClick={() => router.push(`/leads/${lead.id}?from=kanban`)}
      identifier={shortId}
      priorityBadge={<KanbanPriorityBadge priority={lead.priority} />}
      actionMenu={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Lead options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuLabel className="text-xs">Lead Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}?from=kanban`)} className="cursor-pointer">
              <Eye className="w-3.5 h-3.5 mr-2" />
              View Details
            </DropdownMenuItem>

            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Move to Stage
                </DropdownMenuLabel>
                {STAGE_ORDER.filter((s) => s !== lead.currentStage).map((stage) => (
                  <DropdownMenuItem
                    key={stage}
                    onClick={() => onStageChange(lead, stage)}
                    className="cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 mr-2" style={{ color: SALES_STAGE_COLORS[stage] }} />
                    {SALES_STAGE_LABELS[stage]}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDelete?.(lead)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Lead
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
      title={clientName}
      subtitle={contactName}
      badges={
        <>
          {lead.dealValue ? (
            <KanbanMetricBadge
              variant="success"
              icon={<TrendingUp className="w-2.5 h-2.5 text-success shrink-0" />}
            >
              {formatCurrency(lead.dealValue)}
            </KanbanMetricBadge>
          ) : null}

          {lead.nextFollowUpAt ? (
            <KanbanDueDateBadge dueDate={lead.nextFollowUpAt} />
          ) : null}

          {lead.probability !== null && lead.probability !== undefined ? (
            <KanbanMetricBadge variant="default">
              {lead.probability}%
            </KanbanMetricBadge>
          ) : null}
        </>
      }
      avatar={
        <UserAvatar
          user={lead.assignedTo}
          name={assigneeName}
          size="xs"
          title={assigneeName ?? "Unassigned"}
        />
      }
    />
  );
}

export const SalesKanbanCard = memo(SalesKanbanCardImpl);
