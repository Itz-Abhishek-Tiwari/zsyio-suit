import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  jobSchema,
  eventSchema,
  stageSchema,
  candidateDetailsSchema,
} from "../../apps/recruit/src/lib/schemas";
import { careerApplicationSchema } from "../../apps/landing/src/app/api/careers/applications/schema";
import { can, canAccessApp } from "@zsyio/auth/permissions";
describe("Recruit validation and access", () => {
  it("requires app access and a separate management permission", () => {
    expect(canAccessApp("DEVELOPER", "recruit")).toBe(false);
    expect(canAccessApp("CUSTOM", "recruit", ["app:access:recruit"])).toBe(
      true,
    );
    expect(can("CUSTOM", "recruit:manage", ["app:access:recruit"])).toBe(false);
    expect(canAccessApp("ADMIN", "recruit")).toBe(true);
  });
  it("normalizes applicant emails for duplicate detection", () => {
    expect(
      applicationSchema.parse({
        jobId: "job-1",
        name: "Riya Sen",
        email: "RIYA@example.com",
      }).email,
    ).toBe("riya@example.com");
  });
  it("rejects blank jobs and unsupported stages", () => {
    expect(
      jobSchema.safeParse({
        title: "  ",
        department: "Engineering",
        location: "Remote",
        description: "Build software",
        employment: "FULL_TIME",
      }).success,
    ).toBe(false);
    expect(stageSchema.safeParse({ stage: "AUTO_HIRED" }).success).toBe(false);
  });
  it("requires a date for interviews and text for feedback", () => {
    expect(
      eventSchema.safeParse({ kind: "INTERVIEW", title: "Technical round" })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        kind: "INTERVIEW",
        title: "Technical round",
        scheduledAt: "2026-10-12T10:00:00+05:30",
      }).success,
    ).toBe(true);
    expect(
      eventSchema.safeParse({ kind: "FEEDBACK", title: "Review", body: " " })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        kind: "FEEDBACK",
        title: "Review",
        body: "Clear examples of project ownership.",
      }).success,
    ).toBe(true);
  });
  it("requires a reason to reject but not to move a candidate otherwise", () => {
    expect(stageSchema.safeParse({ stage: "REJECTED" }).success).toBe(false);
    expect(
      stageSchema.safeParse({ stage: "REJECTED", rejectionReason: "Culture fit" })
        .success,
    ).toBe(true);
    expect(
      stageSchema.safeParse({ stage: "REJECTED", rejectionReason: "Made up" })
        .success,
    ).toBe(false);
    expect(stageSchema.safeParse({ stage: "OFFER" }).success).toBe(true);
  });
  it("accepts only http(s) links and turns blank details into null", () => {
    expect(
      candidateDetailsSchema.safeParse({ resumeUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      candidateDetailsSchema.safeParse({ linkedinUrl: "not a link" }).success,
    ).toBe(false);
    expect(
      candidateDetailsSchema.parse({
        phone: "  ",
        resumeUrl: "https://example.com/cv.pdf",
      }),
    ).toMatchObject({ phone: null, resumeUrl: "https://example.com/cv.pdf" });
  });
  it("requires a phone on public careers applications and keeps links safe", () => {
    const base = { jobId: "job-1", name: "Riya Sen", email: "RIYA@example.com" };
    expect(careerApplicationSchema.safeParse(base).success).toBe(false);
    const ok = careerApplicationSchema.parse({
      ...base,
      phone: "+91 98765 43210",
      resumeUrl: "https://example.com/cv.pdf",
      noticePeriod: "",
    });
    expect(ok).toMatchObject({ email: "riya@example.com", noticePeriod: null });
    expect(
      careerApplicationSchema.safeParse({ ...base, phone: "12345", linkedinUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      careerApplicationSchema.safeParse({ ...base, phone: "12345", website: "spam.com" }).success,
    ).toBe(false);
  });
});
