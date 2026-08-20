import { z } from "zod";

export const environmentEnum = z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]);

const optionalImageOrUrl = z
  .union([
    z.string().refine(
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
    ),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (!val || val.trim() === "" ? null : val));

const optionalUrl = z
  .union([
    z.string().url("Must be a valid URL (e.g. https://...)"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => (!val || val.trim() === "" ? null : val));

const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => (!val || val.trim() === "" ? null : val));

export const createProductSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  name: z.string().min(1, "Product name is required"),
  imageUrl: optionalImageOrUrl,
  version: optionalString,
  deployedUrl: optionalUrl,
  repoUrl: optionalUrl,
  environment: environmentEnum.optional().default("PRODUCTION"),
  lastDeployed: z.coerce.date().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial().omit({ clientId: true });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
