import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";
import { adjustUserLeaveAllocationSchema } from "@zsyio/validators";

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const input = adjustUserLeaveAllocationSchema.parse(body);
    return leaveService.adjustUserLeaveAllocation(user, input);
  });
}
