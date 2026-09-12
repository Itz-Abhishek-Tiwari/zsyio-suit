import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";
import { updateUserSchema } from "@zsyio/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    await requireUser();
    const { id } = await params;
    return userService.getById(id);
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
    const validated = updateUserSchema.parse(body);
    return userService.update(user, id, validated);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return userService.delete(user, id);
  });
}
