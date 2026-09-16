import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { clientService } from "@/server/services/client.service";
import { createClientSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    return clientService.list(user, {
      status: params.get("status") ?? undefined,
      clientType: params.get("clientType") ?? undefined,
      q: params.get("q") || params.get("search") || undefined,
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 25),
      sortBy: params.get("sortBy") ?? undefined,
      sortDir: (params.get("sortDir") as "asc" | "desc" | null) ?? undefined,
      includeDeleted: params.get("includeDeleted") === "true",
    });
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createClientSchema.parse(await request.json());
    return clientService.create(user, body);
  });
}
