import { NextRequest } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { NoteGeneralAccess } from "@prisma/client";
import { evaluateNoteAccess, evaluateFolderAccess, hasPermissionLevel, getUserTeamIds } from "@zsyio/auth/note-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const [note, teamIds] = await Promise.all([
      prisma.note.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          folder: {
            include: {
              parent: {
                include: {
                  parent: true,
                },
              },
              shares: true,
            },
          },
          shares: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
              team: { select: { id: true, name: true, color: true } },
              customRole: { select: { id: true, name: true, label: true, color: true } },
            },
          },
          stars: {
            where: { userId: user.id },
            select: { userId: true },
          },
        },
      }),
      getUserTeamIds(user.id),
    ]);

    if (!note) {
      throw errorResponse("NOT_FOUND", "Note not found.", 404);
    }

    const effectiveAccess = await evaluateNoteAccess(note.id, { ...user, teamIds }, note);
    if (!hasPermissionLevel(effectiveAccess, "VIEW")) {
      throw errorResponse("FORBIDDEN", "You do not have access to view this note.", 403);
    }

    // Build folder breadcrumb hierarchy
    const breadcrumbs: { id: string; name: string; icon?: string | null }[] = [];
    if (note.folder) {
      let curr: { id: string; name: string; icon?: string | null; parent?: unknown } | null = note.folder;
      const chain: typeof breadcrumbs = [];
      while (curr) {
        chain.unshift({ id: curr.id, name: curr.name, icon: curr.icon });
        curr = (curr.parent as { id: string; name: string; icon?: string | null; parent?: unknown } | null) ?? null;
      }
      breadcrumbs.push(...chain);
    }

    return {
      ...note,
      isStarred: note.stars.length > 0,
      effectiveAccess,
      breadcrumbs,
    };
  });
}

export async function PATCH(
  req: NextRequest,
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
    if (!hasPermissionLevel(effectiveAccess, "EDIT")) {
      throw errorResponse("FORBIDDEN", "You do not have permission to edit this note.", 403);
    }

    const body = await req.json();
    const { title, content, icon, coverImage, folderId, isPinned, isArchived, generalAccess } = body;

    if (generalAccess !== undefined && !Object.values(NoteGeneralAccess).includes(generalAccess)) {
      throw errorResponse("VALIDATION_ERROR", "Invalid generalAccess value.", 400);
    }
    for (const [k, v] of Object.entries({ title, content, icon, coverImage })) {
      if (v !== undefined && v !== null && typeof v !== "string") {
        throw errorResponse("VALIDATION_ERROR", `${k} must be a string.`, 400);
      }
    }
    if (title === null) {
      throw errorResponse("VALIDATION_ERROR", "title must be a string.", 400);
    }

    // Only owners/admin/FULL access can change general access or permanently archive/move
    if (generalAccess !== undefined && !hasPermissionLevel(effectiveAccess, "FULL")) {
      throw errorResponse("FORBIDDEN", "Only editors with full access can modify note sharing level.", 403);
    }

    // If moving to a folder, check folder existence
    if (folderId !== undefined && folderId !== null) {
      const targetFolder = await prisma.noteFolder.findUnique({
        where: { id: String(folderId) },
        include: { shares: true },
      });
      if (!targetFolder) {
        throw errorResponse("NOT_FOUND", "Target folder not found.", 404);
      }
      const targetAccess = await evaluateFolderAccess(targetFolder.id, user, targetFolder);
      if (!hasPermissionLevel(targetAccess, "EDIT")) {
        throw errorResponse("FORBIDDEN", "You do not have permission to move notes into this folder.", 403);
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() || "Untitled" } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
        ...(folderId !== undefined ? { folderId } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
        ...(generalAccess !== undefined ? { generalAccess } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        folder: { select: { id: true, name: true, icon: true, color: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            team: { select: { id: true, name: true } },
            customRole: { select: { id: true, name: true, label: true } },
          },
        },
        stars: {
          where: { userId: user.id },
          select: { userId: true },
        },
      },
    });

    return {
      ...updatedNote,
      isStarred: updatedNote.stars.length > 0,
      effectiveAccess,
    };
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    const note = await prisma.note.findUnique({
      where: { id },
      include: { shares: true, folder: { include: { shares: true } } },
    });

    if (!note) {
      throw errorResponse("NOT_FOUND", "Note not found.", 404);
    }

    const effectiveAccess = await evaluateNoteAccess(note.id, user, note);
    if (!hasPermissionLevel(effectiveAccess, "FULL") && note.authorId !== user.id) {
      throw errorResponse("FORBIDDEN", "Only note owners or admins can delete this note.", 403);
    }

    if (permanent) {
      await prisma.note.delete({ where: { id } });
      return { success: true, deleted: true };
    } else {
      const archived = await prisma.note.update({
        where: { id },
        data: { isArchived: true },
      });
      return { success: true, archived: true, note: archived };
    }
  });
}
