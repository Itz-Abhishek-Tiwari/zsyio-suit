import { NextRequest } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { evaluateNoteAccess, hasPermissionLevel } from "@zsyio/auth/note-permissions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: { shares: true, folder: { include: { shares: true } } },
    });

    if (!note) {
      throw errorResponse("NOT_FOUND", "Note not found.", 404);
    }

    const effectiveAccess = await evaluateNoteAccess(note.id, user, note);
    if (!hasPermissionLevel(effectiveAccess, "VIEW")) {
      throw errorResponse("FORBIDDEN", "You do not have permission to view or favorite this note.", 403);
    }

    const existingStar = await prisma.noteStar.findUnique({
      where: {
        userId_noteId: {
          userId: user.id,
          noteId: id,
        },
      },
    });

    if (existingStar) {
      await prisma.noteStar.delete({
        where: {
          userId_noteId: {
            userId: user.id,
            noteId: id,
          },
        },
      });
      return { isStarred: false };
    } else {
      await prisma.noteStar.create({
        data: {
          userId: user.id,
          noteId: id,
        },
      });
      return { isStarred: true };
    }
  });
}
