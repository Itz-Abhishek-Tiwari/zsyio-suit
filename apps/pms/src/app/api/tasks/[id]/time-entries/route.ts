import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timeEntryService } from "@/server/services/time-entry.service";
import { createTimeEntrySchema } from "@zsyio/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    return timeEntryService.getByTaskId(user, id);
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const json = await request.json();
    const input = createTimeEntrySchema.parse({
      ...json,
      taskId: id,
    });
    return timeEntryService.create(user, input);
  });
}
