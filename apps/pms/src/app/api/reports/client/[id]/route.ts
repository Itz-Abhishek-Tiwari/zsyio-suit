import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan, NotFoundError } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";

export const dynamic = "force-dynamic";

async function fetchClientReportData(clientId: string) {
  const now = new Date();

  // Run client lookup + all aggregate queries in parallel
  const [
    client,
    totalTasks,
    doneTasks,
    blockedTasks,
    overdueTasks,
    byStatus,
    byPriority,
    byType,
    byProductAndStatus,
  ] = await Promise.all([
    prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        domain: true,
        contactName: true,
        contactEmail: true,
        products: {
          where: { deletedAt: null },
          select: { id: true, name: true, version: true, environment: true, deployedUrl: true },
        },
      },
    }),
    prisma.task.count({ where: { product: { clientId, deletedAt: null }, deletedAt: null } }),
    prisma.task.count({ where: { product: { clientId, deletedAt: null }, deletedAt: null, status: "DONE" } }),
    prisma.task.count({ where: { product: { clientId, deletedAt: null }, deletedAt: null, status: "BLOCKED" } }),
    prisma.task.count({
      where: { product: { clientId, deletedAt: null }, deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { product: { clientId, deletedAt: null }, deletedAt: null },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { product: { clientId, deletedAt: null }, deletedAt: null },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["type"],
      where: { product: { clientId, deletedAt: null }, deletedAt: null },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["productId", "status"],
      where: { product: { clientId, deletedAt: null }, deletedAt: null },
      _count: true,
    }),
  ]);

  if (!client) throw new NotFoundError("Client not found");

  const productStats = client.products.map((p) => {
    const groups = byProductAndStatus.filter((g) => g.productId === p.id);
    const pTotal = groups.reduce((sum, g) => sum + g._count, 0);
    const pDone = groups.find((g) => g.status === "DONE")?._count ?? 0;
    const pBlocked = groups.find((g) => g.status === "BLOCKED")?._count ?? 0;
    return {
      ...p,
      totalTasks: pTotal,
      doneTasks: pDone,
      blockedTasks: pBlocked,
      completionRate: pTotal ? Math.round((pDone / pTotal) * 100) : 0,
    };
  });

  return {
    client,
    stats: {
      totalTasks,
      doneTasks,
      blockedTasks,
      overdueTasks,
      activeTasks: totalTasks - doneTasks,
      completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
    byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
    byPriority: byPriority.map((g) => ({ priority: g.priority, count: g._count })),
    byType: byType.map((g) => ({ type: g.type, count: g._count })),
    products: productStats,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "report:view", user.permissions);
    const { id } = await params;

    const data = await fetchClientReportData(id);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30" },
    });
  });
}
