"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@zsyio/ui";
import { KanbanBoard, KanbanBoardSkeleton, useKanbanOrder } from "@zsyio/ui";
import { getErrorMessage } from "@zsyio/ui";
import type { SalesLead, SalesStage, PipelineStage } from "@zsyio/types";
import { SALES_STAGE_LABELS } from "@zsyio/types";
import {
  useGetSalesLeadsQuery,
  useMoveSalesLeadMutation,
  useDeleteSalesLeadMutation,
} from "@/store/api/salesLeadsApi";
import { useGetDefaultPipelineQuery } from "@/store/api/salesPipelineApi";
import { SalesKanbanColumn } from "./SalesKanbanColumn";
import { SalesKanbanFilters } from "./SalesKanbanFilters";

interface SalesKanbanBoardProps {
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

export function SalesKanbanBoard({
  canEdit = true,
  canCreate = true,
  canDelete = false,
}: SalesKanbanBoardProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<SalesLead | null>(null);

  const { data: pipelineData, isLoading: pipelineLoading } = useGetDefaultPipelineQuery();
  const { data: leadsData, isLoading: leadsLoading, refetch } = useGetSalesLeadsQuery({
    pageSize: 200,
    ...filters,
  });

  const [moveLead] = useMoveSalesLeadMutation();
  const [deleteLead, { isLoading: isDeleting }] = useDeleteSalesLeadMutation();

  const leads = useMemo(() => leadsData?.items ?? [], [leadsData]);
  const canonicalStages: PipelineStage[] = useMemo(
    () => pipelineData?.stages ?? [],
    [pipelineData]
  );

  const {
    columns: stages,
    draggedColumnStatus,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleReorderColumns,
    handleMoveColumnLeft,
    handleMoveColumnRight,
    handleResetColumns,
  } = useKanbanOrder<PipelineStage>({
    initialColumns: canonicalStages,
    getStatus: (s) => s.stageKey,
    storageKey: "zsyio_sales_kanban_columns_order",
    onOrderChange: () => {
      toast.success("Board column order updated!");
    },
  });

  const leadsByStage = useMemo(() => {
    const map: Record<string, SalesLead[]> = {};
    for (const stage of canonicalStages) {
      map[stage.stageKey] = [];
    }
    for (const lead of leads) {
      if (map[lead.currentStage]) {
        map[lead.currentStage].push(lead);
      }
    }
    return map;
  }, [leads, canonicalStages]);

  /** Single handler for both drag-drop and context-menu stage changes. */
  const handleMoveLead = useCallback(
    async (leadId: string, currentStage: SalesStage, targetStage: SalesStage) => {
      if (currentStage === targetStage) return;
      try {
        await moveLead({ id: leadId, stageKey: targetStage }).unwrap();
        toast.success(`Lead moved to ${SALES_STAGE_LABELS[targetStage]}`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to move lead"));
      }
    },
    [moveLead]
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteLead(pendingDelete.id).unwrap();
      toast.success("Lead deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete lead"));
    } finally {
      setPendingDelete(null);
    }
  };

  const isLoading = pipelineLoading || leadsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SalesKanbanFilters filters={filters} onChange={setFilters} onRefresh={refetch} />
        <KanbanBoardSkeleton columnsCount={canonicalStages.length || 5} cardsPerColumn={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <SalesKanbanFilters filters={filters} onChange={setFilters} onRefresh={refetch} />

      {/* Unified Kanban Board */}
      <KanbanBoard
        onResetOrder={handleResetColumns}
        resetButtonTitle="Restore default pipeline stages order"
        layoutGroupId="sales-kanban-stages"
      >
        {stages.map((stage, idx) => (
          <SalesKanbanColumn
            key={stage.id || stage.stageKey}
            stage={stage}
            leads={leadsByStage[stage.stageKey] ?? []}
            onStageChange={(lead, newStage) => handleMoveLead(lead.id, lead.currentStage, newStage)}
            onDrop={handleMoveLead}
            onDelete={canDelete ? setPendingDelete : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
            canCreate={canCreate}
            isFirst={idx === 0}
            isLast={idx === stages.length - 1}
            draggedColumnStatus={draggedColumnStatus}
            onColumnDragStart={handleColumnDragStart}
            onColumnDragEnd={handleColumnDragEnd}
            onReorderColumn={handleReorderColumns}
            onMoveLeft={() => handleMoveColumnLeft(stage.stageKey)}
            onMoveRight={() => handleMoveColumnRight(stage.stageKey)}
          />
        ))}
      </KanbanBoard>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete Lead"
        description={`Permanently delete "${pendingDelete?.client?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
