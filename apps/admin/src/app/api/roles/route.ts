import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";
import { createRoleSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdminAccess();
    return roleService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const body = await request.json();
    const validated = createRoleSchema.parse(body);
    return roleService.create(user, validated);
  });
}
