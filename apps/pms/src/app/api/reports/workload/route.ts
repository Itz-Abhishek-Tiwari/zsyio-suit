import { unstable_cache } from "next/cache";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { NextResponse } from "next/server";

// Cached for 5 minutes - workload aggregate data changes infrequently.
const getWorkloadData = unstable_cache(
  async () => {
    const now = new Date();

    const [
      users,
      groupedStatus,
      userOverdueCounts,
      groupedPriority,
      groupedType,
      totalTasks,
      doneTasks,
      blockedTasks,
      overdueTasks,
      clients,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, role: true, email: true },
      }),
      prisma.task.groupBy({
        by: ["assignedToId", "status"],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["assignedToId"],
        where: { deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ["type"],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { deletedAt: null, status: "DONE" } }),
      prisma.task.count({ where: { deletedAt: null, status: "BLOCKED" } }),
      prisma.task.count({
        where: { deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } },
      }),
      prisma.client.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          status: true,
          products: {
            where: { deletedAt: null },
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    // Pre-index grouped status rows by userId for O(1) lookup
    const statusByUser = new Map<string | null, typeof groupedStatus>();
    for (const g of groupedStatus) {
      const key = g.assignedToId ?? null;
      const bucket = statusByUser.get(key);
      if (bucket) bucket.push(g);
      else statusByUser.set(key, [g]);
    }

    const userOverdueMap = new Map<string | null, number>();
    for (const g of userOverdueCounts) {
      if (g.assignedToId) {
        userOverdueMap.set(g.assignedToId, g._count);
      }
    }

    const workload = users.map((u) => {
      const userTasks = statusByUser.get(u.id) ?? [];
      const totalUserTasks = userTasks.reduce((sum, g) => sum + g._count, 0);
      const doneUserTasks = userTasks
        .filter((g) => g.status === "DONE")
        .reduce((sum, g) => sum + g._count, 0);
      const activeUserTasks = totalUserTasks - doneUserTasks;
      const overdueUserTasks = userOverdueMap.get(u.id) ?? 0;

      return {
        user: u,
        totalTasks: totalUserTasks,
        doneTasks: doneUserTasks,
        activeTasks: activeUserTasks,
        overdueTasks: overdueUserTasks,
        completionRate: totalUserTasks ? Math.round((doneUserTasks / totalUserTasks) * 100) : 0,
        byStatus: userTasks.map((g) => ({ status: g.status, count: g._count })),
      };
    });

    return {
      workload,
      byPriority: groupedPriority.map((g) => ({ priority: g.priority, count: g._count })),
      byType: groupedType.map((g) => ({ type: g.type, count: g._count })),
      clients,
      stats: {
        totalTasks,
        doneTasks,
        blockedTasks,
        overdueTasks,
        activeTasks: totalTasks - doneTasks,
        completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
    };
  },
  ["workload-report"],
  { revalidate: 300, tags: ["workload-report"] }
);

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "report:view", user.permissions);

    const data = await getWorkloadData();

    // Allow CDN/proxy to serve stale content for up to 5 minutes
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, s-maxage=300, stale-while-revalidate=60" },
    });
  });
}
