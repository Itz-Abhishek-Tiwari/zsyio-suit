import { z } from "zod";

export const roleFormSchema = z.object({
  name: z
    .string()
    .max(50, "Role identifier must be under 50 characters")
    .refine(
      (val) => !val || (val.length >= 2 && /^[A-Za-z0-9_-]+$/.test(val)),
      "Identifier must be at least 2 characters and contain only letters, numbers, hyphens, or underscores"
    )
    .optional(),
  label: z
    .string()
    .min(2, "Role display label must be at least 2 characters")
    .max(60, "Role display label must be under 60 characters"),
  description: z.string().max(250, "Description must be under 250 characters").optional(),
  color: z.string().min(1),
  icon: z.string().min(1),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
