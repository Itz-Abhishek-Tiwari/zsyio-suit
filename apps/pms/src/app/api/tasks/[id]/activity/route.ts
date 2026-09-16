import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const activityLogs = await taskService.getActivityLogs(user, id);
    if (!activityLogs) return errorResponse("NOT_FOUND", "Task not found.", 404);
    return activityLogs;
  });
}
