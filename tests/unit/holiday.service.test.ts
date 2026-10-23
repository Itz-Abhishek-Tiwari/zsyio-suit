import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearHolidaySeedCache, holidayService } from "../../apps/hrms/src/server/services/holiday.service";
import { prisma } from "@zsyio/database";
import { ConflictError, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";

vi.mock("@zsyio/database", () => {
  return {
    prisma: {
      companyHoliday: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        upsert: vi.fn(),
      },
    },
  };
});

const mockSuperAdmin = {
  id: "admin-1",
  name: "Super Admin",
  email: "admin@zsyio.de",
  role: "SUPER_ADMIN",
  permissions: ["timesheet:manage", "timesheet:view:all"],
};

const mockEmployee = {
  id: "emp-1",
  name: "Regular Employee",
  email: "emp@zsyio.de",
  role: "DEVELOPER",
  permissions: ["timesheet:view:own"],
};

describe("HolidayService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearHolidaySeedCache();
  });

  describe("getHolidays", () => {
    it("returns holidays and calculates daysRemaining and dayOfWeek", async () => {
      vi.mocked(prisma.companyHoliday.count).mockResolvedValue(1);
      vi.mocked(prisma.companyHoliday.findMany).mockResolvedValue([
        {
          id: "hol-1",
          name: "Diwali",
          date: "2026-11-08",
          year: 2026,
          isOptional: false,
          description: "Festival of lights",
          createdById: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await holidayService.getHolidays(2026);
      expect(result.holidays).toHaveLength(1);
      expect(result.holidays[0].name).toBe("Diwali");
      expect(result.holidays[0].dayOfWeek).toBeDefined();
    });

    it("seeds default holidays if count is 0", async () => {
      vi.mocked(prisma.companyHoliday.count).mockResolvedValue(0);
      vi.mocked(prisma.companyHoliday.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.companyHoliday.findMany).mockResolvedValue([]);

      await holidayService.getHolidays(2026);
      expect(prisma.companyHoliday.upsert).toHaveBeenCalled();
    });
  });

  describe("createHoliday", () => {
    it("allows Super Admin to create a new holiday", async () => {
      vi.mocked(prisma.companyHoliday.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.companyHoliday.create).mockResolvedValue({
        id: "new-hol",
        name: "Founder's Day",
        date: "2026-05-15",
        year: 2026,
        isOptional: true,
        description: "Company foundation day",
        createdById: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const holiday = await holidayService.createHoliday(mockSuperAdmin, {
        name: "Founder's Day",
        date: "2026-05-15",
        isOptional: true,
        description: "Company foundation day",
      });

      expect(holiday.name).toBe("Founder's Day");
      expect(holiday.isOptional).toBe(true);
      expect(prisma.companyHoliday.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Founder's Day",
          date: "2026-05-15",
          year: 2026,
          isOptional: true,
          createdById: "admin-1",
        }),
      });
    });

    it("throws ConflictError if a holiday already exists on the same date", async () => {
      vi.mocked(prisma.companyHoliday.findFirst).mockResolvedValue({
        id: "existing-hol",
        name: "Diwali",
        date: "2026-11-08",
        year: 2026,
        isOptional: false,
        description: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        holidayService.createHoliday(mockSuperAdmin, {
          name: "Company Special Off", // Different name, same date
          date: "2026-11-08",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("throws ForbiddenError if non-admin tries to create a holiday", async () => {
      await expect(
        holidayService.createHoliday(mockEmployee, {
          name: "Special Holiday",
          date: "2026-07-01",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateHoliday", () => {
    it("allows Super Admin to update holiday details", async () => {
      vi.mocked(prisma.companyHoliday.findUnique).mockResolvedValue({
        id: "hol-1",
        name: "Diwali",
        date: "2026-11-08",
        year: 2026,
        isOptional: false,
        description: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.companyHoliday.update).mockResolvedValue({
        id: "hol-1",
        name: "Deepawali Special",
        date: "2026-11-08",
        year: 2026,
        isOptional: false,
        description: "Updated description",
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await holidayService.updateHoliday(mockSuperAdmin, "hol-1", {
        name: "Deepawali Special",
        description: "Updated description",
      });

      expect(updated.name).toBe("Deepawali Special");
      expect(prisma.companyHoliday.update).toHaveBeenCalledWith({
        where: { id: "hol-1" },
        data: expect.objectContaining({
          name: "Deepawali Special",
          description: "Updated description",
        }),
      });
    });

    it("throws ConflictError if updating to a date that already has a holiday", async () => {
      vi.mocked(prisma.companyHoliday.findUnique).mockResolvedValue({
        id: "hol-1",
        name: "Diwali",
        date: "2026-11-08",
        year: 2026,
        isOptional: false,
        description: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.companyHoliday.findFirst).mockResolvedValue({
        id: "hol-2",
        name: "Govardhan Puja",
        date: "2026-11-09",
        year: 2026,
        isOptional: true,
        description: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        holidayService.updateHoliday(mockSuperAdmin, "hol-1", {
          date: "2026-11-09",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("throws NotFoundError if holiday does not exist", async () => {
      vi.mocked(prisma.companyHoliday.findUnique).mockResolvedValue(null);

      await expect(
        holidayService.updateHoliday(mockSuperAdmin, "unknown-id", { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError if employee tries to update holiday", async () => {
      await expect(
        holidayService.updateHoliday(mockEmployee, "hol-1", { name: "Test" })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteHoliday", () => {
    it("allows Super Admin to delete a holiday", async () => {
      vi.mocked(prisma.companyHoliday.findUnique).mockResolvedValue({
        id: "hol-1",
        name: "Holiday",
        date: "2026-11-08",
        year: 2026,
        isOptional: false,
        description: null,
        createdById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.companyHoliday.delete).mockResolvedValue({} as any);

      const res = await holidayService.deleteHoliday(mockSuperAdmin, "hol-1");
      expect(res.success).toBe(true);
      expect(prisma.companyHoliday.delete).toHaveBeenCalledWith({ where: { id: "hol-1" } });
    });

    it("throws ForbiddenError if employee tries to delete holiday", async () => {
      await expect(holidayService.deleteHoliday(mockEmployee, "hol-1")).rejects.toThrow(ForbiddenError);
    });
  });
});
