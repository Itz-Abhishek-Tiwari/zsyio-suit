import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";
import { createUserSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    await requireAdminAccess();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const role = searchParams.get("role") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    return userService.list({ q, role, status });
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const body = await request.json();
    const validated = createUserSchema.parse(body);
    return userService.create(user, validated);
  });
}
