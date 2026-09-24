import { prisma } from "@zsyio/database";
import { normalizeDate } from "../repositories/timesheet.repository";
import type { EmployeeDirectoryItem, TimesheetState } from "@zsyio/types";

export class DirectoryService {
  async getDirectory(): Promise<EmployeeDirectoryItem[]> {
    const today = normalizeDate(new Date());
    const now = new Date();

    const [users, activeWorkSessions, activeOooSessions, todayWorkSessions, todayLeaves] =
      await Promise.all([
        prisma.user.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            customRole: {
              select: {
                id: true,
                name: true,
                label: true,
              },
            },
            teamMemberships: {
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.workSession.findMany({
          where: { status: "ACTIVE", endTime: null },
          select: { userId: true, startTime: true },
        }),
        prisma.oooSession.findMany({
          where: { status: "ACTIVE", endTime: null },
          select: { userId: true, startTime: true },
        }),
        prisma.workSession.findMany({
          where: { date: today },
          select: { userId: true, durationMinutes: true, startTime: true, endTime: true },
        }),
        prisma.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { userId: true },
        }),
      ]);

    const activeWorkMap = new Map(activeWorkSessions.map((ws) => [ws.userId, ws.startTime]));
    const activeOooMap = new Map(activeOooSessions.map((os) => [os.userId, os.startTime]));
    const onLeaveSet = new Set(todayLeaves.map((l) => l.userId));

    // Calculate today's worked minutes per user
    const todayWorkedMinutesMap = new Map<string, number>();
    for (const ws of todayWorkSessions) {
      let duration = ws.durationMinutes;
      if (!duration && ws.startTime) {
        const end = ws.endTime ? new Date(ws.endTime).getTime() : now.getTime();
        duration = Math.max(0, Math.floor((end - new Date(ws.startTime).getTime()) / (1000 * 60)));
      }
      const prev = todayWorkedMinutesMap.get(ws.userId) || 0;
      todayWorkedMinutesMap.set(ws.userId, prev + (duration || 0));
    }

    return users.map((u) => {
      let state: TimesheetState = "CLOCKED_OUT";
      let sessionStartedAt: string | null = null;
      let activeSessionDurationMinutes: number | null = null;

      if (onLeaveSet.has(u.id)) {
        state = "CLOCKED_OUT"; // marked on leave in UI tag
      } else if (activeOooMap.has(u.id)) {
        state = "OOO";
        const start = activeOooMap.get(u.id)!;
        sessionStartedAt = start.toISOString();
        activeSessionDurationMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60)));
      } else if (activeWorkMap.has(u.id)) {
        state = "WORKING";
        const start = activeWorkMap.get(u.id)!;
        sessionStartedAt = start.toISOString();
        activeSessionDurationMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60)));
      }

      // Department resolved strictly from assigned teams, defaulting to '_' if none assigned
      const teamNames = (u.teamMemberships || [])
        .map((tm) => tm.team?.name?.trim())
        .filter((name): name is string => Boolean(name));
      const department = teamNames.length > 0 ? teamNames.join(", ") : "_";

      // Role resolved from custom role label or real system role
      const role = u.customRole?.label?.trim() || u.customRole?.name?.trim() || u.role;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        department,
        designation: role,
        shiftTiming: "09:00 AM – 06:00 PM (Standard)",
        attendanceState: state,
        sessionStartedAt,
        activeSessionDurationMinutes,
        todayWorkedMinutes: todayWorkedMinutesMap.get(u.id) || 0,
      };
    });
  }
}

export const directoryService = new DirectoryService();
