import { z } from "zod";

export const createTaskTypeSchema = z.object({
  name: z.string().trim().min(1, "Task type name is required").max(60, "Task type name must not exceed 60 characters"),
  icon: z.string().trim().max(50).optional().default("sparkles"),
  color: z.string().trim().max(50).optional().default("purple"),
});

export type CreateTaskTypeInput = z.input<typeof createTaskTypeSchema>;
export type CreateTaskTypeOutput = z.output<typeof createTaskTypeSchema>;
