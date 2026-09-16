import { NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { taskColumnsRepository } from "@/server/repositories/task-columns.repository";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:create:any", user.permissions);

    const resetColumns = await taskColumnsRepository.resetOrder();
    return NextResponse.json(resetColumns);
  });
}
