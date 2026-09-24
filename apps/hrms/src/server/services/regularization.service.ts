import { prisma, type Prisma } from "@zsyio/database";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  can,
} from "@zsyio/auth/permissions";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import type {
  ApplyRegularizationInput,
  ReviewRegularizationInput,
} from "@zsyio/validators";
import type { AttendanceRegularizationItem, RegularizationStatus } from "@zsyio/types";
import { normalizeDate, parseDateTimeInTimeZone } from "../repositories/timesheet.repository";
import { serializeDate } from "@zsyio/ui";

export interface UserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  permissions?: string[] | null;
}

export class RegularizationService {
  async applyRegularization(
    user: UserContext,
    input: ApplyRegularizationInput
  ): Promise<AttendanceRegularizationItem> {
    const normalizedDate = normalizeDate(input.date);

    // Check for duplicate pending requests on the same date
    const existingPending = await prisma.attendanceRegularization.findFirst({
      where: {
        userId: user.id,
        date: normalizedDate,
        status: "PENDING",
      },
    });

    if (existingPending) {
      throw new ConflictError("You already have a pending regularization request for this date.");
    }

    const datePart = input.date.split("T")[0];
    let clockInDate: Date | null = null;
    let clockOutDate: Date | null = null;

    if (input.requestedClockIn) {
      clockInDate = parseDateTimeInTimeZone(datePart, input.requestedClockIn);
      if (isNaN(clockInDate.getTime())) {
        throw new BadRequestError("Invalid requested clock in time format.");
      }
    }

    if (input.requestedClockOut) {
      clockOutDate = parseDateTimeInTimeZone(datePart, input.requestedClockOut);
      if (isNaN(clockOutDate.getTime())) {
        throw new BadRequestError("Invalid requested clock out time format.");
      }
    }

    if (clockInDate && clockOutDate && clockOutDate <= clockInDate) {
      throw new BadRequestError("Requested Clock Out time must be after Clock In time.");
    }

    const record = await prisma.attendanceRegularization.create({
      data: {
        userId: user.id,
        date: normalizedDate,
        type: input.type,
        requestedClockIn: clockInDate,
        requestedClockOut: clockOutDate,
        reason: input.reason.trim(),
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return this.serializeItem(record);
  }

  async reviewRegularization(
    reviewer: UserContext,
    id: string,
    input: ReviewRegularizationInput
  ): Promise<AttendanceRegularizationItem> {
    const canReview =
      can(reviewer.role, "timesheet:manage", reviewer.permissions) || reviewer.role === "MANAGER";

    if (!canReview) {
      throw new ForbiddenError("Not authorized to review attendance regularizations.");
    }

    const regularization = await prisma.attendanceRegularization.findUnique({
      where: { id },
    });

    if (!regularization) {
      throw new NotFoundError("Attendance regularization request not found.");
    }

    if (regularization.status !== "PENDING") {
      throw new BadRequestError(`This request has already been ${regularization.status.toLowerCase()}.`);
    }

    if (regularization.userId === reviewer.id && reviewer.role !== "SUPER_ADMIN" && !isSuperAdmin(reviewer)) {
      throw new ForbiddenError("You cannot approve or reject your own attendance regularization request.");
    }

    if (input.status === "APPROVED") {
      // Find existing work session for the user on that date.
      // If there's an INCOMPLETE session, prioritize it since regularization is meant
      // to resolve missed clock-ins/outs rather than overwriting an already completed session.
      const existingSession =
        (await prisma.workSession.findFirst({
          where: {
            userId: regularization.userId,
            date: regularization.date,
            status: "INCOMPLETE",
          },
          orderBy: { startTime: "desc" },
        })) ||
        (await prisma.workSession.findFirst({
          where: {
            userId: regularization.userId,
            date: regularization.date,
          },
          orderBy: { startTime: "desc" },
        }));

      const datePart = regularization.date.toISOString().split("T")[0];
      const defaultStart = parseDateTimeInTimeZone(datePart, "09:00");
      const defaultEnd = parseDateTimeInTimeZone(datePart, "18:00");

      const effectiveStartTime = regularization.requestedClockIn || existingSession?.startTime || defaultStart;
      const effectiveEndTime = regularization.requestedClockOut || existingSession?.endTime || defaultEnd;
      const durationMinutes = Math.max(0, Math.floor((effectiveEndTime.getTime() - effectiveStartTime.getTime()) / 60000));

      if (existingSession) {
        await prisma.workSession.update({
          where: { id: existingSession.id },
          data: {
            startTime: effectiveStartTime,
            endTime: effectiveEndTime,
            durationMinutes,
            entryType: "MANUAL",
            status: "COMPLETED",
            approvalStatus: "APPROVED",
            reason: regularization.reason,
          },
        });

        await prisma.timesheetAuditLog.create({
          data: {
            workSessionId: existingSession.id,
            actorId: reviewer.id,
            action: "REGULARIZED",
            field: "approvalStatus",
            oldValue: existingSession.status,
            newValue: "APPROVED",
            reason: `Regularization approved: ${regularization.reason}`,
          },
        });
      } else {
        const newSession = await prisma.workSession.create({
          data: {
            userId: regularization.userId,
            date: regularization.date,
            startTime: effectiveStartTime,
            endTime: effectiveEndTime,
            durationMinutes,
            entryType: "MANUAL",
            status: "COMPLETED",
            approvalStatus: "APPROVED",
            reason: regularization.reason,
            createdById: reviewer.id,
          },
        });

        await prisma.timesheetAuditLog.create({
          data: {
            workSessionId: newSession.id,
            actorId: reviewer.id,
            action: "REGULARIZED",
            field: "entryType",
            oldValue: null,
            newValue: "MANUAL",
            reason: `Regularization approved: ${regularization.reason}`,
          },
        });
      }
    }

    const updated = await prisma.attendanceRegularization.update({
      where: { id },
      data: {
        status: input.status,
        reviewerId: reviewer.id,
        reviewerComment: input.reviewerComment?.trim() || null,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return this.serializeItem(updated);
  }

  async cancelRegularization(
    user: UserContext,
    id: string
  ): Promise<AttendanceRegularizationItem> {
    const regularization = await prisma.attendanceRegularization.findUnique({
      where: { id },
    });

    if (!regularization) {
      throw new NotFoundError("Attendance regularization request not found.");
    }

    if (regularization.userId !== user.id) {
      throw new ForbiddenError("Not authorized to cancel another employee's regularization request.");
    }

    if (regularization.status !== "PENDING") {
      throw new BadRequestError("Only pending regularization requests can be cancelled.");
    }

    const updated = await prisma.attendanceRegularization.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return this.serializeItem(updated);
  }

  async getMyRegularizations(user: UserContext): Promise<AttendanceRegularizationItem[]> {
    const records = await prisma.attendanceRegularization.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.serializeItem(r));
  }

  async getTeamRegularizations(
    reviewer: UserContext,
    statusFilter?: RegularizationStatus | "ALL"
  ): Promise<AttendanceRegularizationItem[]> {
    const canViewTeam =
      can(reviewer.role, "timesheet:view:all", reviewer.permissions) ||
      can(reviewer.role, "timesheet:manage", reviewer.permissions) ||
      reviewer.role === "MANAGER";

    if (!canViewTeam) {
      throw new ForbiddenError("Not authorized to view team attendance regularizations.");
    }

    const where: Prisma.AttendanceRegularizationWhereInput = {};
    if (statusFilter && (statusFilter as string) !== "ALL") {
      where.status = statusFilter as any;
    }

    const records = await prisma.attendanceRegularization.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.serializeItem(r));
  }

  private serializeItem(item: any): AttendanceRegularizationItem {
    return {
      id: item.id,
      userId: item.userId,
      user: item.user
        ? {
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            role: item.user.role,
          }
        : undefined,
      date: item.date instanceof Date ? item.date.toISOString().split("T")[0] : String(item.date),
      type: item.type,
      requestedClockIn: item.requestedClockIn ? item.requestedClockIn.toISOString() : null,
      requestedClockOut: item.requestedClockOut ? item.requestedClockOut.toISOString() : null,
      reason: item.reason,
      status: item.status,
      reviewerId: item.reviewerId,
      reviewer: item.reviewer
        ? {
            id: item.reviewer.id,
            name: item.reviewer.name,
            email: item.reviewer.email,
            role: item.reviewer.role,
          }
        : null,
      reviewerComment: item.reviewerComment,
      reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
      createdAt: serializeDate(item.createdAt) ?? String(item.createdAt),
      updatedAt: serializeDate(item.updatedAt) ?? String(item.updatedAt),
    };
  }
}

export const regularizationService = new RegularizationService();
