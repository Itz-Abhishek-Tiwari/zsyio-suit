import {
  assertCan,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import { holidayService } from "./holiday.service";
import { hrSettingsService } from "./hr-settings.service";
import { leaveService } from "./leave.service";
import { timesheetRepository, normalizeDate, parseDateTimeInTimeZone } from "../repositories/timesheet.repository";
import type {
  ClockInInput,
  ClockOutInput,
  StartOooInput,
  EndOooInput,
  ManualWorkSessionInput,
  ManualOooSessionInput,
  FixTimesheetInput,
  AdminCorrectionInput,
  TimesheetFilterInput,
} from "@zsyio/validators";

export interface UserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  customRoleId?: string | null;
  permissions?: string[] | null;
}

export class TimesheetService {
  async getTodayStatus(user: UserContext) {
    assertCan(user.role, "timesheet:view:own", user.permissions);

    const now = new Date();
    const today = normalizeDate(now);

    // Auto-detect and mark stale active sessions from previous days as INCOMPLETE.
    // Use batched updateMany (not serial awaits) to avoid partial writes on network error
    // and to reduce DB round-trips - this runs on every dashboard page load.
    const yesterdayIncomplete = await timesheetRepository.findIncompleteSessions(user.id, today);
    const staleWorkIds = yesterdayIncomplete.workSessions
      .filter((ws) => ws.status === "ACTIVE")
      .map((ws) => ws.id);
    const staleOooIds = yesterdayIncomplete.oooSessions
      .filter((os) => os.status === "ACTIVE")
      .map((os) => os.id);

    const hasStale = staleWorkIds.length > 0 || staleOooIds.length > 0;
    if (hasStale) {
      await Promise.all([
        staleWorkIds.length > 0
          ? prisma.workSession.updateMany({
              where: { id: { in: staleWorkIds } },
              data: { status: "INCOMPLETE" },
            })
          : Promise.resolve(),
        staleOooIds.length > 0
          ? prisma.oooSession.updateMany({
              where: { id: { in: staleOooIds } },
              data: { status: "INCOMPLETE" },
            })
          : Promise.resolve(),
      ]);
    }

    const [activeWork, activeOoo, todayWorkSessions, todayOooSessions] = await Promise.all([
      timesheetRepository.findActiveWorkSession(user.id),
      timesheetRepository.findActiveOooSession(user.id),
      timesheetRepository.findWorkSessionsForDay(user.id, today),
      timesheetRepository.findOooSessionsForDay(user.id, today),
    ]);

    let state: "WORKING" | "OOO" | "CLOCKED_OUT" = "CLOCKED_OUT";
    if (activeOoo) {
      state = "OOO";
    } else if (activeWork) {
      state = "WORKING";
    }

    // Calculate today's totals
    let todayTotalSessionMinutes = 0;
    for (const ws of todayWorkSessions) {
      if (ws.durationMinutes) {
        todayTotalSessionMinutes += ws.durationMinutes;
      } else if (ws.status === "ACTIVE") {
        const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(ws.startTime).getTime()) / 60000));
        todayTotalSessionMinutes += elapsed;
      }
    }

    let todayOooMinutes = 0;
    for (const os of todayOooSessions) {
      if (os.durationMinutes) {
        todayOooMinutes += os.durationMinutes;
      } else if (os.status === "ACTIVE") {
        const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(os.startTime).getTime()) / 60000));
        todayOooMinutes += elapsed;
      }
    }

    const todayWorkedMinutes = Math.max(0, todayTotalSessionMinutes - todayOooMinutes);

    const pendingIncomplete = hasStale
      ? await timesheetRepository.findIncompleteSessions(user.id, today)
      : yesterdayIncomplete;

    const incompleteList = [
      ...pendingIncomplete.workSessions.map((w) => ({
        id: w.id,
        type: "WORK" as const,
        date: w.date.toISOString(),
        startTime: w.startTime.toISOString(),
        reason: w.reason,
      })),
      ...pendingIncomplete.oooSessions.map((o) => ({
        id: o.id,
        type: "OOO" as const,
        date: o.date.toISOString(),
        startTime: o.startTime.toISOString(),
        reason: o.reason,
      })),
    ];

    return {
      state,
      activeWorkSession: activeWork
        ? {
            id: activeWork.id,
            startTime: activeWork.startTime.toISOString(),
            entryType: activeWork.entryType,
            reason: activeWork.reason,
          }
        : null,
      activeOooSession: activeOoo
        ? {
            id: activeOoo.id,
            startTime: activeOoo.startTime.toISOString(),
            reason: activeOoo.reason,
          }
        : null,
      todayWorkedMinutes,
      todayOooMinutes,
      todayTotalSessionMinutes,
      incompleteSessions: incompleteList,
    };
  }

  async getDashboardSummary(user: UserContext) {
    assertCan(user.role, "timesheet:view:own", user.permissions);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const monthStr = `${yyyy}-${mm}`;

    const [status, monthlyAttendance, leaves, holidays, todayTimesheet] = await Promise.all([
      this.getTodayStatus(user),
      this.getMonthlyTimesheet(user, monthStr, user.id),
      leaveService.getLeaveOverview(user),
      holidayService.getHolidays(yyyy),
      this.getDailyTimesheet(user, user.id, todayStr),
    ]);

    return {
      status,
      monthlyAttendance,
      leaves,
      upcomingHoliday: holidays.upcoming,
      todayTimesheet,
    };
  }

  async clockIn(user: UserContext, input?: ClockInInput | void) {
    assertCan(user.role, "timesheet:clock", user.permissions);

    const existingActive = await timesheetRepository.findActiveWorkSession(user.id);
    if (existingActive) {
      throw new BadRequestError("You already have an active working session. Please clock out first.");
    }

    const now = new Date();
    const date = normalizeDate(now);

    const session = await timesheetRepository.createActiveWorkSessionIfNone({
      userId: user.id,
      date,
      startTime: now,
      entryType: "AUTOMATIC",
      status: "ACTIVE",
      reason: input?.note?.trim() || null,
      createdById: user.id,
    });

    if (!session) {
      throw new BadRequestError("You already have an active working session. Please clock out first.");
    }

    return { success: true, session };
  }

  async clockOut(user: UserContext, input?: ClockOutInput | void) {
    assertCan(user.role, "timesheet:clock", user.permissions);

    const activeWork = await timesheetRepository.findActiveWorkSession(user.id);
    if (!activeWork) {
      throw new BadRequestError("No active working session found to clock out.");
    }

    const now = new Date();

    // If an OOO session is still active, close it automatically as part of clock out
    const activeOoo = await timesheetRepository.findActiveOooSession(user.id);
    if (activeOoo) {
      const oooDuration = Math.max(0, Math.floor((now.getTime() - new Date(activeOoo.startTime).getTime()) / 60000));
      await timesheetRepository.updateOooSession(activeOoo.id, {
        endTime: now,
        durationMinutes: oooDuration,
        status: "COMPLETED",
      });
    }

    const startMs = new Date(activeWork.startTime).getTime();
    const durationMinutes = Math.max(0, Math.floor((now.getTime() - startMs) / 60000));

    const updated = await timesheetRepository.updateWorkSession(activeWork.id, {
      endTime: now,
      durationMinutes,
      status: "COMPLETED",
      ...(input?.note ? { reason: input.note.trim() } : {}),
    });

    return { success: true, session: updated };
  }

  async startOoo(user: UserContext, input: StartOooInput) {
    assertCan(user.role, "timesheet:clock", user.permissions);

    const activeWork = await timesheetRepository.findActiveWorkSession(user.id);
    if (!activeWork) {
      throw new BadRequestError("You must be Clocked In / Working before starting an Out Of Office break.");
    }

    const activeOoo = await timesheetRepository.findActiveOooSession(user.id);
    if (activeOoo) {
      throw new BadRequestError("You are already in an active Out Of Office break.");
    }

    const now = new Date();
    const date = normalizeDate(now);

    const session = await timesheetRepository.createOooSession({
      userId: user.id,
      workSessionId: activeWork.id,
      date,
      startTime: now,
      entryType: "AUTOMATIC",
      status: "ACTIVE",
      reason: input.reason?.trim() || "Temporary break",
      createdById: user.id,
    });

    return { success: true, session };
  }

  async endOoo(user: UserContext, input?: EndOooInput | void) {
    assertCan(user.role, "timesheet:clock", user.permissions);

    const activeOoo = await timesheetRepository.findActiveOooSession(user.id);
    if (!activeOoo) {
      throw new BadRequestError("No active Out Of Office break found to end.");
    }

    const now = new Date();
    const startMs = new Date(activeOoo.startTime).getTime();
    const durationMinutes = Math.max(0, Math.floor((now.getTime() - startMs) / 60000));

    const updated = await timesheetRepository.updateOooSession(activeOoo.id, {
      endTime: now,
      durationMinutes,
      status: "COMPLETED",
      ...(input?.note ? { reason: input.note.trim() } : {}),
    });

    return { success: true, session: updated };
  }

  async addManualWorkSession(user: UserContext, input: ManualWorkSessionInput) {
    assertCan(user.role, "timesheet:manual:create", user.permissions);

    const date = normalizeDate(input.date);
    const datePart = input.date.split("T")[0];
    const startTime = parseDateTimeInTimeZone(datePart, input.startTime);
    const endTime = parseDateTimeInTimeZone(datePart, input.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestError("Invalid start or end time format.");
    }

    if (endTime <= startTime) {
      throw new BadRequestError("Clock Out time must be after Clock In time.");
    }

    if (endTime.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new BadRequestError("Manual entries cannot end in the future.");
    }

    const overlap = await timesheetRepository.checkWorkSessionOverlap(user.id, startTime, endTime);
    if (overlap) {
      const s = overlap.startTime ? new Date(overlap.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
      const e = overlap.endTime
        ? new Date(overlap.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "Ongoing";
      const details = s ? ` (${s} – ${e})` : "";
      throw new ConflictError(`Manual entry overlaps with an existing working session${details}.`);
    }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    const session = await timesheetRepository.createWorkSession({
      userId: user.id,
      date,
      startTime,
      endTime,
      durationMinutes,
      entryType: "MANUAL",
      status: "COMPLETED",
      reason: input.reason.trim(),
      createdById: user.id,
    });

    await timesheetRepository.createAuditLog({
      workSessionId: session.id,
      actorId: user.id,
      action: "CREATED",
      field: "entryType",
      oldValue: null,
      newValue: "MANUAL",
      reason: input.reason.trim(),
    });

    return { success: true, session };
  }

  async addManualOooSession(user: UserContext, input: ManualOooSessionInput) {
    assertCan(user.role, "timesheet:manual:create", user.permissions);

    const date = normalizeDate(input.date);
    const datePart = input.date.split("T")[0];
    const startTime = parseDateTimeInTimeZone(datePart, input.startTime);
    const endTime = parseDateTimeInTimeZone(datePart, input.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestError("Invalid break start or end time format.");
    }

    if (endTime <= startTime) {
      throw new BadRequestError("Break end time must be after break start time.");
    }

    const overlap = await timesheetRepository.checkOooSessionOverlap(user.id, startTime, endTime);
    if (overlap) {
      const s = overlap.startTime ? new Date(overlap.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
      const e = overlap.endTime
        ? new Date(overlap.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "Ongoing";
      const details = s ? ` (${s} – ${e})` : "";
      throw new ConflictError(`Manual break overlaps with an existing break${details}.`);
    }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Find if there is an overlapping or enclosing work session to attach this break to
    const enclosingWork = await timesheetRepository.checkWorkSessionOverlap(user.id, startTime, endTime);

    if (!enclosingWork) {
      throw new BadRequestError(
        "A manual break must fall within an existing work session for that date."
      );
    }

    const session = await timesheetRepository.createOooSession({
      userId: user.id,
      workSessionId: enclosingWork.id,
      date,
      startTime,
      endTime,
      durationMinutes,
      entryType: "MANUAL",
      status: "COMPLETED",
      reason: input.reason.trim(),
      createdById: user.id,
    });

    await timesheetRepository.createAuditLog({
      oooSessionId: session.id,
      actorId: user.id,
      action: "CREATED",
      field: "timeRange",
      oldValue: null,
      newValue: `${startTime.toISOString()} - ${endTime.toISOString()}`,
      reason: input.reason.trim(),
    });

    return { success: true, session };
  }

  async updateManualOooSession(user: UserContext, oooSessionId: string, input: ManualOooSessionInput) {
    const session = await timesheetRepository.getOooSessionById(oooSessionId);
    if (!session) {
      throw new NotFoundError("Out Of Office break session not found.");
    }

    const isOwner = session.userId === user.id;
    const canManage =
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      (user.permissions && user.permissions.includes("timesheet:manage"));

    if (!isOwner && !canManage) {
      throw new ForbiddenError("Not authorized to modify this Out Of Office break.");
    }

    if (session.entryType !== "MANUAL") {
      throw new BadRequestError("Only manual Out Of Office break entries can be directly modified.");
    }

    const dateStr = input.date
      ? String(input.date)
      : (session.date ? new Date(session.date).toISOString() : new Date(session.startTime).toISOString());
    const date = normalizeDate(dateStr);
    const datePart = dateStr.split("T")[0];
    const startTime = parseDateTimeInTimeZone(datePart, input.startTime);
    const endTime = parseDateTimeInTimeZone(datePart, input.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestError("Invalid break start or end time format.");
    }

    if (endTime <= startTime) {
      throw new BadRequestError("Break end time must be after break start time.");
    }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    const oldTimes = `${session.startTime.toISOString()} - ${session.endTime?.toISOString() ?? "null"}`;
    const newTimes = `${startTime.toISOString()} - ${endTime.toISOString()}`;

    const updated = await timesheetRepository.updateOooSession(session.id, {
      date,
      startTime,
      endTime,
      durationMinutes,
      reason: input.reason.trim(),
    });

    await timesheetRepository.createAuditLog({
      oooSessionId: session.id,
      actorId: user.id,
      action: "CORRECTED",
      field: "timeRange",
      oldValue: oldTimes,
      newValue: newTimes,
      reason: input.reason.trim(),
    });

    return { success: true, session: updated };
  }

  async deleteManualOooSession(user: UserContext, oooSessionId: string) {
    const session = await timesheetRepository.getOooSessionById(oooSessionId);
    if (!session) {
      throw new NotFoundError("Out Of Office break session not found.");
    }

    const isOwner = session.userId === user.id;
    const canManage =
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      (user.permissions && user.permissions.includes("timesheet:manage"));

    if (!isOwner && !canManage) {
      throw new ForbiddenError("Not authorized to delete this Out Of Office break.");
    }

    if (session.entryType !== "MANUAL") {
      throw new BadRequestError("Only manual Out Of Office break entries can be deleted.");
    }

    await timesheetRepository.createAuditLog({
      oooSessionId: session.id,
      actorId: user.id,
      action: "DELETED",
      field: "status",
      oldValue: `${session.startTime?.toISOString() ?? "null"} - ${session.endTime?.toISOString() ?? "null"} (${session.reason || "BREAK"})`,
      newValue: "DELETED",
      reason: "Manual Out Of Office break session deleted",
    });

    await timesheetRepository.deleteOooSession(session.id);

    return { success: true };
  }

  async fixTimesheet(user: UserContext, input: FixTimesheetInput) {
    const isSelfOrAdmin = (targetUserId: string) =>
      targetUserId === user.id ||
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      (user.permissions && user.permissions.includes("timesheet:manage"));

    if (input.sessionType === "WORK") {
      const session = await timesheetRepository.getWorkSessionById(input.sessionId);
      if (!session) throw new NotFoundError("Work session not found.");
      if (!isSelfOrAdmin(session.userId)) {
        throw new ForbiddenError("Not permitted to fix another employee's timesheet.");
      }

      const endTime = new Date(input.endTime);
      if (isNaN(endTime.getTime())) throw new BadRequestError("Invalid end time.");
      if (endTime.getTime() > Date.now() + 5 * 60 * 1000) {
        throw new BadRequestError("End time cannot be in the future.");
      }
      if (endTime <= new Date(session.startTime)) {
        throw new BadRequestError("Clock Out time must be after Clock In time.");
      }

      // Guard: ensure the proposed window doesn't overlap another session on the same day
      const overlap = await timesheetRepository.checkWorkSessionOverlap(
        session.userId,
        new Date(session.startTime),
        endTime,
        session.id
      );
      if (overlap) {
        throw new ConflictError(
          "The proposed clock-out time overlaps another work session. Please review and adjust the times."
        );
      }

      const durationMinutes = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 60000);

      await timesheetRepository.updateWorkSession(session.id, {
        endTime,
        durationMinutes,
        status: "COMPLETED",
      });

      await timesheetRepository.createAuditLog({
        workSessionId: session.id,
        actorId: user.id,
        action: "FIXED",
        field: "endTime",
        oldValue: session.endTime?.toISOString() ?? null,
        newValue: endTime.toISOString(),
        reason: input.reason.trim(),
      });
    } else {
      const session = await timesheetRepository.getOooSessionById(input.sessionId);
      if (!session) throw new NotFoundError("OOO break session not found.");
      if (!isSelfOrAdmin(session.userId)) {
        throw new ForbiddenError("Not permitted to fix another employee's timesheet.");
      }

      const endTime = new Date(input.endTime);
      if (isNaN(endTime.getTime())) throw new BadRequestError("Invalid end time.");
      if (endTime.getTime() > Date.now() + 5 * 60 * 1000) {
        throw new BadRequestError("End time cannot be in the future.");
      }
      if (endTime <= new Date(session.startTime)) {
        throw new BadRequestError("Break end time must be after break start time.");
      }

      const durationMinutes = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 60000);

      await timesheetRepository.updateOooSession(session.id, {
        endTime,
        durationMinutes,
        status: "COMPLETED",
      });

      await timesheetRepository.createAuditLog({
        oooSessionId: session.id,
        actorId: user.id,
        action: "FIXED",
        field: "endTime",
        oldValue: session.endTime?.toISOString() ?? null,
        newValue: endTime.toISOString(),
        reason: input.reason.trim(),
      });
    }

    return { success: true };
  }

  async adminCorrectSession(actor: UserContext, input: AdminCorrectionInput) {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestError("Invalid timestamps provided.");
    }

    if (endTime <= startTime) {
      throw new BadRequestError("End time must be strictly after start time.");
    }

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    if (input.sessionType === "WORK") {
      const session = await timesheetRepository.getWorkSessionById(input.sessionId);
      if (!session) throw new NotFoundError("Working session not found.");

      const oldTimes = `${session.startTime.toISOString()} - ${session.endTime?.toISOString() ?? "null"}`;
      const newTimes = `${startTime.toISOString()} - ${endTime.toISOString()}`;

      await timesheetRepository.updateWorkSession(session.id, {
        startTime,
        endTime,
        durationMinutes,
        status: "COMPLETED",
      });

      await timesheetRepository.createAuditLog({
        workSessionId: session.id,
        actorId: actor.id,
        action: "CORRECTED",
        field: "timeRange",
        oldValue: oldTimes,
        newValue: newTimes,
        reason: input.reason.trim(),
      });
    } else {
      const session = await timesheetRepository.getOooSessionById(input.sessionId);
      if (!session) throw new NotFoundError("OOO session not found.");

      const oldTimes = `${session.startTime.toISOString()} - ${session.endTime?.toISOString() ?? "null"}`;
      const newTimes = `${startTime.toISOString()} - ${endTime.toISOString()}`;

      await timesheetRepository.updateOooSession(session.id, {
        startTime,
        endTime,
        durationMinutes,
        status: "COMPLETED",
      });

      await timesheetRepository.createAuditLog({
        oooSessionId: session.id,
        actorId: actor.id,
        action: "CORRECTED",
        field: "timeRange",
        oldValue: oldTimes,
        newValue: newTimes,
        reason: input.reason.trim(),
      });
    }

    return { success: true };
  }

  async getDailyTimesheet(actor: UserContext, targetUserId?: string, dateStr?: string) {
    const userId = targetUserId || actor.id;

    if (userId !== actor.id) {
      assertCan(actor.role, "timesheet:view:all", actor.permissions);
    } else {
      assertCan(actor.role, "timesheet:view:own", actor.permissions);
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError("Invalid date.");
    }
    const normalized = normalizeDate(targetDate);

    const [workSessions, oooSessions] = await Promise.all([
      timesheetRepository.findWorkSessionsForDay(userId, normalized),
      timesheetRepository.findOooSessionsForDay(userId, normalized),
    ]);

    // Build timeline items
    const timeline: {
      id: string;
      type: "WORK" | "OOO";
      label: "Working" | "Break" | "OOO";
      startTime: string;
      endTime: string | null;
      durationMinutes: number;
      entryType: "AUTOMATIC" | "MANUAL";
      status: "ACTIVE" | "COMPLETED" | "INCOMPLETE";
      reason?: string | null;
      hasAuditLogs: boolean;
    }[] = [];

    let totalSessionMinutes = 0;
    let totalOooMinutes = 0;
    let manualEntriesCount = 0;
    let firstClockIn: string | null = null;
    let lastClockOut: string | null = null;
    let hasIncomplete = false;

    for (const ws of workSessions) {
      if (ws.entryType === "MANUAL") manualEntriesCount++;
      if (ws.status === "INCOMPLETE") hasIncomplete = true;

      const dur = ws.durationMinutes ?? 0;
      totalSessionMinutes += dur;

      if (!firstClockIn || new Date(ws.startTime) < new Date(firstClockIn)) {
        firstClockIn = ws.startTime.toISOString();
      }
      if (ws.endTime) {
        if (!lastClockOut || new Date(ws.endTime) > new Date(lastClockOut)) {
          lastClockOut = ws.endTime.toISOString();
        }
      }

      timeline.push({
        id: ws.id,
        type: "WORK",
        label: "Working",
        startTime: ws.startTime.toISOString(),
        endTime: ws.endTime?.toISOString() ?? null,
        durationMinutes: dur,
        entryType: ws.entryType,
        status: ws.status,
        reason: ws.reason,
        hasAuditLogs: ws.auditLogs.length > 0,
      });
    }

    for (const os of oooSessions) {
      if (os.entryType === "MANUAL") manualEntriesCount++;
      if (os.status === "INCOMPLETE") hasIncomplete = true;

      const dur = os.durationMinutes ?? 0;
      totalOooMinutes += dur;

      timeline.push({
        id: os.id,
        type: "OOO",
        label: "Break",
        startTime: os.startTime.toISOString(),
        endTime: os.endTime?.toISOString() ?? null,
        durationMinutes: dur,
        entryType: os.entryType,
        status: os.status,
        reason: os.reason,
        hasAuditLogs: os.auditLogs.length > 0,
      });
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const netWorkingMinutes = Math.max(0, totalSessionMinutes - totalOooMinutes);

    let summaryStatus: "ACTIVE" | "COMPLETED" | "INCOMPLETE" | "NOT_STARTED" = "NOT_STARTED";
    if (workSessions.length > 0) {
      if (hasIncomplete) {
        summaryStatus = "INCOMPLETE";
      } else if (workSessions.some((w) => w.status === "ACTIVE")) {
        summaryStatus = "ACTIVE";
      } else {
        summaryStatus = "COMPLETED";
      }
    }

    return {
      date: normalized.toISOString(),
      user: {
        id: userId,
        name: actor.id === userId ? actor.name : undefined,
        email: actor.id === userId ? actor.email : undefined,
        role: actor.id === userId ? actor.role : undefined,
      },
      summary: {
        firstClockIn,
        lastClockOut,
        totalSessionMinutes,
        totalOooMinutes,
        netWorkingMinutes,
        manualEntriesCount,
        status: summaryStatus,
      },
      timeline,
      workSessions,
      oooSessions,
    };
  }

  async listAdminTimesheets(actor: UserContext, filters: TimesheetFilterInput) {
    assertCan(actor.role, "timesheet:view:all", actor.permissions);

    const startDate = filters.startDate ? new Date(filters.startDate) : filters.date ? new Date(filters.date) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : filters.date ? new Date(filters.date) : undefined;

    const skip = (filters.page - 1) * filters.limit;
    const take = filters.limit;

    const { total, sessions } = await timesheetRepository.listAdminTimesheets({
      userId: filters.userId,
      startDate,
      endDate,
      status: filters.status,
      entryType: filters.entryType,
      incompleteOnly: filters.incompleteOnly,
      search: filters.search?.trim(),
      skip,
      take,
    });

    // Aggregate by (userId + date) so each employee has one complete Daily Timesheet row per date
    const dayMap = new Map<string, {
      userId: string;
      user: (typeof sessions)[0]["user"];
      date: Date;
      sessions: typeof sessions;
    }>();

    for (const ws of sessions) {
      const dateKey = `${ws.userId}_${normalizeDate(ws.date).toISOString().split("T")[0]}`;
      const existing = dayMap.get(dateKey);
      if (existing) {
        existing.sessions.push(ws);
      } else {
        dayMap.set(dateKey, {
          userId: ws.userId,
          user: ws.user,
          date: ws.date,
          sessions: [ws],
        });
      }
    }

    const items = Array.from(dayMap.values()).map((group) => {
      // Sort sessions of the day by startTime ascending
      group.sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      const firstWs = group.sessions[0];
      const lastWs = group.sessions[group.sessions.length - 1];

      let totalWorkMinutes = 0;
      let totalOooMinutes = 0;
      let manualEntriesCount = 0;
      let hasManual = false;
      let hasIncomplete = false;
      let hasActive = false;

      const timeline: {
        id: string;
        type: "WORK" | "OOO";
        label: string;
        startTime: string;
        endTime: string | null;
        durationMinutes: number;
        entryType: "AUTOMATIC" | "MANUAL";
        status: "ACTIVE" | "COMPLETED" | "INCOMPLETE";
        reason?: string | null;
        hasAuditLogs?: boolean;
      }[] = [];

      for (const ws of group.sessions) {
        if (ws.entryType === "MANUAL") {
          hasManual = true;
          manualEntriesCount++;
        }
        if (ws.status === "INCOMPLETE") hasIncomplete = true;
        if (ws.status === "ACTIVE") hasActive = true;
        totalWorkMinutes += ws.durationMinutes ?? 0;

        timeline.push({
          id: ws.id,
          type: "WORK",
          label: "Working",
          startTime: ws.startTime.toISOString(),
          endTime: ws.endTime?.toISOString() ?? null,
          durationMinutes: ws.durationMinutes ?? 0,
          entryType: ws.entryType,
          status: ws.status,
          reason: ws.reason,
          hasAuditLogs: ws.auditLogs.length > 0,
        });

        for (const os of ws.oooEntries) {
          if (os.entryType === "MANUAL") {
            hasManual = true;
            manualEntriesCount++;
          }
          totalOooMinutes += os.durationMinutes ?? 0;
          timeline.push({
            id: os.id,
            type: "OOO",
            label: "Break",
            startTime: os.startTime.toISOString(),
            endTime: os.endTime?.toISOString() ?? null,
            durationMinutes: os.durationMinutes ?? 0,
            entryType: os.entryType,
            status: os.status,
            reason: os.reason,
            hasAuditLogs: false,
          });
        }
      }

      timeline.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const netWorking = Math.max(0, totalWorkMinutes - totalOooMinutes);
      const status: "ACTIVE" | "COMPLETED" | "INCOMPLETE" = hasIncomplete
        ? "INCOMPLETE"
        : hasActive
        ? "ACTIVE"
        : "COMPLETED";

      return {
        id: lastWs.id,
        date: group.date.toISOString(),
        user: group.user,
        firstClockIn: firstWs.startTime.toISOString(),
        lastClockOut: hasActive ? null : (lastWs.endTime?.toISOString() ?? null),
        totalSessionMinutes: totalWorkMinutes,
        totalOooMinutes,
        netWorkingMinutes: netWorking,
        manualEntriesCount,
        status,
        hasManual,
        isIncomplete: hasIncomplete,
        timeline,
      };
    });

    const today = normalizeDate(new Date());
    const metrics = await timesheetRepository.getAdminMetrics(today);

    return {
      items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit) || 1,
      },
      metrics,
    };
  }

  async getSessionAuditLogs(actor: UserContext, sessionId: string) {
    assertCan(actor.role, "timesheet:manage", actor.permissions);
    return timesheetRepository.getAuditLogsForSession(sessionId);
  }

  async getMonthlyTimesheet(actor: UserContext, monthStr: string, targetUserId?: string) {
    let userId = actor.id;
    if (targetUserId && targetUserId !== actor.id) {
      assertCan(actor.role, "timesheet:view:all", actor.permissions);
      userId = targetUserId;
    } else {
      assertCan(actor.role, "timesheet:view:own", actor.permissions);
    }

    const [yearStr, monthNumStr] = monthStr.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthNumStr, 10) - 1;

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      throw new BadRequestError("Invalid month format. Expected YYYY-MM.");
    }

    const startOfMonth = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const [sessionsData, holidaysData, approvedLeaves, hrSettings] = await Promise.all([
      timesheetRepository.findSessionsForMonth(userId, startOfMonth, endOfMonth),
      holidayService.getHolidays(year),
      prisma.leaveRequest.findMany({
        where: {
          userId,
          status: "APPROVED",
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      }),
      hrSettingsService.getSettings(),
    ]);

    const standardMins = Math.round((hrSettings.standardDailyHours ?? 8.0) * 60);
    const halfDayMins = Math.round((hrSettings.halfDayMinimumHours ?? 4.0) * 60);
    const weekendDaysSet = new Set(
      hrSettings.weekendDays
        ? hrSettings.weekendDays.split(",").map((s) => Number(s.trim()))
        : [0, 6]
    );

    const { workSessions, oooSessions } = sessionsData;

    // Map holidays for this month
    const holidayMap = new Map<string, typeof holidaysData.holidays[0]>();
    for (const hol of holidaysData.holidays) {
      if (hol.date.startsWith(monthStr)) {
        holidayMap.set(hol.date, hol);
      }
    }

    // Map approved leaves by date
    const leaveMap = new Map<string, { type: string; reason: string; isHalfDay: boolean; halfDayType: string | null }>();
    for (const leave of approvedLeaves) {
      const lStartStr = leave.startDate.toISOString().split("T")[0];
      const lEndStr = leave.endDate.toISOString().split("T")[0];
      for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
        const dStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        if (dStr >= lStartStr && dStr <= lEndStr) {
          leaveMap.set(dStr, {
            type: leave.leaveType,
            reason: leave.reason,
            isHalfDay: leave.isHalfDay,
            halfDayType: leave.halfDayType,
          });
        }
      }
    }

    // Group work and ooo sessions by YYYY-MM-DD
    const workMap = new Map<string, typeof workSessions>();
    const oooMap = new Map<string, typeof oooSessions>();

    for (const ws of workSessions) {
      const dStr = ws.date.toISOString().split("T")[0];
      const arr = workMap.get(dStr) || [];
      arr.push(ws);
      workMap.set(dStr, arr);
    }

    for (const ooo of oooSessions) {
      const dStr = ooo.date.toISOString().split("T")[0];
      const arr = oooMap.get(dStr) || [];
      arr.push(ooo);
      oooMap.set(dStr, arr);
    }

    const tz = process.env.APP_TIMEZONE || process.env.NEXT_PUBLIC_APP_TIMEZONE || "Europe/Berlin";
    let todayStr: string;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      todayStr = new Date().toISOString().split("T")[0];
    }

    const days = [];
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let holidayDays = 0;
    let leaveDays = 0;
    let totalWorkingMinutes = 0;
    let totalOvertimeMinutes = 0;
    let pastWorkingDays = 0;

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayDate = new Date(Date.UTC(year, monthIndex, dayNum));
      const dayOfWeek = dayDate.getUTCDay(); // 0 = Sun, 6 = Sat
      const isWeekend = weekendDaysSet.has(dayOfWeek);
      const isToday = dStr === todayStr;
      const isPast = dStr < todayStr;

      const wsList = workMap.get(dStr) || [];
      const oooList = oooMap.get(dStr) || [];
      const holiday = holidayMap.get(dStr);
      const leave = leaveMap.get(dStr);

      let dayWorkMins = 0;
      let hasActive = false;
      let hasIncomplete = false;

      for (const ws of wsList) {
        if (ws.status === "ACTIVE") hasActive = true;
        if (ws.status === "INCOMPLETE") hasIncomplete = true;
        if (ws.durationMinutes) dayWorkMins += ws.durationMinutes;
      }

      let dayOooMins = 0;
      for (const ooo of oooList) {
        if (ooo.durationMinutes) dayOooMins += ooo.durationMinutes;
      }

      const netWorkMins = Math.max(0, dayWorkMins - dayOooMins);
      const dayOvertimeMins = Math.max(0, netWorkMins - standardMins);

      let status: "PRESENT" | "HALF_DAY" | "SHORT_HOURS" | "ACTIVE" | "INCOMPLETE" | "ABSENT" | "WEEKEND" | "UPCOMING" | "HOLIDAY" | "ON_LEAVE";

      if (hasIncomplete) {
        status = "INCOMPLETE";
      } else if (hasActive || (isToday && wsList.length > 0 && !wsList[wsList.length - 1].endTime)) {
        status = "ACTIVE";
      } else if (leave && !leave.isHalfDay) {
        // Full day approved leave takes precedence over accidental / short clock-in
        status = "ON_LEAVE";
        leaveDays++;
      } else if (wsList.length > 0) {
        if (netWorkMins >= standardMins) {
          status = "PRESENT";
          presentDays++;
          totalOvertimeMinutes += dayOvertimeMins;
        } else if (netWorkMins >= halfDayMins || leave?.isHalfDay) {
          status = "HALF_DAY";
          halfDays++;
        } else {
          status = "SHORT_HOURS";
        }
      } else if (holiday && !holiday.isOptional) {
        status = "HOLIDAY";
        holidayDays++;
      } else if (leave) {
        status = "ON_LEAVE";
        leaveDays++;
      } else if (holiday && holiday.isOptional) {
        if (isWeekend) {
          status = "WEEKEND";
        } else if (isPast) {
          status = "ABSENT";
          absentDays++;
        } else {
          status = "UPCOMING";
        }
      } else if (isWeekend) {
        status = "WEEKEND";
      } else if (isPast) {
        status = "ABSENT";
        absentDays++;
      } else {
        status = "UPCOMING";
      }

      const isScheduledWorkingDay = !isWeekend && (!holiday || holiday.isOptional);
      if (isScheduledWorkingDay && (isPast || isToday)) {
        pastWorkingDays++;
      }

      totalWorkingMinutes += netWorkMins;

      days.push({
        date: dStr,
        dayNumber: dayNum,
        dayOfWeek,
        isWeekend,
        isToday,
        totalWorkMinutes: dayWorkMins,
        totalOooMinutes: dayOooMins,
        netWorkingMinutes: netWorkMins,
        overtimeMinutes: dayOvertimeMins,
        status,
        sessionCount: wsList.length,
        firstClockIn: wsList[0]?.startTime.toISOString() || null,
        lastClockOut: wsList[wsList.length - 1]?.endTime?.toISOString() || null,
        holidayName: holiday?.name || null,
        isOptionalHoliday: holiday?.isOptional ?? false,
        leaveType: leave?.type || null,
        leaveReason: leave?.reason || null,
      });
    }

    const recordedDays = presentDays + halfDays;
    const averageDailyHours = recordedDays > 0
      ? Number((totalWorkingMinutes / recordedDays / 60).toFixed(1))
      : 0;

    const attendancePercentage = pastWorkingDays > 0
      ? Math.min(100, Math.round(((presentDays + halfDays * 0.5 + leaveDays) / pastWorkingDays) * 100))
      : 100;

    return {
      month: monthStr,
      summary: {
        totalDays: totalDaysInMonth,
        pastWorkingDays,
        presentDays,
        halfDays,
        absentDays,
        holidayDays,
        leaveDays,
        totalWorkingMinutes,
        totalOvertimeMinutes,
        averageDailyHours,
        targetWorkingHours: pastWorkingDays * 8,
        attendancePercentage,
      },
      days,
    };
  }
}

export const timesheetService = new TimesheetService();
