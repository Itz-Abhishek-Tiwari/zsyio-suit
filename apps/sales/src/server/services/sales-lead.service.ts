import { prisma } from "@zsyio/database";
import { ForbiddenError, NotFoundError, BadRequestError } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import type { AuthenticatedUser } from "@zsyio/auth/api-helpers";
import { serializeDate } from "@zsyio/ui";
import type {
  CreateSalesLeadInput,
  UpdateSalesLeadInput,
  MoveSalesLeadInput,
  SalesLeadFilters,
} from "@zsyio/validators";

const DEFAULT_LEAD_INCLUDE = {
  client: true,
  stage: true,
  pipeline: { include: { stages: { orderBy: { order: "asc" as const } } } },
  assignedTo: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
  _count: { select: { activities: true } },
} as const;

function assertCanView(user: AuthenticatedUser) {
  if (!can(user.role, "sales:view", user.permissions)) throw new ForbiddenError();
}
function assertCanCreate(user: AuthenticatedUser) {
  if (!can(user.role, "sales:create", user.permissions)) throw new ForbiddenError();
}
function assertCanEdit(user: AuthenticatedUser) {
  if (!can(user.role, "sales:edit", user.permissions)) throw new ForbiddenError();
}
function assertCanDelete(user: AuthenticatedUser) {
  if (!can(user.role, "sales:delete", user.permissions)) throw new ForbiddenError();
}

async function ensureDefaultPipeline() {
  let pipeline = await prisma.salesPipeline.findFirst({ where: { isDefault: true } });
  if (!pipeline) {
    pipeline = await prisma.salesPipeline.create({
      data: {
        name: "Default Sales Pipeline",
        isDefault: true,
        stages: {
          create: [
            { name: "New Lead",       stageKey: "NEW_LEAD",      order: 0, color: "#6366f1" },
            { name: "Contacted",      stageKey: "CONTACTED",     order: 1, color: "#3b82f6" },
            { name: "Qualified",      stageKey: "QUALIFIED",     order: 2, color: "#8b5cf6" },
            { name: "Proposal Sent",  stageKey: "PROPOSAL_SENT", order: 3, color: "#f59e0b" },
            { name: "Negotiation",    stageKey: "NEGOTIATION",   order: 4, color: "#f97316" },
            { name: "Won",            stageKey: "WON",           order: 5, color: "#10b981" },
            { name: "Lost",           stageKey: "LOST",          order: 6, color: "#ef4444" },
          ],
        },
      },
    });
  }
  return pipeline;
}

export const salesLeadService = {
  async list(user: AuthenticatedUser, filters: SalesLeadFilters) {
    assertCanView(user);
    const { q, stage, priority, assignedToId, followUpBefore, followUpAfter, tagIds, page, pageSize, sortBy, sortDir, includeDeleted } = filters;

    const tagIdList = tagIds ? tagIds.split(",").filter(Boolean) : undefined;

    const where: Record<string, unknown> = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(stage ? { currentStage: stage } : {}),
      ...(priority ? { priority } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(followUpBefore ? { nextFollowUpAt: { lte: new Date(followUpBefore) } } : {}),
      ...(followUpAfter ? { nextFollowUpAt: { gte: new Date(followUpAfter) } } : {}),
      ...(tagIdList?.length ? { tags: { some: { tagId: { in: tagIdList } } } } : {}),
      ...(q
        ? {
            OR: [
              { client: { name: { contains: q, mode: "insensitive" } } },
              { client: { contactName: { contains: q, mode: "insensitive" } } },
              { client: { contactEmail: { contains: q, mode: "insensitive" } } },
              { client: { contactPhone: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const SORTABLE = ["createdAt", "updatedAt", "dealValue", "probability", "expectedCloseAt", "lastContactAt", "nextFollowUpAt", "leadSource", "currentStage", "priority"];
    const orderBy = sortBy && sortBy !== "createdAt" && SORTABLE.includes(sortBy)
      ? { [sortBy]: sortDir }
      : { createdAt: sortDir };

    const [items, total] = await Promise.all([
      prisma.salesLead.findMany({
        where,
        include: DEFAULT_LEAD_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salesLead.count({ where }),
    ]);

    return {
      items: items.map(serializeLead),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getById(user: AuthenticatedUser, id: string) {
    assertCanView(user);
    const lead = await prisma.salesLead.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...DEFAULT_LEAD_INCLUDE,
        activities: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!lead) throw new NotFoundError("Sales lead not found.");
    return serializeLead(lead);
  },

  async create(user: AuthenticatedUser, input: CreateSalesLeadInput) {
    assertCanCreate(user);

    const pipeline = await ensureDefaultPipeline();
    const pipelineId = input.pipelineId || pipeline.id;

    const pipelineWithStages = await prisma.salesPipeline.findUnique({
      where: { id: pipelineId },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    if (!pipelineWithStages) throw new BadRequestError("Pipeline not found.");

    const targetStage = pipelineWithStages.stages.find((s) => s.stageKey === (input.currentStage ?? "NEW_LEAD"));
    if (!targetStage) throw new BadRequestError("Invalid stage for this pipeline.");

    const lead = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: input.clientName,
          logoUrl: input.logoUrl ?? null,
          domain: input.domain ?? null,
          contactName: input.contactName ?? null,
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone ?? null,
          notes: input.notes ?? null,
          status: "INTAKE",
          clientType: "SALES",
        },
      });

      const newLead = await tx.salesLead.create({
        data: {
          clientId: client.id,
          pipelineId,
          stageId: targetStage.id,
          currentStage: input.currentStage ?? "NEW_LEAD",
          assignedToId: input.assignedToId ?? null,
          priority: input.priority ?? "MEDIUM",
          dealValue: input.dealValue ?? null,
          probability: input.probability ?? null,
          expectedCloseAt: input.expectedCloseAt ? new Date(input.expectedCloseAt) : null,
          leadSource: input.leadSource ?? null,
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null,
          ...(input.tagIds?.length
            ? { tags: { create: input.tagIds.map((tagId) => ({ tagId })) } }
            : {}),
        },
        include: DEFAULT_LEAD_INCLUDE,
      });

      // Audit log
      await tx.salesAuditLog.create({
        data: {
          leadId: newLead.id,
          action: "CREATED",
          actorId: user.id,
          nextValue: input.clientName,
        },
      });

      return newLead;
    });

    return serializeLead(lead);
  },

  async update(user: AuthenticatedUser, id: string, input: UpdateSalesLeadInput) {
    assertCanEdit(user);
    const existing = await prisma.salesLead.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError("Sales lead not found.");

    const lead = await prisma.$transaction(async (tx) => {
      // Update client fields if provided
      if (input.clientName || input.contactName || input.contactEmail || input.contactPhone || input.notes !== undefined) {
        await tx.client.update({
          where: { id: existing.clientId },
          data: {
            ...(input.clientName ? { name: input.clientName } : {}),
            ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
            ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
            ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
          },
        });
      }

      // Update tag associations if provided
      if (input.tagIds !== undefined) {
        await tx.salesLeadTag.deleteMany({ where: { leadId: id } });
        if (input.tagIds.length > 0) {
          await tx.salesLeadTag.createMany({
            data: input.tagIds.map((tagId) => ({ leadId: id, tagId })),
          });
        }
      }

      const updated = await tx.salesLead.update({
        where: { id },
        data: {
          ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
          ...(input.priority ? { priority: input.priority } : {}),
          ...(input.dealValue !== undefined ? { dealValue: input.dealValue } : {}),
          ...(input.probability !== undefined ? { probability: input.probability } : {}),
          ...(input.expectedCloseAt !== undefined ? { expectedCloseAt: input.expectedCloseAt ? new Date(input.expectedCloseAt) : null } : {}),
          ...(input.leadSource !== undefined ? { leadSource: input.leadSource } : {}),
          ...(input.lastContactAt !== undefined ? { lastContactAt: input.lastContactAt ? new Date(input.lastContactAt) : null } : {}),
          ...(input.nextFollowUpAt !== undefined ? { nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null } : {}),
        },
        include: DEFAULT_LEAD_INCLUDE,
      });

      await tx.salesAuditLog.create({
        data: { leadId: id, action: "UPDATED", actorId: user.id },
      });

      return updated;
    });

    return serializeLead(lead);
  },

  async move(user: AuthenticatedUser, id: string, input: MoveSalesLeadInput) {
    assertCanEdit(user);
    const existing = await prisma.salesLead.findFirst({
      where: { id, deletedAt: null },
      include: { stage: true },
    });
    if (!existing) throw new NotFoundError("Sales lead not found.");

    const newStage = await prisma.pipelineStage.findFirst({
      where: { pipelineId: existing.pipelineId, stageKey: input.stageKey },
    });
    if (!newStage) throw new BadRequestError("Invalid stage for this pipeline.");

    const prevStage = existing.currentStage;

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.salesLead.update({
        where: { id },
        data: { stageId: newStage.id, currentStage: input.stageKey },
        include: DEFAULT_LEAD_INCLUDE,
      });

      await tx.salesAuditLog.create({
        data: {
          leadId: id,
          action: "STAGE_CHANGED",
          actorId: user.id,
          prevValue: prevStage,
          nextValue: input.stageKey,
          metadata: input.reason ? { reason: input.reason } : undefined,
        },
      });

      // Record as an activity
      await tx.salesActivity.create({
        data: {
          leadId: id,
          type: "STAGE_CHANGE",
          title: `Moved to ${input.stageKey.replace(/_/g, " ")}`,
          description: input.reason ?? null,
          createdById: user.id,
          status: "DONE",
          completedAt: new Date(),
        },
      });

      return updated;
    });

    return serializeLead(lead);
  },

  async convert(user: AuthenticatedUser, id: string, reason?: string) {
    if (!can(user.role, "sales:convert", user.permissions)) throw new ForbiddenError();

    const lead = await prisma.salesLead.findFirst({
      where: { id, deletedAt: null },
      include: { client: true, pipeline: { include: { stages: true } } },
    });
    if (!lead) throw new NotFoundError("Sales lead not found.");

    const wonStage = lead.pipeline?.stages?.find((s) => s.stageKey === "WON");

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: lead.clientId },
        data: { clientType: "DEVELOPMENT", status: "ONBOARDING" },
      });

      if (lead.currentStage !== "WON" && wonStage) {
        await tx.salesLead.update({
          where: { id: lead.id },
          data: { currentStage: "WON", stageId: wonStage.id },
        });
      }

      await tx.salesAuditLog.create({
        data: {
          leadId: id,
          action: "TYPE_CONVERTED",
          actorId: user.id,
          prevValue: "SALES",
          nextValue: "DEVELOPMENT",
          metadata: reason ? { reason } : undefined,
        },
      });

      await tx.salesActivity.create({
        data: {
          leadId: id,
          type: "STAGE_CHANGE",
          title: "Moved to Development Clients (PMS)",
          description: reason ?? "Client moved from Sales CRM to Development workflow in Zsyio Flow.",
          createdById: user.id,
          status: "DONE",
          completedAt: new Date(),
        },
      });
    });

    return { success: true, clientId: lead.clientId };
  },

  async softDelete(user: AuthenticatedUser, id: string) {
    assertCanDelete(user);
    const existing = await prisma.salesLead.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError("Sales lead not found.");

    await prisma.$transaction(async (tx) => {
      await tx.salesLead.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.salesAuditLog.create({
        data: { leadId: id, action: "DELETED", actorId: user.id },
      });
    });

    return { success: true };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeLead(lead: any) {
  return {
    ...lead,
    dealValue: lead.dealValue ? Number(lead.dealValue) : null,
    tags: lead.tags?.map((lt: { tag?: unknown }) => lt.tag ?? lt) ?? [],
    createdAt: serializeDate(lead.createdAt),
    updatedAt: serializeDate(lead.updatedAt),
    deletedAt: serializeDate(lead.deletedAt),
    expectedCloseAt: serializeDate(lead.expectedCloseAt),
    lastContactAt: serializeDate(lead.lastContactAt),
    nextFollowUpAt: serializeDate(lead.nextFollowUpAt),
    client: lead.client ? {
      ...lead.client,
      createdAt: serializeDate(lead.client.createdAt),
      updatedAt: serializeDate(lead.client.updatedAt),
    } : null,
  };
}
