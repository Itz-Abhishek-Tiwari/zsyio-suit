import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetService } from "@/server/services/timesheet.service";
import { startOooSchema } from "@zsyio/validators";

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body
    }
    const input = startOooSchema.parse(body);
    return timesheetService.startOoo(user, input);
  });
}
