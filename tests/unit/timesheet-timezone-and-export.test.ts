import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatTime, formatDate, localTimeToIso } from "@zsyio/ui";
import { parseDateTimeInTimeZone } from "../../apps/hrms/src/server/repositories/timesheet.repository";
import { timesheetExportService } from "../../apps/hrms/src/server/services/timesheet-export.service";
import { timesheetRepository } from "../../apps/hrms/src/server/repositories/timesheet.repository";

vi.mock("../../apps/hrms/src/server/repositories/timesheet.repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../apps/hrms/src/server/repositories/timesheet.repository")>();
  return {
    ...actual,
    timesheetRepository: {
      ...actual.timesheetRepository,
      listAdminTimesheets: vi.fn(),
    },
  };
});

describe("Timezone handling and CSV/XLSX export formatting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseDateTimeInTimeZone", () => {
    it("correctly parses summer time (CEST / UTC+2) wall clock time to UTC", () => {
      // On 2026-09-07, Germany is in CEST (UTC+2)
      const parsedIn = parseDateTimeInTimeZone("2026-09-07", "09:00", "Europe/Berlin");
      expect(parsedIn.toISOString()).toBe("2026-09-07T07:00:00.000Z");

      const parsedOut = parseDateTimeInTimeZone("2026-09-07", "18:00", "Europe/Berlin");
      expect(parsedOut.toISOString()).toBe("2026-09-07T16:00:00.000Z");
    });

    it("correctly parses winter time (CET / UTC+1) wall clock time to UTC", () => {
      // On 2026-01-15, Germany is in CET (UTC+1)
      const parsedIn = parseDateTimeInTimeZone("2026-01-15", "09:00", "Europe/Berlin");
      expect(parsedIn.toISOString()).toBe("2026-01-15T08:00:00.000Z");

      const parsedOut = parseDateTimeInTimeZone("2026-01-15", "18:00", "Europe/Berlin");
      expect(parsedOut.toISOString()).toBe("2026-01-15T17:00:00.000Z");
    });

    it("passes through full ISO strings directly", () => {
      const iso = "2026-09-07T07:30:00.000Z";
      const parsed = parseDateTimeInTimeZone("2026-09-07", iso);
      expect(parsed.toISOString()).toBe(iso);
    });
  });

  describe("formatTime and formatDate with timezone", () => {
    it("formats UTC timestamps into Europe/Berlin local time", () => {
      // 07:00 UTC on Sep 7 is 09:00 CEST
      const dIn = new Date("2026-09-07T07:00:00.000Z");
      expect(formatTime(dIn, "Europe/Berlin")).toBe("09:00 AM");

      // 16:00 UTC on Sep 7 is 18:00 CEST (06:00 PM)
      const dOut = new Date("2026-09-07T16:00:00.000Z");
      expect(formatTime(dOut, "Europe/Berlin")).toBe("06:00 PM");

      // Date formatted in timezone
      expect(formatDate(dIn, "Europe/Berlin")).toBe("Sep 7, 2026");
    });
  });

  describe("timesheetExportService", () => {
    const mockAdmin = {
      id: "admin-1",
      name: "Admin User",
      email: "admin@zsyio.de",
      role: "ADMIN",
      permissions: ["timesheet:export", "timesheet:view:all"],
    };

    it("formats exported times matching the user's timezone instead of UTC", async () => {
      vi.mocked(timesheetRepository.listAdminTimesheets).mockResolvedValue({
        sessions: [
          {
            id: "ws-1",
            userId: "emp-1",
            date: new Date("2026-09-07T00:00:00.000Z"),
            startTime: new Date("2026-09-07T07:00:00.000Z"), // 09:00 local CEST
            endTime: new Date("2026-09-07T16:00:00.000Z"), // 18:00 local CEST
            durationMinutes: 540,
            entryType: "AUTOMATIC",
            status: "COMPLETED",
            reason: null,
            user: { name: "Alexander Becker", email: "alexander@zsyio.de" },
            oooEntries: [],
          } as any,
        ],
        total: 1,
      });

      const res = await timesheetExportService.generateExport(
        mockAdmin,
        { timezone: "Europe/Berlin" },
        "csv",
        "detailed"
      );

      const csvContent = (res.buffer as Buffer).toString("utf-8");
      // The export should contain 09:00 AM and 06:00 PM, NOT 07:00 AM and 04:00 PM
      expect(csvContent).toContain("09:00 AM");
      expect(csvContent).toContain("06:00 PM");
      expect(csvContent).not.toContain("07:00 AM");
      expect(csvContent).not.toContain("04:00 PM");
    });

    it("uses the selected report date in the export filename instead of today's date", async () => {
      vi.mocked(timesheetRepository.listAdminTimesheets).mockResolvedValue({
        sessions: [],
        total: 0,
      });

      const resDate = await timesheetExportService.generateExport(
        mockAdmin,
        { date: "2026-08-15" },
        "csv",
        "detailed"
      );
      expect(resDate.filename).toBe("Detailed_Timesheet_2026-08-15.csv");

      const resRange = await timesheetExportService.generateExport(
        mockAdmin,
        { startDate: "2026-08-01", endDate: "2026-08-07" },
        "xlsx",
        "summary"
      );
      expect(resRange.filename).toBe("Timesheet_Summary_2026-08-01_to_2026-08-07.xlsx");
    });
  });
});
