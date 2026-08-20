import { z } from "zod";

export const teamMemberRoleSchema = z.enum(["LEAD", "CO_LEAD", "MEMBER", "SENIOR"]).default("MEMBER");

export const teamMemberAssignmentSchema = z.object({
  userId: z.string(),
  role: z.string().default("MEMBER"),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100, "Team name must not exceed 100 characters"),
  description: z.string().trim().max(500, "Description must not exceed 500 characters").optional().nullable(),
  color: z.string().trim().max(50).optional().default("purple"),
  memberUserIds: z.array(z.string()).optional().default([]),
  leadUserId: z.string().trim().optional().nullable(),
  members: z.array(teamMemberAssignmentSchema).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name cannot be empty").max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().max(50).optional(),
  memberUserIds: z.array(z.string()).optional(),
  leadUserId: z.string().trim().optional().nullable(),
  members: z.array(teamMemberAssignmentSchema).optional(),
});

export type CreateTeamInput = z.input<typeof createTeamSchema>;
export type UpdateTeamInput = z.input<typeof updateTeamSchema>;
export type CreateTeamOutput = z.output<typeof createTeamSchema>;
export type UpdateTeamOutput = z.output<typeof updateTeamSchema>;
