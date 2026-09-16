import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { productService } from "@/server/services/product.service";
import { updateProductSchema } from "@zsyio/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const product = await productService.getById(user, id);
    if (!product) return errorResponse("NOT_FOUND", "Product not found.", 404);
    return product;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateProductSchema.parse(await request.json());
    return productService.update(user, id, body);
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await productService.softDelete(user, id);
    return { success: true };
  });
}
