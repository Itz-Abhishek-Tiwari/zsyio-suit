import { NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const roles = await prisma.customRole.findMany({
      where: {
        name: { not: "SUPER_ADMIN" },
      },
      select: {
        id: true,
        name: true,
        label: true,
        description: true,
        isSystem: true,
        permissions: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(roles);
  });
}
