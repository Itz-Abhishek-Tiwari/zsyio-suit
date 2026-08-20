import { z } from "zod";
import { isEmailDomainAllowed, getAllowedDomainsNotice } from "@zsyio/auth/domain-restriction";

export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .refine((val) => isEmailDomainAllowed(val), {
      message: `Only email addresses from authorized domains (${getAllowedDomainsNotice()}) are permitted.`,
    }),
});

export const forgotPasswordVerifySchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(100, "Password must not exceed 100 characters"),
});

export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordVerifyInput = z.infer<typeof forgotPasswordVerifySchema>;
