import { withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { requireRecruitUser } from "@/server/access";
import { eventSchema } from "@/lib/schemas";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const user = await requireRecruitUser(true);
    const { id } = await context.params;
    const event = eventSchema.parse(await request.json());
    return prisma.recruitEvent.create({
      data: {
        ...event,
        scheduledAt: event.scheduledAt
          ? new Date(event.scheduledAt)
          : undefined,
        applicationId: id,
        authorId: user.id,
        authorName: user.name ?? "Team member",
      },
    });
  });
}
