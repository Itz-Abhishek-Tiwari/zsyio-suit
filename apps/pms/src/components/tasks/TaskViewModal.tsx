"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { FormattedText, extractAllNoteIds } from "@zsyio/editor";
import { CommentThread } from "./CommentThread";
import { ActivityTimeline } from "./ActivityTimeline";
import { TaskAttachmentsGallery } from "./TaskAttachmentsGallery";
import { AiSummaryCard } from "./AiSummaryCard";
import { TestSheetTab } from "./test-sheet/TestSheetTab";
import { TaskModalHeader } from "./modal/TaskModalHeader";
import { TaskModalSidebar } from "./modal/TaskModalSidebar";
import { TaskLinkedNotesTab } from "./modal/TaskLinkedNotesTab";
import {
  useGetTaskQuery,
  useGetTaskActivityQuery,
  useGenerateAiBranchMutation,
  useGetTestCasesQuery,
  useUpdateTaskMutation,
} from "@/store/api/tasksApi";
import { TaskTimeTrackingCard } from "./detail/TaskTimeTrackingCard";
import { TaskTimeLogsTab } from "./detail/TaskTimeLogsTab";
import { useGetDashboardNotesQuery } from "@/store/api/dashboardNotesApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import { useSession } from "next-auth/react";
import { can } from "@zsyio/auth/permissions";
import { formatTicketId } from "@/lib/utils";
import { generateGitBranchSuggestion } from "@/lib/git-branch-helper";
import type { Task, User, Team } from "@zsyio/types";
import {
  FileText,
  Copy,
  Check,
  MessageSquare,
  FileCheck2,
  History,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  Share2,
  GitBranch,
  ExternalLink,
  Pencil,
  Clock,
} from "lucide-react";

export interface TaskViewModalProps {
  task?: Task | null;
  taskId?: string;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskViewModal({ task, taskId, isOpen, onClose }: TaskViewModalProps) {
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [hasCopiedDesc, setHasCopiedDesc] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "test-sheet" | "time-logs" | "activity" | "notes">("comments");
  const [currentSlugMap, setCurrentSlugMap] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredAiMapRef = useRef<Record<string, boolean>>({});

  const targetTaskId = taskId || task?.id || "";
  const currentSlug = targetTaskId ? (currentSlugMap[targetTaskId] ?? null) : null;

  const {
    data: fetchedTask,
    isLoading: isLoadingTask,
    isFetching: isFetchingTask,
  } = useGetTaskQuery(targetTaskId, {
    skip: !targetTaskId || !isOpen,
  });

  const { data: testCases = [] } = useGetTestCasesQuery(targetTaskId, {
    skip: !targetTaskId || !isOpen,
  });

  const { data: activityLogs = [], isLoading: isLoadingActivity } = useGetTaskActivityQuery(
    targetTaskId,
    {
      skip: !targetTaskId || !isOpen || activeTab !== "activity",
    }
  );

  const { data: linkedNotes = [], isLoading: isLoadingNotes } = useGetDashboardNotesQuery(
    targetTaskId ? { taskId: targetTaskId } : undefined,
    {
      skip: !targetTaskId || !isOpen,
    }
  );

  const { data: users = [] } = useGetUsersQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [generateAiBranch, { isLoading: isGeneratingAi }] = useGenerateAiBranchMutation();
  const [updateTask] = useUpdateTaskMutation();

  const isFetchedForCurrentTask = Boolean(fetchedTask && fetchedTask.id === targetTaskId);
  const isInitialForCurrentTask = Boolean(task && task.id === targetTaskId);

  const currentResolvedTask = isFetchedForCurrentTask ? fetchedTask! : isInitialForCurrentTask ? task! : null;

  const lastActiveTaskRef = useRef<Task | null>(null);
  if (currentResolvedTask) {
    lastActiveTaskRef.current = currentResolvedTask;
  }
  const activeTask = currentResolvedTask || lastActiveTaskRef.current;

  const referencedNoteIds = useMemo(
    () => extractAllNoteIds(activeTask?.description),
    [activeTask?.description]
  );
  const totalNotesCount = (linkedNotes?.length || 0) + referencedNoteIds.length;

  const handleGenerateAi = useCallback(async (force = false) => {
    if (!activeTask?.id) return;
    try {
      const res = await generateAiBranch({ id: activeTask.id, force }).unwrap();
      setCurrentSlugMap((prev) => ({ ...prev, [activeTask.id]: res.slug }));
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
  }, [activeTask?.id, generateAiBranch]);

  useEffect(() => {
    if (
      activeTask &&
      !activeTask.gitBranchSlug &&
      !currentSlugMap[activeTask.id] &&
      isOpen &&
      !hasTriggeredAiMapRef.current[activeTask.id]
    ) {
      hasTriggeredAiMapRef.current[activeTask.id] = true;
      handleGenerateAi(false);
    }
  }, [activeTask, currentSlugMap, isOpen, handleGenerateAi]);

  if (!isOpen && !activeTask) return null;

  if (isLoadingTask && !isInitialForCurrentTask && !activeTask) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 gap-0 border-l border-border/80 bg-card shadow-md flex flex-col h-full overflow-hidden"
        >
          <div className="p-6 border-b border-border/80 flex flex-col gap-4 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
            <div className="h-8 w-3/4 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-6 animate-pulse">
            <div className="h-32 bg-muted/40 rounded-lg" />
            <div className="h-48 bg-muted/40 rounded-lg" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!activeTask) {
    return null;
  }

  const isTaskCommentsLoading = isFetchingTask && !isFetchedForCurrentTask;

  const assignedUserIds = activeTask.assignees
    ? activeTask.assignees.map((a) => a.userId ?? a.user?.id).filter((id): id is string => Boolean(id))
    : activeTask.assignedToId
    ? [activeTask.assignedToId]
    : [];

  const assignedUsers = assignedUserIds
    .map((id) => users.find((u) => u.id === id) ?? activeTask.assignees?.find((a) => (a.userId ?? a.user?.id) === id)?.user)
    .filter((u): u is User => Boolean(u && u.name && u.name !== u.id));

  const assignedTeamIds = activeTask.teams
    ? activeTask.teams.map((t) => t.teamId ?? t.team?.id).filter((id): id is string => Boolean(id))
    : activeTask.assignedTeamId
    ? [activeTask.assignedTeamId]
    : [];

  const assignedTeams = assignedTeamIds
    .map((id) => teams.find((t) => t.id === id) ?? activeTask.teams?.find((t) => t.teamId === id)?.team)
    .filter((t): t is Team => Boolean(t && t.name && t.name !== t.id));

  const creator = activeTask.createdBy || users.find((u) => u.id === activeTask.createdById);
  const reviewer = activeTask.reviewer || (activeTask.reviewerId ? users.find((u) => u.id === activeTask.reviewerId) : null);
  const reviewerUserIds = activeTask.reviewers && activeTask.reviewers.length > 0
    ? activeTask.reviewers.map((r) => r.userId ?? (r as unknown as { user?: { id: string } }).user?.id).filter((id): id is string => Boolean(id))
    : activeTask.reviewerId
    ? [activeTask.reviewerId]
    : [];

  const reviewers = reviewerUserIds
    .map((id) => users.find((u) => u.id === id) ?? (activeTask.reviewers?.find((r) => (r.userId ?? (r as unknown as { user?: { id: string } }).user?.id) === id) as unknown as { user?: User })?.user)
    .filter((u): u is User => Boolean(u && u.name && u.name !== u.id));

  const currentClient = activeTask.product?.client;

  const canEdit = Boolean(
    currentUser &&
    (can(currentUser.role, "task:edit:any", currentUser.permissions) ||
      (can(currentUser.role, "task:edit:own", currentUser.permissions) &&
        (activeTask.assignedToId === currentUser.id ||
          activeTask.reviewerId === currentUser.id ||
          reviewerUserIds.includes(currentUser.id) ||
          activeTask.createdById === currentUser.id ||
          activeTask.assignees?.some((a) => (a.userId ?? a.user?.id) === currentUser.id))))
  );

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks?taskId=${activeTask.id}`;
    navigator.clipboard.writeText(url);
    setHasCopiedLink(true);
    toast.success("Task link copied to clipboard");
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    const shortIdStr = formatTicketId(activeTask);
    navigator.clipboard.writeText(shortIdStr);
    setHasCopiedId(true);
    toast.success(`Copied ticket ID: ${shortIdStr}`);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleCopyDescription = () => {
    if (!activeTask.description) return;
    navigator.clipboard.writeText(activeTask.description);
    setHasCopiedDesc(true);
    toast.success("Description copied to clipboard");
    setTimeout(() => setHasCopiedDesc(false), 2000);
  };

  const effectiveSlug = currentSlug || activeTask.gitBranchSlug;
  const isAiGenerated = Boolean(effectiveSlug);

  const gitSuggestion = activeTask
    ? generateGitBranchSuggestion({
        id: activeTask.id,
        ticketNumber: activeTask.ticketNumber,
        title: activeTask.title,
        type: activeTask.type,
        slugOverride: effectiveSlug,
      })
    : null;

  const isGeneratingBranch = isGeneratingAi || (!effectiveSlug);

  const shortId = formatTicketId(activeTask);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          if (
            typeof document !== "undefined" &&
            (document.body.classList.contains("media-lightbox-open") ||
              (e.target as HTMLElement | null)?.closest?.('[data-media-lightbox="true"]'))
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (
            typeof document !== "undefined" &&
            (document.body.classList.contains("media-lightbox-open") ||
              (e.target as HTMLElement | null)?.closest?.('[data-media-lightbox="true"]'))
          ) {
            e.preventDefault();
          }
        }}
        className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 gap-0 border-l border-border/80 bg-card shadow-md flex flex-col h-full overflow-hidden"
      >
        <div className="animate-modal-stagger-1">
          <TaskModalHeader
            currentClient={currentClient}
            product={activeTask.product}
            taskId={activeTask.id}
            title={activeTask.title}
            shortId={shortId}
            status={activeTask.status}
            priority={activeTask.priority}
            type={activeTask.type}
            dueDate={activeTask.dueDate}
            assignedUsers={assignedUsers}
            actualHours={activeTask.actualHours}
            estimatedHours={activeTask.estimatedHours}
            hasCopiedId={hasCopiedId}
            onCopyId={handleCopyId}
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col gap-6 bg-muted/15"
        >
          {activeTask.status === "BLOCKED" && (
            <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs animate-fade-in">
              <div className="w-8 h-8 rounded-sm bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-destructive text-sm">
                    Ticket is Blocked
                  </span>
                  <span className="text-xs text-destructive/70 font-mono">Attention required</span>
                </div>
                <p className="text-destructive leading-relaxed text-xs">
                  {activeTask.blockedReason || "No blocker details specified."}
                </p>
              </div>
            </div>
          )}

          {activeTask.status === "DONE" && (
            <div className="rounded-md border border-success/25 bg-success/5 p-3.5 sm:p-4 flex items-center gap-3 shadow-2xs animate-fade-in">
              <div className="w-7 h-7 rounded-sm bg-success/15 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-success text-sm">
                  Ticket Completed
                </span>
                <span className="text-success text-xs">
                  All requirements have been met and reviewed.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6 animate-modal-stagger-2">
              {Boolean(activeTask.description?.trim()) && (
                <AiSummaryCard
                  taskId={activeTask.id}
                  summary={activeTask.aiSummary}
                  hasDescription={true}
                  canRegenerate={false}
                />
              )}

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold   text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </span>
                    Ticket Description
                  </span>

                  {activeTask.description && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyDescription}
                      className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                    >
                      {hasCopiedDesc ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopiedDesc ? "Copied" : "Copy text"}</span>
                    </Button>
                  )}
                </div>

                <div className="rounded-md border border-border/70 bg-card p-4 min-h-[110px] shadow-2xs leading-relaxed text-sm">
                  {activeTask.description ? (
                    <FormattedText content={activeTask.description} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/60">
                      <FileText className="w-8 h-8 opacity-40 mb-1.5" />
                      <span className="text-xs italic">No description provided for this ticket.</span>
                    </div>
                  )}
                </div>
              </div>

              <TaskAttachmentsGallery
                taskId={activeTask.id}
                attachments={isFetchedForCurrentTask ? fetchedTask?.attachments : activeTask.attachments}
                canEdit={false}
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
                        count: isFetchedForCurrentTask ? (fetchedTask?.comments?.length ?? 0) : undefined,
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
                        count: activeTask.actualHours ? `${activeTask.actualHours}h` : undefined,
                        badgeVariant: "default",
                      },
                      {
                        id: "activity",
                        label: "Activity History",
                        icon: <History className="w-3.5 h-3.5 text-warning" />,
                        count: isLoadingActivity || !isFetchedForCurrentTask ? undefined : activityLogs.length,
                        badgeVariant: "amber",
                      },
                      {
                        id: "notes",
                        label: "Linked Notes",
                        icon: <StickyNote className="w-3.5 h-3.5 text-notion-blue-fg" />,
                        count: isLoadingNotes ? (referencedNoteIds.length || undefined) : (totalNotesCount || undefined),
                        badgeVariant: "default",
                      },
                    ]}
                  />
                </div>

                {activeTab === "comments" && (
                  <CommentThread
                    taskId={activeTask.id}
                    comments={isFetchedForCurrentTask ? (fetchedTask?.comments ?? []) : []}
                    isLoadingTask={isTaskCommentsLoading}
                  />
                )}

                {activeTab === "test-sheet" && (
                  <TestSheetTab
                    taskId={activeTask.id}
                    taskTitle={activeTask.title}
                    canEdit={false}
                  />
                )}

                {activeTab === "time-logs" && (
                  <TaskTimeLogsTab
                    task={activeTask}
                    canEdit={canEdit}
                  />
                )}

                {activeTab === "activity" && (
                  <ActivityTimeline
                    entries={isFetchedForCurrentTask ? activityLogs : []}
                    isLoading={isLoadingActivity || !isFetchedForCurrentTask}
                  />
                )}

                {activeTab === "notes" && (
                  <TaskLinkedNotesTab
                    isLoading={isLoadingNotes}
                    notes={linkedNotes}
                    timeAgo={timeAgo}
                    taskDescription={activeTask.description}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-1 animate-modal-stagger-3 flex flex-col gap-4">
              <TaskTimeTrackingCard
                task={activeTask}
                canEdit={canEdit}
                onUpdateEstimatedHours={async (hours) => {
                  await updateTask({ id: activeTask.id, body: { estimatedHours: hours } as never }).unwrap();
                }}
                onViewTimeLogs={() => setActiveTab("time-logs")}
              />

              <TaskModalSidebar
                gitSuggestion={gitSuggestion}
                isAiGenerated={isAiGenerated}
                isGeneratingAi={isGeneratingBranch}
                onGenerateAi={undefined}
                assignedUsers={assignedUsers}
                reviewer={reviewer}
                reviewers={reviewers}
                assignedTeams={assignedTeams}
                currentClient={currentClient}
                product={activeTask.product}
                creator={creator}
                createdAt={activeTask.createdAt}
                updatedAt={activeTask.updatedAt}
                timeAgo={timeAgo}
                onClose={onClose}
              />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-border/80 bg-card flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {hasCopiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{hasCopiedLink ? "Link copied!" : "Share link"}</span>
            </Button>

            {gitSuggestion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(gitSuggestion.checkoutCmd);
                  toast.success("Checkout command copied to clipboard!");
                }}
                className="text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
              >
                <GitBranch className="w-3.5 h-3.5 text-primary" />
                <span>Copy git checkout</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hidden md:inline-flex"
            >
              <Link href={`/tasks/${activeTask.id}`} onClick={onClose}>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in page</span>
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="default"
              onClick={onClose}
              className="text-xs font-semibold rounded-md"
            >
              Close
            </Button>

            {canEdit && (
              <Button
                asChild
                size="default"
                onClick={onClose}
                className="text-xs font-semibold gap-2 rounded-md shadow-xs px-5"
              >
                <Link href={`/tasks/${activeTask.id}`}>
                  <Pencil className="w-4 h-4" />
                  <span>Edit Ticket</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
