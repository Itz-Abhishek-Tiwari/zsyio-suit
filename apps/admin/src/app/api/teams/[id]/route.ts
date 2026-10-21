import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { teamService } from "@/server/services/team.service";
import { updateTeamSchema } from "@zsyio/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    await requireAdminAccess();
    const { id } = await params;
    return teamService.getById(id);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const { id } = await params;
    const body = await request.json();
    const validated = updateTeamSchema.parse(body);
    return teamService.update(user, id, validated);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const { id } = await params;
    return teamService.delete(user, id);
  });
}
