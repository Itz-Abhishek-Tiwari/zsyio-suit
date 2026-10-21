import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const { id } = await params;
    const body = await request.json();
    const { password } = resetPasswordSchema.parse(body);
    return userService.resetPassword(user, id, password);
  });
}
