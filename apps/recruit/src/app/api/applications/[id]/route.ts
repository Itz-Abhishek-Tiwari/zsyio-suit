import { withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { requireRecruitUser } from "@/server/access";
import { candidateDetailsSchema, stageSchema } from "@/lib/schemas";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withApiHandler(async () => {
    const user = await requireRecruitUser(true);
    const { id } = await context.params;
    const body = await request.json();
    // A body with a stage moves the candidate; anything else edits their details.
    if (!body || typeof body !== "object" || !("stage" in body))
      return prisma.recruitApplication.update({
        where: { id },
        data: candidateDetailsSchema.parse(body),
      });
    const { stage, rejectionReason, note } = stageSchema.parse(body);
    return prisma.$transaction(async (tx) => {
      const current = await tx.recruitApplication.findUniqueOrThrow({
        where: { id },
      });
      if (current.stage === stage) return current;
      return tx.recruitApplication.update({
        where: { id },
        data: {
          stage,
          rejectionReason: stage === "REJECTED" ? rejectionReason : null,
          events: {
            create: {
              kind: "STAGE",
              title: `${current.stage} → ${stage}`,
              body:
                stage === "REJECTED"
                  ? [rejectionReason, note].filter(Boolean).join(" — ")
                  : "",
              authorId: user.id,
              authorName: user.name ?? "Team member",
            },
          },
        },
      });
    });
  });
}
