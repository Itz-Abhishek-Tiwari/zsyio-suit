import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";
import { createRoleSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const roles = await roleService.list();
    return NextResponse.json(roles);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const validated = createRoleSchema.parse(body);
    const role = await roleService.create(user, validated);
    return NextResponse.json(role, { status: 201 });
  });
}
