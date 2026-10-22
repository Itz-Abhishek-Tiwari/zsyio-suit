import { NextResponse } from "next/server";
import { withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { careerApplicationSchema } from "./schema";

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin)
      return errorResponse("FORBIDDEN", "Submit your application from the careers page.", 403);
    if (!request.headers.get("content-type")?.includes("application/json"))
      return errorResponse("BAD_REQUEST", "Expected a JSON application.", 400);
    const raw = await request.text();
    if (raw.length > 16000) return errorResponse("BAD_REQUEST", "Application is too large.", 413);
    let json: unknown;
    try { json = JSON.parse(raw); } catch { return errorResponse("BAD_REQUEST", "Invalid application.", 400); }
    const { jobId, website, ...applicant } = careerApplicationSchema.parse(json);
    if (website) return errorResponse("BAD_REQUEST", "Invalid application.", 400);
    const { email } = applicant;
    return prisma.$transaction(async (tx) => {
      // Lock against closing a role while an application is being accepted.
      const jobs = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "RecruitJob" WHERE "id" = ${jobId} AND "status" = 'OPEN' FOR UPDATE`;
      if (!jobs.length) return errorResponse("JOB_CLOSED", "This role is no longer accepting applications.", 409);
      const count = await tx.recruitApplication.count({ where: { email, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
      if (count >= 5) return errorResponse("TOO_MANY_REQUESTS", "Please wait before submitting another application.", 429);
      await tx.recruitApplication.create({ data: { ...applicant, jobId, source: "Careers website", createdBy: "public:careers", stage: "APPLIED" } });
      return NextResponse.json({ success: true }, { status: 201 });
    });
  });
}
