import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";
import { createCommentSchema } from "@zsyio/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const input = createCommentSchema.parse(await request.json());
    return taskService.addComment(user, id, input.body, input.parentId);
  });
}
