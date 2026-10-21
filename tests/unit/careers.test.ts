import { describe, expect, it } from "vitest";
import { careerApplicationSchema } from "../../apps/pms/src/app/api/careers/applications/schema";

describe("public careers applications", () => {
  it("normalizes email and ignores client-supplied hiring controls", () => {
    const result = careerApplicationSchema.parse({ jobId: "role-1", name: " Priya Rao ", email: " PRIYA@example.com ", phone: " +91 98765 43210 ", stage: "HIRED", source: "Staff", createdBy: "admin" });
    expect(result).toEqual({
      jobId: "role-1", name: "Priya Rao", email: "priya@example.com", phone: "+91 98765 43210",
      linkedinUrl: null, currentCompany: null, expectedSalary: null, noticePeriod: null, resumeUrl: null,
    });
  });
  it("rejects blank names, invalid emails, and filled honeypots", () => {
    expect(careerApplicationSchema.safeParse({ jobId: "role-1", name: " ", email: "not-an-email", phone: "12345" }).success).toBe(false);
    expect(careerApplicationSchema.safeParse({ jobId: "role-1", name: "Priya Rao", email: "priya@example.com" }).success).toBe(false);
    expect(careerApplicationSchema.safeParse({ jobId: "role-1", name: "Priya Rao", email: "priya@example.com", phone: "12345", website: "spam" }).success).toBe(false);
  });
});
