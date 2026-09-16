import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { taskService } from "@/server/services/task.service";

const attachSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileUrl: z.string().optional(),
});

const deleteSchema = z.object({
  attachmentId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = attachSchema.parse(await request.json());
    return taskService.addAttachment(user, id, body);
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    let attachmentId = searchParams.get("attachmentId");
    if (!attachmentId) {
      const body = await request.json().catch(() => ({}));
      attachmentId = deleteSchema.parse(body).attachmentId;
    }
    return taskService.deleteAttachment(user, id, attachmentId);
  });
}

