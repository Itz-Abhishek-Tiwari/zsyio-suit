import { describe, it, expect, vi, beforeEach } from "vitest";
import { hrSettingsService } from "../../apps/hrms/src/server/services/hr-settings.service";
import { updateHrSettingsSchema } from "@zsyio/validators";
import { prisma } from "@zsyio/database";
import { BadRequestError, ForbiddenError } from "@zsyio/auth/permissions";

vi.mock("@zsyio/database", () => {
  return {
    prisma: {
      hrPolicySettings: {
        findUnique: vi.fn(),
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
  name: "Regular Employee",
  email: "emp@mediloon.de",
  role: "DEVELOPER",
  permissions: ["timesheet:view:own"],
};

describe("HrSettingsService & updateHrSettingsSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateHrSettingsSchema Validation", () => {
    it("accepts valid standard and half-day hours where halfDay < standard", () => {
      const valid = updateHrSettingsSchema.safeParse({
        standardDailyHours: 8,
        halfDayMinimumHours: 4,
        overtimeThresholdMins: 0,
        weekendDays: "0,6",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects when halfDayMinimumHours is equal to standardDailyHours", () => {
      const result = updateHrSettingsSchema.safeParse({
        standardDailyHours: 8,
        halfDayMinimumHours: 8,
        overtimeThresholdMins: 0,
        weekendDays: "0,6",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Half-day minimum hours must be strictly less than standard daily hours"
        );
      }
    });

    it("rejects when halfDayMinimumHours exceeds standardDailyHours (e.g. 9h half-day with 8h shift)", () => {
      const result = updateHrSettingsSchema.safeParse({
        standardDailyHours: 8,
        halfDayMinimumHours: 9,
        overtimeThresholdMins: 0,
        weekendDays: "0,6",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Half-day minimum hours must be strictly less than standard daily hours"
        );
      }
    });
  });

  describe("HrSettingsService.updateSettings", () => {
    it("throws BadRequestError if halfDayMinimumHours >= standardDailyHours", async () => {
      await expect(
        hrSettingsService.updateSettings(mockSuperAdmin, {
          standardDailyHours: 8,
          halfDayMinimumHours: 9,
          overtimeThresholdMins: 0,
          weekendDays: "0,6",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("throws ForbiddenError if non-admin attempts to update settings", async () => {
      await expect(
        hrSettingsService.updateSettings(mockEmployee, {
          standardDailyHours: 8,
          halfDayMinimumHours: 4,
          overtimeThresholdMins: 0,
          weekendDays: "0,6",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("successfully updates HR settings when valid", async () => {
      vi.mocked(prisma.hrPolicySettings.upsert).mockResolvedValue({
        id: "default-hr-policy",
        standardDailyHours: 8.5,
        halfDayMinimumHours: 4.25,
        overtimeThresholdMins: 30,
        weekendDays: "0,6",
        updatedById: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await hrSettingsService.updateSettings(mockSuperAdmin, {
        standardDailyHours: 8.5,
        halfDayMinimumHours: 4.25,
        overtimeThresholdMins: 30,
        weekendDays: "0,6",
      });

      expect(updated.standardDailyHours).toBe(8.5);
      expect(updated.halfDayMinimumHours).toBe(4.25);
    });
  });
});
