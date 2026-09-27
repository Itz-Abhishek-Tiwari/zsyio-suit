import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesLeadService } from "@/server/services/sales-lead.service";
import { convertToDevClientSchema } from "@zsyio/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = convertToDevClientSchema.parse(await request.json());
    return salesLeadService.convert(user, id, body.reason ?? undefined);
  });
}
