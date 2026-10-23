import { Prisma, Role } from "@prisma/client";
import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "./shared";
import { isSuperAdmin, SUPER_ADMIN_ROLE } from "@zsyio/auth/super-admin";
import { hashPassword } from "@zsyio/auth/password";
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from "@zsyio/auth/permissions";
import type { CreateUserInput, UpdateUserInput } from "@zsyio/validators";
import crypto from "crypto";

export function formatSuperAdminUser<T extends { email: string; role?: string; customRole?: unknown }>(u: T): T {
  if (isSuperAdmin(u)) {
    return {
      ...u,
      role: (u.role || "ADMIN") as never,
      customRole: SUPER_ADMIN_ROLE as never,
    };
  }
  return u;
}

const MAX_USER_LIST = 500;

export interface UserListFilters {
  q?: string;
  role?: string;
  status?: string;
  active?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  limit?: number;
}

const ALLOWED_USER_SORT_FIELDS = new Set(["name", "email", "createdAt", "updatedAt", "role", "active", "invitedAt"]);

export const userRepository = {
  async list(filters?: UserListFilters) {
    const { q, role, status, active, sortBy = "createdAt", sortDir = "desc", limit } = filters || {};

    const where: Prisma.UserWhereInput = {};
    if (typeof active === "boolean") {
      where.active = active;
    }

    if (status) {
      if (status === "ACTIVE") {
        where.active = true;
        where.invitationStatus = "ACCEPTED";
      } else if (status === "PENDING") {
        where.invitationStatus = "PENDING";
      } else if (status === "REJECTED") {
        where.invitationStatus = "REJECTED";
      } else if (status === "DEACTIVATED") {
        where.active = false;
      }
    }

    const andClauses: Prisma.UserWhereInput[] = [];

    if (role && role !== "ALL") {
      const isPrismaRole = (Object.values(Role) as string[]).includes(role.toUpperCase());
      andClauses.push({
        OR: [
          ...(isPrismaRole ? [{ role: role.toUpperCase() as Role }] : []),
          { customRoleId: role },
          { customRole: { name: { equals: role, mode: "insensitive" as const } } },
          { customRole: { label: { equals: role, mode: "insensitive" as const } } },
        ],
      });
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      andClauses.push({
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { email: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const effectiveSortBy = ALLOWED_USER_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";

    const users = await prisma.user.findMany({
      where,
      orderBy: { [effectiveSortBy]: sortDir },
      take: limit && limit > 0 ? Math.min(limit, MAX_USER_LIST) : MAX_USER_LIST,
      select: {
        ...SAFE_USER_SELECT,
        teamMemberships: {
          select: {
            teamId: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      relationLoadStrategy: "join",
    });

    return users.map((u) => {
      const formatted = formatSuperAdminUser(u);
      return {
        ...formatted,
        teamMembers: formatted.teamMemberships,
      };
    });
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SAFE_USER_SELECT,
        teamMemberships: {
          select: {
            teamId: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
      relationLoadStrategy: "join",
    });
    if (!user) return null;
    const formatted = formatSuperAdminUser(user);
    return {
      ...formatted,
      teamMembers: formatted.teamMemberships,
    };
  },

  async create(data: CreateUserInput) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictError("A user with this email address already exists.");
    }

    let passwordHash: string | null = null;
    if (data.password && data.password.trim()) {
      passwordHash = await hashPassword(data.password);
    }

    let systemRole: "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" = "DEVELOPER";
    let customRoleId: string | null = data.customRoleId ?? null;

    if (data.role && ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(data.role)) {
      systemRole = data.role as "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT";
    } else if (data.role && !customRoleId) {
      const customRole = await prisma.customRole.findUnique({ where: { name: data.role.toUpperCase().trim() } });
      if (customRole) {
        customRoleId = customRole.id;
      }
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitedAt = new Date();

    const createdUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        role: systemRole,
        customRoleId,
        passwordHash,
        active: true,
        mustChangePassword: true,
        invitationStatus: "PENDING",
        invitationToken,
        invitationExpiresAt,
        invitedAt,
      },
      select: SAFE_USER_SELECT,
    });

    return {
      user: formatSuperAdminUser(createdUser),
      invitationToken,
    };
  },

  async update(id: string, data: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(existing)) {
      if (data.active === false) {
        throw new ForbiddenError("The Super Admin account cannot be deactivated.");
      }
      if (data.role !== undefined || data.customRoleId !== undefined) {
        throw new ForbiddenError("The Super Admin role cannot be modified or reassigned.");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.active !== undefined) updateData.active = data.active;
    if (data.customRoleId !== undefined) updateData.customRoleId = data.customRoleId;

    if (data.role !== undefined) {
      if (["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(data.role)) {
        updateData.role = data.role;
        if (data.customRoleId === undefined) {
          updateData.customRoleId = null;
        }
      } else {
        const customRole = await prisma.customRole.findUnique({ where: { name: data.role.toUpperCase().trim() } });
        if (customRole) {
          updateData.customRoleId = customRole.id;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });
    return formatSuperAdminUser(updated);
  },

  async resendInvitation(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        invitationToken,
        invitationExpiresAt,
        invitedAt,
        invitationStatus: "PENDING",
      },
      select: SAFE_USER_SELECT,
    });

    return {
      user: formatSuperAdminUser(updatedUser),
      invitationToken,
    };
  },

  async setPassword(id: string, password: string) {
    const passwordHash = await hashPassword(password);
    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
      select: SAFE_USER_SELECT,
    });
    return formatSuperAdminUser(updated);
  },

  async delete(id: string, fallbackAdminId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(user)) {
      throw new ForbiddenError(
        "The Super Admin account is permanently protected and cannot be deleted."
      );
    }

    let fallbackId = fallbackAdminId;
    if (!fallbackId || fallbackId === id) {
      const admin = await prisma.user.findFirst({
        where: { id: { not: id }, role: "ADMIN", active: true },
        select: { id: true },
      });
      fallbackId = admin?.id;
    }

    if (user.role === "ADMIN" && !fallbackId) {
      throw new BadRequestError(
        "Cannot delete the only active administrator account. Please promote another active administrator first."
      );
    }

    return prisma.$transaction(
      async (tx) => {
        await tx.task.updateMany({
          where: { assignedToId: id },
          data: { assignedToId: null },
        });

        await tx.taskAssignee.deleteMany({ where: { userId: id } });
        await tx.teamMember.deleteMany({ where: { userId: id } });

        if (fallbackId) {
          await tx.task.updateMany({
            where: { createdById: id },
            data: { createdById: fallbackId },
          });
          await tx.note.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.noteFolder.updateMany({
            where: { createdById: id },
            data: { createdById: fallbackId },
          });
          await tx.dashboardNote.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.comment.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.activityLog.updateMany({
            where: { actorId: id },
            data: { actorId: fallbackId },
          });
        }

        await tx.user.delete({ where: { id } });

        return { success: true };
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },
};
