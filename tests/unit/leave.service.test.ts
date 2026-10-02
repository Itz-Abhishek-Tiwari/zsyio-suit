import { describe, it, expect, vi, beforeEach } from "vitest";
import { leaveService } from "../../apps/hrms/src/server/services/leave.service";
import { prisma } from "@zsyio/database";
import { BadRequestError, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";

vi.mock("@zsyio/database", () => {
  return {
    prisma: {
      leaveRequest: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      leavePolicy: {
        findMany: vi.fn().mockResolvedValue([
          { leaveType: "CASUAL", label: "Casual Leave", totalDays: 12, description: "", color: "#3B82F6", carryForward: false, maxCarryDays: 0, isActive: true },
          { leaveType: "SICK", label: "Sick Leave", totalDays: 10, description: "", color: "#EF4444", carryForward: false, maxCarryDays: 0, isActive: true },
          { leaveType: "EARNED", label: "Earned / Privilege Leave", totalDays: 15, description: "", color: "#10B981", carryForward: true, maxCarryDays: 5, isActive: true },
          { leaveType: "COMPENSATORY", label: "Compensatory Off", totalDays: 0, description: "", color: "#F59E0B", carryForward: false, maxCarryDays: 0, isActive: true },
          { leaveType: "UNPAID", label: "Loss of Pay (LWP)", totalDays: 30, description: "", color: "#6B7280", carryForward: false, maxCarryDays: 0, isActive: true },
        ]),
        findUnique: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn().mockResolvedValue(5),
      },
      userLeaveAllocation: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue({ id: "emp-1", name: "John Doe" }),
      },
      hrPolicySettings: {
        findUnique: vi.fn().mockResolvedValue({
          id: "default-hr-policy",
          standardDailyHours: 8.0,
          halfDayMinimumHours: 4.0,
          overtimeThresholdMins: 0,
          weekendDays: "0,6",
        }),
        create: vi.fn(),
        upsert: vi.fn(),
      },
    },
  };
});

const mockSuperAdmin = {
  id: "admin-1",
  name: "Super Admin",
  email: "admin@mediloon.de",
  role: "SUPER_ADMIN",
  permissions: ["timesheet:manage", "timesheet:view:all"],
};

const mockEmployee = {
  id: "emp-1",
  name: "John Doe",
  email: "john@mediloon.de",
  role: "DEVELOPER",
  permissions: ["timesheet:view:own", "timesheet:clock"],
};

const mockManager = {
  id: "mgr-1",
  name: "Manager Smith",
  email: "manager@mediloon.de",
  role: "MANAGER",
  permissions: ["timesheet:view:own", "timesheet:view:all"],
};

describe("LeaveService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLeaveOverview", () => {
    it("computes balances with used days from approved leaves", async () => {
      vi.mocked(prisma.leaveRequest.findMany).mockResolvedValue([
        {
          id: "leave-1",
          userId: "emp-1",
          leaveType: "CASUAL",
          startDate: new Date("2026-09-10T00:00:00.000Z"),
          endDate: new Date("2026-09-11T23:59:59.999Z"),
          daysCount: 2,
          isHalfDay: false,
          halfDayType: null,
          reason: "Family vacation",
          status: "APPROVED",
          reviewerId: "mgr-1",
          reviewer: { id: "mgr-1", name: "Manager Smith", email: "mgr@mediloon.de", role: "MANAGER" },
          reviewerComment: "Approved enjoy",
          reviewedAt: new Date("2026-09-08T10:00:00.000Z"),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]);

      const res = await leaveService.getLeaveOverview(mockEmployee);
      expect(res.balances).toBeDefined();

      const casual = res.balances.find((b) => b.type === "CASUAL");
      expect(casual).toBeDefined();
      expect(casual?.total).toBe(12);
      expect(casual?.used).toBe(2);
      expect(casual?.available).toBe(10);
      expect(res.myLeaves).toHaveLength(1);
    });
  });

  describe("applyLeave", () => {
    it("successfully creates a pending leave request", async () => {
      vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.leaveRequest.create).mockResolvedValue({
        id: "new-leave-1",
        userId: "emp-1",
        leaveType: "SICK",
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-10-02T23:59:59.999Z"),
        daysCount: 2,
        isHalfDay: false,
        halfDayType: null,
        reason: "Fever recovery",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await leaveService.applyLeave(mockEmployee, {
        leaveType: "SICK",
        startDate: "2026-10-01",
        endDate: "2026-10-02",
        isHalfDay: false,
        reason: "Fever recovery",
      });

      expect(res.id).toBe("new-leave-1");
      expect(res.status).toBe("PENDING");
      expect(res.daysCount).toBe(2);
    });

    it("throws BadRequestError if end date is prior to start date", async () => {
      await expect(
        leaveService.applyLeave(mockEmployee, {
          leaveType: "CASUAL",
          startDate: "2026-10-05",
          endDate: "2026-10-01",
          isHalfDay: false,
          reason: "Errand",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when selecting only configured weekend days", async () => {
      // 2026-10-03 is Saturday, 2026-10-04 is Sunday
      await expect(
        leaveService.applyLeave(mockEmployee, {
          leaveType: "CASUAL",
          startDate: "2026-10-03",
          endDate: "2026-10-04",
          isHalfDay: false,
          reason: "Weekend outing",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when requesting half-day leave on a weekend", async () => {
      // 2026-10-03 is Saturday
      await expect(
        leaveService.applyLeave(mockEmployee, {
          leaveType: "CASUAL",
          startDate: "2026-10-03",
          endDate: "2026-10-03",
          isHalfDay: true,
          reason: "Weekend morning",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("excludes configured weekends and counts only working days across a date range", async () => {
      // 2026-10-02 is Friday, 2026-10-05 is Monday (Sat 10-03 and Sun 10-04 are excluded: 2 working days)
      vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.leaveRequest.create).mockImplementation((args: any) =>
        Promise.resolve({
          id: "range-leave",
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      const res = await leaveService.applyLeave(mockEmployee, {
        leaveType: "CASUAL",
        startDate: "2026-10-02",
        endDate: "2026-10-05",
        isHalfDay: false,
        reason: "Long weekend trip",
      });

      expect(res.daysCount).toBe(2);
      expect(prisma.leaveRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            daysCount: 2,
          }),
        })
      );
    });
  });

  describe("reviewLeave", () => {
    it("allows manager to approve a pending leave request", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "leave-to-review",
        userId: "emp-1",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.leaveRequest.update).mockResolvedValue({
        id: "leave-to-review",
        userId: "emp-1",
        leaveType: "CASUAL",
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-10-02T23:59:59.999Z"),
        daysCount: 2,
        isHalfDay: false,
        status: "APPROVED",
        reviewerId: "mgr-1",
        reviewerComment: "Have fun",
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await leaveService.reviewLeave(mockManager, "leave-to-review", {
        status: "APPROVED",
        reviewerComment: "Have fun",
      });

      expect(res.status).toBe("APPROVED");
      expect(prisma.leaveRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "leave-to-review" },
          data: expect.objectContaining({ status: "APPROVED" }),
        })
      );
    });

    it("throws ForbiddenError if normal employee tries to review a leave", async () => {
      await expect(
        leaveService.reviewLeave(mockEmployee, "leave-to-review", { status: "APPROVED" })
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError when SUPER_ADMIN tries to approve their own leave request", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "superadmin-own-leave",
        userId: "admin-1", // Same as mockSuperAdmin.id
        daysCount: 2,
        status: "PENDING",
      } as any);

      await expect(
        leaveService.reviewLeave(mockSuperAdmin, "superadmin-own-leave", {
          status: "APPROVED",
          reviewerComment: "Self-approved",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError when regular MANAGER tries to approve their own leave request", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "mgr-own-leave",
        userId: "mgr-1", // Same as mockManager.id
        daysCount: 1,
        status: "PENDING",
      } as any);

      await expect(
        leaveService.reviewLeave(mockManager, "mgr-own-leave", { status: "APPROVED" })
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws BadRequestError when rejecting leave without a reviewerComment", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "leave-to-reject",
        userId: "emp-1",
        daysCount: 1,
        status: "PENDING",
      } as any);

      await expect(
        leaveService.reviewLeave(mockManager, "leave-to-reject", {
          status: "REJECTED",
          reviewerComment: "",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("allows manager to reject leave when reviewerComment is provided", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "leave-to-reject",
        userId: "emp-1",
        daysCount: 1,
        status: "PENDING",
      } as any);

      vi.mocked(prisma.leaveRequest.update).mockResolvedValue({
        id: "leave-to-reject",
        userId: "emp-1",
        leaveType: "CASUAL",
        startDate: new Date("2026-10-01T00:00:00.000Z"),
        endDate: new Date("2026-10-01T23:59:59.999Z"),
        daysCount: 1,
        isHalfDay: false,
        status: "REJECTED",
        reviewerId: "mgr-1",
        reviewerComment: "Critical client release scheduled on this day.",
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await leaveService.reviewLeave(mockManager, "leave-to-reject", {
        status: "REJECTED",
        reviewerComment: "Critical client release scheduled on this day.",
      });

      expect(res.status).toBe("REJECTED");
      expect(res.reviewerComment).toBe("Critical client release scheduled on this day.");
    });
  });

  describe("cancelLeave", () => {
    it("allows employee to cancel their own pending leave", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "my-leave",
        userId: "emp-1",
        status: "PENDING",
      } as any);

      await leaveService.cancelLeave(mockEmployee, "my-leave");
      expect(prisma.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: "my-leave" },
        data: { status: "CANCELLED" },
      });
    });

    it("throws ForbiddenError if employee tries to cancel another employee's leave", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue({
        id: "other-leave",
        userId: "emp-2",
        status: "PENDING",
      } as any);

      await expect(leaveService.cancelLeave(mockEmployee, "other-leave")).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("leave policies and allocation management", () => {
    it("returns leave policies", async () => {
      const policies = await leaveService.getLeavePolicies();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].leaveType).toBe("CASUAL");
    });

    it("allows super admin to update leave policies", async () => {
      vi.mocked(prisma.leavePolicy.update).mockResolvedValue({
        leaveType: "CASUAL",
        label: "Casual Vacation",
        totalDays: 14,
        description: "Updated",
        color: "#3B82F6",
        carryForward: false,
        maxCarryDays: 0,
        isActive: true,
      } as any);

      const updated = await leaveService.updateLeavePolicies(mockSuperAdmin, {
        policies: [
          {
            leaveType: "CASUAL",
            label: "Casual Vacation",
            totalDays: 14,
            description: "Updated",
            color: "#3B82F6",
            carryForward: false,
            maxCarryDays: 0,
            isActive: true,
          },
        ],
      });

      expect(updated.length).toBeGreaterThan(0);
      expect(prisma.leavePolicy.upsert).toHaveBeenCalled();
    });

    it("throws ForbiddenError when non-admin tries to update policies", async () => {
      await expect(
        leaveService.updateLeavePolicies(mockEmployee, {
          policies: [
            {
              leaveType: "CASUAL",
              label: "Casual Vacation",
              totalDays: 14,
            },
          ],
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows super admin to adjust an individual employee's quota", async () => {
      vi.mocked(prisma.userLeaveAllocation.upsert).mockResolvedValue({
        id: "alloc-1",
        userId: "emp-1",
        user: { name: "John Doe", email: "john@mediloon.de" },
        leaveType: "CASUAL",
        year: 2026,
        totalDays: 18,
        notes: "Bonus leave awarded",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const alloc = await leaveService.adjustUserLeaveAllocation(mockSuperAdmin, {
        userId: "emp-1",
        leaveType: "CASUAL",
        year: 2026,
        totalDays: 18,
        notes: "Bonus leave awarded",
      });

      expect(alloc.totalDays).toBe(18);
      expect(alloc.userName).toBe("John Doe");
      expect(prisma.userLeaveAllocation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_leaveType_year: {
              userId: "emp-1",
              leaveType: "CASUAL",
              year: 2026,
            },
          },
        })
      );
    });

    it("throws ForbiddenError when non-admin tries to adjust employee quota", async () => {
      await expect(
        leaveService.adjustUserLeaveAllocation(mockEmployee, {
          userId: "emp-1",
          leaveType: "CASUAL",
          year: 2026,
          totalDays: 18,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

