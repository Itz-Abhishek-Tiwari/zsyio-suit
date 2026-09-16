import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { updateTestCaseSchema } from "@zsyio/validators";
import { testCaseService } from "@/server/services/test-case.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testCaseId: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id, testCaseId } = await params;
    const body = updateTestCaseSchema.parse(await request.json());
    return testCaseService.update(user, id, testCaseId, body);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; testCaseId: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id, testCaseId } = await params;
    return testCaseService.delete(user, id, testCaseId);
  });
}
