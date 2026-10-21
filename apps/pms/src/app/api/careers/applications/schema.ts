import { z } from "zod";
import { candidateDetailsSchema } from "@zsyio/validators";

export const careerApplicationSchema = z
  .object({
    jobId: z.string().trim().min(1).max(100),
    name: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    phone: z.string().trim().min(5, "Enter your phone number.").max(40),
    website: z.string().max(0).optional(),
  })
  .merge(candidateDetailsSchema.omit({ phone: true }));
