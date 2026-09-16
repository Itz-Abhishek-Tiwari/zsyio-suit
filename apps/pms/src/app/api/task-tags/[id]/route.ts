import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    await requireUser();
    const { id } = await params;
    await prisma.taskTag.delete({ where: { id } });
    return { success: true };
  });
}
