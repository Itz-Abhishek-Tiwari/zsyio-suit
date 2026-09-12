import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";
import { updateRoleSchema } from "@zsyio/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    await requireUser();
    const { id } = await params;
    return roleService.getById(id);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const validated = updateRoleSchema.parse(body);
    return roleService.update(user, id, validated);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return roleService.delete(user, id);
  });
}
