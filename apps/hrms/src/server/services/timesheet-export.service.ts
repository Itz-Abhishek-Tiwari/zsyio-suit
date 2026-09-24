import * as XLSX from "xlsx";
import { formatDuration, formatTime, formatDate } from "@zsyio/ui";
import { timesheetRepository } from "../repositories/timesheet.repository";
import type { UserContext } from "./timesheet.service";
import type { TimesheetFilterInput } from "@zsyio/validators";
import { assertCan, BadRequestError } from "@zsyio/auth/permissions";

export class TimesheetExportService {
  async generateExport(
    actor: UserContext,
    filters: TimesheetFilterInput,
    format: "csv" | "xlsx",
    reportType: "summary" | "detailed"
  ) {
    assertCan(actor.role, "timesheet:export", actor.permissions);

    const tz = filters.timezone || process.env.APP_TIMEZONE || process.env.NEXT_PUBLIC_APP_TIMEZONE || "Europe/Berlin";
    const startDate = filters.startDate ? new Date(filters.startDate) : filters.date ? new Date(filters.date) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : filters.date ? new Date(filters.date) : undefined;

    const { total, sessions } = await timesheetRepository.listAdminTimesheets({
      userId: filters.userId,
      startDate,
      endDate,
      status: filters.status,
      entryType: filters.entryType,
      incompleteOnly: filters.incompleteOnly,
      search: filters.search?.trim(),
      skip: 0,
      take: 2000,
    });

    if (total > 2000) {
      throw new BadRequestError(
        `Found ${total} records matching filters, which exceeds the maximum export limit of 2,000. Please narrow your date range or filter criteria.`
      );
    }

    let dateSuffix = "all_records";
    if (filters.date) {
      dateSuffix = filters.date;
    } else if (filters.startDate && filters.endDate) {
      dateSuffix =
        filters.startDate === filters.endDate
          ? filters.startDate
          : `${filters.startDate}_to_${filters.endDate}`;
    } else if (filters.startDate) {
      dateSuffix = `from_${filters.startDate}`;
    } else if (filters.endDate) {
      dateSuffix = `until_${filters.endDate}`;
    } else if (sessions.length > 0) {
      const dates = sessions.map((s) => s.date.toISOString().split("T")[0]).sort();
      const minD = dates[0];
      const maxD = dates[dates.length - 1];
      dateSuffix = minD === maxD ? minD : `${minD}_to_${maxD}`;
    }

    if (reportType === "detailed") {
      const rows: Record<string, any>[] = [];

      for (const ws of sessions) {
        // Working Session Row
        rows.push({
          "Employee": ws.user.name,
          "Email": ws.user.email,
          "Date": formatDate(ws.date, tz),
          "Activity": "Working",
          "Start Time": formatTime(ws.startTime, tz),
          "End Time": ws.endTime ? formatTime(ws.endTime, tz) : "Active",
          "Duration": formatDuration(ws.durationMinutes),
          "Entry Type": ws.entryType === "MANUAL" ? "Manual" : "Automatic",
          "Reason": ws.reason || "",
        });

        // OOO Session Rows
        for (const os of ws.oooEntries) {
          rows.push({
            "Employee": ws.user.name,
            "Email": ws.user.email,
            "Date": formatDate(ws.date, tz),
            "Activity": "Break",
            "Start Time": formatTime(os.startTime, tz),
            "End Time": os.endTime ? formatTime(os.endTime, tz) : "Active",
            "Duration": formatDuration(os.durationMinutes),
            "Entry Type": os.entryType === "MANUAL" ? "Manual" : "Automatic",
            "Reason": os.reason || "",
          });
        }
      }

      return this.serializeData(rows, format, "Detailed_Timesheet", dateSuffix);
    } else {
      // Summary Report: Aggregate by (employee + date)
      const dayMap = new Map<string, {
        userId: string;
        userName: string;
        userEmail: string;
        date: Date;
        sessions: typeof sessions;
      }>();

      for (const ws of sessions) {
        const dateKey = `${ws.userId}_${new Date(ws.date).toISOString().split("T")[0]}`;
        const existing = dayMap.get(dateKey);
        if (existing) {
          existing.sessions.push(ws);
        } else {
          dayMap.set(dateKey, {
            userId: ws.userId,
            userName: ws.user.name,
            userEmail: ws.user.email,
            date: ws.date,
            sessions: [ws],
          });
        }
      }

      const rows = Array.from(dayMap.values()).map((group) => {
        group.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const firstWs = group.sessions[0];
        const lastWs = group.sessions[group.sessions.length - 1];

        let totalWork = 0;
        let totalOoo = 0;
        let hasManual = false;
        let hasIncomplete = false;
        let hasActive = false;

        for (const ws of group.sessions) {
          if (ws.entryType === "MANUAL") hasManual = true;
          if (ws.status === "INCOMPLETE") hasIncomplete = true;
          if (ws.status === "ACTIVE") hasActive = true;
          totalWork += ws.durationMinutes ?? 0;

          for (const os of ws.oooEntries) {
            if (os.entryType === "MANUAL") hasManual = true;
            totalOoo += os.durationMinutes ?? 0;
          }
        }

        const netWorking = Math.max(0, totalWork - totalOoo);
        const statusLabel = hasIncomplete ? "Incomplete" : hasActive ? "In Progress" : "Completed";

        return {
          "Employee": group.userName,
          "Email": group.userEmail,
          "Date": formatDate(group.date, tz),
          "First Clock In": firstWs?.startTime ? formatTime(firstWs.startTime, tz) : "--:--",
          "Last Clock Out": hasActive ? "Active" : (lastWs.endTime ? formatTime(lastWs.endTime, tz) : "Active"),
          "Working Hours": formatDuration(netWorking),
          "Break Duration": formatDuration(totalOoo),
          "Status": statusLabel,
          "Manual Entries": hasManual ? "Yes" : "No",
        };
      });

      return this.serializeData(rows, format, "Timesheet_Summary", dateSuffix);
    }
  }

  private serializeData(
    data: Record<string, any>[],
    format: "csv" | "xlsx",
    sheetName: string,
    dateSuffix: string
  ) {
    const worksheet = XLSX.utils.json_to_sheet(data);

    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: `${sheetName}_${dateSuffix}.xlsx`,
      };
    } else {
      const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
      return {
        buffer: Buffer.from(csvContent, "utf-8"),
        contentType: "text/csv; charset=utf-8",
        filename: `${sheetName}_${dateSuffix}.csv`,
      };
    }
  }
}

export const timesheetExportService = new TimesheetExportService();
