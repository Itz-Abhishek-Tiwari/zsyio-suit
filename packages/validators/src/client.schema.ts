import { z } from "zod";

export const clientStatusEnum = z.enum(["INTAKE", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"]);
export const clientTypeEnum = z.enum(["SALES", "DEVELOPMENT"]);

const optionalEmail = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z.string().email("Invalid email address format").nullable().optional()
);

const optionalImageOrUrl = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        if (val.startsWith("data:image/")) return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Must be a valid image (Base64) or URL" }
    )
    .nullable()
    .optional()
);

const optionalString = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : typeof val === "string" ? val.trim() : val),
  z.string().nullable().optional()
);

const optionalDate = z.preprocess((val) => {
  if (!val || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}, z.date().nullable().optional());

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required").transform((v) => v.trim()),
  logoUrl: optionalImageOrUrl,
  domain: optionalString,
  contractStart: optionalDate,
  contractEnd: optionalDate,
  status: clientStatusEnum.optional().default("ONBOARDING"),
  clientType: clientTypeEnum.optional().default("DEVELOPMENT"),
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  notes: optionalString,
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
