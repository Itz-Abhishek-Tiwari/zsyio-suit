import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";
import { createRoleSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return roleService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const validated = createRoleSchema.parse(body);
    return roleService.create(user, validated);
  });
}
