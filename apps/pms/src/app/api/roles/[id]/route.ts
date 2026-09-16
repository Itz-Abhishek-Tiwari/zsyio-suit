import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { roleService } from "@/server/services/role.service";
import { updateRoleSchema } from "@zsyio/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    await requireUser();
    const { id } = await params;
    const role = await roleService.findById(id);
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const validated = updateRoleSchema.parse(body);
    const updated = await roleService.update(user, id, validated);
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await roleService.delete(user, id);
    return NextResponse.json({ success: true });
  });
}
