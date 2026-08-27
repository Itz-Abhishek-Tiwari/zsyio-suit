import { prisma, type NotePermission, type Prisma } from "@zsyio/database";

export type EffectiveAccess = "NONE" | "VIEW" | "EDIT" | "FULL";

// Shape required by evaluateFolderAccess/evaluateNoteAccess to avoid a redundant
// DB round trip when the caller has already fetched the record. Callers may pass
// a more detailed object (extra `include`d relations) — only these fields are read.
export type FolderAccessRecord = Prisma.NoteFolderGetPayload<{
  include: { shares: true };
}>;

export type NoteAccessRecord = Prisma.NoteGetPayload<{
  include: { shares: true; folder: { include: { shares: true } } };
}>;

const ACCESS_HIERARCHY: Record<NotePermission | "NONE", number> = {
  NONE: 0,
  VIEW: 1,
  EDIT: 2,
  FULL: 3,
};

export function compareAccess(a: EffectiveAccess, b: EffectiveAccess): EffectiveAccess {
  return ACCESS_HIERARCHY[a] >= ACCESS_HIERARCHY[b] ? a : b;
}

export function hasPermissionLevel(actual: EffectiveAccess, required: "VIEW" | "EDIT" | "FULL"): boolean {
  return ACCESS_HIERARCHY[actual] >= ACCESS_HIERARCHY[required];
}

export interface UserAuthContext {
  id: string;
  role: string;
  customRoleId?: string | null;
  teamIds?: string[];
}

/**
 * Fetch team IDs for a user to evaluate team-based shares
 */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

/**
 * Evaluates the effective access level of a user for a given folder.
 *
 * @param preloadedFolder Optional already-fetched folder (with `shares` included) to
 *   avoid a redundant DB round trip when the caller already has the record.
 */
export async function evaluateFolderAccess(
  folderId: string,
  user: UserAuthContext,
  preloadedFolderOrVisited?: FolderAccessRecord | null | Set<string>,
  visitedSet?: Set<string>
): Promise<EffectiveAccess> {
  let preloadedFolder: FolderAccessRecord | null | undefined;
  let visited: Set<string>;

  if (preloadedFolderOrVisited instanceof Set) {
    visited = preloadedFolderOrVisited;
    preloadedFolder = undefined;
  } else {
    preloadedFolder = preloadedFolderOrVisited;
    visited = visitedSet ?? new Set();
  }

  if (visited.has(folderId) || visited.size > 20) {
    return "NONE";
  }
  visited.add(folderId);

  const folder =
    preloadedFolder !== undefined
      ? preloadedFolder
      : await prisma.noteFolder.findUnique({
          where: { id: folderId },
          include: {
            shares: true,
          },
        });

  if (!folder) return "NONE";
  if (folder.createdById === user.id) return "FULL";

  let highestAccess: EffectiveAccess = "NONE";

  // Check general access on folder
  if (folder.generalAccess === "WORKSPACE_EDIT") {
    highestAccess = compareAccess(highestAccess, "EDIT");
  } else if (folder.generalAccess === "WORKSPACE_VIEW") {
    highestAccess = compareAccess(highestAccess, "VIEW");
  }

  // Get user's teams if not provided
  const teamIds = user.teamIds ?? (await getUserTeamIds(user.id));

  const roleUpper = user.role?.toUpperCase();

  // Check folder shares
  for (const share of folder.shares || []) {
    // 1. Direct user share
    if (share.userId && share.userId === user.id) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    // 2. System role share
    if (share.role && share.role.toUpperCase() === roleUpper) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    // 3. Custom role share
    if (share.customRoleId && user.customRoleId && share.customRoleId === user.customRoleId) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    // 4. Team share
    if (share.teamId && teamIds.includes(share.teamId)) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
  }

  // If folder has parent and access is not FULL, evaluate parent inheritance if not explicit
  if (folder.parentId && highestAccess === "NONE" && !visited.has(folder.parentId)) {
    const parentAccess = await evaluateFolderAccess(folder.parentId, { ...user, teamIds }, undefined, visited);
    highestAccess = compareAccess(highestAccess, parentAccess);
  }

  return highestAccess;
}

/**
 * Evaluates the effective access level of a user for a given note.
 *
 * @param preloadedNote Optional already-fetched note (with `shares` and
 *   `folder.shares` included) to avoid a redundant DB round trip when the
 *   caller already has the record.
 */
export async function evaluateNoteAccess(
  noteId: string,
  user: UserAuthContext,
  preloadedNote?: NoteAccessRecord | null
): Promise<EffectiveAccess> {
  const note =
    preloadedNote !== undefined
      ? preloadedNote
      : await prisma.note.findUnique({
          where: { id: noteId },
          include: {
            shares: true,
            folder: {
              include: {
                shares: true,
              },
            },
          },
        });

  if (!note) return "NONE";
  if (note.authorId === user.id) return "FULL";

  let highestAccess: EffectiveAccess = "NONE";

  // Check general access on note
  if (note.generalAccess === "WORKSPACE_EDIT") {
    highestAccess = compareAccess(highestAccess, "EDIT");
  } else if (note.generalAccess === "WORKSPACE_VIEW") {
    highestAccess = compareAccess(highestAccess, "VIEW");
  }

  const teamIds = user.teamIds ?? (await getUserTeamIds(user.id));
  const roleUpper = user.role?.toUpperCase();

  // Check direct note shares
  for (const share of note.shares || []) {
    if (share.userId && share.userId === user.id) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    if (share.role && share.role.toUpperCase() === roleUpper) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    if (share.customRoleId && user.customRoleId && share.customRoleId === user.customRoleId) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
    if (share.teamId && teamIds.includes(share.teamId)) {
      highestAccess = compareAccess(highestAccess, share.accessLevel as EffectiveAccess);
    }
  }

  // If note generalAccess is INHERIT and it belongs to a folder, evaluate folder access
  if (note.generalAccess === "INHERIT" && note.folderId) {
    const folderAccess = await evaluateFolderAccess(note.folderId, { ...user, teamIds }, note.folder ?? undefined);
    highestAccess = compareAccess(highestAccess, folderAccess);
  }

  return highestAccess;
}

export interface FolderAccessItem {
  id: string;
  parentId: string | null;
  createdById: string;
  generalAccess: string;
  shares: {
    userId: string | null;
    role: string | null;
    customRoleId: string | null;
    teamId: string | null;
  }[];
}

/**
 * Pure in-memory evaluation of accessible folders, including cascading inheritance.
 */
export function computeAccessibleFolderIds(
  user: UserAuthContext,
  folders: FolderAccessItem[]
): Set<string> {
  const roleUpper = user.role?.toUpperCase() || "";
  const teamIds = user.teamIds ?? [];
  const isPrismaRole = ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(roleUpper);

  const accessibleSet = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  for (const f of folders) {
    if (f.parentId) {
      if (!childrenMap.has(f.parentId)) childrenMap.set(f.parentId, []);
      childrenMap.get(f.parentId)!.push(f.id);
    }

    let hasAccess = false;
    if (f.createdById === user.id) {
      hasAccess = true;
    } else if (f.generalAccess === "WORKSPACE_VIEW" || f.generalAccess === "WORKSPACE_EDIT") {
      hasAccess = true;
    } else {
      hasAccess = f.shares.some(
        (s) =>
          (s.userId && s.userId === user.id) ||
          (s.role && isPrismaRole && s.role.toUpperCase() === roleUpper) ||
          (s.customRoleId && user.customRoleId && s.customRoleId === user.customRoleId) ||
          (s.teamId && teamIds.includes(s.teamId))
      );
    }

    if (hasAccess) {
      accessibleSet.add(f.id);
    }
  }

  // Cascading inheritance: all subfolders of accessible folders are accessible
  const queue = Array.from(accessibleSet);
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = childrenMap.get(parentId);
    if (children) {
      for (const childId of children) {
        if (!accessibleSet.has(childId)) {
          accessibleSet.add(childId);
          queue.push(childId);
        }
      }
    }
  }

  return accessibleSet;
}

/**
 * Resolves all folder IDs accessible to the user, including recursive subfolders.
 * Optionally accepts `preloadedFolders` to eliminate a redundant DB round-trip.
 */
export async function getAccessibleFolderIds(
  user: UserAuthContext,
  preloadedFolders?: FolderAccessItem[]
): Promise<Set<string>> {
  const teamIds = user.teamIds ?? (await getUserTeamIds(user.id));
  const folders =
    preloadedFolders ??
    (await prisma.noteFolder.findMany({
      select: {
        id: true,
        parentId: true,
        createdById: true,
        generalAccess: true,
        shares: {
          select: {
            userId: true,
            role: true,
            customRoleId: true,
            teamId: true,
          },
        },
      },
    }));

  return computeAccessibleFolderIds({ ...user, teamIds }, folders);
}
