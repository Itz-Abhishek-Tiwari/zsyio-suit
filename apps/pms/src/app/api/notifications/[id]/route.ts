import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { notificationService } from "@/server/services/notification.service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const updated = await notificationService.markAsRead(user.id, id);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return updated;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const result = await notificationService.deleteNotification(user.id, id);
    if (!result) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return result;
  });
}

