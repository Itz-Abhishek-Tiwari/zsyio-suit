import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { taskColumnsRepository } from "@/server/repositories/task-columns.repository";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:create:any", user.permissions);
    const { id } = await params;

    // Support deletion by ID or by statusKey (e.g. CUSTOM_QA)
    if (id.startsWith("CUSTOM_") || id.startsWith("custom_")) {
      await taskColumnsRepository.deleteByStatusKey(id);
    } else {
      try {
        await taskColumnsRepository.delete(id);
      } catch {
        await taskColumnsRepository.deleteByStatusKey(id);
      }
    }

    return NextResponse.json({ success: true });
  });
}
