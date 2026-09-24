import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";
import { adminCorrectionSchema } from "@zsyio/validators";

export async function PUT(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await request.json();
    const input = adminCorrectionSchema.parse(body);
    return timesheetService.adminCorrectSession(user, input);
  });
}
