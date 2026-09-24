import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || undefined;
    const targetUserId = searchParams.get("userId") || undefined;

    return timesheetService.getDailyTimesheet(user, targetUserId, date);
  });
}
