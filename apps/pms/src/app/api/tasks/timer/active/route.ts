import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timeEntryService } from "@/server/services/time-entry.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    const active = await timeEntryService.getActive(user);
    return { active };
  });
}
