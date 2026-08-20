import { z } from "zod";

export const testCaseStatusEnum = z.enum(["PENDING", "PASSED", "FAILED", "BLOCKED", "SKIPPED"]);

export const createTestCaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must not exceed 200 characters"),
  description: z.string().trim().max(2000).nullable().optional(),
  steps: z.string().trim().max(4000).nullable().optional(),
  expectedResult: z.string().trim().max(2000).nullable().optional(),
  status: testCaseStatusEnum.default("PENDING"),
  notes: z.string().trim().max(2000).nullable().optional(),
  testedById: z.string().nullable().optional(),
});

export const updateTestCaseSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  steps: z.string().trim().max(4000).nullable().optional(),
  expectedResult: z.string().trim().max(2000).nullable().optional(),
  status: testCaseStatusEnum.optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  testedById: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
