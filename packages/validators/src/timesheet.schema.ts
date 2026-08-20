import { z } from "zod";

export const entryTypeEnum = z.enum(["AUTOMATIC", "MANUAL"]);
export const sessionStatusEnum = z.enum(["ACTIVE", "COMPLETED", "INCOMPLETE"]);
export const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const clockInSchema = z.object({
  note: z.string().max(255).optional().nullable(),
});

export const clockOutSchema = z.object({
  note: z.string().max(255).optional().nullable(),
});

export const startOooSchema = z.object({
  reason: z.string().max(255).optional().nullable(),
});

export const endOooSchema = z.object({
  note: z.string().max(255).optional().nullable(),
});

export const manualWorkSessionSchema = z
  .object({
    date: z.string().min(1, "Date is required"), // YYYY-MM-DD
    startTime: z.string().min(1, "Clock in time is required"), // HH:mm or ISO
    endTime: z.string().min(1, "Clock out time is required"), // HH:mm or ISO
    reason: z.string().min(3, "Reason must be at least 3 characters"),
  })
  .refine(
    (data) => {
      const start = data.startTime.includes("T") && data.startTime.length > 10
        ? new Date(data.startTime)
        : new Date(`${data.date.split("T")[0]}T${data.startTime}`);
      const end = data.endTime.includes("T") && data.endTime.length > 10
        ? new Date(data.endTime)
        : new Date(`${data.date.split("T")[0]}T${data.endTime}`);
      return end > start;
    },
    {
      message: "Clock out time must be after clock in time",
      path: ["endTime"],
    }
  );

export const manualOooSessionSchema = z
  .object({
    date: z.string().min(1, "Date is required"), // YYYY-MM-DD
    startTime: z.string().min(1, "Break start time is required"),
    endTime: z.string().min(1, "Break end time is required"),
    reason: z.string().min(2, "Reason is required"),
  })
  .refine(
    (data) => {
      const start = data.startTime.includes("T") && data.startTime.length > 10
        ? new Date(data.startTime)
        : new Date(`${data.date.split("T")[0]}T${data.startTime}`);
      const end = data.endTime.includes("T") && data.endTime.length > 10
        ? new Date(data.endTime)
        : new Date(`${data.date.split("T")[0]}T${data.endTime}`);
      return end > start;
    },
    {
      message: "Break end time must be after break start time",
      path: ["endTime"],
    }
  );

export const fixTimesheetSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  sessionType: z.enum(["WORK", "OOO"]),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().min(3, "Reason for correction is required"),
});

export const adminCorrectionSchema = z
  .object({
    sessionId: z.string().min(1, "Session ID is required"),
    sessionType: z.enum(["WORK", "OOO"]),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    reason: z.string().min(3, "Audit reason is required for correction"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const timesheetFilterSchema = z.object({
  userId: z.string().optional(),
  date: z.string().optional(), // Specific single date YYYY-MM-DD
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD
  status: sessionStatusEnum.optional(),
  entryType: entryTypeEnum.optional(),
  incompleteOnly: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  search: z.string().optional(),
  timezone: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type StartOooInput = z.infer<typeof startOooSchema>;
export type EndOooInput = z.infer<typeof endOooSchema>;
export type ManualWorkSessionInput = z.infer<typeof manualWorkSessionSchema>;
export type ManualOooSessionInput = z.infer<typeof manualOooSessionSchema>;
export type FixTimesheetInput = z.infer<typeof fixTimesheetSchema>;
export type AdminCorrectionInput = z.infer<typeof adminCorrectionSchema>;
export type TimesheetFilterInput = z.infer<typeof timesheetFilterSchema>;

// ---------- Leave Schemas ----------

export const leaveTypeEnum = z.enum(["CASUAL", "SICK", "EARNED", "UNPAID", "COMPENSATORY"]);
export const leaveStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const applyLeaveSchema = z
  .object({
    leaveType: leaveTypeEnum,
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    isHalfDay: z.boolean().default(false),
    halfDayType: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional().nullable(),
    reason: z.string().min(3, "Reason must be at least 3 characters"),
  })
  .refine(
    (data) => {
      const s = new Date(data.startDate);
      const e = new Date(data.endDate);
      return e >= s;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );

export const reviewLeaveSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reviewerComment: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) =>
      data.status !== "REJECTED" ||
      (typeof data.reviewerComment === "string" && data.reviewerComment.trim().length > 0),
    {
      message: "A rejection reason is required when rejecting a leave request",
      path: ["reviewerComment"],
    }
  );

export const cancelLeaveSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;
export type CancelLeaveInput = z.infer<typeof cancelLeaveSchema>;

// ---------- Attendance Regularization Schemas ----------

export const regularizationTypeEnum = z.enum([
  "MISSED_PUNCH_IN",
  "MISSED_PUNCH_OUT",
  "MISSED_BOTH",
  "TIME_CORRECTION",
]);

export const regularizationStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);

export const applyRegularizationSchema = z
  .object({
    date: z.string().min(1, "Date is required"), // YYYY-MM-DD
    type: regularizationTypeEnum,
    requestedClockIn: z.string().optional().nullable(), // HH:mm or ISO
    requestedClockOut: z.string().optional().nullable(), // HH:mm or ISO
    reason: z.string().min(3, "Reason must be at least 3 characters"),
  })
  .refine(
    (data) => {
      if (data.requestedClockIn && data.requestedClockOut) {
        const inDate = data.requestedClockIn.includes("T") && data.requestedClockIn.length > 10
          ? new Date(data.requestedClockIn)
          : new Date(`${data.date.split("T")[0]}T${data.requestedClockIn}`);
        const outDate = data.requestedClockOut.includes("T") && data.requestedClockOut.length > 10
          ? new Date(data.requestedClockOut)
          : new Date(`${data.date.split("T")[0]}T${data.requestedClockOut}`);
        return outDate > inDate;
      }
      return true;
    },
    {
      message: "Requested clock out time must be after clock in time",
      path: ["requestedClockOut"],
    }
  );

export const reviewRegularizationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerComment: z.string().max(500).optional().nullable(),
});

export const cancelRegularizationSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export type ApplyRegularizationInput = z.infer<typeof applyRegularizationSchema>;
export type ReviewRegularizationInput = z.infer<typeof reviewRegularizationSchema>;
export type CancelRegularizationInput = z.infer<typeof cancelRegularizationSchema>;

// ---------- Company Holiday Schemas ----------

export const createHolidaySchema = z.object({
  name: z.string().min(2, "Holiday name must be at least 2 characters").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  isOptional: z.boolean().default(false),
  description: z.string().max(255).optional().nullable(),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isOptional: z.boolean().optional(),
  description: z.string().max(255).optional().nullable(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;

// ---------- Leave Policies & Quota Schemas ----------

export const updateLeavePolicyItemSchema = z.object({
  leaveType: leaveTypeEnum,
  label: z.string().min(2).max(50),
  totalDays: z.number().min(0).max(365),
  description: z.string().max(255).optional().nullable(),
  color: z.string().optional().nullable(),
  carryForward: z.boolean().default(false),
  maxCarryDays: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateLeavePoliciesSchema = z.object({
  policies: z.array(updateLeavePolicyItemSchema),
});

export const adjustUserLeaveAllocationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  leaveType: leaveTypeEnum,
  year: z.number().int().min(2020).max(2050),
  totalDays: z.number().min(0).max(365),
  notes: z.string().max(255).optional().nullable(),
});

export type UpdateLeavePoliciesInput = z.infer<typeof updateLeavePoliciesSchema>;
export type AdjustUserLeaveAllocationInput = z.infer<typeof adjustUserLeaveAllocationSchema>;

// ---------- HR Policy Settings Schemas ----------

export const updateHrSettingsSchema = z
  .object({
    standardDailyHours: z.number().min(1).max(24),
    halfDayMinimumHours: z.number().min(0.5).max(12),
    overtimeThresholdMins: z.number().min(0).max(360).default(0),
    weekendDays: z
      .string()
      .regex(/^[0-6](,[0-6])*$/, "Weekend days must be comma-separated day numbers 0-6")
      .refine((val) => val.split(",").map((s) => s.trim()).includes("0"), {
        message: "Sunday (0) must always be included as a non-working weekend day",
      }),
  })
  .refine((data) => data.halfDayMinimumHours < data.standardDailyHours, {
    message: "Half-day minimum hours must be strictly less than standard daily hours",
    path: ["halfDayMinimumHours"],
  });

export type UpdateHrSettingsInput = z.infer<typeof updateHrSettingsSchema>;
