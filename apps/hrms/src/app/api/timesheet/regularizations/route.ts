import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { regularizationService } from "@/server/services/regularization.service";
import { applyRegularizationSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return regularizationService.getMyRegularizations(user);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const input = applyRegularizationSchema.parse(body);
    return regularizationService.applyRegularization(user, input);
  });
}
