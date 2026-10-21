import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { domainService } from "@/server/services/domain.service";
import { createDomainSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdminAccess();
    return domainService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const body = await request.json();
    const validated = createDomainSchema.parse(body);
    return domainService.create(user, validated);
  });
}
