import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { createTestCaseSchema } from "@zsyio/validators";
import { testCaseService } from "@/server/services/test-case.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return testCaseService.listOrSeed(user, id);
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = createTestCaseSchema.parse(await request.json());
    return testCaseService.create(user, id, body);
  });
}
