import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { domainService } from "@/server/services/domain.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const { id } = await params;
    return domainService.setPrimary(user, id);
  });
}
