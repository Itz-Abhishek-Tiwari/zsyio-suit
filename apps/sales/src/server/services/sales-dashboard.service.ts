import { prisma } from "@zsyio/database";
import { ForbiddenError } from "@zsyio/auth/permissions";
import { can } from "@zsyio/auth/permissions";
import type { AuthenticatedUser } from "@zsyio/auth/api-helpers";
import { SALES_STAGE_LABELS } from "@zsyio/types";
import type { SalesStage } from "@zsyio/types";

export const salesDashboardService = {
  async getStats(user: AuthenticatedUser) {
    if (!can(user.role, "sales:dashboard:view", user.permissions)) throw new ForbiddenError();

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allStages: SalesStage[] = [
      "NEW_LEAD",
      "CONTACTED",
      "QUALIFIED",
      "PROPOSAL_SENT",
      "NEGOTIATION",
      "WON",
      "LOST",
    ];

    // Totals are aggregated in the database instead of loading every lead.
    const [stageGroups, upcomingFollowUps, recentLeadsRaw, upcomingFollowUpsRaw, recentActivitiesRaw] = await Promise.all([
      prisma.salesLead.groupBy({
        by: ["currentStage"],
        where: { deletedAt: null },
        _count: { _all: true },
        _sum: { dealValue: true },
      }),
      prisma.salesLead.count({
        where: { deletedAt: null, nextFollowUpAt: { gte: now, lte: nextWeek } },
      }),
      prisma.salesLead.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          client: { select: { id: true, name: true, contactName: true, contactEmail: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.salesLead.findMany({
        where: {
          deletedAt: null,
          nextFollowUpAt: { not: null },
          currentStage: { notIn: ["WON", "LOST"] },
        },
        orderBy: { nextFollowUpAt: "asc" },
        take: 5,
        include: {
          client: { select: { id: true, name: true, contactName: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.salesActivity.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          lead: {
            select: {
              id: true,
              client: { select: { id: true, name: true } },
            },
          },
          assignedTo: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const stageCounts: Record<string, number> = {};
    const stageValues: Record<string, number> = {};
    let totalLeads = 0;
    let totalPipelineValue = 0;
    let wonValue = 0;

    for (const group of stageGroups) {
      const stage = group.currentStage;
      const count = group._count._all;
      const value = group._sum.dealValue ? Number(group._sum.dealValue) : 0;
      stageCounts[stage] = count;
      stageValues[stage] = value;
      totalLeads += count;
      if (stage !== "LOST") totalPipelineValue += value;
      if (stage === "WON") wonValue += value;
    }

    const recentLeads = recentLeadsRaw.map((l) => ({
      ...l,
      dealValue: l.dealValue ? Number(l.dealValue) : null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      expectedCloseAt: l.expectedCloseAt ? l.expectedCloseAt.toISOString() : null,
      nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.toISOString() : null,
    }));

    const upcomingFollowUpsList = upcomingFollowUpsRaw.map((l) => ({
      ...l,
      dealValue: l.dealValue ? Number(l.dealValue) : null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      expectedCloseAt: l.expectedCloseAt ? l.expectedCloseAt.toISOString() : null,
      nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.toISOString() : null,
    }));

    const recentActivities = recentActivitiesRaw.map((a) => ({
      ...a,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return {
      totalLeads,
      newLeads: stageCounts["NEW_LEAD"] ?? 0,
      contacted: stageCounts["CONTACTED"] ?? 0,
      qualified: stageCounts["QUALIFIED"] ?? 0,
      proposalSent: stageCounts["PROPOSAL_SENT"] ?? 0,
      negotiation: stageCounts["NEGOTIATION"] ?? 0,
      won: stageCounts["WON"] ?? 0,
      lost: stageCounts["LOST"] ?? 0,
      totalPipelineValue,
      wonValue,
      upcomingFollowUps,
      stageBreakdown: allStages.map((stage) => ({
        stage,
        label: SALES_STAGE_LABELS[stage],
        count: stageCounts[stage] ?? 0,
        value: stageValues[stage] ?? 0,
      })),
      recentLeads,
      upcomingFollowUpsList,
      recentActivities,
    };
  },
};
