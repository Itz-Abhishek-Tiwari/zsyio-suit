import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesLeadService } from "@/server/services/sales-lead.service";
import { moveSalesLeadSchema } from "@zsyio/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = moveSalesLeadSchema.parse(await request.json());
    return salesLeadService.move(user, id, body);
  });
}
