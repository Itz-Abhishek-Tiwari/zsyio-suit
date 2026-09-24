import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    return leaveService.getAllUserLeaveBalances(user, year);
  });
}
