import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { domainService } from "@/server/services/domain.service";
import { createDomainSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return domainService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const validated = createDomainSchema.parse(body);
    return domainService.create(user, validated);
  });
}
