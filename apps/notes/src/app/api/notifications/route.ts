import { NextRequest } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";

import { prisma } from "@zsyio/database";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limitParam = searchParams.get("limit");
    const rawLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const limit = !Number.isNaN(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 40;

    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
    };
  });
}

export async function DELETE() {
  return withApiHandler(async () => {
    const user = await requireUser();

    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    return { success: true };
  });
}

