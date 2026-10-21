import { NextRequest } from "next/server";
import { requireAdminAccess, withApiHandler } from "@zsyio/auth/api-helpers";
import { teamService } from "@/server/services/team.service";
import { createTeamSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdminAccess();
    return teamService.list();
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireAdminAccess();
    const body = await request.json();
    const validated = createTeamSchema.parse(body);
    return teamService.create(user, validated);
  });
}
