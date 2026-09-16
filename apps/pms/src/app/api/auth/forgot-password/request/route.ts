import { NextRequest } from "next/server";
import { forgotPasswordRequestSchema } from "@zsyio/validators";
import { userService } from "@/server/services/user.service";
import { withApiHandler } from "@zsyio/auth/api-helpers";

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const body = await req.json();
    if (process.env.NODE_ENV === "development") {
      console.log(`\n📨 [Forgot Password] Request received for: ${body.email}`);
    }
    const validated = forgotPasswordRequestSchema.parse(body);
    const result = await userService.requestPasswordResetOtp(validated.email);
    return result;
  });
}
