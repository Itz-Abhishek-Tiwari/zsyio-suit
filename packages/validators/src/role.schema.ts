import { z } from "zod";
import { ALL_ACTIONS } from "@zsyio/auth/permissions";

const actionEnum = z.enum(ALL_ACTIONS as [string, ...string[]]);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role identifier must be at least 2 characters")
    .max(50, "Role identifier too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Role identifier can only contain letters, numbers, hyphens, and underscores"),
  label: z.string().min(2, "Display label is required").max(60, "Display label too long"),
  description: z.string().max(250, "Description too long").optional().nullable(),
  permissions: z.array(actionEnum).optional().default([]),
  color: z.string().optional().default("purple"),
  icon: z.string().optional().default("shield"),
});

export const updateRoleSchema = z.object({
  label: z.string().min(2).max(60).optional(),
  description: z.string().max(250).optional().nullable(),
  permissions: z.array(actionEnum).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
