import { ForbiddenError, NotFoundError, can } from "@zsyio/auth/permissions";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { dashboardNoteRepository } from "@/server/repositories/dashboard-note.repository";
import { notificationService } from "@/server/services/notification.service";
import { runAfterResponse } from "@/lib/after-response";
import type { CreateDashboardNoteInput } from "@zsyio/validators";

export interface AuthUserSession {
  id: string;
  name?: string | null;
  role: string;
  permissions?: string[] | null;
}

export const dashboardNoteService = {
  async listForUser(
    user: AuthUserSession,
    filters?: { clientId?: string; taskId?: string }
  ) {
    return dashboardNoteRepository.listForUser(user.id, user.role, filters);
  },

  async isVisibleTo(user: AuthUserSession, id: string) {
    return dashboardNoteRepository.isVisibleTo(id, user.id, user.role);
  },

  async findById(id: string) {
    return dashboardNoteRepository.findById(id);
  },

  async create(user: AuthUserSession, data: CreateDashboardNoteInput) {
    const canPublishWorkspaceNote =
      user.role === "SUPER_ADMIN" ||
      isSuperAdmin(user) ||
      can(user.role, "dashboard:note:create", user.permissions);

    if (!data.isPersonal && !canPublishWorkspaceNote) {
      throw new ForbiddenError("You do not have permission to publish workspace dashboard announcements.");
    }

    const note = await dashboardNoteRepository.create(user.id, data);

    runAfterResponse(() => notificationService.notifyNoteCreated({
        noteId: note.id,
        content: note.content,
        isPersonal: note.isPersonal,
        targetAll: note.targetAll,
        targetUserIds: data.targetUserIds,
        targetTeamIds: data.targetTeamIds,
        clientId: note.clientId,
        clientName: note.client?.name,
        actorId: user.id,
        actorName: user.name || "A team member",
      }), "[Notes] Notification");

    return note;
  },

  async delete(user: AuthUserSession, id: string) {
    const existing = await dashboardNoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Note not found.");
    }

    const canDelete =
      existing.authorId === user.id ||
      user.role === "SUPER_ADMIN" ||
      isSuperAdmin(user) ||
      can(user.role, "dashboard:note:delete", user.permissions);

    if (!canDelete) {
      throw new ForbiddenError("You do not have permission to delete this note.");
    }

    return dashboardNoteRepository.delete(id);
  },
};
