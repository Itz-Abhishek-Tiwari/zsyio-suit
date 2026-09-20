import { NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  });
}
