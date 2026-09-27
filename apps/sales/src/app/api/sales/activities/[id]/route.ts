import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesActivityService } from "@/server/services/sales-activity.service";
import { updateSalesActivitySchema } from "@zsyio/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateSalesActivitySchema.parse(await request.json());
    return salesActivityService.update(user, id, body);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return salesActivityService.delete(user, id);
  });
}
