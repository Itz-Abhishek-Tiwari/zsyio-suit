import { describe, it, expect, vi, beforeEach } from "vitest";
import { timesheetService, type UserContext } from "../../apps/hrms/src/server/services/timesheet.service";
import { timesheetRepository } from "../../apps/hrms/src/server/repositories/timesheet.repository";
import { BadRequestError, ConflictError, ForbiddenError } from "@zsyio/auth/permissions";

vi.mock("../../apps/hrms/src/server/repositories/timesheet.repository", () => {
  return {
    timesheetRepository: {
      findActiveWorkSession: vi.fn(),
      findActiveOooSession: vi.fn(),
      findWorkSessionsForDay: vi.fn(),
      findOooSessionsForDay: vi.fn(),
      findIncompleteSessions: vi.fn(),
      checkWorkSessionOverlap: vi.fn(),
      checkOooSessionOverlap: vi.fn(),
      createWorkSession: vi.fn(),
      updateWorkSession: vi.fn(),
      createOooSession: vi.fn(),
      updateOooSession: vi.fn(),
      deleteOooSession: vi.fn(),
      createAuditLog: vi.fn(),
      getWorkSessionById: vi.fn(),
      getOooSessionById: vi.fn(),
      listAdminTimesheets: vi.fn(),
      getAdminMetrics: vi.fn(),
    },
    normalizeDate: vi.fn((d: Date | string) => new Date("2026-09-01T00:00:00.000Z")),
    getStartOfDay: vi.fn((d: Date) => new Date("2026-09-01T00:00:00.000Z")),
    getEndOfDay: vi.fn((d: Date) => new Date("2026-09-01T23:59:59.999Z")),
    parseDateTimeInTimeZone: vi.fn((dateStr: string, timeStr: string, timeZone?: string) => {
      if (timeStr.includes("T")) return new Date(timeStr);
      const datePart = dateStr.split("T")[0];
      return new Date(`${datePart}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}Z`);
    }),
  };
});

const mockEmployee: UserContext = {
  id: "emp-1",
  name: "John Doe",
  email: "john@mediloon.de",
  role: "DEVELOPER",
  permissions: ["timesheet:view:own", "timesheet:clock", "timesheet:manual:create"],
};

const mockAdmin: UserContext = {
  id: "admin-1",
  name: "Super Admin",
  email: "admin@mediloon.de",
  role: "SUPER_ADMIN",
  permissions: ["timesheet:view:own", "timesheet:clock", "timesheet:manual:create", "timesheet:view:all", "timesheet:manage", "timesheet:export"],
};

describe("TimesheetService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("clockIn", () => {
    it("successfully creates an active working session when none exists", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue(null);
      vi.mocked(timesheetRepository.createWorkSession).mockResolvedValue({
        id: "ws-1",
        userId: "emp-1",
        date: new Date("2026-09-01T00:00:00.000Z"),
        startTime: new Date("2026-09-01T09:30:00.000Z"),
        endTime: null,
        durationMinutes: null,
        entryType: "AUTOMATIC",
        status: "ACTIVE",
        approvalStatus: "APPROVED",
        reason: null,
        createdById: "emp-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await timesheetService.clockIn(mockEmployee);
      expect(res.success).toBe(true);
      expect(res.session.id).toBe("ws-1");
      expect(timesheetRepository.createWorkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "emp-1",
          entryType: "AUTOMATIC",
          status: "ACTIVE",
        })
      );
    });

    it("throws BadRequestError if employee already has an active working session", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue({
        id: "ws-existing",
        userId: "emp-1",
        status: "ACTIVE",
      } as any);

      await expect(timesheetService.clockIn(mockEmployee)).rejects.toThrow(BadRequestError);
      expect(timesheetRepository.createWorkSession).not.toHaveBeenCalled();
    });
  });

  describe("clockOut", () => {
    it("successfully clocks out an active session and calculates duration", async () => {
      const startTime = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue({
        id: "ws-1",
        userId: "emp-1",
        startTime,
        status: "ACTIVE",
      } as any);
      vi.mocked(timesheetRepository.findActiveOooSession).mockResolvedValue(null);
      vi.mocked(timesheetRepository.updateWorkSession).mockResolvedValue({
        id: "ws-1",
        status: "COMPLETED",
        durationMinutes: 480,
      } as any);

      const res = await timesheetService.clockOut(mockEmployee);
      expect(res.success).toBe(true);
      expect(timesheetRepository.updateWorkSession).toHaveBeenCalledWith(
        "ws-1",
        expect.objectContaining({
          status: "COMPLETED",
          durationMinutes: expect.any(Number),
        })
      );
    });

    it("automatically closes active OOO break if still open upon clock out", async () => {
      const startTime = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const oooStartTime = new Date(Date.now() - 30 * 60 * 1000); // 30m ago

      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue({
        id: "ws-1",
        userId: "emp-1",
        startTime,
        status: "ACTIVE",
      } as any);
      vi.mocked(timesheetRepository.findActiveOooSession).mockResolvedValue({
        id: "os-1",
        userId: "emp-1",
        startTime: oooStartTime,
        status: "ACTIVE",
      } as any);
      vi.mocked(timesheetRepository.updateWorkSession).mockResolvedValue({
        id: "ws-1",
        status: "COMPLETED",
      } as any);

      await timesheetService.clockOut(mockEmployee);
      expect(timesheetRepository.updateOooSession).toHaveBeenCalledWith(
        "os-1",
        expect.objectContaining({
          status: "COMPLETED",
          durationMinutes: expect.any(Number),
        })
      );
    });

    it("throws BadRequestError if no active working session exists to clock out", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue(null);

      await expect(timesheetService.clockOut(mockEmployee)).rejects.toThrow(BadRequestError);
    });
  });

  describe("Out Of Office (OOO) breaks", () => {
    it("starts OOO when employee is currently working", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue({
        id: "ws-1",
        userId: "emp-1",
        status: "ACTIVE",
      } as any);
      vi.mocked(timesheetRepository.findActiveOooSession).mockResolvedValue(null);
      vi.mocked(timesheetRepository.createOooSession).mockResolvedValue({
        id: "os-1",
        status: "ACTIVE",
        reason: "Lunch break",
      } as any);

      const res = await timesheetService.startOoo(mockEmployee, { reason: "Lunch break" });
      expect(res.success).toBe(true);
      expect(timesheetRepository.createOooSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "emp-1",
          workSessionId: "ws-1",
          status: "ACTIVE",
          reason: "Lunch break",
        })
      );
    });

    it("throws BadRequestError if starting OOO when not clocked in", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue(null);

      await expect(timesheetService.startOoo(mockEmployee, { reason: "Lunch" })).rejects.toThrow(
        "You must be Clocked In / Working before starting an Out Of Office break."
      );
    });

    it("throws BadRequestError if starting OOO while already on OOO", async () => {
      vi.mocked(timesheetRepository.findActiveWorkSession).mockResolvedValue({ id: "ws-1" } as any);
      vi.mocked(timesheetRepository.findActiveOooSession).mockResolvedValue({ id: "os-1" } as any);

      await expect(timesheetService.startOoo(mockEmployee, { reason: "Another break" })).rejects.toThrow(
        "You are already in an active Out Of Office break."
      );
    });

    it("ends OOO break and computes break duration", async () => {
      const oooStart = new Date(Date.now() - 25 * 60 * 1000); // 25 min ago
      vi.mocked(timesheetRepository.findActiveOooSession).mockResolvedValue({
        id: "os-1",
        startTime: oooStart,
        status: "ACTIVE",
      } as any);
      vi.mocked(timesheetRepository.updateOooSession).mockResolvedValue({
        id: "os-1",
        status: "COMPLETED",
        durationMinutes: 25,
      } as any);

      const res = await timesheetService.endOoo(mockEmployee);
      expect(res.success).toBe(true);
      expect(timesheetRepository.updateOooSession).toHaveBeenCalledWith(
        "os-1",
        expect.objectContaining({
          status: "COMPLETED",
          durationMinutes: expect.any(Number),
        })
      );
    });
  });

  describe("Manual entries & validations", () => {
    it("successfully creates manual work session and logs audit trail", async () => {
      vi.mocked(timesheetRepository.checkWorkSessionOverlap).mockResolvedValue(null);
      vi.mocked(timesheetRepository.createWorkSession).mockResolvedValue({
        id: "ws-manual-1",
        entryType: "MANUAL",
        durationMinutes: 510,
      } as any);

      const res = await timesheetService.addManualWorkSession(mockEmployee, {
        date: "2026-09-01",
        startTime: "09:30",
        endTime: "18:00",
        reason: "Forgot to clock in",
      });

      expect(res.success).toBe(true);
      expect(timesheetRepository.createWorkSession).toHaveBeenCalledWith(
        expect.objectContaining({
          entryType: "MANUAL",
          status: "COMPLETED",
          reason: "Forgot to clock in",
        })
      );
      expect(timesheetRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          workSessionId: "ws-manual-1",
          actorId: "emp-1",
          action: "CREATED",
        })
      );
    });

    it("rejects manual work session if it overlaps with an existing session", async () => {
      vi.mocked(timesheetRepository.checkWorkSessionOverlap).mockResolvedValue({
        id: "ws-conflict",
      } as any);

      await expect(
        timesheetService.addManualWorkSession(mockEmployee, {
          date: "2026-09-01",
          startTime: "09:30",
          endTime: "18:00",
          reason: "Overlapping shift",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("rejects manual work session if clock out time is before clock in time", async () => {
      await expect(
        timesheetService.addManualWorkSession(mockEmployee, {
          date: "2026-09-01",
          startTime: "18:00",
          endTime: "09:30",
          reason: "Invalid times",
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Manual OOO Sessions", () => {
    it("creates a manual OOO session and logs audit trail with timeRange field", async () => {
      vi.mocked(timesheetRepository.checkOooSessionOverlap).mockResolvedValue(null);
      vi.mocked(timesheetRepository.createOooSession).mockResolvedValue({
        id: "os-manual-1",
        userId: "emp-1",
        entryType: "MANUAL",
        startTime: new Date("2026-09-01T13:00:00.000Z"),
        endTime: new Date("2026-09-01T13:30:00.000Z"),
        durationMinutes: 30,
      } as any);

      const res = await timesheetService.addManualOooSession(mockEmployee, {
        date: "2026-09-01",
        startTime: "13:00",
        endTime: "13:30",
        reason: "Doctor appointment",
      });

      expect(res.success).toBe(true);
      expect(timesheetRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          oooSessionId: "os-manual-1",
          actorId: "emp-1",
          action: "CREATED",
          field: "timeRange",
          newValue: expect.stringContaining("2026-09-01T13:00:00.000Z - 2026-09-01T13:30:00.000Z"),
          reason: "Doctor appointment",
        })
      );
    });

    it("allows updating a manual OOO session and records CORRECTED audit log", async () => {
      vi.mocked(timesheetRepository.getOooSessionById).mockResolvedValue({
        id: "os-manual-1",
        userId: "emp-1",
        entryType: "MANUAL",
        startTime: new Date("2026-09-01T13:00:00.000Z"),
        endTime: new Date("2026-09-01T13:30:00.000Z"),
        durationMinutes: 30,
      } as any);
      vi.mocked(timesheetRepository.checkOooSessionOverlap).mockResolvedValue(null);
      vi.mocked(timesheetRepository.updateOooSession).mockResolvedValue({
        id: "os-manual-1",
      } as any);

      const res = await timesheetService.updateManualOooSession(mockEmployee, "os-manual-1", {
        startTime: "13:00",
        endTime: "14:00",
        reason: "Extended appointment",
      });

      expect(res.success).toBe(true);
      expect(timesheetRepository.updateOooSession).toHaveBeenCalledWith(
        "os-manual-1",
        expect.objectContaining({
          durationMinutes: 60,
        })
      );
      expect(timesheetRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          oooSessionId: "os-manual-1",
          actorId: "emp-1",
          action: "CORRECTED",
          field: "timeRange",
          reason: "Extended appointment",
        })
      );
    });

    it("allows deleting a manual OOO session", async () => {
      vi.mocked(timesheetRepository.getOooSessionById).mockResolvedValue({
        id: "os-manual-1",
        userId: "emp-1",
        entryType: "MANUAL",
      } as any);
      vi.mocked(timesheetRepository.deleteOooSession).mockResolvedValue({
        id: "os-manual-1",
      } as any);

      const res = await timesheetService.deleteManualOooSession(mockEmployee, "os-manual-1");
      expect(res.success).toBe(true);
      expect(timesheetRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: "DELETED", oooSessionId: "os-manual-1" })
      );
      expect(timesheetRepository.deleteOooSession).toHaveBeenCalledWith("os-manual-1");
    });
  });

  describe("Admin corrections & Audit logging", () => {
    it("allows Super Admin to modify a record with an audit reason", async () => {
      vi.mocked(timesheetRepository.getWorkSessionById).mockResolvedValue({
        id: "ws-1",
        startTime: new Date("2026-09-01T09:30:00.000Z"),
        endTime: new Date("2026-09-01T18:00:00.000Z"),
      } as any);

      const res = await timesheetService.adminCorrectSession(mockAdmin, {
        sessionId: "ws-1",
        sessionType: "WORK",
        startTime: "2026-09-01T09:15:00.000Z",
        endTime: "2026-09-01T18:00:00.000Z",
        reason: "Employee requested correction",
      });

      expect(res.success).toBe(true);
      expect(timesheetRepository.updateWorkSession).toHaveBeenCalledWith(
        "ws-1",
        expect.objectContaining({
          durationMinutes: 525, // 8h 45m
        })
      );
      expect(timesheetRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          workSessionId: "ws-1",
          actorId: "admin-1",
          action: "CORRECTED",
          reason: "Employee requested correction",
        })
      );
    });

    it("prevents standard employee from making admin corrections", async () => {
      await expect(
        timesheetService.adminCorrectSession(mockEmployee, {
          sessionId: "ws-1",
          sessionType: "WORK",
          startTime: "2026-09-01T09:15:00.000Z",
          endTime: "2026-09-01T18:00:00.000Z",
          reason: "Unauthorized attempt",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getDailyTimesheet duration arithmetic", () => {
    it("calculates Net Working Time = Total Session - Total OOO correctly", async () => {
      vi.mocked(timesheetRepository.findWorkSessionsForDay).mockResolvedValue([
        {
          id: "ws-1",
          startTime: new Date("2026-09-01T09:30:00.000Z"),
          endTime: new Date("2026-09-01T18:30:00.000Z"),
          durationMinutes: 540, // 9 hours
          entryType: "AUTOMATIC",
          status: "COMPLETED",
          auditLogs: [],
        },
      ] as any);

      vi.mocked(timesheetRepository.findOooSessionsForDay).mockResolvedValue([
        {
          id: "os-1",
          startTime: new Date("2026-09-01T12:30:00.000Z"),
          endTime: new Date("2026-09-01T12:50:00.000Z"),
          durationMinutes: 20,
          entryType: "AUTOMATIC",
          status: "COMPLETED",
          auditLogs: [],
        },
        {
          id: "os-2",
          startTime: new Date("2026-09-01T15:00:00.000Z"),
          endTime: new Date("2026-09-01T15:30:00.000Z"),
          durationMinutes: 30,
          entryType: "AUTOMATIC",
          status: "COMPLETED",
          auditLogs: [],
        },
      ] as any);

      const res = await timesheetService.getDailyTimesheet(mockEmployee, "emp-1", "2026-09-01");

      // Total session = 540m (9h)
      // Total OOO = 20m + 30m = 50m
      // Net working = 540 - 50 = 490m (8h 10m)
      expect(res.summary.totalSessionMinutes).toBe(540);
      expect(res.summary.totalOooMinutes).toBe(50);
      expect(res.summary.netWorkingMinutes).toBe(490);
      expect(res.timeline.length).toBe(3);
    });
  });
});
