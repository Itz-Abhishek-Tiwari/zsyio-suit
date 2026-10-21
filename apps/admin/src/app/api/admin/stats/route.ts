import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { getAllowedEmailDomains, setDynamicAllowedDomains } from "@zsyio/auth/domain-restriction";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdminAccess();

    const [totalUsers, activeUsers, pendingInvitations, deactivatedUsers, totalTeams, totalRoles, dbDomains] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true, invitationStatus: "ACCEPTED" } }),
        prisma.user.count({ where: { invitationStatus: "PENDING" } }),
        prisma.user.count({ where: { active: false } }),
        prisma.team.count(),
        prisma.customRole.count({ where: { name: { not: "SUPER_ADMIN" } } }),
        prisma.allowedDomain.findMany({
          where: { isActive: true },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        }),
      ]);

    const allowedDomains =
      dbDomains.length > 0 ? dbDomains.map((d) => d.domain) : getAllowedEmailDomains();

    setDynamicAllowedDomains(allowedDomains);

    return {
      totalUsers,
      activeUsers,
      pendingInvitations,
      deactivatedUsers,
      totalTeams,
      totalRoles,
      allowedDomains,
    };
  });
}
