import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";
import { createTaskSchema, taskFiltersSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const filters = taskFiltersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return taskService.list(user, filters);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createTaskSchema.parse(await request.json());
    return taskService.create(user, body);
  });
}
