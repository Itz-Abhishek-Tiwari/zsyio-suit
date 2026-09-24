import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";
import { timesheetFilterSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = timesheetFilterSchema.parse(query);
    return timesheetService.listAdminTimesheets(user, filters);
  });
}
