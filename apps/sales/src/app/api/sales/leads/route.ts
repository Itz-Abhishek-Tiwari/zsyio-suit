import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesLeadService } from "@/server/services/sales-lead.service";
import { createSalesLeadSchema, salesLeadFiltersSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const filters = salesLeadFiltersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return salesLeadService.list(user, filters);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createSalesLeadSchema.parse(await request.json());
    return salesLeadService.create(user, body);
  });
}
