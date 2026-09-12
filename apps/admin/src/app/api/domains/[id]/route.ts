import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { domainService } from "@/server/services/domain.service";
import { updateDomainSchema } from "@zsyio/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const validated = updateDomainSchema.parse(body);
    return domainService.update(user, id, validated);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return domainService.delete(user, id);
  });
}
