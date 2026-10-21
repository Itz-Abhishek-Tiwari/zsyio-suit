"use client";

import { CircleDot, Search, CalendarDays, FileCheck2, UserCheck, UserX, MoreVertical, Eye, ArrowRight, Plus } from "lucide-react";
import {
  KanbanBoard, KanbanColumn, KanbanColumnEmpty, KanbanCard,
  KanbanIdentifierBadge, useKanbanOrder, UserAvatar, Badge, Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@zsyio/ui";
import { stages, type Application } from "@/lib/schemas";

type Stage = typeof stages[number];
const columns = stages.map((status) => ({ status }));
const stageConfig = {
  APPLIED: { label: "Applied", icon: CircleDot, color: "text-notion-blue-fg bg-notion-blue" },
  SCREENING: { label: "Screening", icon: Search, color: "text-notion-yellow-fg bg-notion-yellow" },
  INTERVIEW: { label: "Interview", icon: CalendarDays, color: "text-notion-purple-fg bg-notion-purple" },
  OFFER: { label: "Offer", icon: FileCheck2, color: "text-primary bg-primary-light" },
  HIRED: { label: "Hired", icon: UserCheck, color: "text-notion-green-fg bg-notion-green" },
  REJECTED: { label: "Rejected", icon: UserX, color: "text-notion-red-fg bg-notion-red" },
};

export function RecruitKanbanBoard({ applications, canManage, saving, onStageChange, onOpenCandidate, onAddCandidate }: {
  applications: Application[];
  canManage: boolean;
  saving: boolean;
  onStageChange: (id: string, stage: Stage) => Promise<boolean>;
  onOpenCandidate: (id: string) => void;
  onAddCandidate?: () => void;
}) {
  const order = useKanbanOrder({ initialColumns: columns, storageKey: "zsyio_recruit_kanban_columns_order" });
  const canMove = canManage && !saving;

  function moveCandidate(id: string, target: Stage) {
    const application = applications.find((candidate) => candidate.id === id);
    if (!canMove || !application || application.stage === target) return;
    void onStageChange(id, target);
  }

  return <section aria-label="Hiring stages">
    <KanbanBoard
      layoutGroupId="recruit-kanban-stages"
      onResetOrder={order.handleResetColumns}
      resetButtonTitle="Restore default hiring stages order"
    >
      {order.columns.map(({ status }, index) => {
        const config = stageConfig[status];
        const Icon = config.icon;
        const candidates = applications.filter((candidate) => candidate.stage === status);
        return <KanbanColumn
          key={status}
          status={status}
          label={config.label}
          count={candidates.length}
          icon={<Icon className="w-3.5 h-3.5" />}
          iconBadgeClass={config.color}
          isFirst={index === 0}
          isLast={index === order.columns.length - 1}
          draggedColumnStatus={order.draggedColumnStatus}
          onColumnDragStart={order.handleColumnDragStart}
          onColumnDragEnd={order.handleColumnDragEnd}
          onReorderColumn={order.handleReorderColumns}
          onMoveLeft={() => order.handleMoveColumnLeft(status)}
          onMoveRight={() => order.handleMoveColumnRight(status)}
          onItemDragOver={(event) => {
            if (!canMove || !event.dataTransfer.types.includes("text/recruit-application-id")) event.dataTransfer.dropEffect = "none";
          }}
          onDropItem={(event) => moveCandidate(event.dataTransfer.getData("text/recruit-application-id"), status)}
          action={status === "APPLIED" && onAddCandidate ? <Button variant="ghost" size="icon-sm" className="w-5 h-5" aria-label="Add candidate to Applied" disabled={saving} onClick={onAddCandidate}><Plus className="w-3.5 h-3.5" /></Button> : undefined}
          footer={status === "APPLIED" && onAddCandidate ? <Button variant="outline" className="w-full h-8 border-dashed text-xs" disabled={saving} onClick={onAddCandidate}><Plus className="w-3 h-3" />Add candidate</Button> : undefined}
          emptyState={<KanbanColumnEmpty title={`No ${config.label.toLowerCase()} candidates`} description={canMove ? "Drag candidate cards here to update their stage." : "No candidates in this stage."} />}
        >
          {candidates.map((application) => <KanbanCard
            key={application.id}
            id={application.id}
            draggable={canMove}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/recruit-application-id", application.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onOpenCandidate(application.id)}
            identifier={<KanbanIdentifierBadge id={`APP-${application.id.slice(-6).toUpperCase()}`} />}
            title={application.name}
            subtitle={application.job.title}
            badges={<Badge variant="secondary">{application.source}</Badge>}
            avatar={<UserAvatar name={application.name} size="sm" />}
            actionMenu={<DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" className="w-6 h-6 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Options for ${application.name}`}><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Candidate options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenCandidate(application.id)}><Eye className="w-3.5 h-3.5 mr-2" />View details</DropdownMenuItem>
                {canManage && <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                  {stages.filter((target) => target !== application.stage).map((target) => <DropdownMenuItem key={target} disabled={saving} onClick={() => moveCandidate(application.id, target)}><ArrowRight className="w-3.5 h-3.5 mr-2" />{stageConfig[target].label}</DropdownMenuItem>)}
                </>}
              </DropdownMenuContent>
            </DropdownMenu>}
          ><p className="text-xs text-muted-foreground truncate">{application.email}</p></KanbanCard>)}
        </KanbanColumn>;
      })}
    </KanbanBoard>
  </section>;
}
