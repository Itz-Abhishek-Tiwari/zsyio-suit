import { assertCan, NotFoundError, ConflictError } from "@zsyio/auth/permissions";
import { prisma } from "@zsyio/database";
import type { CompanyHoliday } from "@zsyio/types";
import type { CreateHolidayInput, UpdateHolidayInput } from "@zsyio/validators";
import type { UserContext } from "./timesheet.service";

// Standard Company Holidays initial seed template
const COMPANY_HOLIDAYS_RAW = [
  { name: "New Year's Day", month: 0, day: 1, isOptional: false, description: "Celebration of the New Year" },
  { name: "Republic Day", month: 0, day: 26, isOptional: false, description: "Honoring the Constitution of the Nation" },
  { name: "Holi (Festival of Colors)", month: 2, day: 14, isOptional: false, description: "Spring festival and colors" },
  { name: "Good Friday", month: 3, day: 18, isOptional: false, description: "Christian holiday commemorating the passion" },
  { name: "Eid-ul-Fitr", month: 2, day: 31, isOptional: false, description: "Islamic festival marking the end of Ramadan" },
  { name: "International Labor Day", month: 4, day: 1, isOptional: true, description: "Worldwide tribute to workers' contributions" },
  { name: "Independence Day", month: 7, day: 15, isOptional: false, description: "National Independence Celebration" },
  { name: "Raksha Bandhan", month: 7, day: 28, isOptional: true, description: "Festival of sibling bond and protection" },
  { name: "Gandhi Jayanti", month: 9, day: 2, isOptional: false, description: "Father of the Nation Birthday commemoration" },
  { name: "Dussehra (Vijayadashami)", month: 9, day: 20, isOptional: false, description: "Victory of good over evil" },
  { name: "Diwali (Festival of Lights)", month: 10, day: 8, isOptional: false, description: "Grand celebration of lights and prosperity" },
  { name: "Govardhan Puja", month: 10, day: 9, isOptional: true, description: "Post-Diwali devotion celebration" },
  { name: "Guru Nanak Jayanti", month: 10, day: 24, isOptional: false, description: "Birth anniversary of Guru Nanak Dev Ji" },
  { name: "Christmas Day", month: 11, day: 25, isOptional: false, description: "Worldwide celebration of Christmas" },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Years already known to have holidays, so later requests skip the count query.
const seededYears = new Set<number>();

/** Forget which years were seeded (used by tests, which mock the holiday table per case). */
export function clearHolidaySeedCache() {
  seededYears.clear();
}

export class HolidayService {
  private async ensureHolidaysSeeded(year: number) {
    if (seededYears.has(year)) return;
    const count = await prisma.companyHoliday.count({ where: { year } });
    if (count > 0) {
      seededYears.add(year);
      return;
    }

    const defaults = COMPANY_HOLIDAYS_RAW.map((h) => {
      const mm = String(h.month + 1).padStart(2, "0");
      const dd = String(h.day).padStart(2, "0");
      return {
        name: h.name,
        date: `${year}-${mm}-${dd}`,
        year,
        isOptional: h.isOptional,
        description: h.description,
      };
    });

    for (const d of defaults) {
      await prisma.companyHoliday.upsert({
        where: {
          date: d.date,
        },
        update: {},
        create: d,
      });
    }
    seededYears.add(year);
  }

  async getHolidays(year?: number): Promise<{ holidays: CompanyHoliday[]; upcoming: CompanyHoliday | null }> {
    const targetYear = year || new Date().getFullYear();
    await this.ensureHolidaysSeeded(targetYear);

    const dbHolidays = await prisma.companyHoliday.findMany({
      where: { year: targetYear },
      orderBy: { date: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidays: CompanyHoliday[] = dbHolidays.map((h) => {
      const [y, m, d] = h.date.split("-").map(Number);
      const holDate = new Date(y, m - 1, d);
      const diffTime = holDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dayOfWeek = DAYS[holDate.getDay()];

      return {
        id: h.id,
        name: h.name,
        date: h.date,
        dayOfWeek,
        isOptional: h.isOptional,
        description: h.description || undefined,
        daysRemaining,
      };
    });

    const upcoming = holidays.find((h) => h.daysRemaining >= 0) || null;
    return { holidays, upcoming };
  }

  async createHoliday(actor: UserContext, input: CreateHolidayInput): Promise<CompanyHoliday> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const [y, m, d] = input.date.split("-").map(Number);
    const year = y;

    const existing = await prisma.companyHoliday.findFirst({
      where: { date: input.date },
    });
    if (existing) {
      throw new ConflictError(`A holiday ("${existing.name}") already exists on ${input.date}.`);
    }

    let created;
    try {
      created = await prisma.companyHoliday.create({
        data: {
          name: input.name,
          date: input.date,
          year,
          isOptional: input.isOptional ?? false,
          description: input.description,
          createdById: actor.id,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ConflictError(`A holiday already exists on ${input.date}.`);
      }
      throw err;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holDate = new Date(y, m - 1, d);
    const diffTime = holDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dayOfWeek = DAYS[holDate.getDay()];

    return {
      id: created.id,
      name: created.name,
      date: created.date,
      dayOfWeek,
      isOptional: created.isOptional,
      description: created.description || undefined,
      daysRemaining,
    };
  }

  async updateHoliday(actor: UserContext, id: string, input: UpdateHolidayInput): Promise<CompanyHoliday> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const holiday = await prisma.companyHoliday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundError("Holiday not found.");
    }

    if (input.date && input.date !== holiday.date) {
      const existingOnDate = await prisma.companyHoliday.findFirst({
        where: { date: input.date },
      });
      if (existingOnDate) {
        throw new ConflictError(
          `A holiday ("${existingOnDate.name}") already exists on ${input.date}.`
        );
      }
    }

    const year = input.date ? parseInt(input.date.split("-")[0], 10) : holiday.year;

    const updated = await prisma.companyHoliday.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.date ? { date: input.date, year } : {}),
        ...(input.isOptional !== undefined ? { isOptional: input.isOptional } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = updated.date.split("-").map(Number);
    const holDate = new Date(y, m - 1, d);
    const diffTime = holDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dayOfWeek = DAYS[holDate.getDay()];

    return {
      id: updated.id,
      name: updated.name,
      date: updated.date,
      dayOfWeek,
      isOptional: updated.isOptional,
      description: updated.description || undefined,
      daysRemaining,
    };
  }

  async deleteHoliday(actor: UserContext, id: string): Promise<{ success: boolean }> {
    assertCan(actor.role, "timesheet:manage", actor.permissions);

    const holiday = await prisma.companyHoliday.findUnique({ where: { id } });
    if (!holiday) {
      throw new NotFoundError("Holiday not found.");
    }

    await prisma.companyHoliday.delete({ where: { id } });
    return { success: true };
  }
}

export const holidayService = new HolidayService();
