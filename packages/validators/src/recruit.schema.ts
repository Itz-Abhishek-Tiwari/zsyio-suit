import { z } from "zod";

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

// Only http(s) links: these are rendered as hrefs, so block javascript: and similar.
export const optionalLink = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => value || null)
  .refine((value) => {
    if (!value) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter a full link starting with https://");

/** Optional details a candidate can have, shared by Recruit and the public careers form. */
export const candidateDetailsSchema = z.object({
  phone: optionalText(40),
  linkedinUrl: optionalLink,
  currentCompany: optionalText(150),
  expectedSalary: optionalText(100),
  noticePeriod: optionalText(100),
  resumeUrl: optionalLink,
});
