import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { createTaskTypeSchema } from "@zsyio/validators";
import { taskTypesRepository } from "@/server/repositories/task-types.repository";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const customTypes = await taskTypesRepository.list();
    return NextResponse.json(customTypes);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:create:any", user.permissions);

    const body = await request.json();
    const validated = createTaskTypeSchema.parse(body);

    const created = await taskTypesRepository.create(validated);
    return NextResponse.json(created, { status: 201 });
  });
}
