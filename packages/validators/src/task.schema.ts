import { z } from "zod";

export const priorityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const createTaskSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.string().min(1).optional(),
  priority: priorityEnum.optional(),
  type: z.string().min(1),
  dueDate: z.coerce.date().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  reviewerIds: z.array(z.string()).optional(),
  assignedTeamId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  teamIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  gitBranchSlug: z.string().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileSize: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.string().min(1).optional(),
  priority: priorityEnum.optional(),
  type: z.string().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  dueDateReason: z.string().optional().nullable(),
  changeReason: z.string().optional().nullable(),
  blockedReason: z.string().optional().nullable(),
  gitBranchSlug: z.string().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  reviewerIds: z.array(z.string()).optional(),
  assignedTeamId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  teamIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const assignTaskSchema = z.object({
  assignedToId: z.string().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  reviewerIds: z.array(z.string()).optional(),
  assignedTeamId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  teamIds: z.array(z.string()).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1),
  parentId: z.string().optional().nullable(),
});

export const taskFiltersSchema = z
  .object({
    clientId: z.string().optional(),
    productId: z.string().optional(),
    status: z
      .string()
      .optional()
      .transform((val) => (val === "ALL" || val === "" ? undefined : val)),
    priority: z
      .union([priorityEnum, z.literal("ALL"), z.literal("")])
      .optional()
      .transform((val) => (val === "ALL" || val === "" ? undefined : val)),
    assignedToId: z.string().optional(),
    reviewerId: z.string().optional(),
    reviewerIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.filter(Boolean);
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    assignedToIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val.filter(Boolean);
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    assignedTeamId: z.string().optional(),
    type: z
      .string()
      .optional()
      .transform((val) => (val === "ALL" || val === "" ? undefined : val)),
    role: z
      .string()
      .optional()
      .transform((val) => (val === "ALL" || val === "" ? undefined : val)),
    customRoleId: z
      .string()
      .optional()
      .transform((val) => (val === "ALL" || val === "" ? undefined : val)),
    tag: z.string().optional(),
    dueBefore: z.coerce.date().optional(),
    dueAfter: z.coerce.date().optional(),
    q: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(500).default(25),
    sortBy: z.string().optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  })
  .transform((data) => ({
    ...data,
    q: data.q || data.search || undefined,
  }));

export const createTaskTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional().default("blue"),
});

export const createTimeEntrySchema = z.object({
  taskId: z.string().min(1),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional().nullable(),
  durationMin: z.number().int().nonnegative().optional().nullable(),
  description: z.string().optional().nullable(),
  isBillable: z.boolean().optional().default(true),
});

export const updateTimeEntrySchema = z.object({
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional().nullable(),
  durationMin: z.number().int().nonnegative().optional().nullable(),
  description: z.string().optional().nullable(),
  isBillable: z.boolean().optional(),
});

export const stopTimeEntrySchema = z.object({
  endedAt: z.coerce.date().optional(),
  description: z.string().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
export type CreateTaskTagInput = z.infer<typeof createTaskTagSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type StopTimeEntryInput = z.infer<typeof stopTimeEntrySchema>;

