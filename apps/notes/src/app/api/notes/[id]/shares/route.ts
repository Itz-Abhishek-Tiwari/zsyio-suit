import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { evaluateNoteAccess, hasPermissionLevel } from "@zsyio/auth/note-permissions";
import { notificationService } from "@/server/services/notification.service";
import type { Role, NotePermission } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            team: { select: { id: true, name: true, color: true } },
            customRole: { select: { id: true, name: true, label: true, color: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        folder: {
          include: {
            shares: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                team: { select: { id: true, name: true } },
                customRole: { select: { id: true, name: true, label: true } },
              },
            },
          },
        },
      },
    });

    if (!note) {
      throw errorResponse("NOT_FOUND", "Note not found.", 404);
    }

    const effectiveAccess = await evaluateNoteAccess(note.id, user, note);
    if (!hasPermissionLevel(effectiveAccess, "VIEW")) {
      throw errorResponse("FORBIDDEN", "Forbidden.", 403);
    }

    return {
      generalAccess: note.generalAccess,
      directShares: note.shares,
      inheritedShares: note.folder?.shares ?? [],
      folderName: note.folder?.name ?? null,
      canManage: hasPermissionLevel(effectiveAccess, "FULL") || note.authorId === user.id,
    };
  });
}

export async function POST(
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
    if (!hasPermissionLevel(effectiveAccess, "FULL") && note.authorId !== user.id) {
      throw errorResponse("FORBIDDEN", "Only note owners or admins can manage shares.", 403);
    }

    const body = await req.json();
    const { userId, userIds, role, teamId, customRoleId, accessLevel = "VIEW" } = body;

    const allUserIds: string[] = Array.isArray(userIds)
      ? userIds.filter((uid): uid is string => typeof uid === "string" && uid.trim().length > 0)
      : typeof userId === "string" && userId.trim().length > 0
      ? [userId]
      : [];

    if (allUserIds.length === 0 && !role && !teamId && !customRoleId) {
      throw errorResponse("VALIDATION_ERROR", "Must specify user(s), role, team, or custom role.", 400);
    }

    // Upsert or create share
    if (allUserIds.length > 0) {
      const shares = await prisma.$transaction(
        allUserIds.map((uid) =>
          prisma.noteShare.upsert({
            where: { noteId_userId: { noteId: id, userId: uid } },
            create: {
              noteId: id,
              userId: uid,
              accessLevel: accessLevel as NotePermission,
            },
            update: {
              accessLevel: accessLevel as NotePermission,
            },
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          })
        )
      );

      await Promise.all(
        allUserIds.map((uid) =>
          notificationService.notifyNoteShared({
            noteId: note.id,
            noteTitle: note.title || "Untitled",
            targetUserId: uid,
            actorId: user.id,
            actorName: user.name || "Someone",
          })
        )
      );

      return NextResponse.json(allUserIds.length === 1 ? shares[0] : { shares, count: shares.length }, { status: 200 });
    }

    let share;
    if (role) {
      share = await prisma.noteShare.upsert({
        where: { noteId_role: { noteId: id, role: role as Role } },
        create: {
          noteId: id,
          role: role as Role,
          accessLevel: accessLevel as NotePermission,
        },
        update: {
          accessLevel: accessLevel as NotePermission,
        },
      });
    } else if (teamId) {
      share = await prisma.noteShare.upsert({
        where: { noteId_teamId: { noteId: id, teamId } },
        create: {
          noteId: id,
          teamId,
          accessLevel: accessLevel as NotePermission,
        },
        update: {
          accessLevel: accessLevel as NotePermission,
        },
        include: {
          team: { select: { id: true, name: true } },
        },
      });
    } else if (customRoleId) {
      share = await prisma.noteShare.upsert({
        where: { noteId_customRoleId: { noteId: id, customRoleId } },
        create: {
          noteId: id,
          customRoleId,
          accessLevel: accessLevel as NotePermission,
        },
        update: {
          accessLevel: accessLevel as NotePermission,
        },
        include: {
          customRole: { select: { id: true, name: true, label: true } },
        },
      });
    }

    return NextResponse.json(share, { status: 200 });
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
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      throw errorResponse("VALIDATION_ERROR", "shareId is required.", 400);
    }

    const note = await prisma.note.findUnique({
      where: { id },
      include: { shares: true, folder: { include: { shares: true } } },
    });

    if (!note) {
      throw errorResponse("NOT_FOUND", "Note not found.", 404);
    }

    const effectiveAccess = await evaluateNoteAccess(note.id, user, note);
    if (!hasPermissionLevel(effectiveAccess, "FULL") && note.authorId !== user.id) {
      throw errorResponse("FORBIDDEN", "Only note owners or admins can remove shares.", 403);
    }

    const result = await prisma.noteShare.deleteMany({
      where: { id: shareId, noteId: id },
    });

    if (result.count === 0) {
      throw errorResponse("NOT_FOUND", "Share not found on this note.", 404);
    }

    return { success: true };
  });
}
