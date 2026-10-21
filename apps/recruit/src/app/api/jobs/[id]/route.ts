import { withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { requireRecruitUser } from "@/server/access";
import { jobSchema } from "@/lib/schemas";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    await requireRecruitUser(true);
    const { id } = await context.params;
    return prisma.recruitJob.update({
      where: { id },
      data: jobSchema.partial().parse(await request.json()),
    });
  });
}
