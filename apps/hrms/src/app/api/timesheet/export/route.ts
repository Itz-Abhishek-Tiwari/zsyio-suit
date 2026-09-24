import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@zsyio/auth/api-helpers";
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
    console.error("Export error:", err);
    return NextResponse.json(
      { error: { code: "EXPORT_FAILED", message: err.message || "Failed to generate timesheet export." } },
      { status: 500 }
    );
  }
}
