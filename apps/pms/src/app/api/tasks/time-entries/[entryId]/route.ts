import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timeEntryService } from "@/server/services/time-entry.service";
import { updateTimeEntrySchema, stopTimeEntrySchema } from "@zsyio/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { entryId } = await params;
    const body = await request.json();

    if (body.action === "stop") {
      const input = stopTimeEntrySchema.parse(body);
      return timeEntryService.stop(user, entryId, input);
    }

    const input = updateTimeEntrySchema.parse(body);
    return timeEntryService.update(user, entryId, input);
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { entryId } = await params;
    await timeEntryService.delete(user, entryId);
    return { success: true };
  });
}
