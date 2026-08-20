import { z } from "zod";

export const createDashboardNoteSchema = z.object({
  clientId: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() !== "" ? val.trim() : null),
      z.string().nullable().optional()
    ),
  taskId: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() !== "" ? val.trim() : null),
      z.string().nullable().optional()
    ),
  content: z.string().min(1, "Note content is required"),
  targetAll: z.boolean().optional().default(true),
  isPersonal: z.boolean().optional().default(false),
  targetTeamIds: z.array(z.string()).optional().default([]),
  targetUserIds: z.array(z.string()).optional().default([]),
});

export type CreateDashboardNoteInput = z.infer<typeof createDashboardNoteSchema>;
