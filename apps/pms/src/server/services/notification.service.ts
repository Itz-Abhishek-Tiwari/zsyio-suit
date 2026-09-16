import { prisma } from "@zsyio/database";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  taskId?: string | null;
  commentId?: string | null;
  noteId?: string | null;
}

function cleanNotificationPreview(text: string): string {
  if (!text) return "";
  return text
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
    .replace(/@\[([^\]]+)\]/g, "@$1")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const notificationService = {
  /**
   * Fetch or initialize default notification preferences for a user
   */
  async getPreferences(userId: string) {
    const existing = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return prisma.notificationPreference.create({
      data: {
        userId,
        taskAssigned: true,
        statusChanged: true,
        mentions: true,
        comments: true,
        dueDateReminders: true,
        dashboardNotes: true,
        inAppToasts: true,
        browserNotifications: true,
        browserSound: true,
      },
    });
  },

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(
    userId: string,
    data: {
      taskAssigned?: boolean;
      statusChanged?: boolean;
      mentions?: boolean;
      comments?: boolean;
      dueDateReminders?: boolean;
      dashboardNotes?: boolean;
      inAppToasts?: boolean;
      browserNotifications?: boolean;
      browserSound?: boolean;
    }
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  },

  /**
   * Create a single notification with preference checking & self-notification filtering
   */
  async createNotification(params: CreateNotificationParams) {
    // Avoid sending notification to the actor themselves for automated status/comment/assignment events,
    // but ALLOW explicit self-mentions when someone tags @themselves in a comment/note
    if (params.actorId && params.actorId === params.userId && params.type !== "MENTIONED") {
      return null;
    }



    try {
      const pref = await this.getPreferences(params.userId);

      if (params.type === "TASK_ASSIGNED" && !pref.taskAssigned) return null;
      if (params.type === "STATUS_CHANGED" && !pref.statusChanged) return null;
      if (params.type === "MENTIONED" && !pref.mentions) return null;
      if (params.type === "COMMENT_ADDED" && !pref.comments) return null;
      if (params.type === "DUE_DATE_REMINDER" && !pref.dueDateReminders) return null;
      if (params.type === "NOTE_ADDED" && !pref.dashboardNotes) return null;

      // Deduplication: skip if an identical notification was sent in the last 15 seconds.
      // Prevents duplicate toast/notification storms from rapid double-clicks or transient retries
      // while allowing distinct subsequent comments, status changes, and collaborator replies through.
      const DEDUP_TYPES: (typeof params.type)[] = [
        "COMMENT_ADDED",
        "STATUS_CHANGED",
        "TASK_ASSIGNED",
      ];
      if (DEDUP_TYPES.includes(params.type) && params.taskId) {
        const deduplicationWindow = new Date(Date.now() - 15 * 1000);
        const recent = await prisma.notification.findFirst({
          where: {
            userId: params.userId,
            type: params.type,
            taskId: params.taskId,
            actorId: params.actorId || null,
            title: params.title,
            createdAt: { gte: deduplicationWindow },
          },
          select: { id: true },
        });
        if (recent) return null; // Silently deduplicated
      }

      return await prisma.notification.create({
        data: {
          userId: params.userId,
          actorId: params.actorId || null,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link || null,
          taskId: params.taskId || null,
          commentId: params.commentId || null,
          noteId: params.noteId || null,
        },
      });
    } catch (error) {
      console.error("[NotificationService] Failed to create notification:", error);
      return null;
    }
  },

  /**
   * Create multiple notifications efficiently in bulk with single-query preference checks
   */
  async createNotificationsBatch(items: CreateNotificationParams[]) {
    if (!items.length) return [];

    const validItems = items.filter(
      (p) => !(p.actorId && p.actorId === p.userId && p.type !== "MENTIONED")
    );
    if (!validItems.length) return [];

    try {
      const userIds = Array.from(new Set(validItems.map((p) => p.userId)));

      const preferences = await prisma.notificationPreference.findMany({
        where: { userId: { in: userIds } },
      });
      const prefMap = new Map(preferences.map((p) => [p.userId, p]));

      const allowedItems = validItems.filter((params) => {
        const pref = prefMap.get(params.userId);
        if (!pref) return true; // default enabled
        if (params.type === "TASK_ASSIGNED" && !pref.taskAssigned) return false;
        if (params.type === "STATUS_CHANGED" && !pref.statusChanged) return false;
        if (params.type === "MENTIONED" && !pref.mentions) return false;
        if (params.type === "COMMENT_ADDED" && !pref.comments) return false;
        if (params.type === "DUE_DATE_REMINDER" && !pref.dueDateReminders) return false;
        if (params.type === "NOTE_ADDED" && !pref.dashboardNotes) return false;
        return true;
      });

      if (!allowedItems.length) return [];

      await prisma.notification.createMany({
        data: allowedItems.map((p) => ({
          userId: p.userId,
          actorId: p.actorId || null,
          type: p.type,
          title: p.title,
          message: p.message,
          link: p.link || null,
          taskId: p.taskId || null,
          commentId: p.commentId || null,
          noteId: p.noteId || null,
        })),
        skipDuplicates: true,
      });

      return allowedItems;
    } catch (error) {
      console.error("[NotificationService] Failed to create notifications batch:", error);
      return [];
    }
  },

  /**
   * Parse @mentions from text and return unique valid user IDs mentioned.
   * Matches @[Name](userId), @[Name], @"Full Name", and @name.
   * Cross-checks existing database users by ID, name, or email.
   */
  async extractMentionedUserIds(text: string): Promise<string[]> {
    if (!text || !text.includes("@")) return [];

    const mentionedIds = new Set<string>();
    const namesToLookup = new Set<string>();
    const explicitIdsToVerify = new Set<string>();

    const explicitRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = explicitRegex.exec(text)) !== null) {
      const name = match[1]?.trim();
      const id = match[2]?.trim();
      if (id) explicitIdsToVerify.add(id);
      if (name) namesToLookup.add(name);
    }

    const bracketedNameRegex = /@\[([^\]]+)\](?!\()/g;
    while ((match = bracketedNameRegex.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (name) namesToLookup.add(name);
    }

    const nameMentionRegex = /@("([^"]+)"|([a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?))/g;
    while ((match = nameMentionRegex.exec(text)) !== null) {
      const cleanName = (match[2] || match[3] || "").trim();
      if (cleanName && !cleanName.startsWith("[")) {
        namesToLookup.add(cleanName);
      }
    }

    if (explicitIdsToVerify.size > 0) {
      const validUsersById = await prisma.user.findMany({
        where: { id: { in: Array.from(explicitIdsToVerify) } },
        select: { id: true },
      });
      for (const u of validUsersById) {
        mentionedIds.add(u.id);
      }
    }

    if (namesToLookup.size > 0) {
      const namesList = Array.from(namesToLookup).filter((n) => n.length >= 2);
      if (namesList.length > 0) {
        const usersByName = await prisma.user.findMany({
          where: {
            OR: namesList.flatMap((n) => [
              { name: { equals: n, mode: "insensitive" } },
              { email: { equals: n, mode: "insensitive" } },
              { email: { startsWith: `${n}@`, mode: "insensitive" } },
              { name: { startsWith: `${n} `, mode: "insensitive" } },
            ]),
          },
          select: { id: true, name: true, email: true },
        });

        for (const u of usersByName) {
          mentionedIds.add(u.id);
        }
      }
    }

    return Array.from(mentionedIds);
  },


  /**
   * Notify users tagged via @mentions
   */
  async notifyMentions({
    text,
    sourceTitle,
    link,
    actorId,
    actorName,
    taskId,
    noteId,
  }: {
    text: string;
    sourceTitle: string;
    link?: string;
    actorId: string;
    actorName: string;
    taskId?: string;
    noteId?: string;
  }) {
    const mentionedUserIds = await this.extractMentionedUserIds(text);
    if (!mentionedUserIds.length) return [];

    const cleanText = cleanNotificationPreview(text);
    const preview = cleanText.slice(0, 120);

    const items: CreateNotificationParams[] = mentionedUserIds.map((targetUserId) => {
      const isSelf = targetUserId === actorId;
      return {
        userId: targetUserId,
        actorId,
        type: "MENTIONED",
        title: isSelf ? "You mentioned yourself" : `${actorName} mentioned you`,
        message: `In "${sourceTitle}": "${preview}${cleanText.length > 120 ? "..." : ""}"`,
        link: link || (taskId ? `/tasks?taskId=${taskId}` : "/"),
        taskId,
        noteId,
      };
    });

    return this.createNotificationsBatch(items);
  },

  /**
   * Notify users and team members assigned to a task
   */
  async notifyTaskAssigned({
    taskId,
    taskTitle,
    assigneeUserIds = [],
    teamIds = [],
    actorId,
    actorName,
  }: {
    taskId: string;
    taskTitle: string;
    assigneeUserIds?: string[];
    teamIds?: string[];
    actorId: string;
    actorName: string;
  }) {
    const directUserIds = Array.from(new Set(assigneeUserIds)).filter((id) => id && id !== actorId);
    const notificationItems: CreateNotificationParams[] = [];

    for (const userId of directUserIds) {
      notificationItems.push({
        userId,
        actorId,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `${actorName} assigned you to "${taskTitle}".`,
        link: `/tasks?taskId=${taskId}`,
        taskId,
      });
    }

    const cleanTeamIds = Array.from(new Set(teamIds)).filter(Boolean);
    if (cleanTeamIds.length > 0) {
      const teamsWithMembers = await prisma.team.findMany({
        where: { id: { in: cleanTeamIds } },
        include: {
          members: {
            select: { userId: true },
          },
        },
      });

      const notifiedUserIds = new Set(directUserIds);
      if (actorId) notifiedUserIds.add(actorId);

      for (const team of teamsWithMembers) {
        for (const member of team.members) {
          if (!notifiedUserIds.has(member.userId)) {
            notifiedUserIds.add(member.userId);
            notificationItems.push({
              userId: member.userId,
              actorId,
              type: "TASK_ASSIGNED",
              title: "Task Assigned to Your Team",
              message: `${actorName} assigned "${taskTitle}" to ${team.name}.`,
              link: `/tasks?taskId=${taskId}`,
              taskId,
            });
          }
        }
      }
    }

    return this.createNotificationsBatch(notificationItems);
  },

  /**
   * Notify user assigned as reviewer on a task
   */
  async notifyReviewerAssigned({
    taskId,
    taskTitle,
    reviewerId,
    actorId,
    actorName,
  }: {
    taskId: string;
    taskTitle: string;
    reviewerId: string;
    actorId: string;
    actorName: string;
  }) {
    if (!reviewerId || reviewerId === actorId) return null;
    return this.createNotification({
      userId: reviewerId,
      actorId,
      type: "TASK_ASSIGNED",
      title: "Assigned as Reviewer",
      message: `${actorName} assigned you as reviewer on "${taskTitle}".`,
      link: `/tasks?taskId=${taskId}`,
      taskId,
    });
  },

  /**
   * Notify users assigned as reviewers on a task
   */
  async notifyReviewersAssigned({
    taskId,
    taskTitle,
    reviewerIds,
    actorId,
    actorName,
  }: {
    taskId: string;
    taskTitle: string;
    reviewerIds: string[];
    actorId: string;
    actorName: string;
  }) {
    const validIds = reviewerIds.filter((id) => Boolean(id && id !== actorId));
    if (validIds.length === 0) return [];
    const notificationItems: Array<Parameters<typeof this.createNotification>[0]> = validIds.map((userId) => ({
      userId,
      actorId,
      type: "TASK_ASSIGNED",
      title: "Assigned as Reviewer",
      message: `${actorName} assigned you as reviewer on "${taskTitle}".`,
      link: `/tasks?taskId=${taskId}`,
      taskId,
    }));
    return this.createNotificationsBatch(notificationItems);
  },

  /**
   * Notify assignees & watchers when a task status changes
   */
  async notifyStatusChanged({
    taskId,
    taskTitle,
    oldStatus,
    newStatus,
    actorId,
    actorName,
    recipientUserIds,
  }: {
    taskId: string;
    taskTitle: string;
    oldStatus: string;
    newStatus: string;
    actorId: string;
    actorName: string;
    recipientUserIds: string[];
  }) {
    const uniqueRecipients = Array.from(new Set(recipientUserIds)).filter(
      (id) => id && id !== actorId
    );
    if (!uniqueRecipients.length) return [];

    const items: CreateNotificationParams[] = uniqueRecipients.map((userId) => ({
      userId,
      actorId,
      type: "STATUS_CHANGED",
      title: "Task Status Updated",
      message: `${actorName} moved "${taskTitle}" from ${oldStatus} to ${newStatus}.`,
      link: `/tasks?taskId=${taskId}`,
      taskId,
    }));

    return this.createNotificationsBatch(items);
  },

  /**
   * Notify assignees/watchers/parent author when a comment is added
   */
  async notifyCommentAdded({
    taskId,
    taskTitle,
    commentId,
    commentBody,
    actorId,
    actorName,
    parentAuthorId,
    taskAssigneeIds,
  }: {
    taskId: string;
    taskTitle: string;
    commentId: string;
    commentBody: string;
    actorId: string;
    actorName: string;
    parentAuthorId?: string | null;
    taskAssigneeIds: string[];
  }) {
    await this.notifyMentions({
      text: commentBody,
      sourceTitle: taskTitle,
      link: `/tasks?taskId=${taskId}`,
      actorId,
      actorName,
      taskId,
    });

    const recipients = new Set<string>();
    if (parentAuthorId && parentAuthorId !== actorId) {
      recipients.add(parentAuthorId);
    }
    taskAssigneeIds.forEach((uid) => {
      if (uid && uid !== actorId) recipients.add(uid);
    });

    const cleanComment = cleanNotificationPreview(commentBody);
    const preview = cleanComment.slice(0, 100);

    const items: CreateNotificationParams[] = Array.from(recipients).map((userId) => ({
      userId,
      actorId,
      type: "COMMENT_ADDED",
      title: parentAuthorId === userId ? `${actorName} replied to your comment` : `New comment on "${taskTitle}"`,
      message: `${actorName}: "${preview}${cleanComment.length > 100 ? "..." : ""}"`,
      link: `/tasks?taskId=${taskId}`,
      taskId,
      commentId,
    }));

    return this.createNotificationsBatch(items);
  },

  /**
   * Notify team members or workspace users when a Dashboard Note or Announcement is posted
   */
  async notifyNoteCreated({
    noteId,
    content,
    isPersonal,
    targetAll,
    targetUserIds = [],
    targetTeamIds = [],
    clientId,
    clientName,
    actorId,
    actorName,
  }: {
    noteId: string;
    content: string;
    isPersonal: boolean;
    targetAll: boolean;
    targetUserIds?: string[];
    targetTeamIds?: string[];
    clientId?: string | null;
    clientName?: string | null;
    actorId: string;
    actorName: string;
  }) {
    if (isPersonal) return [];

    const recipientIds = new Set<string>();

    if (targetAll) {
      const allActiveUsers = await prisma.user.findMany({
        where: { active: true, id: { not: actorId } },
        select: { id: true },
      });
      allActiveUsers.forEach((u) => recipientIds.add(u.id));
    } else {
      targetUserIds.forEach((uid) => {
        if (uid && uid !== actorId) recipientIds.add(uid);
      });

      if (targetTeamIds.length > 0) {
        const teamMembers = await prisma.teamMember.findMany({
          where: { teamId: { in: targetTeamIds } },
          select: { userId: true },
        });
        teamMembers.forEach((tm) => {
          if (tm.userId && tm.userId !== actorId) recipientIds.add(tm.userId);
        });
      }
    }

    if (!recipientIds.size) return [];

    const noteTitle = clientName ? `New note on ${clientName}` : "New Workspace Announcement";
    const plainText = cleanNotificationPreview(content);
    const preview = plainText.slice(0, 100);
    const targetLink = clientId ? `/clients/${clientId}?noteId=${noteId}` : `/?noteId=${noteId}`;

    const items: CreateNotificationParams[] = Array.from(recipientIds).map((userId) => ({
      userId,
      actorId,
      type: "NOTE_ADDED",
      title: noteTitle,
      message: `${actorName}: "${preview}${plainText.length > 100 ? "..." : ""}"`,
      link: targetLink,
      noteId,
    }));

    return this.createNotificationsBatch(items);
  },

  async listNotifications(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    const { unreadOnly = false, limit = 40 } = options ?? {};
    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { items, total, unreadCount };
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  },

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  },

  async deleteAll(userId: string) {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    return { success: true };
  },
};


