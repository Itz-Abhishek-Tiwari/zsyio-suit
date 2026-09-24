import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";
import { fixTimesheetSchema } from "@zsyio/validators";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const input = fixTimesheetSchema.parse(body);
    return timesheetService.fixTimesheet(user, input);
  });
}
