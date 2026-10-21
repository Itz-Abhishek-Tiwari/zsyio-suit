"use client";

import { useState, useEffect } from "react";
import { formatTicketId } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import {
  useGetTaskQuery,
  useGetTaskActivityQuery,
  useGetTestCasesQuery,
  useUpdateTaskMutation,
  useReassignTaskMutation,
  useDeleteTaskMutation,
} from "@/store/api/tasksApi";
import { useGetDashboardNotesQuery } from "@/store/api/dashboardNotesApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import { useGetCustomTaskTypesQuery, useCreateCustomTaskTypeMutation } from "@/store/api/taskTypesApi";
import { TaskDetailHeader } from "./detail/TaskDetailHeader";
import { TaskBlockedAlert } from "./detail/TaskBlockedAlert";
import { TaskDescriptionSection } from "./detail/TaskDescriptionSection";
import { TaskSidebarMetadata } from "./detail/TaskSidebarMetadata";
import { TaskDetailSkeleton } from "./detail/TaskDetailSkeleton";
import { CustomTypeModal } from "./detail/CustomTypeModal";
import { ChangeReasonModal } from "./modal/ChangeReasonModal";
import { TaskAttachmentsGallery } from "./TaskAttachmentsGallery";
import { TestSheetTab } from "./test-sheet/TestSheetTab";
import { CommentThread } from "./CommentThread";
import { ActivityTimeline } from "./ActivityTimeline";
import { TaskLinkedNotesTab } from "./modal/TaskLinkedNotesTab";
import { TaskTimeTrackingCard } from "./detail/TaskTimeTrackingCard";
import { TaskTimeLogsTab } from "./detail/TaskTimeLogsTab";
import { ConfirmDialog, UserAvatar } from "@/components/shared";
import type { Task, User, Team } from "@zsyio/types";
import {
  AlertOctagon,
  Shield,
  MessageSquare,
  FileCheck2,
  History,
  StickyNote,
  Clock,
} from "lucide-react";

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "just now";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskDetailPanel({ taskId, canEdit }: { taskId: string; canEdit: boolean }) {
  const router = useRouter();
  const { data: task, isLoading, error } = useGetTaskQuery(taskId);
  const [activeTab, setActiveTab] = useState<"comments" | "test-sheet" | "time-logs" | "activity" | "notes">("comments");

  const { data: testCases = [] } = useGetTestCasesQuery(taskId, {
    skip: !taskId,
  });

  const { data: activityLogs = [], isLoading: isLoadingActivity } = useGetTaskActivityQuery(
    taskId,
    {
      skip: !taskId || activeTab !== "activity",
    }
  );

  const { data: linkedNotes = [], isLoading: isLoadingNotes } = useGetDashboardNotesQuery(
    taskId ? { taskId } : undefined,
    {
      skip: !taskId,
    }
  );

  const { data: users = [] } = useGetUsersQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [reassignTask] = useReassignTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const { data: customTaskTypes = [] } = useGetCustomTaskTypesQuery();
  const [createCustomType, { isLoading: isCreatingType }] = useCreateCustomTaskTypeMutation();

  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [isEditingBlocked, setIsEditingBlocked] = useState(false);
  const [blockedInput, setBlockedInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveReasonModalOpen, setIsSaveReasonModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const [isCustomTypeOpen, setIsCustomTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const isTaskLoaded = Boolean(task && task.id === taskId);

  useEffect(() => {
    if (task && task.id === taskId) {
      setTitleInput(task.title);
      setDescInput(task.description ?? "");
      setBlockedInput(task.blockedReason ?? "");
      setDueDateInput(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      );
    }
  }, [task, taskId]);

  if (isLoading || !isTaskLoaded) {
    return <TaskDetailSkeleton />;
  }

  if (error || !task) {
    const isForbidden = (error as { status?: number })?.status === 403;
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-border bg-card max-w-lg mx-auto my-8 animate-fade-in shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {isForbidden ? "Access Restricted" : "Task Not Found"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm">
          {isForbidden
            ? "You do not have permission to view this task. Developer accounts can only access tasks assigned to them."
            : "This task may have been deleted or does not exist in your workspace."}
        </p>
        <Button asChild size="sm" className="font-semibold">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  const shortId = formatTicketId(task);

  const currentAssigneeIds = Array.from(
    new Set([
      ...(task.assignees?.map((a) => a.userId).filter((id): id is string => Boolean(id && typeof id === "string" && !id.startsWith("opt-"))) ?? []),
      ...(task.assignedToId && !task.assignedToId.startsWith("opt-") ? [task.assignedToId] : []),
    ])
  ).filter((id) => users.length === 0 || users.some((u) => u.id === id));

  const currentAssignees = currentAssigneeIds
    .map((id) => users.find((u) => u.id === id) ?? task.assignees?.find((a) => a.userId === id)?.user)
    .filter((u): u is User => Boolean(u && u.name));

  const currentTeamIds = Array.from(
    new Set([
      ...(task.teams?.map((t) => t.teamId).filter((id): id is string => Boolean(id && typeof id === "string" && !id.startsWith("opt-"))) ?? []),
      ...(task.assignedTeamId && !task.assignedTeamId.startsWith("opt-") ? [task.assignedTeamId] : []),
    ])
  ).filter((id) => teams.length === 0 || teams.some((t) => t.id === id));

  const currentTeams = currentTeamIds
    .map((id) => teams.find((t) => t.id === id) ?? task.teams?.find((t) => t.teamId === id)?.team)
    .filter((t): t is Team => Boolean(t && t.name));

  let dueDateText: string | null = null;
  let isOverdue = false;
  let isDueToday = false;

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0 && task.status !== "DONE") {
      isOverdue = true;
      dueDateText = `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0 && task.status !== "DONE") {
      isDueToday = true;
      dueDateText = "Due today";
    } else {
      dueDateText = due.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const isDueDateModified = Boolean(
    task &&
      dueDateInput !==
        (task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
  );

  const hasUnsavedChanges =
    Boolean(task) &&
    ((titleInput.trim() !== "" && titleInput.trim() !== task.title) ||
      descInput.trim() !== (task.description ?? "") ||
      blockedInput.trim() !== (task.blockedReason ?? "") ||
      isDueDateModified);

  function handleSaveAll() {
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }
    setIsSaveReasonModalOpen(true);
  }

  async function commitSaveAll(reason: string) {
    setIsSaving(true);
    try {
      const updates: Partial<Task> = {};
      if (titleInput.trim() && titleInput.trim() !== task?.title) {
        updates.title = titleInput.trim();
      }
      if (descInput.trim() !== (task?.description ?? "")) {
        updates.description = descInput.trim() || null;
      }
      if (blockedInput.trim() !== (task?.blockedReason ?? "")) {
        updates.blockedReason = blockedInput.trim() || null;
      }
      const formattedDueDate = dueDateInput ? new Date(dueDateInput).toISOString() : null;
      if (formattedDueDate !== (task?.dueDate ? new Date(task.dueDate).toISOString() : null)) {
        updates.dueDate = formattedDueDate as never;
        updates.dueDateReason = reason.trim();
      }
      updates.changeReason = reason.trim();

      if (Object.keys(updates).length > 0) {
        await updateTask({ id: taskId, body: updates as never }).unwrap();
        toast.success("Ticket saved successfully!");
      } else {
        toast.info("No changes to save");
      }

      setIsSaveReasonModalOpen(false);
      setIsEditingBlocked(false);
    } catch {
      toast.error("Failed to save ticket changes");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    if (task) {
      setTitleInput(task.title);
      setDescInput(task.description ?? "");
      setBlockedInput(task.blockedReason ?? "");
      setDueDateInput(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      );
    }
    setIsEditingBlocked(false);
  }

  async function handleBlockedSave() {
    try {
      await updateTask({
        id: taskId,
        body: { blockedReason: blockedInput.trim() || null },
      }).unwrap();
      setIsEditingBlocked(false);
      toast.success("Blocker reason updated");
    } catch {
      toast.error("Failed to update blocker reason");
    }
  }

  async function handleFieldUpdate(fields: Partial<Task> & { tags?: string[]; teamIds?: string[]; assigneeIds?: string[]; reviewerIds?: string[] }) {
    try {
      await updateTask({ id: taskId, body: fields as never }).unwrap();
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  }

  function handleAssigneeToggle(userId: string) {
    const nextAssigneeIds = currentAssigneeIds.includes(userId)
      ? currentAssigneeIds.filter((id) => id !== userId)
      : [...currentAssigneeIds, userId];

    setPendingAssigneeId(userId);
    reassignTask({ id: taskId, assigneeIds: nextAssigneeIds })
      .unwrap()
      .then(() => toast.success("Assignees updated"))
      .catch(() => toast.error("Failed to update assignees"))
      .finally(() => setPendingAssigneeId(null));
  }

  function handleTeamToggle(teamId: string) {
    const nextTeamIds = currentTeamIds.includes(teamId)
      ? currentTeamIds.filter((id) => id !== teamId)
      : [...currentTeamIds, teamId];

    setPendingTeamId(teamId);
    reassignTask({ id: taskId, teamIds: nextTeamIds })
      .unwrap()
      .then(() => toast.success("Teams updated"))
      .catch(() => toast.error("Failed to update teams"))
      .finally(() => setPendingTeamId(null));
  }

  async function handleDelete() {
    try {
      await deleteTask(taskId).unwrap();
      toast.success("Task deleted successfully!");
      router.push("/tasks");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  async function handleCreateCustomType() {
    if (!newTypeName.trim()) return;
    try {
      const created = await createCustomType({ name: newTypeName.trim() }).unwrap();
      toast.success(`Custom type "${created.name}" created`);
      setNewTypeName("");
      setIsCustomTypeOpen(false);
      await handleFieldUpdate({ type: created.name });
    } catch {
      toast.error("Failed to create custom task type");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 w-full">
      <TaskDetailHeader
        task={task}
        shortId={shortId}
        canEdit={canEdit}
        titleInput={titleInput}
        setTitleInput={setTitleInput}
        isUpdating={isUpdating}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        handleSaveAll={handleSaveAll}
        handleDiscard={handleDiscard}
        onDeleteClick={() => setIsDeleteConfirmOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TaskBlockedAlert
            task={task}
            canEdit={canEdit}
            isEditingBlocked={isEditingBlocked}
            blockedInput={blockedInput}
            setBlockedInput={setBlockedInput}
            setIsEditingBlocked={setIsEditingBlocked}
            handleBlockedSave={handleBlockedSave}
          />

          <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <TaskDescriptionSection
              task={task}
              canEdit={canEdit}
              descInput={descInput}
              setDescInput={setDescInput}
            />
          </div>

          <TaskAttachmentsGallery
            taskId={task.id}
            attachments={task.attachments}
            canEdit={canEdit}
          />

          <div className="border-t border-border/80 pt-6 mt-1 flex flex-col gap-5">
            <div className="overflow-x-auto pb-1 sm:pb-0">
              <SegmentedTabs<"comments" | "test-sheet" | "time-logs" | "activity" | "notes">
                value={activeTab}
                onChange={setActiveTab}
                size="sm"
                tabs={[
                  {
                    id: "comments",
                    label: "Comments",
                    icon: <MessageSquare className="w-3.5 h-3.5 text-primary" />,
                    count: task.comments?.length ?? 0,
                    badgeVariant: "primary",
                  },
                  {
                    id: "test-sheet",
                    label: "QA Test Sheet",
                    icon: <FileCheck2 className="w-3.5 h-3.5 text-success" />,
                    count:
                      testCases.length > 0
                        ? `${testCases.filter((tc: { status: string }) => tc.status === "PASSED").length}/${testCases.length}`
                        : undefined,
                    badgeVariant: "emerald",
                  },
                  {
                    id: "time-logs",
                    label: "Time Logs",
                    icon: <Clock className="w-3.5 h-3.5 text-notion-blue-fg" />,
                    count: task.actualHours ? `${task.actualHours}h` : undefined,
                    badgeVariant: "default",
                  },
                  {
                    id: "activity",
                    label: "Activity History",
                    icon: <History className="w-3.5 h-3.5 text-warning" />,
                    count: isLoadingActivity ? undefined : activityLogs.length,
                    badgeVariant: "amber",
                  },
                  {
                    id: "notes",
                    label: "Linked Notes",
                    icon: <StickyNote className="w-3.5 h-3.5 text-notion-blue-fg" />,
                    count: isLoadingNotes ? undefined : linkedNotes.length,
                    badgeVariant: "default",
                  },
                ]}
              />
            </div>

            {activeTab === "comments" && (
              <CommentThread
                taskId={task.id}
                comments={task.comments ?? []}
                isLoadingTask={false}
              />
            )}

            {activeTab === "test-sheet" && (
              <TestSheetTab
                taskId={task.id}
                taskTitle={task.title}
                canEdit={canEdit}
              />
            )}

            {activeTab === "time-logs" && (
              <TaskTimeLogsTab
                task={task}
                canEdit={canEdit}
              />
            )}

            {activeTab === "activity" && (
              <ActivityTimeline
                entries={activityLogs}
                isLoading={isLoadingActivity}
              />
            )}

            {activeTab === "notes" && (
              <TaskLinkedNotesTab
                isLoading={isLoadingNotes}
                notes={linkedNotes}
                timeAgo={timeAgo}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TaskTimeTrackingCard
            task={task}
            canEdit={canEdit}
            onUpdateEstimatedHours={async (hours) => {
              await updateTask({ id: task.id, body: { estimatedHours: hours } as never }).unwrap();
            }}
            onViewTimeLogs={() => setActiveTab("time-logs")}
          />

          <TaskSidebarMetadata
            task={task}
            canEdit={canEdit}
            users={users}
            teams={teams}
            customTaskTypes={customTaskTypes}
            currentAssignees={currentAssignees}
            currentAssigneeIds={currentAssigneeIds}
            currentTeams={currentTeams}
            currentTeamIds={currentTeamIds}
            dueDateText={dueDateText}
            dueDateInput={dueDateInput}
            setDueDateInput={setDueDateInput}
            isOverdue={isOverdue}
            isDueToday={isDueToday}
            handleFieldUpdate={handleFieldUpdate}
            handleAssigneeToggle={handleAssigneeToggle}
            handleTeamToggle={handleTeamToggle}
            pendingAssigneeId={pendingAssigneeId}
            pendingTeamId={pendingTeamId}
            setIsCustomTypeOpen={setIsCustomTypeOpen}
          />

          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col gap-3 shadow-xs">
            <span className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Reporter & Timeline
            </span>

            <div className="flex flex-col gap-2.5 text-xs">
              {(() => {
                const reporterUser = users.find((u) => u.id === task.createdById) ?? task.createdBy;
                return reporterUser ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reporter</span>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <UserAvatar user={reporterUser} size="xs" />
                      <span>{reporterUser.name}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground">
                  {new Date(task.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomTypeModal
        isOpen={isCustomTypeOpen}
        onOpenChange={setIsCustomTypeOpen}
        newTypeName={newTypeName}
        setNewTypeName={setNewTypeName}
        handleCreateCustomType={handleCreateCustomType}
        isCreatingType={isCreatingType}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Task Ticket"
        description={`Are you sure you want to delete "${task.title}" (${shortId})? This action cannot be undone.`}
        variant="destructive"
        confirmText="Delete Task"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <ChangeReasonModal
        isOpen={isSaveReasonModalOpen}
        onClose={() => setIsSaveReasonModalOpen(false)}
        onConfirm={commitSaveAll}
        type={isDueDateModified ? "date" : "general"}
        title={
          isDueDateModified
            ? "Reason for Due Date & Ticket Update"
            : "Reason for Ticket Changes"
        }
        oldValue={
          isDueDateModified && task?.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined
        }
        newValue={
          isDueDateModified && dueDateInput
            ? new Date(dueDateInput).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined
        }
        isLoading={isSaving}
      />
    </div>
  );
}
