import { prisma } from "@zsyio/database";
import type { CreateDashboardNoteInput } from "@zsyio/validators";

export const dashboardNoteRepository = {
  async listForUser(
    userId: string,
    role: string,
    filters?: { clientId?: string; taskId?: string }
  ) {
    // Build base filter from optional query params
    const baseWhere: Record<string, unknown> = {};
    if (filters?.clientId) baseWhere.clientId = filters.clientId;
    if (filters?.taskId) baseWhere.taskId = filters.taskId;

    // Non-admin/manager users: collapse the previous 2-query pattern
    // into a single query with nested relation filters
    const visibilityFilter =
      role === "ADMIN" || role === "MANAGER" || role === "SUPER_ADMIN"
        ? {
            OR: [
              { isPersonal: false },
              { isPersonal: true, authorId: userId },
            ],
          }
        : {
            OR: [
              { isPersonal: true, authorId: userId },
              { isPersonal: false, targetAll: true },
              { isPersonal: false, authorId: userId },
              { isPersonal: false, targetUsers: { some: { userId } } },
              { isPersonal: false, targetTeams: { some: { team: { members: { some: { userId } } } } } },
            ],
          };

    const where = { ...baseWhere, ...visibilityFilter };

    return prisma.dashboardNote.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        task: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, email: true, role: true } },
        targetTeams: {
          include: {
            team: { select: { id: true, name: true, color: true } },
          },
        },
        targetUsers: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.dashboardNote.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        client: { select: { id: true, name: true, logoUrl: true } },
        task: { select: { id: true, title: true } },
        targetTeams: {
          include: {
            team: { select: { id: true, name: true, color: true } },
          },
        },
        targetUsers: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async create(authorId: string, data: CreateDashboardNoteInput) {
    const { clientId, taskId, content, targetAll, isPersonal, targetTeamIds, targetUserIds } = data;

    const personal = Boolean(isPersonal);
    const resolvedClientId = clientId && clientId.trim() !== "" ? clientId.trim() : null;
    const resolvedTaskId = taskId && taskId.trim() !== "" ? taskId.trim() : null;

    return prisma.dashboardNote.create({
      data: {
        clientId: resolvedClientId,
        taskId: resolvedTaskId,
        authorId,
        content: content.trim(),
        isPersonal: personal,
        targetAll: personal ? false : (targetAll ?? true),
        ...(!personal && targetTeamIds && targetTeamIds.length > 0 && !targetAll
          ? {
              targetTeams: {
                create: targetTeamIds.map((teamId) => ({ teamId })),
              },
            }
          : {}),
        ...(!personal && targetUserIds && targetUserIds.length > 0 && !targetAll
          ? {
              targetUsers: {
                create: targetUserIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: {
        client: { select: { id: true, name: true, logoUrl: true } },
        task: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, email: true, role: true } },
        targetTeams: {
          include: {
            team: { select: { id: true, name: true, color: true } },
          },
        },
        targetUsers: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.dashboardNote.delete({
      where: { id },
    });
  },
};

// Backwards-compatible export alias
export const dashboardNotesRepository = dashboardNoteRepository;
