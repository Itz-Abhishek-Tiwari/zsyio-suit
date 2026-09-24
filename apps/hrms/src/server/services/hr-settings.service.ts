import { prisma } from "@zsyio/database";
import { assertCan, BadRequestError } from "@zsyio/auth/permissions";
import type { UpdateHrSettingsInput } from "@zsyio/validators";
import type { HrPolicySettingsItem } from "@zsyio/types";
import type { UserContext } from "./timesheet.service";

export class HrSettingsService {
  async getSettings(): Promise<HrPolicySettingsItem> {
    let settings = await prisma.hrPolicySettings.findUnique({
      where: { id: "default-hr-policy" },
    });

    if (!settings) {
      settings = await prisma.hrPolicySettings.create({
        data: {
          id: "default-hr-policy",
          standardDailyHours: 8.0,
          halfDayMinimumHours: 4.0,
          overtimeThresholdMins: 0,
          weekendDays: "0,6",
        },
      });
    }

    return {
      id: settings.id,
      standardDailyHours: settings.standardDailyHours,
      halfDayMinimumHours: settings.halfDayMinimumHours,
      overtimeThresholdMins: settings.overtimeThresholdMins,
      weekendDays: settings.weekendDays,
      updatedById: settings.updatedById,
    };
  }

  async updateSettings(
    actor: UserContext,
    input: UpdateHrSettingsInput
  ): Promise<HrPolicySettingsItem> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    if (input.halfDayMinimumHours >= input.standardDailyHours) {
      throw new BadRequestError(
        `Half-day minimum hours (${input.halfDayMinimumHours}h) must be strictly less than standard daily hours (${input.standardDailyHours}h).`
      );
    }

    const updated = await prisma.hrPolicySettings.upsert({
      where: { id: "default-hr-policy" },
      create: {
        id: "default-hr-policy",
        standardDailyHours: input.standardDailyHours,
        halfDayMinimumHours: input.halfDayMinimumHours,
        overtimeThresholdMins: input.overtimeThresholdMins,
        weekendDays: input.weekendDays,
        updatedById: actor.id,
      },
      update: {
        standardDailyHours: input.standardDailyHours,
        halfDayMinimumHours: input.halfDayMinimumHours,
        overtimeThresholdMins: input.overtimeThresholdMins,
        weekendDays: input.weekendDays,
        updatedById: actor.id,
      },
    });

    return {
      id: updated.id,
      standardDailyHours: updated.standardDailyHours,
      halfDayMinimumHours: updated.halfDayMinimumHours,
      overtimeThresholdMins: updated.overtimeThresholdMins,
      weekendDays: updated.weekendDays,
      updatedById: updated.updatedById,
    };
  }
}

export const hrSettingsService = new HrSettingsService();
