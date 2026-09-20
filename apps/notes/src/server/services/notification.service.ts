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
        "NOTE_ADDED",
      ];
      if (DEDUP_TYPES.includes(params.type)) {
        const deduplicationWindow = new Date(Date.now() - 15 * 1000);
        const recent = await prisma.notification.findFirst({
          where: {
            userId: params.userId,
            type: params.type,
            noteId: params.noteId || undefined,
            taskId: params.taskId || undefined,
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
   * Notify a user that a note has been shared with them
   */
  async notifyNoteShared({
    noteId,
    noteTitle,
    targetUserId,
    actorId,
    actorName,
  }: {
    noteId: string;
    noteTitle: string;
    targetUserId: string;
    actorId: string;
    actorName: string;
  }) {
    return this.createNotification({
      userId: targetUserId,
      actorId,
      type: "NOTE_ADDED",
      title: "A note was shared with you",
      message: `${actorName} shared "${noteTitle}" with you.`,
      link: `/notes?noteId=${noteId}`,
      noteId,
    });
  },
};
