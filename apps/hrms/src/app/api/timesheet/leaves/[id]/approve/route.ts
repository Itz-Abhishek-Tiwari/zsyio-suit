import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";
import { reviewLeaveSchema } from "@zsyio/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = reviewLeaveSchema.parse({
      status: "APPROVED",
      reviewerComment: body.reviewerComment || null,
    });
    return leaveService.reviewLeave(user, id, validated);
  });
}
