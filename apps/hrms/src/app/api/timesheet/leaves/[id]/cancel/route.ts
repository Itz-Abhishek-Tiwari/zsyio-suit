import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await leaveService.cancelLeave(user, id);
    return { success: true, message: "Leave request cancelled successfully" };
  });
}
