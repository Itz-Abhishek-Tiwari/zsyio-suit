import { prisma } from "@zsyio/database";
import { ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import type { AuthenticatedUser } from "@zsyio/auth/api-helpers";
import { serializeDate } from "@zsyio/ui";
import type { CreateSalesActivityInput, UpdateSalesActivityInput } from "@zsyio/validators";

const ACTIVITY_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  lead: {
    select: {
      id: true,
      currentStage: true,
      client: { select: { id: true, name: true, contactName: true } },
    },
  },
} as const;

export const salesActivityService = {
  async list(
    user: AuthenticatedUser,
    params: { leadId?: string; status?: string; assignedToId?: string }
  ) {
    if (!can(user.role, "sales:view", user.permissions)) throw new ForbiddenError();

    const activities = await prisma.salesActivity.findMany({
      where: {
        ...(params.leadId ? { leadId: params.leadId } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      },
      include: ACTIVITY_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return activities.map(serializeActivity);
  },

  async create(user: AuthenticatedUser, input: CreateSalesActivityInput) {
    if (!can(user.role, "sales:create", user.permissions)) throw new ForbiddenError();

    const lead = await prisma.salesLead.findFirst({ where: { id: input.leadId, deletedAt: null } });
    if (!lead) throw new NotFoundError("Sales lead not found.");

    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.salesActivity.create({
        data: {
          leadId: input.leadId,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          assignedToId: input.assignedToId ?? null,
          createdById: user.id,
          priority: input.priority ?? "MEDIUM",
          status: input.status ?? "PENDING",
        },
        include: ACTIVITY_INCLUDE,
      });

      await tx.salesAuditLog.create({
        data: {
          leadId: input.leadId,
          action: "ACTIVITY_CREATED",
          actorId: user.id,
          nextValue: input.title,
        },
      });

      return created;
    });

    return serializeActivity(activity);
  },

  async update(user: AuthenticatedUser, id: string, input: UpdateSalesActivityInput) {
    if (!can(user.role, "sales:edit", user.permissions)) throw new ForbiddenError();

    const existing = await prisma.salesActivity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Activity not found.");

    const wasCompleted = !existing.completedAt && input.status === "DONE";

    const activity = await prisma.$transaction(async (tx) => {
      const updated = await tx.salesActivity.update({
        where: { id },
        data: {
          ...(input.type ? { type: input.type } : {}),
          ...(input.title ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
          ...(input.completedAt !== undefined ? { completedAt: input.completedAt ? new Date(input.completedAt) : null } : {}),
          ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(wasCompleted ? { completedAt: new Date() } : {}),
        },
        include: ACTIVITY_INCLUDE,
      });

      if (wasCompleted) {
        await tx.salesAuditLog.create({
          data: {
            leadId: existing.leadId,
            action: "ACTIVITY_COMPLETED",
            actorId: user.id,
            nextValue: existing.title,
          },
        });
      }

      return updated;
    });

    return serializeActivity(activity);
  },

  async delete(user: AuthenticatedUser, id: string) {
    if (!can(user.role, "sales:delete", user.permissions)) throw new ForbiddenError();
    const existing = await prisma.salesActivity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Activity not found.");
    await prisma.salesActivity.delete({ where: { id } });
    return { success: true };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeActivity(activity: any) {
  return {
    ...activity,
    createdAt: serializeDate(activity.createdAt),
    updatedAt: serializeDate(activity.updatedAt),
    dueAt: serializeDate(activity.dueAt),
    completedAt: serializeDate(activity.completedAt),
  };
}
