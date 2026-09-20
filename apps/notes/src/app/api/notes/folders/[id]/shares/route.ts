import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { evaluateFolderAccess, hasPermissionLevel } from "@zsyio/auth/note-permissions";
import type { Role, NotePermission } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const { id } = await params;

    const folder = await prisma.noteFolder.findUnique({
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
      },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "VIEW")) {
      throw errorResponse("FORBIDDEN", "Forbidden.", 403);
    }

    return {
      generalAccess: folder.generalAccess,
      shares: folder.shares,
      canManage: hasPermissionLevel(effectiveAccess, "FULL") || folder.createdById === user.id,
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

    const folder = await prisma.noteFolder.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "FULL") && folder.createdById !== user.id) {
      throw errorResponse("FORBIDDEN", "Only folder owners or admins can manage shares.", 403);
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

    if (allUserIds.length > 0) {
      const shares = await prisma.$transaction(
        allUserIds.map((uid) =>
          prisma.noteFolderShare.upsert({
            where: { folderId_userId: { folderId: id, userId: uid } },
            create: {
              folderId: id,
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

      return NextResponse.json(allUserIds.length === 1 ? shares[0] : { shares, count: shares.length }, { status: 200 });
    }

    let share;
    if (role) {
      share = await prisma.noteFolderShare.upsert({
        where: { folderId_role: { folderId: id, role: role as Role } },
        create: {
          folderId: id,
          role: role as Role,
          accessLevel: accessLevel as NotePermission,
        },
        update: {
          accessLevel: accessLevel as NotePermission,
        },
      });
    } else if (teamId) {
      share = await prisma.noteFolderShare.upsert({
        where: { folderId_teamId: { folderId: id, teamId } },
        create: {
          folderId: id,
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
      share = await prisma.noteFolderShare.upsert({
        where: { folderId_customRoleId: { folderId: id, customRoleId } },
        create: {
          folderId: id,
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

    const folder = await prisma.noteFolder.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "FULL") && folder.createdById !== user.id) {
      throw errorResponse("FORBIDDEN", "Only folder owners or admins can remove shares.", 403);
    }

    const result = await prisma.noteFolderShare.deleteMany({
      where: { id: shareId, folderId: id },
    });

    if (result.count === 0) {
      throw errorResponse("NOT_FOUND", "Share not found on this folder.", 404);
    }

    return { success: true };
  });
}
