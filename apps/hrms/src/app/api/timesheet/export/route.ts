import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { timesheetExportService } from "@/server/services/timesheet-export.service";
import { timesheetFilterSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;

    const format = (searchParams.get("format") === "xlsx" ? "xlsx" : "csv") as "csv" | "xlsx";
    const reportType = (searchParams.get("type") === "detailed" ? "detailed" : "summary") as "summary" | "detailed";

    const query = Object.fromEntries(searchParams.entries());
    const filters = timesheetFilterSchema.parse(query);

    const { buffer, contentType, filename } = await timesheetExportService.generateExport(
      user,
      filters,
      format,
      reportType
    );

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    if (err instanceof Response) return err;
    console.error("Export error:", err);
    return withApiHandler(async () => {
      throw err;
    });
  }
}
