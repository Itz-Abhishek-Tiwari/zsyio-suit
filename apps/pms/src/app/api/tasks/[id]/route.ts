import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";
import { updateTaskSchema } from "@zsyio/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const task = await taskService.getById(user, id);
    if (!task) return errorResponse("NOT_FOUND", "Task not found.", 404);
    return task;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateTaskSchema.parse(await request.json());
    return taskService.update(user, id, body);
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await taskService.softDelete(user, id);
    return { success: true };
  });
}
