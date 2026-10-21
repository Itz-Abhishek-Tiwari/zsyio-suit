import { prisma, type Prisma } from "@zsyio/database";
import {
  assertCan,
  can,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@zsyio/auth/permissions";
import type {
  ApplyLeaveInput,
  ReviewLeaveInput,
  UpdateLeavePoliciesInput,
  AdjustUserLeaveAllocationInput,
} from "@zsyio/validators";
import type { UserContext } from "./timesheet.service";
import { hrSettingsService } from "./hr-settings.service";
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequestItem,
  LeaveOverviewResponse,
  LeavePolicyItem,
  UserLeaveAllocationItem,
} from "@zsyio/types";

// Standard Annual Quotas Default Fallback
const DEFAULT_QUOTAS: Record<LeaveType, { total: number; label: string; color: string }> = {
  CASUAL: { total: 12, label: "Casual Leave (CL)", color: "amber" },
  SICK: { total: 10, label: "Sick Leave (SL)", color: "rose" },
  EARNED: { total: 15, label: "Earned / Annual Leave (EL)", color: "emerald" },
  UNPAID: { total: 30, label: "Leave Without Pay (LWP)", color: "slate" },
  COMPENSATORY: { total: 5, label: "Compensatory Off (Comp-Off)", color: "purple" },
};

let policiesSeeded = false;

export class LeaveService {
  private async ensurePoliciesSeeded() {
    if (policiesSeeded) return;
    const count = await prisma.leavePolicy.count();
    if (count > 0) {
      policiesSeeded = true;
      return;
    }

    for (const [type, data] of Object.entries(DEFAULT_QUOTAS)) {
      await prisma.leavePolicy.upsert({
        where: { leaveType: type as LeaveType },
        update: {},
        create: {
          leaveType: type as LeaveType,
          label: data.label,
          totalDays: data.total,
          color: data.color,
          description: `Standard annual entitlement for ${data.label}`,
          carryForward: type === "EARNED",
          maxCarryDays: type === "EARNED" ? 10 : 0,
          isActive: true,
        },
      });
    }
    policiesSeeded = true;
  }

  async getLeavePolicies(): Promise<LeavePolicyItem[]> {
    await this.ensurePoliciesSeeded();
    const policies = await prisma.leavePolicy.findMany({
      orderBy: { createdAt: "asc" },
    });
    return policies.map((p) => ({
      id: p.id,
      leaveType: p.leaveType as LeaveType,
      label: p.label,
      totalDays: p.totalDays,
      description: p.description,
      color: p.color,
      carryForward: p.carryForward,
      maxCarryDays: p.maxCarryDays,
      isActive: p.isActive,
    }));
  }

  async updateLeavePolicies(
    actor: UserContext,
    input: UpdateLeavePoliciesInput
  ): Promise<LeavePolicyItem[]> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    for (const item of input.policies) {
      await prisma.leavePolicy.upsert({
        where: { leaveType: item.leaveType as LeaveType },
        create: {
          leaveType: item.leaveType as LeaveType,
          label: item.label,
          totalDays: item.totalDays,
          description: item.description,
          color: item.color,
          carryForward: item.carryForward ?? false,
          maxCarryDays: item.maxCarryDays ?? 0,
          isActive: item.isActive ?? true,
        },
        update: {
          label: item.label,
          totalDays: item.totalDays,
          description: item.description,
          color: item.color,
          carryForward: item.carryForward ?? false,
          maxCarryDays: item.maxCarryDays ?? 0,
          isActive: item.isActive ?? true,
        },
      });
    }

    return this.getLeavePolicies();
  }

  async getAllUserLeaveBalances(actor: UserContext, year?: number) {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const targetYear = year || new Date().getFullYear();
    const yearStart = new Date(Date.UTC(targetYear, 0, 1));
    const yearEnd = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59));

    await this.ensurePoliciesSeeded();
    const [policies, users, leaves, userAllocations] = await Promise.all([
      prisma.leavePolicy.findMany({ where: { isActive: true } }),
      prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.leaveRequest.findMany({
        where: {
          startDate: { gte: yearStart, lte: yearEnd },
          status: "APPROVED",
        },
        select: { userId: true, leaveType: true, daysCount: true },
      }),
      prisma.userLeaveAllocation.findMany({
        where: { year: targetYear },
      }),
    ]);

    // Group usage by user and leaveType
    const usageMap = new Map<string, number>();
    for (const req of leaves) {
      const key = `${req.userId}_${req.leaveType}`;
      usageMap.set(key, (usageMap.get(key) || 0) + req.daysCount);
    }

    // Group custom allocations by user and leaveType
    const allocMap = new Map<string, typeof userAllocations[0]>();
    for (const alloc of userAllocations) {
      allocMap.set(`${alloc.userId}_${alloc.leaveType}`, alloc);
    }

    return users.map((u) => {
      const balances = policies.map((p) => {
        const customAlloc = allocMap.get(`${u.id}_${p.leaveType}`);
        const total = customAlloc ? customAlloc.totalDays : p.totalDays;
        const used = usageMap.get(`${u.id}_${p.leaveType}`) || 0;
        const available = Math.max(0, total - used);
        return {
          type: p.leaveType,
          label: p.label,
          total,
          used,
          available,
          isCustom: Boolean(customAlloc),
          notes: customAlloc?.notes || null,
        };
      });

      return {
        user: u,
        balances,
      };
    });
  }

  async adjustUserLeaveAllocation(
    actor: UserContext,
    input: AdjustUserLeaveAllocationInput
  ): Promise<UserLeaveAllocationItem> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const allocation = await prisma.userLeaveAllocation.upsert({
      where: {
        userId_leaveType_year: {
          userId: input.userId,
          leaveType: input.leaveType as LeaveType,
          year: input.year,
        },
      },
      create: {
        userId: input.userId,
        leaveType: input.leaveType as LeaveType,
        year: input.year,
        totalDays: input.totalDays,
        notes: input.notes,
      },
      update: {
        totalDays: input.totalDays,
        notes: input.notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: allocation.id,
      userId: allocation.userId,
      userName: allocation.user.name,
      userEmail: allocation.user.email,
      leaveType: allocation.leaveType as LeaveType,
      year: allocation.year,
      totalDays: allocation.totalDays,
      notes: allocation.notes,
    };
  }

  async getLeaveOverview(user: UserContext): Promise<LeaveOverviewResponse> {
    assertCan(user.role, "timesheet:view:own", user.permissions);

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(Date.UTC(currentYear, 0, 1));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    await this.ensurePoliciesSeeded();

    const [userLeaves, pendingCount, policies, customAllocations] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: {
          userId: user.id,
          startDate: { gte: yearStart, lte: yearEnd },
        },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      can(user.role, "timesheet:manage", user.permissions) || user.role === "MANAGER"
        ? prisma.leaveRequest.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      prisma.leavePolicy.findMany({ where: { isActive: true } }),
      prisma.userLeaveAllocation.findMany({
        where: { userId: user.id, year: currentYear },
      }),
    ]);

    // Calculate usage per leave type
    const usageByType: Record<string, number> = {};
    for (const req of userLeaves) {
      if (req.status === "APPROVED") {
        usageByType[req.leaveType] = (usageByType[req.leaveType] || 0) + req.daysCount;
      }
    }

    const allocMap = new Map<string, number>();
    for (const a of customAllocations) {
      allocMap.set(a.leaveType, a.totalDays);
    }

    const balances: LeaveBalance[] = policies.map((p) => {
      const total = allocMap.has(p.leaveType) ? allocMap.get(p.leaveType)! : p.totalDays;
      const used = usageByType[p.leaveType] || 0;
      const available = Math.max(0, total - used);
      return {
        type: p.leaveType as LeaveType,
        label: p.label,
        total,
        used,
        available,
        color: p.color || "emerald",
      };
    });

    const myLeaves: LeaveRequestItem[] = userLeaves.map((l) => ({
      id: l.id,
      userId: l.userId,
      leaveType: l.leaveType as LeaveType,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      daysCount: l.daysCount,
      isHalfDay: l.isHalfDay,
      halfDayType: l.halfDayType,
      reason: l.reason,
      status: l.status,
      reviewerId: l.reviewerId,
      reviewer: l.reviewer,
      reviewerComment: l.reviewerComment,
      reviewedAt: l.reviewedAt?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return {
      balances,
      myLeaves,
      pendingApprovalsCount: pendingCount,
    };
  }

  async applyLeave(user: UserContext, input: ApplyLeaveInput): Promise<LeaveRequestItem> {
    assertCan(user.role, "timesheet:view:own", user.permissions);

    const start = new Date(`${input.startDate.split("T")[0]}T00:00:00.000Z`);
    const end = new Date(`${input.endDate.split("T")[0]}T23:59:59.999Z`);

    if (end < start) {
      throw new BadRequestError("End date cannot be prior to start date");
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError("Invalid leave start or end date.");
    }
    if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new BadRequestError("Leave range cannot exceed one year.");
    }

    const hrSettings = await hrSettingsService.getSettings();
    const weekendDays = new Set(
      hrSettings.weekendDays
        ? hrSettings.weekendDays.split(",").map((s) => Number(s.trim()))
        : [0, 6]
    );
    // Sunday (0) is strictly non-working across all leave policies
    weekendDays.add(0);

    // Calculate working days count excluding configured weekends
    let daysCount = 0;
    if (input.isHalfDay) {
      const [sy, sm, sd] = input.startDate.split("T")[0].split("-").map(Number);
      const leaveDayOfWeek = new Date(sy, sm - 1, sd).getDay();
      if (weekendDays.has(leaveDayOfWeek)) {
        throw new BadRequestError("Cannot request leave on a configured weekend day.");
      }
      daysCount = 0.5;
    } else {
      const [sy, sm, sd] = input.startDate.split("T")[0].split("-").map(Number);
      const [ey, em, ed] = input.endDate.split("T")[0].split("-").map(Number);
      const curr = new Date(sy, sm - 1, sd);
      const endCal = new Date(ey, em - 1, ed);

      while (curr <= endCal) {
        if (!weekendDays.has(curr.getDay())) {
          daysCount++;
        }
        curr.setDate(curr.getDate() + 1);
      }

      if (daysCount === 0) {
        throw new BadRequestError("Selected leave range contains only configured weekend days.");
      }
    }

    // Check for overlap with existing pending or approved leaves
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestError(
        `You already have an active leave request (${overlapping.leaveType}) covering this date range.`
      );
    }

    const created = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        leaveType: input.leaveType as any,
        startDate: start,
        endDate: end,
        daysCount,
        isHalfDay: input.isHalfDay ?? false,
        halfDayType: input.halfDayType ?? null,
        reason: input.reason.trim(),
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      user: created.user,
      leaveType: created.leaveType as LeaveType,
      startDate: created.startDate.toISOString().split("T")[0],
      endDate: created.endDate.toISOString().split("T")[0],
      daysCount: created.daysCount,
      isHalfDay: created.isHalfDay,
      halfDayType: created.halfDayType,
      reason: created.reason,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async getTeamLeaves(user: UserContext, status?: string): Promise<LeaveRequestItem[]> {
    const isManagerOrAdmin =
      can(user.role, "timesheet:manage", user.permissions) || user.role === "MANAGER";

    if (!isManagerOrAdmin) {
      throw new ForbiddenError("Only managers and administrators can view team leave requests");
    }

    const where: Prisma.LeaveRequestWhereInput = {};
    if (status && status !== "ALL") {
      where.status = status as any;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return leaves.map((l) => ({
      id: l.id,
      userId: l.userId,
      user: l.user,
      leaveType: l.leaveType as LeaveType,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      daysCount: l.daysCount,
      isHalfDay: l.isHalfDay,
      halfDayType: l.halfDayType,
      reason: l.reason,
      status: l.status,
      reviewerId: l.reviewerId,
      reviewer: l.reviewer,
      reviewerComment: l.reviewerComment,
      reviewedAt: l.reviewedAt?.toISOString() || null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));
  }

  async reviewLeave(
    user: UserContext,
    leaveId: string,
    input: ReviewLeaveInput
  ): Promise<LeaveRequestItem> {
    const isManagerOrAdmin =
      can(user.role, "timesheet:manage", user.permissions) || user.role === "MANAGER";

    if (!isManagerOrAdmin) {
      throw new ForbiddenError("Only managers and administrators can review leave requests");
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundError("Leave request not found");
    }

    if (leave.status !== "PENDING") {
      throw new BadRequestError(`Cannot review leave request that is already ${leave.status}`);
    }

    if (leave.userId === user.id) {
      throw new ForbiddenError("You cannot approve or reject your own leave request.");
    }

    if (input.status === "APPROVED" && leave.daysCount <= 0) {
      throw new BadRequestError("Cannot approve a leave request with no working days.");
    }

    if (input.status === "REJECTED" && (!input.reviewerComment || !input.reviewerComment.trim())) {
      throw new BadRequestError("A reason is required when rejecting a leave request.");
    }

    // Atomic claim: only one concurrent reviewer can move the request out of PENDING
    const claimed = await prisma.leaveRequest.updateMany({
      where: { id: leaveId, status: "PENDING" },
      data: {
        status: input.status,
        reviewerId: user.id,
        reviewerComment: input.reviewerComment?.trim() || null,
        reviewedAt: new Date(),
      },
    });
    if (claimed.count === 0) {
      throw new BadRequestError("This leave request has already been reviewed.");
    }

    const updated = await prisma.leaveRequest.findUniqueOrThrow({
      where: { id: leaveId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      user: updated.user,
      leaveType: updated.leaveType as LeaveType,
      startDate: updated.startDate.toISOString().split("T")[0],
      endDate: updated.endDate.toISOString().split("T")[0],
      daysCount: updated.daysCount,
      isHalfDay: updated.isHalfDay,
      halfDayType: updated.halfDayType,
      reason: updated.reason,
      status: updated.status,
      reviewerId: updated.reviewerId,
      reviewer: updated.reviewer,
      reviewerComment: updated.reviewerComment,
      reviewedAt: updated.reviewedAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async cancelLeave(user: UserContext, leaveId: string): Promise<void> {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundError("Leave request not found");
    }

    if (leave.userId !== user.id && !can(user.role, "timesheet:manage", user.permissions)) {
      throw new ForbiddenError("You can only cancel your own leave requests");
    }

    if (leave.status === "REJECTED" || leave.status === "CANCELLED") {
      throw new BadRequestError(`Leave request is already ${leave.status.toLowerCase()}`);
    }

    const cancelled = await prisma.leaveRequest.updateMany({
      where: { id: leaveId, status: { in: ["PENDING", "APPROVED"] } },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count === 0) {
      throw new BadRequestError("Leave request can no longer be cancelled.");
    }
  }
}

export const leaveService = new LeaveService();
