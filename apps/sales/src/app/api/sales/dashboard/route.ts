import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { salesDashboardService } from "@/server/services/sales-dashboard.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return salesDashboardService.getStats(user);
  });
}
