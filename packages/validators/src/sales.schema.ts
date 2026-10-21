import { z } from "zod";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const optionalString = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : typeof val === "string" ? val.trim() : val),
  z.string().nullable().optional()
);

const optionalEmail = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z.string().email("Invalid email address format").nullable().optional()
);

const optionalDate = z.preprocess((val) => {
  if (!val || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val.toISOString();
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d.toISOString();
}, z.string().nullable().optional());

const optionalDecimal = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  },
  z.number().positive("Must be a positive number").nullable().optional()
);

const optionalInt = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return isNaN(n) ? null : Math.round(n);
  },
  z.number().min(0).max(100).nullable().optional()
);

// ─── Enums ────────────────────────────────────────────────────────────────────

export const salesStageEnum = z.enum([
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const salesPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const salesActivityTypeEnum = z.enum([
  "CALL",
  "EMAIL",
  "MEETING",
  "FOLLOWUP",
  "TASK",
  "NOTE",
  "STAGE_CHANGE",
  "SYSTEM",
]);

export const salesActivityStatusEnum = z.enum(["PENDING", "DONE", "CANCELLED"]);

// ─── Sales Lead ───────────────────────────────────────────────────────────────

export const createSalesLeadSchema = z.object({
  // Client info (creates Client + SalesLead together)
  clientName: z.string().min(1, "Client name is required").transform((v) => v.trim()),
  logoUrl: optionalString,
  domain: optionalString,
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  address: optionalString,
  notes: optionalString,
  // Lead-specific
  pipelineId: z.string().optional(),
  currentStage: salesStageEnum.optional().default("NEW_LEAD"),
  assignedToId: optionalString,
  priority: salesPriorityEnum.optional().default("MEDIUM"),
  dealValue: optionalDecimal,
  probability: optionalInt,
  expectedCloseAt: optionalDate,
  leadSource: optionalString,
  nextFollowUpAt: optionalDate,
  tagIds: z.array(z.string()).optional().default([]),
});

export const updateSalesLeadSchema = z.object({
  clientName: z.string().min(1).transform((v) => v.trim()).optional(),
  logoUrl: optionalString,
  domain: optionalString,
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  address: optionalString,
  notes: optionalString,
  assignedToId: optionalString,
  priority: salesPriorityEnum.optional(),
  dealValue: optionalDecimal,
  probability: optionalInt,
  expectedCloseAt: optionalDate,
  leadSource: optionalString,
  lastContactAt: optionalDate,
  nextFollowUpAt: optionalDate,
  tagIds: z.array(z.string()).optional(),
});

export const moveSalesLeadSchema = z.object({
  stageKey: salesStageEnum,
  reason: optionalString,
});

export const convertToDevClientSchema = z.object({
  reason: optionalString,
});

// ─── Sales Activity ───────────────────────────────────────────────────────────

export const createSalesActivitySchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  type: salesActivityTypeEnum,
  title: z.string().min(1, "Title is required").transform((v) => v.trim()),
  description: optionalString,
  dueAt: optionalDate,
  assignedToId: optionalString,
  priority: salesPriorityEnum.optional().default("MEDIUM"),
  status: salesActivityStatusEnum.optional().default("PENDING"),
});

export const updateSalesActivitySchema = z.object({
  type: salesActivityTypeEnum.optional(),
  title: z.string().min(1).transform((v) => v.trim()).optional(),
  description: optionalString,
  dueAt: optionalDate,
  completedAt: optionalDate,
  assignedToId: optionalString,
  priority: salesPriorityEnum.optional(),
  status: salesActivityStatusEnum.optional(),
});

// ─── Pipeline Stage ───────────────────────────────────────────────────────────

export const createPipelineStageSchema = z.object({
  name: z.string().min(1, "Stage name is required").transform((v) => v.trim()),
  stageKey: salesStageEnum,
  order: z.number().int().min(0),
  color: optionalString,
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const createSalesTagSchema = z.object({
  name: z.string().min(1).transform((v) => v.trim()),
  color: optionalString,
});

// ─── Filter params ────────────────────────────────────────────────────────────

export const salesLeadFiltersSchema = z.object({
  q: z.string().optional(),
  stage: salesStageEnum.optional(),
  priority: salesPriorityEnum.optional(),
  assignedToId: z.string().optional(),
  leadSource: z.string().optional(),
  followUpBefore: z.string().optional(),
  followUpAfter: z.string().optional(),
  tagIds: z.string().optional(), // comma-separated
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  includeDeleted: z.preprocess((v) => v === true || v === "true", z.boolean()).optional().default(false),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateSalesLeadInput = z.infer<typeof createSalesLeadSchema>;
export type UpdateSalesLeadInput = z.infer<typeof updateSalesLeadSchema>;
export type MoveSalesLeadInput = z.infer<typeof moveSalesLeadSchema>;
export type ConvertToDevClientInput = z.infer<typeof convertToDevClientSchema>;
export type CreateSalesActivityInput = z.infer<typeof createSalesActivitySchema>;
export type UpdateSalesActivityInput = z.infer<typeof updateSalesActivitySchema>;
export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type CreateSalesTagInput = z.infer<typeof createSalesTagSchema>;
export type SalesLeadFilters = z.infer<typeof salesLeadFiltersSchema>;
