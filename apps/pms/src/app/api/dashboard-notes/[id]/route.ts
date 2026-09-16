import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, requireUser } from "@zsyio/auth/api-helpers";
import { ForbiddenError } from "@zsyio/auth/permissions";
import { dashboardNoteService } from "@/server/services/dashboard-note.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const note = await dashboardNoteService.findById(id);
    if (!note) {
      return NextResponse.json({ message: "Dashboard note not found" }, { status: 404 });
    }

    if (note.isPersonal && note.authorId !== user.id) {
      throw new ForbiddenError("This is a private personal note.");
    }

    return NextResponse.json(note);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    await dashboardNoteService.delete(user, id);
    return NextResponse.json({ success: true });
  });
}
