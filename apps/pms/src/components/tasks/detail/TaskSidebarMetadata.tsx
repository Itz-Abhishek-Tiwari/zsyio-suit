"use client";

import React, { useMemo } from "react";
import { TaskConfigurationCard } from "@/components/tasks/TaskConfigurationCard";
import { Building2, Package, Calendar } from "lucide-react";
import { ProductEnvironmentBadge } from "@/components/products/ProductEnvironmentBadge";
import { GitBranchCard } from "@/components/tasks/GitBranchCard";
import type { Task, User, Team } from "@zsyio/types";
import { generateGitBranchSuggestion } from "@/lib/git-branch-helper";
import { useGenerateAiBranchMutation } from "@/store/api/tasksApi";
import { toast } from "sonner";

import { ChangeReasonModal } from "../modal/ChangeReasonModal";

interface TaskSidebarMetadataProps {
  task: Task;
  canEdit: boolean;
  users: User[];
  teams: Team[];
  customTaskTypes: { id: string; name: string }[];
  currentAssignees: User[];
  currentAssigneeIds: string[];
  currentTeams: Team[];
  currentTeamIds: string[];
  dueDateText: string | null;
  dueDateInput: string;
  setDueDateInput: (val: string) => void;
  isOverdue: boolean;
  isDueToday: boolean;
  handleFieldUpdate: (fields: Partial<Task> & { tags?: string[]; teamIds?: string[]; assigneeIds?: string[]; reviewerIds?: string[] }) => void | Promise<void>;
  handleAssigneeToggle: (userId: string) => void;
  handleTeamToggle: (teamId: string) => void;
  pendingAssigneeId?: string | null;
  pendingTeamId?: string | null;
  setIsCustomTypeOpen: (open: boolean) => void;
}

export function TaskSidebarMetadata({
  task,
  canEdit,
  users,
  teams,
  customTaskTypes,
  currentAssigneeIds,
  currentTeamIds,
  dueDateInput,
  setDueDateInput,
  handleFieldUpdate,
  handleAssigneeToggle,
  handleTeamToggle,
  pendingAssigneeId,
  pendingTeamId,
  setIsCustomTypeOpen,
}: TaskSidebarMetadataProps) {
  const currentClient = task.product?.client;

  const [isDateReasonModalOpen, setIsDateReasonModalOpen] = React.useState(false);
  const [pendingDueDate, setPendingDueDate] = React.useState<string>("");
  const [isSavingDate, setIsSavingDate] = React.useState(false);

  const currentTags = useMemo(() => task.tags?.map((t) => t.tag.name) || [], [task.tags]);

  const currentReviewerIds = useMemo(() => {
    if (task.reviewers && task.reviewers.length > 0) {
      return task.reviewers.map((r) => r.userId);
    }
    return task.reviewerId ? [task.reviewerId] : [];
  }, [task.reviewers, task.reviewerId]);

  const handleReviewerToggle = (userId: string) => {
    const nextReviewerIds = currentReviewerIds.includes(userId)
      ? currentReviewerIds.filter((id) => id !== userId)
      : [...currentReviewerIds, userId];
    handleFieldUpdate({
      reviewerId: nextReviewerIds[0] ?? null,
      reviewerIds: nextReviewerIds,
    } as never);
  };

  const handleInitiateDueDateChange = (newDate: string) => {
    const currentDateStr = task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "";
    if (newDate === currentDateStr) {
      setDueDateInput(newDate);
      return;
    }
    setPendingDueDate(newDate);
    setIsDateReasonModalOpen(true);
  };

  const handleConfirmDueDateChange = async (reason: string) => {
    setIsSavingDate(true);
    try {
      setDueDateInput(pendingDueDate);
      const formattedDueDate = pendingDueDate ? new Date(pendingDueDate).toISOString() : null;
      await handleFieldUpdate({
        dueDate: formattedDueDate as never,
        dueDateReason: reason.trim(),
        changeReason: reason.trim(),
      });
      setIsDateReasonModalOpen(false);
      setPendingDueDate("");
    } finally {
      setIsSavingDate(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TaskConfigurationCard
        title="Task Configuration"
        statusLabel="Status"
        status={task.status}
        onStatusChange={(val) => handleFieldUpdate({ status: val })}
        priority={task.priority}
        onPriorityChange={(val) => handleFieldUpdate({ priority: val })}
        type={task.type}
        onTypeChange={(val) => handleFieldUpdate({ type: val })}
        customTaskTypes={customTaskTypes}
        onOpenCustomTypeModal={() => setIsCustomTypeOpen(true)}
        canCreateCustomType={canEdit}
        selectedAssigneeIds={currentAssigneeIds}
        onToggleAssignee={handleAssigneeToggle}
        allUsers={users}
        selectedReviewerIds={currentReviewerIds}
        onToggleReviewer={handleReviewerToggle}
        selectedTeamIds={currentTeamIds}
        onToggleTeam={handleTeamToggle}
        allTeams={teams}
        dueDate={dueDateInput}
        onDueDateChange={handleInitiateDueDateChange}
        tags={currentTags}
        onTagsChange={(newTags) => handleFieldUpdate({ tags: newTags } as never)}
        disabled={!canEdit}
        pendingAssigneeId={pendingAssigneeId}
        pendingTeamId={pendingTeamId}
      />

      <ChangeReasonModal
        isOpen={isDateReasonModalOpen}
        onClose={() => {
          setIsDateReasonModalOpen(false);
          setPendingDueDate("");
        }}
        onConfirm={handleConfirmDueDateChange}
        type="date"
        oldValue={
          task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No due date"
        }
        newValue={
          pendingDueDate
            ? new Date(pendingDueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No due date"
        }
        isLoading={isSavingDate}
      />

      {task.dueDateReason && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-1.5 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Last Reschedule Reason
          </span>
          <p className="text-muted-foreground italic text-xs leading-relaxed pt-0.5">
            &ldquo;{task.dueDateReason}&rdquo;
          </p>
        </div>
      )}

      <GitWorkflowSidebarCard task={task} />

      {(currentClient || task.product) && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-2 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
            <Building2 className="w-3.5 h-3.5 text-primary" /> Client & Product
          </span>
          <div className="flex flex-col gap-1 text-xs pt-1">
            {currentClient && (
              <span className="font-bold text-foreground">{currentClient.name}</span>
            )}
            {task.product && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium flex-wrap">
                <Package className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{task.product.name}</span>
                <ProductEnvironmentBadge environment={task.product.environment} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GitWorkflowSidebarCard({ task }: { task: Task }) {
  const [currentSlug, setCurrentSlug] = React.useState<string | null>(task.gitBranchSlug || null);
  const [isAiGenerated, setIsAiGenerated] = React.useState<boolean>(Boolean(task.gitBranchSlug));
  const hasTriggeredRef = React.useRef(false);

  const [generateAiBranch, { isLoading: isGeneratingAi }] = useGenerateAiBranchMutation();

  const handleGenerateAi = React.useCallback(async (force = false) => {
    try {
      const res = await generateAiBranch({ id: task.id, force }).unwrap();
      setCurrentSlug(res.slug);
      setIsAiGenerated(true);
      if (res.source === "gemini" || res.source === "openai") {
        toast.success("Gemini generated a clean Git branch name! ✨");
      } else if (res.cached) {
        toast.info("Using cached branch name");
      } else {
        toast.success("Branch name generated");
      }
    } catch {
      toast.error("Failed to generate AI branch name");
    }
  }, [generateAiBranch, task.id]);

  React.useEffect(() => {
    if (task.gitBranchSlug) {
      setCurrentSlug(task.gitBranchSlug);
      setIsAiGenerated(true);
    } else if (!hasTriggeredRef.current && task.id) {
      hasTriggeredRef.current = true;
      handleGenerateAi(false);
    }
  }, [task.gitBranchSlug, task.id, handleGenerateAi]);

  const suggestion = generateGitBranchSuggestion({
    id: task.id,
    ticketNumber: task.ticketNumber,
    title: task.title,
    type: task.type,
    slugOverride: currentSlug || task.gitBranchSlug,
  });

  const isGenerating = isGeneratingAi || (!currentSlug && !task.gitBranchSlug);

  return (
    <GitBranchCard
      branchName={suggestion.branchName}
      checkoutCmd={suggestion.checkoutCmd}
      prefix={suggestion.prefix}
      isAiGenerated={isAiGenerated}
      isGenerating={isGenerating}
      onRegenerate={() => handleGenerateAi(true)}
    />
  );
}
