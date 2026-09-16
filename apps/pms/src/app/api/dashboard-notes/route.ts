import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { createDashboardNoteSchema } from "@zsyio/validators";
import { dashboardNoteService } from "@/server/services/dashboard-note.service";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || undefined;
    const taskId = searchParams.get("taskId") || undefined;

    const notes = await dashboardNoteService.listForUser(user, {
      clientId,
      taskId,
    });

    return NextResponse.json(notes);
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();
    const validated = createDashboardNoteSchema.parse(body);
    const note = await dashboardNoteService.create(user, validated);
    return NextResponse.json(note, { status: 201 });
  });
}
