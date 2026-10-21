import { withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { requireRecruitUser } from "@/server/access";
import { applicationSchema } from "@/lib/schemas";
import { z } from "zod";
export async function GET() {
  return withApiHandler(async () => {
    await requireRecruitUser();
    return prisma.recruitApplication.findMany({
      include: { job: true, events: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  });
}
export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireRecruitUser(true);
    const body = applicationSchema.parse(await request.json());
    return prisma.$transaction(async (tx) => {
      const job = await tx.recruitJob.findUniqueOrThrow({
        where: { id: body.jobId },
      });
      if (job.status !== "OPEN")
        throw new z.ZodError([
          { code: "custom", path: ["jobId"], message: "Choose an open job." },
        ]);
      return tx.recruitApplication.create({
        data: { ...body, createdBy: user.id },
      });
    });
  });
}
