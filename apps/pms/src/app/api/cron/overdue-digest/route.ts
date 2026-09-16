import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@zsyio/database";
import { sendEmail } from "@zsyio/auth/email";
import { notificationService } from "@/server/services/notification.service";

import crypto from "crypto";

// Phase 1.1 (ai.md §9): query logic exists now; real send goes through
// lib/email.ts, which is a no-op console logger until EMAIL_PROVIDER_API_KEY
// is set. Fixed UTC 08:00 send time for V1 (open decision, ai.md §16).
async function handleCronDigest(request: NextRequest) {
  const headerSecret =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret || !headerSecret) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Invalid cron secret." } }, { status: 401 });
  }

  const secretBuffer = Buffer.from(headerSecret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (secretBuffer.length !== configuredBuffer.length || !crypto.timingSafeEqual(secretBuffer, configuredBuffer)) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Invalid cron secret." } }, { status: 401 });
  }

  const overdue = await prisma.task.findMany({
    where: { deletedAt: null, dueDate: { lt: new Date() }, status: { notIn: ["DONE"] } },
    include: { assignedTo: true },
  });

  const byOwner = new Map<string, { userId: string; email: string; tasks: typeof overdue }>();
  for (const task of overdue) {
    if (!task.assignedTo?.email || !task.assignedToId) continue;
    const entry = byOwner.get(task.assignedTo.email) ?? {
      userId: task.assignedToId,
      email: task.assignedTo.email,
      tasks: [],
    };
    entry.tasks.push(task);
    byOwner.set(task.assignedTo.email, entry);
  }

  let sentCount = 0;
  let failCount = 0;

  for (const { userId, email, tasks } of byOwner.values()) {
    try {
      const body = tasks.map((t) => `- ${t.title} (due ${t.dueDate?.toDateString()})`).join("\n");
      await sendEmail(email, `You have ${tasks.length} overdue task(s)`, body);

      await notificationService.createNotification({
        userId,
        type: "DUE_DATE_REMINDER",
        title: `${tasks.length} Overdue Task${tasks.length === 1 ? "" : "s"} Alert`,
        message: `You have ${tasks.length} task(s) past their target deadline: "${tasks[0].title}"${tasks.length > 1 ? ` and ${tasks.length - 1} more` : ""}.`,
        link: "/tasks",
        taskId: tasks[0].id,
      });
      sentCount++;
    } catch (sendErr) {
      console.error(`Failed to send overdue digest to ${email}:`, sendErr);
      failCount++;
    }
  }

  return NextResponse.json({ sent: sentCount, failed: failCount, total: byOwner.size });
}

export async function GET(request: NextRequest) {
  return handleCronDigest(request);
}

export async function POST(request: NextRequest) {
  return handleCronDigest(request);
}

