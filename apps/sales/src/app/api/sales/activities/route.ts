import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesActivityService } from "@/server/services/sales-activity.service";
import { createSalesActivitySchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    return salesActivityService.list(user, {
      leadId: params.get("leadId") ?? undefined,
      status: params.get("status") ?? undefined,
      assignedToId: params.get("assignedToId") ?? undefined,
    });
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createSalesActivitySchema.parse(await request.json());
    return salesActivityService.create(user, body);
  });
}
