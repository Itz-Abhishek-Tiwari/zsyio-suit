import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { regularizationService } from "@/server/services/regularization.service";
import type { RegularizationStatus } from "@zsyio/types";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as RegularizationStatus | "ALL" | undefined;
    return regularizationService.getTeamRegularizations(user, status || undefined);
  });
}
