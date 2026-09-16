import { NextRequest } from "next/server";
import { withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return withApiHandler(async () => {
    const { token } = await params;
    return userService.rejectInvitation(token);
  });
}
