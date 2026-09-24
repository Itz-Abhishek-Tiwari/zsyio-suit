import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";
import { applyLeaveSchema } from "@zsyio/validators";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const isTeam = searchParams.get("team") === "true";
    const status = searchParams.get("status") || undefined;

    if (isTeam) {
      return leaveService.getTeamLeaves(user, status);
    }

    return leaveService.getLeaveOverview(user);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const validated = applyLeaveSchema.parse(body);
    return leaveService.applyLeave(user, validated);
  });
}
