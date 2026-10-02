import { describe, it, expect, vi, beforeEach } from "vitest";
import { regularizationService } from "../../apps/hrms/src/server/services/regularization.service";
import { prisma } from "@zsyio/database";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";

vi.mock("@zsyio/database", () => {
  return {
    prisma: {
      attendanceRegularization: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workSession: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      timesheetAuditLog: {
        create: vi.fn(),
      },
    },
  };
});

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

const mockSuperAdmin = {
  id: "admin-1",
  name: "Super Admin",
  email: "admin@mediloon.de",
  role: "SUPER_ADMIN",
  permissions: ["timesheet:manage", "timesheet:view:all"],
};

describe("RegularizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("applyRegularization", () => {
    it("successfully creates a pending attendance regularization request", async () => {
      vi.mocked(prisma.attendanceRegularization.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.attendanceRegularization.create).mockResolvedValue({
        id: "reg-1",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        type: "MISSED_PUNCH_IN",
        requestedClockIn: new Date("2026-09-02T09:00:00.000Z"),
        requestedClockOut: new Date("2026-09-02T18:00:00.000Z"),
        reason: "Forgot to clock in on arrival",
        status: "PENDING",
        reviewerId: null,
        reviewerComment: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "emp-1", name: "John Doe", email: "john@mediloon.de", role: "DEVELOPER" },
      } as any);

      const res = await regularizationService.applyRegularization(mockEmployee, {
        date: "2026-09-02",
        type: "MISSED_PUNCH_IN",
        requestedClockIn: "09:00",
        requestedClockOut: "18:00",
        reason: "Forgot to clock in on arrival",
      });

      expect(res.id).toBe("reg-1");
      expect(res.status).toBe("PENDING");
      expect(res.type).toBe("MISSED_PUNCH_IN");
      expect(prisma.attendanceRegularization.create).toHaveBeenCalled();
    });

    it("throws ConflictError if a pending regularization request already exists for that date", async () => {
      vi.mocked(prisma.attendanceRegularization.findFirst).mockResolvedValue({
        id: "existing-reg",
        userId: "emp-1",
        status: "PENDING",
      } as any);

      await expect(
        regularizationService.applyRegularization(mockEmployee, {
          date: "2026-09-02",
          type: "MISSED_BOTH",
          requestedClockIn: "09:00",
          requestedClockOut: "18:00",
          reason: "Duplicate request attempt",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("throws BadRequestError if clock out time is before clock in time", async () => {
      vi.mocked(prisma.attendanceRegularization.findFirst).mockResolvedValue(null);

      await expect(
        regularizationService.applyRegularization(mockEmployee, {
          date: "2026-09-02",
          type: "MISSED_BOTH",
          requestedClockIn: "18:00",
          requestedClockOut: "09:00",
          reason: "Invalid timing order",
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("reviewRegularization", () => {
    it("allows manager to approve a regularization and regularize timesheet", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "reg-1",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        requestedClockIn: new Date("2026-09-02T09:00:00.000Z"),
        requestedClockOut: new Date("2026-09-02T18:00:00.000Z"),
        reason: "Forgot punch in",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.workSession.findFirst).mockResolvedValue({
        id: "ws-existing",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        startTime: new Date("2026-09-02T10:00:00.000Z"),
        endTime: new Date("2026-09-02T18:00:00.000Z"),
        status: "COMPLETED",
      } as any);

      vi.mocked(prisma.attendanceRegularization.update).mockResolvedValue({
        id: "reg-1",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        type: "MISSED_PUNCH_IN",
        status: "APPROVED",
        reviewerId: "mgr-1",
        reviewerComment: "Approved shift",
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "emp-1", name: "John Doe", email: "john@mediloon.de", role: "DEVELOPER" },
        reviewer: { id: "mgr-1", name: "Manager Smith", email: "manager@mediloon.de", role: "MANAGER" },
      } as any);

      const res = await regularizationService.reviewRegularization(mockManager, "reg-1", {
        status: "APPROVED",
        reviewerComment: "Approved shift",
      });

      expect(res.status).toBe("APPROVED");
      expect(prisma.workSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ws-existing" },
          data: expect.objectContaining({
            status: "COMPLETED",
            approvalStatus: "APPROVED",
            entryType: "MANUAL",
          }),
        })
      );
      expect(prisma.timesheetAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "REGULARIZED",
          }),
        })
      );
    });

    it("creates a new work session if none existed on that day when approved", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "reg-2",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        requestedClockIn: new Date("2026-09-02T09:00:00.000Z"),
        requestedClockOut: new Date("2026-09-02T18:00:00.000Z"),
        reason: "Forgot entire day",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.workSession.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.workSession.create).mockResolvedValue({
        id: "ws-new",
      } as any);

      vi.mocked(prisma.attendanceRegularization.update).mockResolvedValue({
        id: "reg-2",
        userId: "emp-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        type: "MISSED_BOTH",
        status: "APPROVED",
        reviewerId: "mgr-1",
        reviewerComment: "Approved whole day",
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await regularizationService.reviewRegularization(mockManager, "reg-2", {
        status: "APPROVED",
        reviewerComment: "Approved whole day",
      });

      expect(prisma.workSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "emp-1",
            entryType: "MANUAL",
            status: "COMPLETED",
          }),
        })
      );
    });

    it("throws ForbiddenError if normal employee attempts to review a regularization", async () => {
      await expect(
        regularizationService.reviewRegularization(mockEmployee, "reg-1", {
          status: "APPROVED",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("throws ForbiddenError if manager attempts to approve their own regularization request", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "own-reg",
        userId: "mgr-1", // Same as mockManager.id
        status: "PENDING",
        date: new Date("2026-09-02T00:00:00.000Z"),
      } as any);

      await expect(
        regularizationService.reviewRegularization(mockManager, "own-reg", {
          status: "APPROVED",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows SUPER_ADMIN to approve their own regularization request", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "superadmin-reg",
        userId: "admin-1", // Same as mockSuperAdmin.id
        status: "PENDING",
        date: new Date("2026-09-02T00:00:00.000Z"),
      } as any);

      vi.mocked(prisma.workSession.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.workSession.create).mockResolvedValue({ id: "new-ws" } as any);
      vi.mocked(prisma.attendanceRegularization.update).mockResolvedValue({
        id: "superadmin-reg",
        userId: "admin-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        type: "MISSED_PUNCH_IN",
        status: "APPROVED",
        reviewerId: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: "admin-1", name: "Super Admin", email: "admin@mediloon.de", role: "SUPER_ADMIN" },
        reviewer: { id: "admin-1", name: "Super Admin", email: "admin@mediloon.de", role: "SUPER_ADMIN" },
      } as any);

      const res = await regularizationService.reviewRegularization(mockSuperAdmin, "superadmin-reg", {
        status: "APPROVED",
      });

      expect(res.status).toBe("APPROVED");
    });
  });

  describe("cancelRegularization", () => {
    it("allows employee to cancel their own pending regularization", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "my-reg",
        userId: "emp-1",
        status: "PENDING",
      } as any);

      vi.mocked(prisma.attendanceRegularization.update).mockResolvedValue({
        id: "my-reg",
        userId: "emp-1",
        date: new Date(),
        type: "MISSED_BOTH",
        status: "CANCELLED",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await regularizationService.cancelRegularization(mockEmployee, "my-reg");
      expect(res.status).toBe("CANCELLED");
      expect(prisma.attendanceRegularization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "my-reg" },
          data: { status: "CANCELLED" },
        })
      );
    });

    it("throws ForbiddenError if employee tries to cancel someone else's regularization", async () => {
      vi.mocked(prisma.attendanceRegularization.findUnique).mockResolvedValue({
        id: "other-reg",
        userId: "emp-2",
        status: "PENDING",
      } as any);

      await expect(
        regularizationService.cancelRegularization(mockEmployee, "other-reg")
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
