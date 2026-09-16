import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { updateTeamSchema } from "@zsyio/validators";
import { teamService } from "@/server/services/team.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const team = await teamService.findById(user, id);
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }
    return NextResponse.json(team);
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
    const validated = updateTeamSchema.parse(body);

    const updated = await teamService.update(user, id, validated);
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
    await teamService.delete(user, id);
    return NextResponse.json({ success: true });
  });
}
