import { z } from "zod";
import { isEmailDomainAllowed, getAllowedDomainsNotice } from "@zsyio/auth/domain-restriction";

export const systemRoleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"]);

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Invalid email format")
    .refine((val) => isEmailDomainAllowed(val), {
      message: `Only email addresses from allowed domains (${getAllowedDomainsNotice()}) can be registered.`,
    }),
  role: z.union([systemRoleEnum, z.string()]).optional().default("DEVELOPER"),
  customRoleId: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const themeEnum = z.enum(["light", "dark", "system"]);
export type ThemeType = z.infer<typeof themeEnum>;

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.union([systemRoleEnum, z.string()]).optional(),
  customRoleId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  theme: themeEnum.optional(),
});

export const updateThemeSchema = z.object({
  theme: themeEnum,
});

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).optional(),
  jobTitle: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().or(z.literal("")).optional().nullable(),
  timeZone: z.string().max(60).optional().nullable(),
  theme: themeEnum.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const acceptInvitationSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
