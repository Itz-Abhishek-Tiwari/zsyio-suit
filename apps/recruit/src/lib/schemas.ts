import { z } from "zod";
import { candidateDetailsSchema, optionalText } from "@zsyio/validators";
export const stages = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;
export const jobSchema = z.object({
  title: z.string().trim().min(2).max(150),
  department: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(150),
  employment: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  description: z.string().trim().min(1).max(10000),
  status: z.enum(["OPEN", "PAUSED", "CLOSED"]).default("OPEN"),
});
export const rejectionReasons = [
  "Skills mismatch",
  "Not enough experience",
  "Salary expectations",
  "Culture fit",
  "Position filled",
  "Candidate withdrew",
  "No response",
  "Other",
] as const;
export { candidateDetailsSchema };
export const applicationSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().trim().min(2).max(150),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  source: z.string().trim().min(1).max(100).default("Direct"),
  phone: optionalText(40),
});
export const stageSchema = z
  .object({
    stage: z.enum(stages),
    rejectionReason: z.enum(rejectionReasons).optional(),
    note: z.string().trim().max(2000).default(""),
  })
  .superRefine((value, context) => {
    if (value.stage === "REJECTED" && !value.rejectionReason)
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Choose a reason for rejecting this candidate.",
      });
  });
export const eventSchema = z
  .object({
    kind: z.enum(["INTERVIEW", "FEEDBACK"]),
    title: z.string().trim().min(1).max(150),
    body: z.string().trim().max(10000).default(""),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
  })
  .superRefine((event, context) => {
    if (event.kind === "INTERVIEW" && !event.scheduledAt)
      context.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Choose an interview time.",
      });
    if (event.kind === "FEEDBACK" && !event.body)
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "Write your feedback.",
      });
  });
export type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment: string;
  description: string;
  status: string;
  _count: { applications: number };
};
export type HiringEvent = {
  id: string;
  kind: string;
  title: string;
  body: string;
  scheduledAt: string | null;
  authorName: string;
  createdAt: string;
};
export type Application = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  stage: string;
  source: string;
  phone: string | null;
  linkedinUrl: string | null;
  currentCompany: string | null;
  expectedSalary: string | null;
  noticePeriod: string | null;
  resumeUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  job: Omit<Job, "_count">;
  events: HiringEvent[];
};
