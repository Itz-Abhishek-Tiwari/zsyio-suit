import { NextRequest } from "next/server";
import { withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";
import { acceptInvitationSchema } from "@zsyio/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return withApiHandler(async () => {
    const { token } = await params;
    const body = acceptInvitationSchema.parse(await request.json());
    return userService.acceptInvitation(token, body);
  });
}
