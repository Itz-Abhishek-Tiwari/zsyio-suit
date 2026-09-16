import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import type { CreateTeamInput, UpdateTeamInput } from "@zsyio/validators";

const TEAM_INCLUDE = {
  members: {
    include: {
      user: {
        select: SAFE_USER_SELECT,
      },
    },
  },
  _count: {
    select: {
      assignedTasks: {
        where: { deletedAt: null },
      },
    },
  },
};

export const teamRepository = {
  async list() {
    return prisma.team.findMany({
      include: TEAM_INCLUDE,
      orderBy: { createdAt: "desc" },
      relationLoadStrategy: "join",
    });
  },

  async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: TEAM_INCLUDE,
      relationLoadStrategy: "join",
    });
  },

  async create(data: CreateTeamInput) {
    const { memberUserIds, leadUserId, members, ...teamData } = data;

    const memberAssignments: { userId: string; role: string }[] = [];
    if (members && members.length > 0) {
      memberAssignments.push(
        ...members.map((m) => ({
          userId: m.userId,
          role: leadUserId && m.userId === leadUserId ? "LEAD" : (m.role || "MEMBER"),
        }))
      );
    } else if (memberUserIds && memberUserIds.length > 0) {
      memberAssignments.push(
        ...memberUserIds.map((userId) => ({
          userId,
          role: userId === leadUserId ? "LEAD" : "MEMBER",
        }))
      );
    }

    if (leadUserId && !memberAssignments.some((m) => m.userId === leadUserId)) {
      memberAssignments.unshift({ userId: leadUserId, role: "LEAD" });
    }

    return prisma.team.create({
      data: {
        ...teamData,
        description: teamData.description ?? undefined,
        ...(memberAssignments.length
          ? {
              members: {
                create: memberAssignments,
              },
            }
          : {}),
      },
      include: TEAM_INCLUDE,
      relationLoadStrategy: "join",
    });
  },

  async update(id: string, data: UpdateTeamInput) {
    const { memberUserIds, leadUserId, members, ...teamData } = data;

    return prisma.$transaction(
      async (tx) => {
        if (members !== undefined || memberUserIds !== undefined || leadUserId !== undefined) {
          let baseUserIds: string[] = [];
          const roleMap: Record<string, string> = {};

          if (members !== undefined) {
            baseUserIds = members.map((m) => m.userId);
            members.forEach((m) => {
              roleMap[m.userId] = m.role || "MEMBER";
            });
          } else if (memberUserIds !== undefined) {
            baseUserIds = [...memberUserIds];
          } else {
            const current = await tx.teamMember.findMany({ where: { teamId: id } });
            baseUserIds = current.map((m) => m.userId);
            current.forEach((m) => {
              roleMap[m.userId] = m.role;
            });
          }

          if (leadUserId && !baseUserIds.includes(leadUserId)) {
            baseUserIds.unshift(leadUserId);
          }

          const memberAssignments = baseUserIds.map((userId) => {
            let role = roleMap[userId] || "MEMBER";
            if (leadUserId !== undefined) {
              if (userId === leadUserId) {
                role = "LEAD";
              } else if (role === "LEAD") {
                role = "MEMBER";
              }
            }
            return {
              teamId: id,
              userId,
              role,
            };
          });

          await tx.teamMember.deleteMany({ where: { teamId: id } });
          if (memberAssignments.length > 0) {
            await tx.teamMember.createMany({
              data: memberAssignments,
            });
          }
        }

        return tx.team.update({
          where: { id },
          data: {
            ...teamData,
            description: teamData.description !== undefined ? (teamData.description ?? null) : undefined,
          },
          include: TEAM_INCLUDE,
          relationLoadStrategy: "join",
        });
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },

  async delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },
};

export const teamsRepository = teamRepository;
