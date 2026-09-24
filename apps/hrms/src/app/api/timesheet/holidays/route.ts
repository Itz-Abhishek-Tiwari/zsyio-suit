import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { holidayService } from "@/server/services/holiday.service";
import { createHolidaySchema } from "@zsyio/validators";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    return holidayService.getHolidays(year);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const input = createHolidaySchema.parse(body);
    return holidayService.createHoliday(user, input);
  });
}
