import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import type { Prisma } from "@prisma/client";

// force-dynamic disables Next.js's *Route Cache* (CDN/edge layer) so every
// request goes through the handler. unstable_cache operates at the *Data Cache*
// layer (in-process, per-server) and is entirely independent - both can and
// should coexist here: the route is always dynamic, but DB queries are memoized
// for 60 s to avoid hammering Postgres on every analytics refresh.
export const dynamic = "force-dynamic";

interface QueryFilters {
  clientId?: string;
  productId?: string;
}

interface ProductBreakdown {
  id: string;
  name: string;
  imageUrl: string | null;
  version: string | null;
  environment: string;
  deployedUrl: string | null;
  totalTasks: number;
  doneTasks: number;
  blockedTasks: number;
  completionRate: number;
}

const getAnalyticsData = (filters: QueryFilters) =>
  unstable_cache(
    async () => {
      const now = new Date();
      const { clientId, productId } = filters;

      const taskWhere: Prisma.TaskWhereInput = { deletedAt: null };

      if (productId) {
        taskWhere.productId = productId;
      } else if (clientId) {
        taskWhere.product = { clientId, deletedAt: null };
      }

      const [
        clientsList,
        totalTasks,
        doneTasks,
        blockedTasks,
        overdueTasks,
        groupedStatus,
        groupedPriority,
        groupedType,
        users,
        userStatusCounts,
        userOverdueCounts,
        byProductAndStatusAll,
        overdueTasksAll,
      ] = await Promise.all([
        prisma.client.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            logoUrl: true,
            status: true,
            domain: true,
            contactName: true,
            contactEmail: true,
            products: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                imageUrl: true,
                version: true,
                environment: true,
                deployedUrl: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),

        prisma.task.count({ where: taskWhere }),
        prisma.task.count({ where: { ...taskWhere, status: "DONE" } }),
        prisma.task.count({ where: { ...taskWhere, status: "BLOCKED" } }),
        prisma.task.count({
          where: { ...taskWhere, status: { not: "DONE" }, dueDate: { lt: now } },
        }),

        prisma.task.groupBy({
          by: ["status"],
          where: taskWhere,
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["priority"],
          where: taskWhere,
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["type"],
          where: taskWhere,
          _count: true,
        }),

        prisma.user.findMany({
          where: { active: true },
          select: { id: true, name: true, role: true, email: true },
          orderBy: { name: "asc" },
        }),
        prisma.task.groupBy({
          by: ["assignedToId", "status"],
          where: taskWhere,
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["assignedToId"],
          where: { ...taskWhere, status: { not: "DONE" }, dueDate: { lt: now } },
          _count: true,
        }),

        prisma.task.groupBy({
          by: ["productId", "status"],
          where: { deletedAt: null },
          _count: true,
        }),
        prisma.task.groupBy({
          by: ["productId"],
          where: { deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } },
          _count: true,
        }),
      ]);

      // Map product stats by product ID
      const productStatsMap = new Map<
        string,
        { total: number; done: number; blocked: number; overdue: number }
      >();

      for (const g of byProductAndStatusAll) {
        if (!g.productId) continue;
        const current = productStatsMap.get(g.productId) || {
          total: 0,
          done: 0,
          blocked: 0,
          overdue: 0,
        };
        current.total += g._count;
        if (g.status === "DONE") current.done += g._count;
        if (g.status === "BLOCKED") current.blocked += g._count;
        productStatsMap.set(g.productId, current);
      }

      for (const o of overdueTasksAll) {
        if (!o.productId) continue;
        const current = productStatsMap.get(o.productId) || {
          total: 0,
          done: 0,
          blocked: 0,
          overdue: 0,
        };
        current.overdue += o._count;
        productStatsMap.set(o.productId, current);
      }

      // Build Per-Client Health Summaries (All Clients Overview Matrix)
      const clientSummaries = clientsList.map((c) => {
        let total = 0;
        let done = 0;
        let blocked = 0;
        let overdue = 0;

        for (const p of c.products) {
          const pStat = productStatsMap.get(p.id);
          if (pStat) {
            total += pStat.total;
            done += pStat.done;
            blocked += pStat.blocked;
            overdue += pStat.overdue;
          }
        }

        return {
          id: c.id,
          name: c.name,
          logoUrl: c.logoUrl,
          status: c.status,
          domain: c.domain,
          contactName: c.contactName,
          contactEmail: c.contactEmail,
          productsCount: c.products.length,
          totalTasks: total,
          doneTasks: done,
          blockedTasks: blocked,
          overdueTasks: overdue,
          completionRate: total ? Math.round((done / total) * 100) : 0,
        };
      });

      // Product breakdowns for selected client
      let productsBreakdown: ProductBreakdown[] = [];
      if (clientId) {
        const clientProducts = clientsList.find((c) => c.id === clientId)?.products ?? [];
        productsBreakdown = clientProducts.map((p) => {
          const pStat = productStatsMap.get(p.id) || {
            total: 0,
            done: 0,
            blocked: 0,
            overdue: 0,
          };
          return {
            ...p,
            totalTasks: pStat.total,
            doneTasks: pStat.done,
            blockedTasks: pStat.blocked,
            completionRate: pStat.total ? Math.round((pStat.done / pStat.total) * 100) : 0,
          };
        });
      }

      const userStatusMap = new Map<string | null, typeof userStatusCounts>();
      for (const g of userStatusCounts) {
        const key = g.assignedToId ?? null;
        const bucket = userStatusMap.get(key);
        if (bucket) bucket.push(g);
        else userStatusMap.set(key, [g]);
      }

      const userOverdueMap = new Map<string | null, number>();
      for (const g of userOverdueCounts) {
        if (g.assignedToId) {
          userOverdueMap.set(g.assignedToId, g._count);
        }
      }

      const workload = users.map((u) => {
        const uTasks = userStatusMap.get(u.id) ?? [];
        const totalUserTasks = uTasks.reduce((sum, g) => sum + g._count, 0);
        const doneUserTasks = uTasks
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
          completionRate: totalUserTasks
            ? Math.round((doneUserTasks / totalUserTasks) * 100)
            : 0,
          byStatus: uTasks.map((g) => ({ status: g.status, count: g._count })),
        };
      });

      return {
        clientsList,
        clientSummaries,
        productsBreakdown,
        stats: {
          totalTasks,
          doneTasks,
          blockedTasks,
          overdueTasks,
          activeTasks: totalTasks - doneTasks,
          completionRate: totalTasks
            ? Math.round((doneTasks / totalTasks) * 100)
            : 0,
        },
        byStatus: groupedStatus.map((g) => ({
          status: g.status,
          count: g._count,
        })),
        byPriority: groupedPriority.map((g) => ({
          priority: g.priority,
          count: g._count,
        })),
        byType: groupedType.map((g) => ({ type: g.type, count: g._count })),
        workload,
      };
    },
    [`analytics-report-${filters.clientId || "all"}-${filters.productId || "all"}`],
    { revalidate: 60, tags: ["analytics-report"] }
  )();

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "report:view", user.permissions);

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId") || undefined;
    const productId = searchParams.get("productId") || undefined;

    const data = await getAnalyticsData({ clientId, productId });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30",
      },
    });
  });
}
