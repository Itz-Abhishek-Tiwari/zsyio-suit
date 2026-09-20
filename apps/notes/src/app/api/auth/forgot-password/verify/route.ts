import { NextRequest } from "next/server";
import { forgotPasswordVerifySchema } from "@zsyio/validators";
import { userService } from "@/server/services/user.service";
import { withApiHandler } from "@zsyio/auth/api-helpers";

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    const validated = forgotPasswordVerifySchema.parse(body);

    return userService.verifyPasswordResetOtp(
      validated.email,
      validated.otp,
      validated.newPassword
    );
  });
}
