import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { holidayService } from "@/server/services/holiday.service";
import { updateHolidaySchema } from "@zsyio/validators";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await req.json();
    const input = updateHolidaySchema.parse(body);
    return holidayService.updateHoliday(user, id, input);
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    return holidayService.deleteHoliday(user, id);
  });
}
