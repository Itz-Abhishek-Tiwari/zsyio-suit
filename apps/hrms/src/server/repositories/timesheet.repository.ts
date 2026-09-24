import { prisma } from "@zsyio/database";
import type { Prisma } from "@prisma/client";

export function normalizeDate(
  d: Date | string,
  timeZone: string = process.env.APP_TIMEZONE || process.env.NEXT_PUBLIC_APP_TIMEZONE || "Europe/Berlin"
): Date {
  let dateStr: string;
  if (typeof d === "string") {
    dateStr = d.split("T")[0];
  } else {
    try {
      const dtf = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      dateStr = dtf.format(d);
    } catch {
      dateStr = d.toISOString().split("T")[0];
    }
  }
  const [y, m, day] = dateStr.split("-").map(Number);
  const normalized = new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0));
  return normalized;
}

export function getStartOfDay(d: Date): Date {
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function getEndOfDay(d: Date): Date {
  const end = new Date(d);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function parseDateTimeInTimeZone(
  dateStr: string,
  timeStr: string,
  timeZone: string = process.env.APP_TIMEZONE || process.env.NEXT_PUBLIC_APP_TIMEZONE || "Europe/Berlin"
): Date {
  if (timeStr.includes("T") && timeStr.length > 10) {
    return new Date(timeStr);
  }
  const datePart = dateStr.split("T")[0];
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;

  // Calculate UTC offset for the given date in target timeZone
  const testDate = new Date(`${datePart}T${cleanTime}Z`);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(dtf.formatToParts(testDate).map((p) => [p.type, p.value]));
  const tzHours = parseInt(parts.hour, 10) % 24;
  const tzMinutes = parseInt(parts.minute, 10);

  const utcHours = testDate.getUTCHours();
  const utcMinutes = testDate.getUTCMinutes();

  let offsetMinutes = (tzHours - utcHours) * 60 + (tzMinutes - utcMinutes);
  if (offsetMinutes > 720) offsetMinutes -= 1440;
  if (offsetMinutes < -720) offsetMinutes += 1440;

  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min, s = 0] = cleanTime.split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h, min, s) - offsetMinutes * 60 * 1000;
  return new Date(utcMs);
}

export class TimesheetRepository {
  async findActiveWorkSession(userId: string) {
    return prisma.workSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endTime: null,
      },
      orderBy: { startTime: "desc" },
    });
  }

  async findActiveOooSession(userId: string) {
    return prisma.oooSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endTime: null,
      },
      orderBy: { startTime: "desc" },
    });
  }

  async findWorkSessionsForDay(userId: string, date: Date) {
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);

    return prisma.workSession.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        oooEntries: {
          orderBy: { startTime: "asc" },
        },
        auditLogs: {
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async findOooSessionsForDay(userId: string, date: Date) {
    const start = getStartOfDay(date);
    const end = getEndOfDay(date);

    return prisma.oooSession.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: {
        auditLogs: {
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async findIncompleteSessions(userId: string, today: Date) {
    const todayStart = getStartOfDay(today);

    const workSessions = await prisma.workSession.findMany({
      where: {
        userId,
        OR: [
          { status: "INCOMPLETE" },
          {
            status: "ACTIVE",
            date: { lt: todayStart },
          },
        ],
      },
      orderBy: { startTime: "desc" },
    });

    const oooSessions = await prisma.oooSession.findMany({
      where: {
        userId,
        OR: [
          { status: "INCOMPLETE" },
          {
            status: "ACTIVE",
            date: { lt: todayStart },
          },
        ],
      },
      orderBy: { startTime: "desc" },
    });

    return {
      workSessions,
      oooSessions,
    };
  }

  async checkWorkSessionOverlap(userId: string, startTime: Date, endTime: Date, excludeId?: string) {
    return prisma.workSession.findFirst({
      where: {
        userId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { not: "INCOMPLETE" },
        AND: [
          { startTime: { lt: endTime } },
          {
            OR: [
              { endTime: null },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
    });
  }

  async checkOooSessionOverlap(userId: string, startTime: Date, endTime: Date, excludeId?: string) {
    return prisma.oooSession.findFirst({
      where: {
        userId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        status: { not: "INCOMPLETE" },
        AND: [
          { startTime: { lt: endTime } },
          {
            OR: [
              { endTime: null },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
    });
  }

  async createWorkSession(data: Prisma.WorkSessionUncheckedCreateInput) {
    return prisma.workSession.create({ data });
  }

  async updateWorkSession(id: string, data: Prisma.WorkSessionUncheckedUpdateInput) {
    return prisma.workSession.update({
      where: { id },
      data,
    });
  }

  async createOooSession(data: Prisma.OooSessionUncheckedCreateInput) {
    return prisma.oooSession.create({ data });
  }

  async updateOooSession(id: string, data: Prisma.OooSessionUncheckedUpdateInput) {
    return prisma.oooSession.update({
      where: { id },
      data,
    });
  }

  async deleteOooSession(id: string) {
    return prisma.oooSession.delete({
      where: { id },
    });
  }

  async createAuditLog(data: Prisma.TimesheetAuditLogUncheckedCreateInput) {
    return prisma.timesheetAuditLog.create({ data });
  }

  async getAuditLogsForSession(sessionId: string) {
    return prisma.timesheetAuditLog.findMany({
      where: {
        OR: [{ workSessionId: sessionId }, { oooSessionId: sessionId }],
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWorkSessionById(id: string) {
    return prisma.workSession.findUnique({
      where: { id },
      include: { user: true, oooEntries: true },
    });
  }

  async getOooSessionById(id: string) {
    return prisma.oooSession.findUnique({
      where: { id },
      include: { user: true, workSession: true },
    });
  }

  async listAdminTimesheets(params: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    entryType?: string;
    incompleteOnly?: boolean;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { userId, startDate, endDate, status, entryType, incompleteOnly, search, skip = 0, take = 50 } = params;

    const userWhere: Prisma.UserWhereInput = {
      active: true,
      ...(userId ? { id: userId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const workWhere: Prisma.WorkSessionWhereInput = {
      user: userWhere,
      ...(startDate && endDate
        ? { date: { gte: getStartOfDay(startDate), lte: getEndOfDay(endDate) } }
        : startDate
        ? { date: { gte: getStartOfDay(startDate) } }
        : endDate
        ? { date: { lte: getEndOfDay(endDate) } }
        : {}),
      ...(status ? { status: status as any } : {}),
      ...(entryType ? { entryType: entryType as any } : {}),
      ...(incompleteOnly ? { status: "INCOMPLETE" } : {}),
    };

    const [total, sessions] = await Promise.all([
      prisma.workSession.count({ where: workWhere }),
      prisma.workSession.findMany({
        where: workWhere,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          oooEntries: {
            orderBy: { startTime: "asc" },
          },
          auditLogs: {
            include: { actor: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        skip,
        take,
      }),
    ]);

    return { total, sessions };
  }

  async getAdminMetrics(today: Date) {
    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const [activeWorkingNow, currentlyOoo, completedToday, incompleteRecordsCount] = await Promise.all([
      prisma.workSession.count({
        where: {
          status: "ACTIVE",
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.oooSession.count({
        where: {
          status: "ACTIVE",
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.workSession.count({
        where: {
          status: "COMPLETED",
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.workSession.count({
        where: {
          status: "INCOMPLETE",
        },
      }),
    ]);

    return {
      activeWorkingNow,
      currentlyOoo,
      clockedOutToday: completedToday,
      incompleteRecordsCount,
    };
  }

  async findSessionsForMonth(userId: string, startOfMonth: Date, endOfMonth: Date) {
    const [workSessions, oooSessions] = await Promise.all([
      prisma.workSession.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.oooSession.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { startTime: "asc" },
      }),
    ]);

    return { workSessions, oooSessions };
  }
}

export const timesheetRepository = new TimesheetRepository();
