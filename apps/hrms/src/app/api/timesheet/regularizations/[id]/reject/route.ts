import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { regularizationService } from "@/server/services/regularization.service";
import { reviewRegularizationSchema } from "@zsyio/validators";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const input = reviewRegularizationSchema.parse({
      ...body,
      status: "REJECTED",
    });
    return regularizationService.reviewRegularization(user, id, input);
  });
}
