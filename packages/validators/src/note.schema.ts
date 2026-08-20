import { z } from "zod";

export const noteGeneralAccessEnum = z.enum(["INHERIT", "PRIVATE", "WORKSPACE_VIEW", "WORKSPACE_EDIT"]);
export const noteAccessLevelEnum = z.enum(["NONE", "VIEW", "EDIT", "FULL"]);
export const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"]);

const optionalString = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : typeof val === "string" ? val.trim() : val),
  z.string().nullable().optional()
);

export const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  icon: z.string().optional(),
  coverImage: optionalString,
  folderId: z.string().nullable().optional(),
  generalAccess: noteGeneralAccessEnum.optional(),
  templateId: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  icon: z.string().optional(),
  coverImage: optionalString,
  folderId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  generalAccess: noteGeneralAccessEnum.optional(),
});

export const createNoteFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: optionalString,
  parentId: z.string().nullable().optional(),
  isWorkspaceRoot: z.boolean().optional(),
  generalAccess: noteGeneralAccessEnum.optional(),
});

export const updateNoteFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: optionalString,
  parentId: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
  generalAccess: noteGeneralAccessEnum.optional(),
});

// Shared shape for both note and note-folder share creation — the caller
// may target one or more users, a system role, a team, or a custom role.
export const shareTargetSchema = z
  .object({
    userId: z.string().trim().min(1).optional(),
    userIds: z.array(z.string().trim().min(1)).optional(),
    role: z.union([roleEnum, z.string()]).optional(),
    teamId: z.string().optional(),
    customRoleId: z.string().optional(),
    accessLevel: noteAccessLevelEnum.optional().default("VIEW"),
  })
  .refine(
    (data) =>
      (data.userIds && data.userIds.length > 0) ||
      (data.userId && data.userId.trim().length > 0) ||
      Boolean(data.role) ||
      Boolean(data.teamId) ||
      Boolean(data.customRoleId),
    { message: "Must specify user(s), role, team, or custom role." }
  );

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateNoteFolderInput = z.infer<typeof createNoteFolderSchema>;
export type UpdateNoteFolderInput = z.infer<typeof updateNoteFolderSchema>;
export type ShareTargetInput = z.infer<typeof shareTargetSchema>;
