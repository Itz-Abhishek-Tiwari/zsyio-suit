import { NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireUser();
    const roles = await roleService.resetDefaults(user);
    return NextResponse.json(roles);
  });
}
