import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { createTeamSchema } from "@zsyio/validators";
import { teamService } from "@/server/services/team.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    const teams = await teamService.list(user);
    return NextResponse.json(teams);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const validated = createTeamSchema.parse(body);
    const team = await teamService.create(user, validated);
    return NextResponse.json(team, { status: 201 });
  });
}
