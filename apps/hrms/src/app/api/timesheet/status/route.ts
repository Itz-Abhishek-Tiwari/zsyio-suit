import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return timesheetService.getTodayStatus(user);
  });
}
