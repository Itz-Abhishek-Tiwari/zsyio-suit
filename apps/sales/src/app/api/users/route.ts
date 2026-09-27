import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return users;
  });
}
