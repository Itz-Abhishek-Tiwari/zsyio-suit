import { NextRequest } from "next/server";
import { errorResponse, requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { clientService } from "@/server/services/client.service";
import { updateClientSchema } from "@zsyio/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const client = await clientService.getById(user, id);
    if (!client) return errorResponse("NOT_FOUND", "Client not found.", 404);
    return client;
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = updateClientSchema.parse(await request.json());
    return clientService.update(user, id, body);
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await clientService.softDelete(user, id);
    return { success: true };
  });
}
