import { Prisma } from "@prisma/client";
import { assertCan, can, ForbiddenError, NotFoundError, BadRequestError } from "@zsyio/auth/permissions";
import { taskRepository, TASK_INCLUDE, type TaskListFilters } from "@/server/repositories/task.repository";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import { prisma } from "@zsyio/database";
import { getActiveStorageProvider } from "@zsyio/auth/providers";
import { notificationService } from "@/server/services/notification.service";
import { generateGeminiBranchSlug } from "@/lib/ai/gemini-branch-helper";
import { isOwner, assertActingUserId } from "@/lib/task-access";
import type { CreateTaskInput, UpdateTaskInput, AssignTaskInput } from "@zsyio/validators";
import type { Session } from "next-auth";

// The session userId from NextAuth is already validated by requireUser().
// We trust it directly - no DB lookup needed on the happy path.
// Only falls back to email lookup if the session somehow lacks an id
// (edge case: OAuth provider didn't return a sub claim). If neither is
// available we reject rather than silently attributing the resulting
// activity-log entry to an arbitrary user.
async function resolveValidUserId(
  tx: Prisma.TransactionClient | typeof prisma,
  userId?: string,
  userEmail?: string | null
): Promise<string> {
  // Fast path: session has a userId - trust it, no DB round trip needed.
  if (userId) return userId;

  // Slow path (should be rare): no userId in session, fall back to email.
  if (userEmail) {
    const found = await tx.user.findUnique({ where: { email: userEmail }, select: { id: true } });
    if (found) return found.id;
  }
  return assertActingUserId(undefined);
}

async function syncTaskTeamsAndAssignees(
  tx: Prisma.TransactionClient,
  taskId: string,
  opts: { teamIds?: string[]; assigneeIds?: string[]; reviewerIds?: string[] }
) {
  if (opts.teamIds !== undefined) {
    const validTeams = opts.teamIds.length
      ? await tx.team.findMany({ where: { id: { in: opts.teamIds } }, select: { id: true } })
      : [];
    const validTeamIds = validTeams.map((t) => t.id);

    await tx.taskTeam.deleteMany({ where: { taskId } });
    if (validTeamIds.length > 0) {
      await tx.taskTeam.createMany({
        data: validTeamIds.map((teamId) => ({ taskId, teamId })),
        skipDuplicates: true,
      });
    }
  }

  if (opts.assigneeIds !== undefined) {
    const validUsers = opts.assigneeIds.length
      ? await tx.user.findMany({ where: { id: { in: opts.assigneeIds } }, select: { id: true } })
      : [];
    const validUserIds = validUsers.map((u) => u.id);

    await tx.taskAssignee.deleteMany({ where: { taskId } });
    if (validUserIds.length > 0) {
      await tx.taskAssignee.createMany({
        data: validUserIds.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      });
    }
  }

  if (opts.reviewerIds !== undefined) {
    const validUsers = opts.reviewerIds.length
      ? await tx.user.findMany({ where: { id: { in: opts.reviewerIds } }, select: { id: true } })
      : [];
    const validUserIds = validUsers.map((u) => u.id);

    await tx.taskReviewer.deleteMany({ where: { taskId } });
    if (validUserIds.length > 0) {
      await tx.taskReviewer.createMany({
        data: validUserIds.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      });
    }
  }
}

async function logAssignmentChanges(
  tx: Prisma.TransactionClient,
  taskId: string,
  actorId: string,
  changes: {
    assignedTo?: { changed: boolean; oldVal?: string | null; newVal?: string | null };
    reviewer?: { changed: boolean; oldVal?: string | null; newVal?: string | null };
    reviewers?: { changed: boolean; oldVal?: string[]; newVal?: string[] };
    assignedTeam?: { changed: boolean; oldVal?: string | null; newVal?: string | null };
    teams?: { changed: boolean; oldVal?: string[]; newVal?: string[] };
    assignees?: { changed: boolean; oldVal?: string[]; newVal?: string[] };
  }
) {
  const logs: Prisma.ActivityLogCreateManyInput[] = [];

  if (changes.assignedTo?.changed) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "assignedTo",
      oldValue: changes.assignedTo.oldVal || "none",
      newValue: changes.assignedTo.newVal || "none",
    });
  }
  if (changes.reviewer?.changed) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "reviewer",
      oldValue: changes.reviewer.oldVal || "none",
      newValue: changes.reviewer.newVal || "none",
    });
  }
  if (changes.reviewers?.changed && changes.reviewers.newVal) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "reviewers",
      oldValue: changes.reviewers.oldVal?.join(",") || "none",
      newValue: changes.reviewers.newVal.join(",") || "none",
    });
  }
  if (changes.assignedTeam?.changed) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "assignedTeam",
      oldValue: changes.assignedTeam.oldVal || "none",
      newValue: changes.assignedTeam.newVal || "none",
    });
  }
  if (changes.teams?.changed && changes.teams.newVal) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "teams",
      oldValue: changes.teams.oldVal?.join(",") || "none",
      newValue: changes.teams.newVal.join(",") || "none",
    });
  }
  if (changes.assignees?.changed && changes.assignees.newVal) {
    logs.push({
      taskId,
      actorId,
      action: "REASSIGNED",
      field: "assignees",
      oldValue: changes.assignees.oldVal?.join(",") || "none",
      newValue: changes.assignees.newVal.join(",") || "none",
    });
  }

  if (logs.length > 0) {
    await tx.activityLog.createMany({ data: logs });
  }
}

function assertCanManageAttachment(
  user: Session["user"],
  existing: NonNullable<Awaited<ReturnType<typeof taskRepository.findOwnershipInfo>>>
) {
  const owns = isOwner(user.id, existing);
  const canManageAttachment =
    can(user.role, "task:attachment:manage", user.permissions) ||
    can(user.role, "task:edit:any", user.permissions) ||
    (can(user.role, "task:edit:own", user.permissions) && owns);

  if (!canManageAttachment) {
    throw new ForbiddenError("You do not have permission to manage attachments on this task.");
  }
}


export const taskService = {
  async list(user: Session["user"], filters: Omit<TaskListFilters, "scopeToUserId">) {
    const scopeToUserId = can(user.role, "task:view:all", user.permissions) ? undefined : user.id;
    return taskRepository.list({ ...filters, scopeToUserId });
  },

  async getById(user: Session["user"], id: string) {
    const task = await taskRepository.findById(id);
    if (!task) return null;
    if (!can(user.role, "task:view:all", user.permissions) && !isOwner(user.id, task)) {
      throw new ForbiddenError("You can only view tasks you're assigned to.");
    }
    return task;
  },

  // Scoped to just the activity log - reuses the lightweight ownership-only
  // query instead of paying for the full TASK_INCLUDE graph (product/client,
  // every assignee's user row, comments, attachments) just to authorize.
  async getActivityLogs(user: Session["user"], id: string) {
    const task = await taskRepository.findOwnershipInfo(id);
    if (!task) return null;
    if (!can(user.role, "task:view:all", user.permissions) && !isOwner(user.id, task)) {
      throw new ForbiddenError("You can only view tasks you're assigned to.");
    }
    return taskRepository.findActivityLogs(id);
  },

  async create(user: Session["user"], input: CreateTaskInput) {
    const wantsAnyType =
      can(user.role, "task:create:any", user.permissions) ||
      can(user.role, "task:create", user.permissions);
    const wantsSupportOnly = can(user.role, "task:create:support", user.permissions);
    if (!wantsAnyType && !wantsSupportOnly) {
      throw new ForbiddenError("You are not permitted to create tasks.");
    }
    const type = wantsAnyType ? input.type : "SUPPORT_REQUEST";

    const effectiveReviewerIds = [
      ...(input.reviewerIds || []),
      ...(input.reviewerId ? [input.reviewerId] : []),
    ];
    const uniqueReviewerIds = Array.from(new Set(effectiveReviewerIds));
    const primaryReviewerId = uniqueReviewerIds[0] ?? input.reviewerId ?? null;

    const result = await prisma.$transaction(async (tx) => {
      const validActorId = await resolveValidUserId(tx, user.id, user.email);
      const task = await tx.task.create({
        data: {
          productId: input.productId,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          type,
          gitBranchSlug: input.gitBranchSlug || null,
          aiSummary: null,
          dueDate: input.dueDate,
          assignedToId: input.assignedToId,
          reviewerId: primaryReviewerId,
          assignedTeamId: input.assignedTeamId,
          createdById: validActorId,
          ...(input.assigneeIds?.length
            ? { assignees: { create: input.assigneeIds.map((userId) => ({ userId })) } }
            : {}),
          ...(uniqueReviewerIds.length
            ? { reviewers: { create: uniqueReviewerIds.map((userId) => ({ userId })) } }
            : {}),
          ...(input.teamIds?.length
            ? { teams: { create: input.teamIds.map((teamId) => ({ teamId })) } }
            : {}),
        },
      });
      if (input.attachments?.length) {
        await tx.attachment.createMany({
          data: input.attachments.map((att) => ({
            taskId: task.id,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileSize: att.fileSize,
          })),
        });
      }

      if (input.tags?.length) {
        for (const tagName of input.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          const tagRecord = await tx.taskTag.upsert({
            where: { name: trimmed },
            update: {},
            create: { name: trimmed },
          });
          await tx.taskTagAssignment.create({
            data: {
              taskId: task.id,
              tagId: tagRecord.id,
            },
          });
        }
      }

      await tx.activityLog.create({
        data: { taskId: task.id, actorId: validActorId, action: "CREATED" },
      });
      return { task, validActorId };
    }, { maxWait: 10000, timeout: 25000 });

    if (!input.gitBranchSlug) {
      // Fire-and-forget: generateGeminiBranchSlug already swallows its own
      // errors via .catch() below, and the trailing .catch() here covers the
      // subsequent prisma update too - no outer try/catch needed.
      generateGeminiBranchSlug({
        title: input.title,
        description: input.description,
        type,
      })
        .then(async (slugResult) => {
          if (slugResult?.slug) {
            await prisma.task.update({
              where: { id: result.task.id },
              data: { gitBranchSlug: slugResult.slug },
            });
          }
        })
        .catch((err) => {
          console.error("Background AI branch generation error on task create:", err);
        });
    }

    const targetAssignees = [
      ...(input.assignedToId ? [input.assignedToId] : []),
      ...(input.assigneeIds || []),
    ];
    const targetTeams = [
      ...(input.assignedTeamId ? [input.assignedTeamId] : []),
      ...(input.teamIds || []),
    ];

    if (targetAssignees.length > 0 || targetTeams.length > 0) {
      notificationService.notifyTaskAssigned({
        taskId: result.task.id,
        taskTitle: result.task.title,
        assigneeUserIds: targetAssignees,
        teamIds: targetTeams,
        actorId: result.validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Notification error:", e));
    }

    if (uniqueReviewerIds.length > 0) {
      notificationService.notifyReviewersAssigned({
        taskId: result.task.id,
        taskTitle: result.task.title,
        reviewerIds: uniqueReviewerIds,
        actorId: result.validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Reviewer notification error:", e));
    }

    if (input.description) {
      notificationService.notifyMentions({
        text: input.description,
        sourceTitle: input.title,
        link: `/tasks?taskId=${result.task.id}`,
        actorId: result.validActorId,
        actorName: user.name || "A team member",
        taskId: result.task.id,
      }).catch((e) => console.error("Mention notification error:", e));
    }

    return result.task;
  },

  async update(user: Session["user"], id: string, input: UpdateTaskInput) {
    const existing = await taskRepository.findOwnershipInfo(id);
    if (!existing) throw new ForbiddenError("Task not found.");

    const owns = isOwner(user.id, existing);
    if (!can(user.role, "task:edit:any", user.permissions) && !(can(user.role, "task:edit:own", user.permissions) && owns)) {
      throw new ForbiddenError("You are not permitted to edit this task.");
    }

    const { teamIds, assigneeIds, reviewerIds, tags, ...scalarInput } = input;
    const statusChanged = !!input.status && input.status !== existing.status;
    const priorityChanged = !!input.priority && input.priority !== existing.priority;
    const typeChanged = !!input.type && input.type !== existing.type;
    const titleChanged = input.title !== undefined && input.title.trim() !== existing.title;
    const descriptionChanged =
      input.description !== undefined &&
      (input.description?.trim() || null) !== (existing.description?.trim() || null);

    const oldDueStr = existing.dueDate ? new Date(existing.dueDate).toISOString().split("T")[0] : null;
    const newDueStr = input.dueDate ? new Date(input.dueDate).toISOString().split("T")[0] : null;
    const dueDateChanged = input.dueDate !== undefined && oldDueStr !== newDueStr;

    if (dueDateChanged) {
      const reason = input.dueDateReason?.trim() || input.changeReason?.trim();
      if (!reason) {
        throw new BadRequestError("A reason is required when changing the due date.");
      }
    }

    const blockedReasonChanged =
      input.blockedReason !== undefined &&
      (input.blockedReason?.trim() || null) !== (existing.blockedReason?.trim() || null);

    const assignedToChanged =
      input.assignedToId !== undefined &&
      (input.assignedToId || null) !== (existing.assignedToId || null);

    const oldReviewerIds = (existing.reviewers || []).map((r) => r.userId).sort();
    const cleanReviewerIds = reviewerIds !== undefined
      ? reviewerIds.filter((uid): uid is string => Boolean(uid && !uid.startsWith("opt-"))).sort()
      : undefined;
    const reviewersChanged = cleanReviewerIds !== undefined && oldReviewerIds.join(",") !== cleanReviewerIds.join(",");

    const primaryReviewerId = cleanReviewerIds !== undefined
      ? (cleanReviewerIds[0] ?? null)
      : input.reviewerId;

    if (primaryReviewerId !== undefined) {
      (scalarInput as Record<string, unknown>).reviewerId = primaryReviewerId;
    }

    if (input.dueDateReason !== undefined) {
      (scalarInput as Record<string, unknown>).dueDateReason = input.dueDateReason?.trim() || null;
    }
    if (input.changeReason !== undefined) {
      (scalarInput as Record<string, unknown>).changeReason = input.changeReason?.trim() || null;
    }

    const reviewerChanged =
      primaryReviewerId !== undefined &&
      (primaryReviewerId || null) !== (existing.reviewerId || null);

    const assignedTeamChanged =
      input.assignedTeamId !== undefined &&
      (input.assignedTeamId || null) !== (existing.assignedTeamId || null);

    const oldTeamIds = (existing.teams || []).map((t) => t.teamId).sort();
    const cleanTeamIds = teamIds !== undefined
      ? teamIds.filter((tid): tid is string => Boolean(tid && !tid.startsWith("opt-"))).sort()
      : undefined;
    const teamsChanged = cleanTeamIds !== undefined && oldTeamIds.join(",") !== cleanTeamIds.join(",");

    const oldAssigneeIds = (existing.assignees || []).map((a) => a.userId).sort();
    const cleanAssigneeIds = assigneeIds !== undefined
      ? assigneeIds.filter((uid): uid is string => Boolean(uid && !uid.startsWith("opt-"))).sort()
      : undefined;
    const assigneesChanged = cleanAssigneeIds !== undefined && oldAssigneeIds.join(",") !== cleanAssigneeIds.join(",");

    // Handle AI summary changes without blocking the update HTTP response (~20ms vs ~2.5s)
    const needsSummaryRegen = input.title !== undefined || input.description !== undefined;
    const effectiveDescription = input.description !== undefined ? input.description : existing.description;

    if (needsSummaryRegen) {
      if (!effectiveDescription || !effectiveDescription.trim()) {
        (scalarInput as Record<string, unknown>).aiSummary = null;
      }
    }

    // PMS-1: Resolve confirmed actor ID before opening transaction
    const validActorId = await resolveValidUserId(prisma, user.id, user.email);

    const task = await prisma.$transaction(async (tx) => {
      await syncTaskTeamsAndAssignees(tx, id, {
        teamIds: cleanTeamIds,
        assigneeIds: cleanAssigneeIds,
        reviewerIds: cleanReviewerIds,
      });

      if (tags !== undefined) {
        await tx.taskTagAssignment.deleteMany({ where: { taskId: id } });
        for (const tagName of tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          const tagRecord = await tx.taskTag.upsert({
            where: { name: trimmed },
            update: {},
            create: { name: trimmed },
          });
          await tx.taskTagAssignment.create({
            data: { taskId: id, tagId: tagRecord.id },
          });
        }
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: scalarInput,
        include: TASK_INCLUDE,
      });

      const activityLogsToCreate: Prisma.ActivityLogCreateManyInput[] = [];

      if (statusChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "STATUS_CHANGED",
          field: "status",
          oldValue: existing.status,
          newValue: input.status,
          reason: input.changeReason?.trim() || null,
        });
      }
      if (priorityChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "priority",
          oldValue: existing.priority,
          newValue: input.priority,
          reason: input.changeReason?.trim() || null,
        });
      }
      if (typeChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "type",
          oldValue: existing.type,
          newValue: input.type,
          reason: input.changeReason?.trim() || null,
        });
      }
      if (titleChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "title",
          oldValue: existing.title,
          newValue: input.title!.trim(),
          reason: input.changeReason?.trim() || null,
        });
      }
      if (descriptionChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "description",
          oldValue: existing.description ? "Updated description" : "None",
          newValue: input.description?.trim() ? "Updated description" : "None",
          reason: input.changeReason?.trim() || null,
        });
      }
      if (dueDateChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "dueDate",
          oldValue: oldDueStr || "none",
          newValue: newDueStr || "none",
          reason: input.dueDateReason?.trim() || input.changeReason?.trim() || null,
        });
      }
      if (blockedReasonChanged) {
        activityLogsToCreate.push({
          taskId: id,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "blockedReason",
          oldValue: existing.blockedReason || "none",
          newValue: input.blockedReason?.trim() || "none",
          reason: input.changeReason?.trim() || null,
        });
      }

      if (activityLogsToCreate.length > 0) {
        await tx.activityLog.createMany({ data: activityLogsToCreate });
      }

      await logAssignmentChanges(tx, id, validActorId, {
        assignedTo: { changed: assignedToChanged, oldVal: existing.assignedToId, newVal: input.assignedToId },
        reviewer: { changed: reviewerChanged, oldVal: existing.reviewerId, newVal: primaryReviewerId },
        reviewers: { changed: reviewersChanged, oldVal: oldReviewerIds, newVal: cleanReviewerIds },
        assignedTeam: { changed: assignedTeamChanged, oldVal: existing.assignedTeamId, newVal: input.assignedTeamId },
        teams: { changed: teamsChanged, oldVal: oldTeamIds, newVal: cleanTeamIds },
        assignees: { changed: assigneesChanged, oldVal: oldAssigneeIds, newVal: cleanAssigneeIds },
      });
      return updatedTask;
    }, { maxWait: 10000, timeout: 25000 });

    if (statusChanged && input.status) {
      const recipientIds = [
        ...(task.assignedToId ? [task.assignedToId] : []),
        ...(task.assignees?.map((a) => a.userId) || []),
      ];
      notificationService.notifyStatusChanged({
        taskId: task.id,
        taskTitle: task.title,
        oldStatus: existing.status,
        newStatus: input.status,
        actorId: validActorId,
        actorName: user.name || "A team member",
        recipientUserIds: recipientIds,
      }).catch((e) => console.error("Status notification error:", e));
    }

    const hasNewAssignee = input.assignedToId && input.assignedToId !== existing.assignedToId;
    // Compute the diff: only teams that weren't previously assigned need notifications.
    // Sending teamIds (full list) was causing re-notifications to members of unchanged teams.
    const newlyAddedTeamIds = cleanTeamIds
      ? cleanTeamIds.filter((tid) => !oldTeamIds.includes(tid))
      : [];
    const hasNewTeams = newlyAddedTeamIds.length > 0;

    if (hasNewAssignee || hasNewTeams) {
      notificationService.notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assigneeUserIds: hasNewAssignee && input.assignedToId ? [input.assignedToId] : [],
        teamIds: hasNewTeams ? newlyAddedTeamIds : [],
        actorId: validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Assignment notification error:", e));
    }

    const newlyAddedReviewers = cleanReviewerIds
      ? cleanReviewerIds.filter((uid) => !oldReviewerIds.includes(uid))
      : (primaryReviewerId && primaryReviewerId !== existing.reviewerId ? [primaryReviewerId] : []);

    if (newlyAddedReviewers.length > 0) {
      notificationService.notifyReviewersAssigned({
        taskId: task.id,
        taskTitle: task.title,
        reviewerIds: newlyAddedReviewers,
        actorId: validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Reviewers notification error:", e));
    }

    // PMS-7: Use trimmed descriptionChanged check rather than raw input.description
    if (descriptionChanged && input.description) {
      notificationService.notifyMentions({
        text: input.description,
        sourceTitle: task.title,
        link: `/tasks?taskId=${task.id}`,
        actorId: validActorId,
        actorName: user.name || "A team member",
        taskId: task.id,
      }).catch((e) => console.error("Mention notification error:", e));
    }

    return task;
  },

  async reassign(user: Session["user"], id: string, input: AssignTaskInput) {
    const hasGlobalEdit = can(user.role, "task:edit:any", user.permissions);
    const existing = await taskRepository.findOwnershipInfo(id);
    if (!existing) throw new ForbiddenError("Task not found.");

    if (!hasGlobalEdit) {
      const owns = isOwner(user.id, existing);
      if (!can(user.role, "task:edit:own", user.permissions) || !owns) {
        throw new ForbiddenError("You are not permitted to reassign this task.");
      }
    }

    const ownerChanged =
      input.assignedToId !== undefined &&
      (input.assignedToId || null) !== (existing.assignedToId || null);

    const oldReviewerIds = (existing.reviewers || []).map((r) => r.userId).sort();
    const cleanReviewerIds = input.reviewerIds !== undefined
      ? input.reviewerIds.filter(
          (uid): uid is string => Boolean(uid && typeof uid === "string" && !uid.startsWith("opt-"))
        ).sort()
      : undefined;
    const reviewersChanged = cleanReviewerIds !== undefined && oldReviewerIds.join(",") !== cleanReviewerIds.join(",");

    const primaryReviewerId = cleanReviewerIds !== undefined
      ? (cleanReviewerIds[0] ?? null)
      : input.reviewerId;

    const reviewerChanged =
      primaryReviewerId !== undefined &&
      (primaryReviewerId || null) !== (existing.reviewerId || null);

    const teamChanged =
      input.assignedTeamId !== undefined &&
      (input.assignedTeamId || null) !== (existing.assignedTeamId || null);

    const oldAssigneeIds = (existing.assignees || []).map((a) => a.userId).sort();
    const cleanUserIds = input.assigneeIds !== undefined
      ? input.assigneeIds.filter(
          (uid): uid is string => Boolean(uid && typeof uid === "string" && !uid.startsWith("opt-"))
        ).sort()
      : undefined;
    const assigneesChanged = cleanUserIds !== undefined && oldAssigneeIds.join(",") !== cleanUserIds.join(",");

    const oldTeamIds = (existing.teams || []).map((t) => t.teamId).sort();
    const cleanTeamIds = input.teamIds !== undefined
      ? input.teamIds.filter(
          (tid): tid is string => Boolean(tid && typeof tid === "string" && !tid.startsWith("opt-"))
        ).sort()
      : undefined;
    const teamsChanged = cleanTeamIds !== undefined && oldTeamIds.join(",") !== cleanTeamIds.join(",");

    let validActorId = user.id;

    const task = await prisma.$transaction(async (tx) => {
      await syncTaskTeamsAndAssignees(tx, id, {
        teamIds: cleanTeamIds,
        assigneeIds: cleanUserIds,
        reviewerIds: cleanReviewerIds,
      });

      const dataToUpdate: Prisma.TaskUpdateInput = {};
      if (input.assignedToId !== undefined) {
        dataToUpdate.assignedTo = input.assignedToId
          ? { connect: { id: input.assignedToId } }
          : { disconnect: true };
      }
      if (primaryReviewerId !== undefined) {
        dataToUpdate.reviewer = primaryReviewerId
          ? { connect: { id: primaryReviewerId } }
          : { disconnect: true };
      }
      if (input.assignedTeamId !== undefined) {
        dataToUpdate.assignedTeam = input.assignedTeamId
          ? { connect: { id: input.assignedTeamId } }
          : { disconnect: true };
      }

      const updatedTask = await tx.task.update({
        where: { id },
        data: dataToUpdate,
        include: TASK_INCLUDE,
      });

      validActorId = await resolveValidUserId(tx, user.id, user.email);

      await logAssignmentChanges(tx, id, validActorId, {
        assignedTo: { changed: ownerChanged, oldVal: existing.assignedToId, newVal: input.assignedToId },
        reviewer: { changed: reviewerChanged, oldVal: existing.reviewerId, newVal: primaryReviewerId },
        reviewers: { changed: reviewersChanged, oldVal: oldReviewerIds, newVal: cleanReviewerIds },
        assignedTeam: { changed: teamChanged, oldVal: existing.assignedTeamId, newVal: input.assignedTeamId },
        assignees: { changed: assigneesChanged, oldVal: oldAssigneeIds, newVal: cleanUserIds },
        teams: { changed: teamsChanged, oldVal: oldTeamIds, newVal: cleanTeamIds },
      });
      return updatedTask;
    }, { maxWait: 10000, timeout: 25000 });

    const newAssigneeIds = [
      ...(input.assignedToId ? [input.assignedToId] : []),
      ...(input.assigneeIds || []),
    ];
    const newTeamIds = [
      ...(input.assignedTeamId ? [input.assignedTeamId] : []),
      ...(input.teamIds || []),
    ];

    if (newAssigneeIds.length > 0 || newTeamIds.length > 0) {
      notificationService.notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assigneeUserIds: newAssigneeIds,
        teamIds: newTeamIds,
        actorId: validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Reassign notification error:", e));
    }

    const newlyAddedReviewers = cleanReviewerIds
      ? cleanReviewerIds.filter((uid) => !oldReviewerIds.includes(uid))
      : (primaryReviewerId && primaryReviewerId !== existing.reviewerId ? [primaryReviewerId] : []);

    if (newlyAddedReviewers.length > 0) {
      notificationService.notifyReviewersAssigned({
        taskId: task.id,
        taskTitle: task.title,
        reviewerIds: newlyAddedReviewers,
        actorId: validActorId,
        actorName: user.name || "A team member",
      }).catch((e) => console.error("Reassign reviewers notification error:", e));
    }

    return task;
  },

  async addComment(user: Session["user"], taskId: string, body: string, parentId?: string | null) {
    const existing = await taskRepository.findOwnershipInfo(taskId);
    if (!existing) throw new ForbiddenError("Task not found.");
    if (!can(user.role, "task:view:all", user.permissions) && !isOwner(user.id, existing)) {
      throw new ForbiddenError("You can only comment on tasks you're assigned to.");
    }

    let parentAuthorId: string | null = null;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });
      parentAuthorId = parentComment?.authorId || null;
    }

    let validActorId = user.id;

    const comment = await prisma.$transaction(
      async (tx) => {
        validActorId = await resolveValidUserId(tx, user.id, user.email);
        const createdComment = await tx.comment.create({
          data: { taskId, authorId: validActorId, body, parentId: parentId || null },
          include: { author: { select: SAFE_USER_SELECT } },
        });
        await tx.activityLog.create({
          data: { taskId, actorId: validActorId, action: "COMMENTED" },
        });
        return createdComment;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    const taskAssignees = [
      ...(existing.assignedToId ? [existing.assignedToId] : []),
      ...(existing.assignees?.map((a) => a.userId) || []),
    ];

    notificationService.notifyCommentAdded({
      taskId,
      taskTitle: existing.title,
      commentId: comment.id,
      commentBody: body,
      actorId: validActorId,
      actorName: user.name || "A team member",
      parentAuthorId,
      taskAssigneeIds: taskAssignees,
    }).catch((e) => console.error("Comment notification error:", e));

    return comment;
  },

  async addAttachment(
    user: Session["user"],
    taskId: string,
    input: { fileName: string; fileSize: number; fileUrl?: string }
  ) {
    const existing = await taskRepository.findOwnershipInfo(taskId);
    if (!existing) throw new NotFoundError("Task not found.");

    assertCanManageAttachment(user, existing);

    let finalUrl = input.fileUrl;
    let uploadUrl = "";

    if (!finalUrl) {
      const storage = await getActiveStorageProvider().getUploadUrl(input.fileName, input.fileSize);
      uploadUrl = storage.url;
      finalUrl = storage.fileUrl;
    }

    let validActorId = user.id;

    const attachment = await prisma.$transaction(
      async (tx) => {
        validActorId = await resolveValidUserId(tx, user.id, user.email);
        const created = await tx.attachment.create({
          data: {
            taskId,
            fileName: input.fileName,
            fileUrl: finalUrl!,
            fileSize: input.fileSize,
          },
        });

        await tx.activityLog.create({
          data: {
            taskId,
            actorId: validActorId,
            action: "ATTACHMENT_ADDED",
            newValue: input.fileName,
          },
        });

        return created;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    return { uploadUrl, attachment };
  },

  async deleteAttachment(
    user: Session["user"],
    taskId: string,
    attachmentId: string
  ) {
    const existing = await taskRepository.findOwnershipInfo(taskId);
    if (!existing) throw new NotFoundError("Task not found.");

    assertCanManageAttachment(user, existing);

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, taskId },
    });

    if (!attachment) {
      throw new NotFoundError("Attachment not found.");
    }

    return prisma.$transaction(
      async (tx) => {
        const validActorId = await resolveValidUserId(tx, user.id, user.email);
        await tx.attachment.delete({
          where: { id: attachmentId },
        });

        await tx.activityLog.create({
          data: {
            taskId,
            actorId: validActorId,
            action: "ATTACHMENT_REMOVED",
            field: "attachment",
            oldValue: attachment.fileName,
          },
        });

        return { success: true };
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );
  },

  async softDelete(user: Session["user"], id: string) {
    assertCan(user.role, "task:delete", user.permissions);
    return prisma.$transaction(
      async (tx) => {
        const validActorId = await resolveValidUserId(tx, user.id, user.email);
        const updated = await tx.task.update({ where: { id }, data: { deletedAt: new Date() } });
        await tx.activityLog.create({ data: { taskId: id, actorId: validActorId, action: "DELETED" } });
        return updated;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );
  },
};
