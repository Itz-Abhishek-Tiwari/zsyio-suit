import { NextRequest } from "next/server";
import { requireUser, withApiHandler, errorResponse } from "@zsyio/auth/api-helpers";
import { prisma } from "@zsyio/database";
import { assertCan } from "@zsyio/auth/permissions";
import { getUserTeamIds, computeAccessibleFolderIds } from "@zsyio/auth/note-permissions";
import type { Role, NoteGeneralAccess } from "@prisma/client";
import { NOTE_TEMPLATES } from "@zsyio/editor";

export async function GET(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "note:view", user.permissions);

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const roleUpper = user.role?.toUpperCase() || "";
    const isPrismaRole = ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(roleUpper);

    // Step 1: Parallelize team lookup and folder tree retrieval
    const [teamIds, allDbFolders] = await Promise.all([
      getUserTeamIds(user.id),
      prisma.noteFolder.findMany({
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          shares: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
              team: { select: { id: true, name: true } },
              customRole: { select: { id: true, name: true, label: true } },
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

    // Step 2: Compute accessible folder IDs in-memory from pre-fetched folders
    const accessibleFolderIds = computeAccessibleFolderIds(userAuthContext, allDbFolders);
    const accessibleFolderIdList = Array.from(accessibleFolderIds);

    const activeFolders = allDbFolders.filter((f) => !f.isArchived && accessibleFolderIds.has(f.id));
    const archivedFolders = allDbFolders.filter((f) => f.isArchived && accessibleFolderIds.has(f.id));
    const activeFolderIdSet = new Set(activeFolders.map((f) => f.id));

    // Filter criteria for accessible notes
    const noteAccessFilter = {
      OR: [
        { authorId: user.id },
        { generalAccess: { in: ["WORKSPACE_VIEW", "WORKSPACE_EDIT"] as NoteGeneralAccess[] } },
        {
          shares: {
            some: {
              OR: [
                { userId: user.id },
                ...(isPrismaRole ? [{ role: roleUpper as Role }] : []),
                ...(user.customRoleId ? [{ customRoleId: user.customRoleId }] : []),
                ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
              ],
            },
          },
        },
        ...(accessibleFolderIdList.length > 0
          ? [
              {
                folderId: { in: accessibleFolderIdList },
                generalAccess: { not: "PRIVATE" as NoteGeneralAccess },
              },
            ]
          : []),
      ],
    };

    // If search query is provided, return flat list of matching notes & in-memory filtered folders
    if (query) {
      const qLower = query.toLowerCase();
      const matchedFolders = activeFolders.filter((f) => f.name.toLowerCase().includes(qLower)).slice(0, 15);
      const notes = await prisma.note.findMany({
        where: {
          ...noteAccessFilter,
          isArchived: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          folder: { select: { id: true, name: true, icon: true, color: true } },
          stars: { where: { userId: user.id }, select: { userId: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      });

      return {
        searchResults: {
          notes: notes.map((n) => ({
            ...n,
            isStarred: n.stars.length > 0,
          })),
          folders: matchedFolders,
        },
      };
    }

    // Normal tree retrieval: single query for notes omitting heavy content bodies
    const allNotes = await prisma.note.findMany({
      where: {
        ...noteAccessFilter,
      },
      select: {
        id: true,
        title: true,
        icon: true,
        coverImage: true,
        folderId: true,
        authorId: true,
        isPinned: true,
        isArchived: true,
        generalAccess: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    const mapNoteSummary = (n: (typeof allNotes)[number]) => ({
      ...n,
      content: "",
      isStarred: n.stars.length > 0,
    });

    const activeNotes = allNotes
      .filter((n) => !n.isArchived)
      .map(mapNoteSummary);

    const archivedNotes = allNotes
      .filter((n) => n.isArchived)
      .map(mapNoteSummary);

    // Grouping for Notion-style sidebar:
    // 1. Starred Notes
    const starredNotes = activeNotes.filter((n) => n.isStarred);

    // 2. Shared with me (Notes where author is NOT current user)
    // Directly shared notes or notes not in a visible folder
    const sharedWithMeNotes = activeNotes.filter((n) => {
      if (n.authorId === user.id) return false;
      const hasDirectShare = n.shares.some(
        (s) =>
          s.userId === user.id ||
          (isPrismaRole && s.role?.toUpperCase() === roleUpper) ||
          (user.customRoleId && s.customRoleId === user.customRoleId) ||
          (s.teamId && teamIds.includes(s.teamId))
      );
      const isUnfiledOrOrphan = !n.folderId || !activeFolderIdSet.has(n.folderId);
      return hasDirectShare || isUnfiledOrOrphan;
    });

    // 3. Private / My root notes (notes created by user with no folder or in non-visible folder)
    const myRootNotes = activeNotes.filter(
      (n) => n.authorId === user.id && (!n.folderId || !activeFolderIdSet.has(n.folderId))
    );

    // 4. Other root notes
    const otherRootNotes = activeNotes.filter(
      (n) => n.authorId !== user.id && (!n.folderId || !activeFolderIdSet.has(n.folderId))
    );

    return {
      folders: activeFolders,
      archivedFolders,
      notes: activeNotes,
      archivedNotes,
      starredNotes,
      sharedWithMeNotes,
      myRootNotes,
      otherRootNotes,
    };
  });
}

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    assertCan(user.role, "note:create", user.permissions);

    const body = await req.json();
    const { folderId, generalAccess, templateId } = body;
    let { title, content, icon, coverImage } = body;

    // If templateId provided, prepopulate content and icon/cover
    if (templateId) {
      const template = NOTE_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        if (!title || title === "Untitled") title = template.title;
        if (!content) content = template.content;
        if (!icon) icon = template.icon;
        if (!coverImage) coverImage = template.coverImage;
      }
    }

    // Verify folder exists if specified
    if (folderId) {
      const folder = await prisma.noteFolder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        throw errorResponse("NOT_FOUND", "Specified folder does not exist.", 404);
      }
    }

    const newNote = await prisma.note.create({
      data: {
        title: title?.trim() || "Untitled",
        content: content || "",
        icon: icon || "file-text",
        coverImage: coverImage || null,
        folderId: folderId || null,
        authorId: user.id,
        generalAccess: generalAccess || (folderId ? "INHERIT" : "PRIVATE"),
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        folder: { select: { id: true, name: true, icon: true, color: true } },
        shares: true,
      },
    });

    return newNote;
  });
}
