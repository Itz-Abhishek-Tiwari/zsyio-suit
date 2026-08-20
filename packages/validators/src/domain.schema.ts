import { z } from "zod";

export const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const createDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "Domain name is required")
    .max(100, "Domain must not exceed 100 characters")
    .regex(domainRegex, "Please enter a valid domain format (e.g. company.com)"),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(domainRegex, "Please enter a valid domain format (e.g. company.com)")
    .optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
