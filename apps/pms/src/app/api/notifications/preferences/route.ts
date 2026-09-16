import { NextRequest } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";

import { notificationService } from "@/server/services/notification.service";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    const prefs = await notificationService.getPreferences(user.id);
    return prefs;
  });
}

export async function PUT(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();

    const allowedFields = [
      "taskAssigned",
      "statusChanged",
      "mentions",
      "comments",
      "dueDateReminders",
      "dashboardNotes",
      "inAppToasts",
      "browserNotifications",
      "browserSound",
    ] as const;

    const data: Record<string, boolean> = {};
    for (const key of allowedFields) {
      if (typeof body[key] === "boolean") {
        data[key] = body[key];
      }
    }

    const updated = await notificationService.updatePreferences(user.id, data);
    return updated;
  });
}

