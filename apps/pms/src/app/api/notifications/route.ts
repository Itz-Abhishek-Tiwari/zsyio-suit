import { NextRequest } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { notificationService } from "@/server/services/notification.service";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limitParam = searchParams.get("limit");
    const rawLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const limit = !Number.isNaN(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 40;

    return notificationService.listNotifications(user.id, { unreadOnly, limit });
  });
}

export async function DELETE() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return notificationService.deleteAll(user.id);
  });
}

