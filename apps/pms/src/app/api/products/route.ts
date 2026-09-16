import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { productService } from "@/server/services/product.service";
import { createProductSchema } from "@zsyio/validators";

export async function GET(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const clientId = request.nextUrl.searchParams.get("clientId") || undefined;
    return productService.list(user, clientId);
  });
}

export async function POST(request: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = createProductSchema.parse(await request.json());
    return productService.create(user, body);
  });
}
