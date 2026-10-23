import { Prisma, Role } from "@prisma/client";
import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import type { CreateTaskInput, UpdateTaskInput, AssignTaskInput } from "@zsyio/validators";

export type TaskListFilters = {
  clientId?: string;
  productId?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  assignedToIds?: string[];
  reviewerId?: string;
  reviewerIds?: string[];
  assignedTeamId?: string;
  type?: string;
  role?: string;
  customRoleId?: string;
  tag?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  q?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  includeDeleted?: boolean;
  /** "own" scoping = assignedToId === self OR self in TaskAssignee roster OR reviewerId === self OR self in TaskReviewer roster OR self in assignedTeam */
  scopeToUserId?: string;
};

export const TASK_INCLUDE = {
  product: { include: { client: true } },
  createdBy: { select: SAFE_USER_SELECT },
  assignedTo: { select: SAFE_USER_SELECT },
  reviewer: { select: SAFE_USER_SELECT },
  reviewers: { include: { user: { select: SAFE_USER_SELECT } } },
  assignees: { include: { user: { select: SAFE_USER_SELECT } } },
  assignedTeam: { include: { members: { include: { user: { select: SAFE_USER_SELECT } } } } },
  teams: { include: { team: { include: { members: { include: { user: { select: SAFE_USER_SELECT } } } } } } },
  tags: { include: { tag: true } },
  attachments: true,
  timeEntries: {
    include: { user: { select: SAFE_USER_SELECT } },
    orderBy: { startedAt: "desc" },
  },
} satisfies Prisma.TaskInclude;

// Compact user shape for task lists (Kanban / Table) to avoid overfetching
// password, invitation, and nested custom role metadata across hundreds of cards
export const TASK_CARD_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  customRoleId: true,
  active: true,
} satisfies Prisma.UserSelect;

// Slim select for list views (Kanban / Table): omits the long text columns
// (description, aiSummary), client notes/contacts, the full team member roster
// and deep user metadata - those are only needed in the detail panel, which
// fetches the full task itself. The Kanban loads up to 500 rows, so this matters.
export const TASK_LIST_SELECT = {
  id: true,
  ticketNumber: true,
  productId: true,
  title: true,
  status: true,
  priority: true,
  type: true,
  dueDate: true,
  dueDateReason: true,
  changeReason: true,
  blockedReason: true,
  gitBranchSlug: true,
  deletedAt: true,
  estimatedHours: true,
  actualHours: true,
  assignedToId: true,
  reviewerId: true,
  assignedTeamId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      clientId: true,
      imageUrl: true,
      environment: true,
      client: { select: { id: true, name: true, logoUrl: true } },
    },
  },
  createdBy: { select: TASK_CARD_USER_SELECT },
  assignedTo: { select: TASK_CARD_USER_SELECT },
  reviewer: { select: TASK_CARD_USER_SELECT },
  reviewers: { select: { taskId: true, userId: true, user: { select: TASK_CARD_USER_SELECT } } },
  assignees: { select: { taskId: true, userId: true, user: { select: TASK_CARD_USER_SELECT } } },
  assignedTeam: { select: { id: true, name: true, color: true } },
  teams: { select: { taskId: true, teamId: true, team: { select: { id: true, name: true, color: true } } } },
  tags: { select: { taskId: true, tagId: true, tag: true } },
} satisfies Prisma.TaskSelect;

const ALLOWED_TASK_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "dueDate",
  "title",
  "status",
  "priority",
  "type",
  "ticketNumber",
]);

/**
 * Resolves a ticket reference ("TSK-123", "123", an id suffix) to a task id.
 * Callers try the exact id first with their own query, so this only handles
 * the fallbacks and does not re-check the direct id.
 */
async function resolveTaskIdFallback(id: string, includeDeleted = false): Promise<string | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  // 1. Numeric ticket number check (e.g. "TSK-123", "tsk-123", or "123")
  const clean = trimmed.toLowerCase().replace(/^tsk-/i, "");
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    const byNum = await prisma.task.findFirst({
      where: { ticketNumber: num, ...(includeDeleted ? {} : { deletedAt: null }) },
      select: { id: true },
    });
    if (byNum) return byNum.id;
  }

  // 2. Suffix check if clean is at least 6 characters
  if (clean.length >= 6) {
    const bySuffix = await prisma.task.findFirst({
      where: {
        id: { endsWith: clean, mode: "insensitive" },
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      select: { id: true },
    });
    if (bySuffix) return bySuffix.id;
  }

  return null;
}

/**
 * Attaches tags (created on demand by name) to a task in three round trips,
 * however many tags there are. Existing assignments are left alone, so callers
 * replacing the set delete the old assignments first.
 */
export async function attachTaskTags(
  db: Prisma.TransactionClient | typeof prisma,
  taskId: string,
  tagNames: string[]
) {
  const names = Array.from(new Set(tagNames.map((n) => n.trim()).filter(Boolean)));
  if (names.length === 0) return;
  await db.taskTag.createMany({ data: names.map((name) => ({ name })), skipDuplicates: true });
  const tagRecords = await db.taskTag.findMany({ where: { name: { in: names } }, select: { id: true } });
  await db.taskTagAssignment.createMany({
    data: tagRecords.map((t) => ({ taskId, tagId: t.id })),
    skipDuplicates: true,
  });
}

// Narrow select for ownership/authorization checks (isOwner + status diffing).
function findOwnershipInfoById(id: string, includeDeleted: boolean) {
  if (!id) return Promise.resolve(null);
  return prisma.task.findFirst({
    where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
    select: {
      id: true,
      createdById: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      dueDate: true,
      dueDateReason: true,
      changeReason: true,
      blockedReason: true,
      assignedToId: true,
      reviewerId: true,
      reviewers: { select: { userId: true } },
      assignedTeamId: true,
      assignees: { select: { userId: true } },
      assignedTeam: { select: { members: { select: { userId: true } } } },
      teams: { select: { teamId: true, team: { select: { members: { select: { userId: true } } } } } },
    },
    relationLoadStrategy: "join",
  });
}

export const taskRepository = {
  async list(filters: TaskListFilters) {
    const {
      clientId,
      productId,
      status,
      priority,
      assignedToId,
      assignedToIds,
      reviewerId,
      reviewerIds,
      assignedTeamId,
      type,
      role,
      customRoleId,
      tag,
      dueBefore,
      dueAfter,
      q,
      page,
      pageSize,
      sortBy,
      sortDir,
      includeDeleted,
      scopeToUserId,
    } = filters;

    const andConditions: Prisma.TaskWhereInput[] = [
      ...(includeDeleted ? [] : [{ deletedAt: null }]),
      ...(productId ? [{ productId }] : []),
      ...(clientId ? [{ product: { clientId } }] : []),
      ...(status ? [{ status: { equals: status, mode: "insensitive" as const } }] : []),
      ...(priority ? [{ priority: priority as never }] : []),
      ...(type ? [{ type: { equals: type, mode: "insensitive" as const } }] : []),
      ...(tag
        ? [
            {
              tags: {
                some: {
                  OR: [
                    { tagId: tag },
                    { tag: { name: { equals: tag, mode: "insensitive" as const } } },
                  ],
                },
              },
            },
          ]
        : []),
      ...(dueBefore || dueAfter
        ? [{ dueDate: { ...(dueBefore ? { lte: dueBefore } : {}), ...(dueAfter ? { gte: dueAfter } : {}) } }]
        : []),
    ];

    const roleFilterConditions: Prisma.UserWhereInput[] = [];
    if (customRoleId) {
      roleFilterConditions.push({ customRoleId });
    }
    if (role) {
      const isPrismaRole = (Object.values(Role) as string[]).includes(role.toUpperCase());
      if (isPrismaRole) {
        roleFilterConditions.push({ role: role.toUpperCase() as Role });
      }
      roleFilterConditions.push(
        { customRoleId: role },
        { customRole: { name: { equals: role, mode: "insensitive" as const } } },
        { customRole: { label: { equals: role, mode: "insensitive" as const } } }
      );
    }
    if (roleFilterConditions.length > 0) {
      const userRoleMatch: Prisma.UserWhereInput = { OR: roleFilterConditions };
      andConditions.push({
        OR: [
          { assignedTo: userRoleMatch },
          { assignees: { some: { user: userRoleMatch } } },
          { assignedTeam: { members: { some: { user: userRoleMatch } } } },
          { teams: { some: { team: { members: { some: { user: userRoleMatch } } } } } },
        ],
      });
    }

    const assigneeFilterIds = [
      ...(assignedToIds ?? []),
      ...(assignedToId ? assignedToId.split(",").map((s) => s.trim()).filter(Boolean) : []),
    ];
    const uniqueAssigneeIds = Array.from(new Set(assigneeFilterIds));

    if (uniqueAssigneeIds.length === 1) {
      const singleId = uniqueAssigneeIds[0];
      andConditions.push({
        OR: [
          { assignedToId: singleId },
          { assignees: { some: { userId: singleId } } },
        ],
      });
    } else if (uniqueAssigneeIds.length > 1) {
      andConditions.push({
        OR: [
          { assignedToId: { in: uniqueAssigneeIds } },
          { assignees: { some: { userId: { in: uniqueAssigneeIds } } } },
        ],
      });
    }

    const reviewerFilterIds = [
      ...(reviewerIds ?? []),
      ...(reviewerId ? reviewerId.split(",").map((s) => s.trim()).filter(Boolean) : []),
    ];
    const uniqueReviewerIds = Array.from(new Set(reviewerFilterIds));

    if (uniqueReviewerIds.length === 1) {
      const singleId = uniqueReviewerIds[0];
      andConditions.push({
        OR: [
          { reviewerId: singleId },
          { reviewers: { some: { userId: singleId } } },
        ],
      });
    } else if (uniqueReviewerIds.length > 1) {
      andConditions.push({
        OR: [
          { reviewerId: { in: uniqueReviewerIds } },
          { reviewers: { some: { userId: { in: uniqueReviewerIds } } } },
        ],
      });
    }

    if (assignedTeamId) {
      andConditions.push({
        OR: [
          { assignedTeamId },
          { teams: { some: { teamId: assignedTeamId } } },
        ],
      });
    }

    if (scopeToUserId) {
      const userTeamMemberships = await prisma.teamMember.findMany({
        where: { userId: scopeToUserId },
        select: { teamId: true },
      });
      const userTeamIds = userTeamMemberships.map((m) => m.teamId);

      andConditions.push({
        OR: [
          { createdById: scopeToUserId },
          { assignedToId: scopeToUserId },
          { reviewerId: scopeToUserId },
          { reviewers: { some: { userId: scopeToUserId } } },
          { assignees: { some: { userId: scopeToUserId } } },
          ...(userTeamIds.length > 0
            ? [
                { assignedTeamId: { in: userTeamIds } },
                { teams: { some: { teamId: { in: userTeamIds } } } },
              ]
            : []),
        ],
      });
    }

    if (q && q.trim()) {
      const trimmed = q.trim();
      const ticketMatch = trimmed.match(/^(?:tsk[-\s]?|#)?(\d+)$/i);

      const searchOr: Prisma.TaskWhereInput[] = [
        { title: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { gitBranchSlug: { contains: trimmed, mode: "insensitive" } },
        { product: { name: { contains: trimmed, mode: "insensitive" } } },
        { product: { client: { name: { contains: trimmed, mode: "insensitive" } } } },
      ];

      if (ticketMatch) {
        const ticketNum = parseInt(ticketMatch[1], 10);
        // Direct exact match on sequential ticket number
        searchOr.push({ ticketNumber: ticketNum });
        // Also match git branch slug like "tsk-2"
        searchOr.push({ gitBranchSlug: { contains: `tsk-${ticketNum}`, mode: "insensitive" } });
      } else {
        // If user typed a full CUID (>= 20 characters)
        if (trimmed.length >= 20) {
          searchOr.push({ id: { equals: trimmed } });
        }
      }

      andConditions.push({ OR: searchOr });
    }

    const where: Prisma.TaskWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const effectiveSortBy = sortBy && ALLOWED_TASK_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: TASK_LIST_SELECT,
        orderBy: { [effectiveSortBy]: sortDir ?? "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  // Narrow select for ownership/authorization checks (isOwner + status diffing)
  // that don't need the full nested TASK_INCLUDE - avoids paying for
  // product/client, every assignee's user row, and full team rosters just to
  // decide whether the current user is allowed to act on the task.
  async findOwnershipInfo(id: string, includeDeleted = false) {
    const direct = await findOwnershipInfoById(id.trim(), includeDeleted);
    if (direct) return direct;
    const targetId = await resolveTaskIdFallback(id, includeDeleted);
    return targetId ? findOwnershipInfoById(targetId, includeDeleted) : null;
  },

  async findActivityLogs(taskId: string) {
    return prisma.activityLog.findMany({
      where: { taskId },
      include: { actor: { select: SAFE_USER_SELECT } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  },

  async findById(id: string, includeDeleted = false) {
    // Try the exact id first; only fall back to ticket-number / suffix lookup
    // when it misses. ActivityLogs are intentionally excluded here - they are
    // served by GET /tasks/[id]/activity and lazy-loaded with the Activity tab.
    // Attachments already come with TASK_INCLUDE.
    const notDeleted = includeDeleted ? {} : { deletedAt: null };
    const loadTask = (taskId: string) =>
      prisma.task.findFirst({
        where: { id: taskId, ...notDeleted },
        include: TASK_INCLUDE,
        relationLoadStrategy: "join",
      });
    const loadComments = (taskId: string) =>
      prisma.comment.findMany({
        where: { taskId },
        include: { author: { select: SAFE_USER_SELECT } },
        orderBy: { createdAt: "asc" },
      });

    const directId = id.trim();
    const [direct, directComments] = await Promise.all([loadTask(directId), loadComments(directId)]);
    if (direct) return { ...direct, comments: directComments };

    const targetId = await resolveTaskIdFallback(id, includeDeleted);
    if (!targetId) return null;
    const [task, comments] = await Promise.all([loadTask(targetId), loadComments(targetId)]);
    return task ? { ...task, comments } : null;
  },

  async create(data: CreateTaskInput & { createdById: string }) {
    const { assigneeIds, teamIds, attachments, tags, ...rest } = data;
    const task = await prisma.task.create({
      data: {
        ...(rest as Prisma.TaskUncheckedCreateInput),
        ...(assigneeIds?.length
          ? { assignees: { create: assigneeIds.map((userId) => ({ userId })) } }
          : {}),
        ...(teamIds?.length
          ? { teams: { create: teamIds.map((teamId) => ({ teamId })) } }
          : {}),
        ...(attachments?.length
          ? {
              attachments: {
                create: attachments.map((att) => ({
                  fileName: att.fileName,
                  fileUrl: att.fileUrl,
                  fileSize: att.fileSize,
                })),
              },
            }
          : {}),
      },
      include: TASK_INCLUDE,
    });

    if (tags?.length) {
      await attachTaskTags(prisma, task.id, tags);
      return prisma.task.findUniqueOrThrow({
        where: { id: task.id },
        include: TASK_INCLUDE,
      });
    }

    return task;
  },

  async update(id: string, data: UpdateTaskInput) {
    const { teamIds, tags, ...rest } = data;
    return prisma.$transaction(
      async (tx) => {
        if (teamIds !== undefined) {
          await tx.taskTeam.deleteMany({ where: { taskId: id } });
          if (teamIds.length > 0) {
            await tx.taskTeam.createMany({
              data: teamIds.map((teamId) => ({ taskId: id, teamId })),
            });
          }
        }
        if (tags !== undefined) {
          await tx.taskTagAssignment.deleteMany({ where: { taskId: id } });
          await attachTaskTags(tx, id, tags);
        }
        return tx.task.update({ where: { id }, data: rest as never, include: TASK_INCLUDE });
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },

  async reassign(id: string, data: AssignTaskInput) {
    return prisma.$transaction(
      async (tx) => {
        if (data.assigneeIds !== undefined) {
          await tx.taskAssignee.deleteMany({ where: { taskId: id } });
        }
        if (data.teamIds !== undefined) {
          await tx.taskTeam.deleteMany({ where: { taskId: id } });
        }

        return tx.task.update({
          where: { id },
          data: {
            assignedToId: data.assignedToId,
            assignedTeamId: data.assignedTeamId,
            ...(data.assigneeIds?.length
              ? { assignees: { create: data.assigneeIds.map((userId) => ({ userId })) } }
              : {}),
            ...(data.teamIds?.length
              ? { teams: { create: data.teamIds.map((teamId) => ({ teamId })) } }
              : {}),
          },
          include: TASK_INCLUDE,
        });
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },

  async softDelete(id: string) {
    return prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
