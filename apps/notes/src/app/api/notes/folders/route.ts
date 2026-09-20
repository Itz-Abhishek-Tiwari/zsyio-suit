import { NextRequest, NextResponse } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { assertCan } from "@zsyio/auth/permissions";
import { getUserTeamIds, computeAccessibleFolderIds } from "@zsyio/auth/note-permissions";

export async function GET() {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "note:view", user.permissions);

    const [teamIds, allDbFolders] = await Promise.all([
      getUserTeamIds(user.id),
      prisma.noteFolder.findMany({
        where: { isArchived: false },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          shares: {
            select: {
              userId: true,
              role: true,
              customRoleId: true,
              teamId: true,
            },
          },
          _count: {
            select: { notes: true, subfolders: true },
          },
        },
        orderBy: [{ isWorkspaceRoot: "desc" }, { name: "asc" }],
      }),
    ]);

    const userAuthContext = {
      id: user.id,
      role: user.role,
      customRoleId: user.customRoleId,
      teamIds,
    };

    const accessibleFolderIds = computeAccessibleFolderIds(userAuthContext, allDbFolders);
    const folders = allDbFolders.filter((f) => accessibleFolderIds.has(f.id));

    return { folders };
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "note:create", user.permissions);

    const body = await req.json();
    const { name, icon, color, description, parentId, isWorkspaceRoot, generalAccess } = body;

    if (!name?.trim()) {
      throw errorResponse("VALIDATION_ERROR", "Folder name is required.", 400);
    }

    if (parentId) {
      const parent = await prisma.noteFolder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw errorResponse("NOT_FOUND", "Parent folder not found.", 404);
      }
    }

    const folder = await prisma.noteFolder.create({
      data: {
        name: name.trim(),
        icon: icon || "folder",
        color: color || "purple",
        description: description || null,
        parentId: parentId || null,
        isWorkspaceRoot: Boolean(isWorkspaceRoot),
        generalAccess: generalAccess || "PRIVATE",
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        shares: true,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  });
}
