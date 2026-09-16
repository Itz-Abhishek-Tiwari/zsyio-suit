import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { userService } from "@/server/services/user.service";
import { createUserSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const lite = searchParams.get("lite") === "true";
    const q = searchParams.get("q") ?? undefined;

    if (lite) {
      const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
      return userService.searchLite({ q, limit });
    }

    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined;
    const role = searchParams.get("role") ?? undefined;
    const active = searchParams.has("active") ? searchParams.get("active") === "true" : undefined;
    const sortBy = searchParams.get("sortBy") ?? undefined;
    const sortDir = (searchParams.get("sortDir") as "asc" | "desc") ?? undefined;

    return userService.list({ page, pageSize, q, role, active, sortBy, sortDir });
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createUserSchema.parse(await request.json());
    return userService.create(user, body);
  });
}
