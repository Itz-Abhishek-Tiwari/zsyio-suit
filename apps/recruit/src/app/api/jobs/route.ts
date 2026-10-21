import { withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { requireRecruitUser } from "@/server/access";
import { jobSchema } from "@/lib/schemas";
export async function GET() {
  return withApiHandler(async () => {
    await requireRecruitUser();
    return prisma.recruitJob.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });
  });
}
export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireRecruitUser(true);
    return prisma.recruitJob.create({
      data: { ...jobSchema.parse(await request.json()), createdBy: user.id },
    });
  });
}
