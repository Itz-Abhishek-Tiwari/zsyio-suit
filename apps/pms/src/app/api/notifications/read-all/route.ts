import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { notificationService } from "@/server/services/notification.service";

export async function POST() {
  return withApiHandler(async () => {
    const user = await requireUser();
    return notificationService.markAllAsRead(user.id);
  });
}

