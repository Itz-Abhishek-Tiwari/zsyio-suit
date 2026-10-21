import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const { id } = await params;
    return userService.resendInvitation(user, id);
  });
}
