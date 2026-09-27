import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesLeadService } from "@/server/services/sales-lead.service";
import { updateSalesLeadSchema } from "@zsyio/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return salesLeadService.getById(user, id);
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateSalesLeadSchema.parse(await request.json());
    return salesLeadService.update(user, id, body);
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return salesLeadService.softDelete(user, id);
  });
}
