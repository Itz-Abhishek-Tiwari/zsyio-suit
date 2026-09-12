import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { teamService } from "@/server/services/team.service";
import { createTeamSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return teamService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const validated = createTeamSchema.parse(body);
    return teamService.create(user, validated);
  });
}
