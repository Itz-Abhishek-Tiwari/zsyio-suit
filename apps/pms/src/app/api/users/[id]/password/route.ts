import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";

const adminSetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Must contain at least one number."),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = adminSetPasswordSchema.parse(await request.json());
    return userService.setPassword(user, id, body.password);
  });
}
