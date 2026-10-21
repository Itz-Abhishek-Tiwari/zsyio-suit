import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { assertCan } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "task:edit:any", user.permissions);
    const { id } = await params;
    await prisma.taskTag.delete({ where: { id } });
    return { success: true };
  });
}
