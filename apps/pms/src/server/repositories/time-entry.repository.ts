import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "./shared";
import type { CreateTimeEntryInput, UpdateTimeEntryInput, StopTimeEntryInput } from "@zsyio/validators";

export const timeEntryRepository = {
  async recalculateTaskActualHours(taskId: string) {
    const entries = await prisma.taskTimeEntry.findMany({
      where: { taskId, durationMin: { not: null } },
      select: { durationMin: true },
    });
    const totalMinutes = entries.reduce((acc, entry) => acc + (entry.durationMin || 0), 0);
    const actualHours = Math.round((totalMinutes / 60) * 100) / 100;

    await prisma.task.update({
      where: { id: taskId },
      data: { actualHours },
    });

    return actualHours;
  },

  async getActive(userId: string) {
    return prisma.taskTimeEntry.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            ticketNumber: true,
            estimatedHours: true,
            actualHours: true,
            status: true,
            priority: true,
            product: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  },

  async getByTaskId(taskId: string) {
    return prisma.taskTimeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: SAFE_USER_SELECT },
      },
      orderBy: { startedAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.taskTimeEntry.findUnique({
      where: { id },
      include: {
        user: { select: SAFE_USER_SELECT },
        task: true,
      },
    });
  },

  async create(data: CreateTimeEntryInput & { userId: string }) {
    const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
    let endedAt: Date | null = null;
    let durationMin: number | null = null;

    if (data.endedAt) {
      endedAt = new Date(data.endedAt);
      durationMin = data.durationMin ?? Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60)));
    } else if (data.durationMin && data.durationMin > 0) {
      durationMin = data.durationMin;
      endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
    }

    // If starting an active timer (endedAt is null), automatically stop any previous active timer for this user
    if (!endedAt) {
      const activeEntry = await prisma.taskTimeEntry.findFirst({
        where: { userId: data.userId, endedAt: null },
      });
      if (activeEntry) {
        const now = new Date();
        const autoDuration = Math.max(1, Math.round((now.getTime() - activeEntry.startedAt.getTime()) / (1000 * 60)));
        await prisma.taskTimeEntry.update({
          where: { id: activeEntry.id },
          data: { endedAt: now, durationMin: autoDuration },
        });
        await this.recalculateTaskActualHours(activeEntry.taskId);
      }
    }

    const entry = await prisma.taskTimeEntry.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        startedAt,
        endedAt,
        durationMin,
        description: data.description ?? null,
        isBillable: data.isBillable ?? true,
      },
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });

    if (durationMin && durationMin > 0) {
      await this.recalculateTaskActualHours(data.taskId);
    }

    return entry;
  },

  async stop(id: string, data: StopTimeEntryInput) {
    const existing = await prisma.taskTimeEntry.findUniqueOrThrow({
      where: { id },
    });

    const endedAt = data.endedAt ? new Date(data.endedAt) : new Date();
    const durationMin = Math.max(1, Math.round((endedAt.getTime() - existing.startedAt.getTime()) / (1000 * 60)));

    const entry = await prisma.taskTimeEntry.update({
      where: { id },
      data: {
        endedAt,
        durationMin,
        description: data.description !== undefined ? data.description : existing.description,
      },
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });

    await this.recalculateTaskActualHours(existing.taskId);
    return entry;
  },

  async update(id: string, data: UpdateTimeEntryInput) {
    const existing = await prisma.taskTimeEntry.findUniqueOrThrow({
      where: { id },
    });

    const startedAt = data.startedAt ? new Date(data.startedAt) : existing.startedAt;
    let endedAt = data.endedAt !== undefined ? (data.endedAt ? new Date(data.endedAt) : null) : existing.endedAt;
    let durationMin = data.durationMin !== undefined ? data.durationMin : existing.durationMin;

    if (endedAt && (durationMin === undefined || durationMin === null)) {
      durationMin = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60)));
    } else if (durationMin !== undefined && durationMin !== null && !endedAt) {
      endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
    }

    const entry = await prisma.taskTimeEntry.update({
      where: { id },
      data: {
        startedAt,
        endedAt,
        durationMin,
        description: data.description !== undefined ? data.description : existing.description,
        isBillable: data.isBillable !== undefined ? data.isBillable : existing.isBillable,
      },
      include: {
        user: { select: SAFE_USER_SELECT },
      },
    });

    await this.recalculateTaskActualHours(existing.taskId);
    return entry;
  },

  async delete(id: string) {
    const entry = await prisma.taskTimeEntry.delete({
      where: { id },
    });
    await this.recalculateTaskActualHours(entry.taskId);
    return entry;
  },
};
