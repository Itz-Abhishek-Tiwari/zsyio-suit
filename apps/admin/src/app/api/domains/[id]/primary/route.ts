import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { domainService } from "@/server/services/domain.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return domainService.setPrimary(user, id);
  });
}
