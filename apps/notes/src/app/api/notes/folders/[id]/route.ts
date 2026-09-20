import { NextRequest } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { evaluateFolderAccess, hasPermissionLevel } from "@zsyio/auth/note-permissions";

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
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        subfolders: {
          where: { isArchived: false },
          include: {
            _count: { select: { notes: true, subfolders: true } },
          },
        },
        notes: {
          where: { isArchived: false },
          include: {
            author: { select: { id: true, name: true, email: true } },
            stars: { where: { userId: user.id }, select: { userId: true } },
          },
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            team: { select: { id: true, name: true, color: true } },
            customRole: { select: { id: true, name: true, label: true, color: true } },
          },
        },
      },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "VIEW")) {
      throw errorResponse("FORBIDDEN", "You do not have access to view this folder.", 403);
    }

    return {
      ...folder,
      notes: folder.notes.map((n) => ({
        ...n,
        isStarred: n.stars.length > 0,
      })),
      effectiveAccess,
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

    const folder = await prisma.noteFolder.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "EDIT")) {
      throw errorResponse("FORBIDDEN", "You do not have permission to edit this folder.", 403);
    }

    const body = await req.json();
    const { name, icon, color, description, parentId, isArchived, generalAccess } = body;

    // Prevent cyclical parenting (both direct self-parenting and multi-level ancestor loops)
    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        throw errorResponse("VALIDATION_ERROR", "A folder cannot be its own parent.", 400);
      }
      const targetParent = await prisma.noteFolder.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true },
      });
      if (!targetParent) {
        throw errorResponse("NOT_FOUND", "Target parent folder not found.", 404);
      }

      let currentParentId: string | null = targetParent.parentId;
      const cycleVisited = new Set<string>([parentId]);
      while (currentParentId) {
        if (currentParentId === id) {
          throw errorResponse("VALIDATION_ERROR", "Cannot set a descendant folder as the parent.", 400);
        }
        if (cycleVisited.has(currentParentId)) break;
        cycleVisited.add(currentParentId);
        const ancestor = await prisma.noteFolder.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        currentParentId = ancestor?.parentId ?? null;
      }
    }

    const updated = await prisma.noteFolder.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
        ...(generalAccess !== undefined ? { generalAccess } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        shares: true,
      },
    });

    return updated;
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

    const folder = await prisma.noteFolder.findUnique({
      where: { id },
      include: { shares: true },
    });

    if (!folder) {
      throw errorResponse("NOT_FOUND", "Folder not found.", 404);
    }

    const effectiveAccess = await evaluateFolderAccess(folder.id, user, folder);
    if (!hasPermissionLevel(effectiveAccess, "FULL") && folder.createdById !== user.id) {
      throw errorResponse("FORBIDDEN", "Only folder owners or admins can delete this folder.", 403);
    }

    if (permanent) {
      await prisma.noteFolder.delete({ where: { id } });
      return { success: true, deleted: true };
    } else {
      const archived = await prisma.noteFolder.update({
        where: { id },
        data: { isArchived: true },
      });
      return { success: true, archived: true, folder: archived };
    }
  });
}
