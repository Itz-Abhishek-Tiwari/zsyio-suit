import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";

import { prisma } from "@zsyio/database";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireUser();

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  });
}

