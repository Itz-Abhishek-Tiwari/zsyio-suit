import { prisma } from "@zsyio/database";
import { ForbiddenError, NotFoundError, BadRequestError } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import type { AuthenticatedUser } from "@zsyio/auth/api-helpers";
import { serializeDate } from "@zsyio/ui";
import type { CreatePipelineStageInput } from "@zsyio/validators";

export const salesPipelineService = {
  async getDefault(user: AuthenticatedUser) {
    if (!can(user.role, "sales:view", user.permissions)) throw new ForbiddenError();

    let pipeline = await prisma.salesPipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: { _count: { select: { leads: true } } },
        },
      },
    });

    if (!pipeline) {
      // Auto-create default pipeline on first access
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
        include: {
          stages: {
            orderBy: { order: "asc" },
            include: { _count: { select: { leads: true } } },
          },
        },
      });
    }

    return serializePipeline(pipeline);
  },

  async addStage(user: AuthenticatedUser, pipelineId: string, input: CreatePipelineStageInput) {
    if (!can(user.role, "sales:pipeline:manage", user.permissions)) throw new ForbiddenError();

    const pipeline = await prisma.salesPipeline.findUnique({ where: { id: pipelineId } });
    if (!pipeline) throw new NotFoundError("Pipeline not found.");

    const existing = await prisma.pipelineStage.findFirst({
      where: { pipelineId, stageKey: input.stageKey },
    });
    if (existing) throw new BadRequestError(`Stage ${input.stageKey} already exists in this pipeline.`);

    const stage = await prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: input.name,
        stageKey: input.stageKey,
        order: input.order,
        color: input.color ?? null,
      },
    });

    return stage;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializePipeline(pipeline: any) {
  return {
    ...pipeline,
    createdAt: serializeDate(pipeline.createdAt),
    updatedAt: serializeDate(pipeline.updatedAt),
    stages: pipeline.stages.map((s: { createdAt: Date | string; updatedAt: Date | string; [k: string]: unknown }) => ({
      ...s,
      createdAt: serializeDate(s.createdAt),
      updatedAt: serializeDate(s.updatedAt),
    })),
  };
}
