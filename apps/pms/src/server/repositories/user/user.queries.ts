import { Prisma, Role } from "@prisma/client";
import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import { formatSuperAdminUser } from "./user.shared";

export type UserListFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  active?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export const userQueries = {
  async list(filters?: UserListFilters) {
    const { page, pageSize, q, role, active, sortBy = "createdAt", sortDir = "desc" } = filters || {};

    const where: Prisma.UserWhereInput = {};
    if (typeof active === "boolean") {
      where.active = active;
    }

    const andClauses: Prisma.UserWhereInput[] = [];

    if (role) {
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

    if (page !== undefined && pageSize !== undefined) {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { [sortBy]: sortDir },
          skip: Math.max(0, (page - 1) * pageSize),
          take: Math.min(100, Math.max(1, pageSize)),
          select: SAFE_USER_SELECT,
          relationLoadStrategy: "join",
        }),
        prisma.user.count({ where }),
      ]);

      return {
        items: items.map(formatSuperAdminUser),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      take: 200,
      select: SAFE_USER_SELECT,
      relationLoadStrategy: "join",
    });
    return users.map(formatSuperAdminUser);
  },

  async searchLite({ q = "", limit = 50 }: { q?: string; limit?: number } = {}) {
    const where: Prisma.UserWhereInput = { active: true };
    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: Math.min(100, Math.max(1, limit)),
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customRoleId: true,
        customRole: true,
      },
      relationLoadStrategy: "join",
    });

    return users.map(formatSuperAdminUser);
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
      relationLoadStrategy: "join",
    });
    return user ? formatSuperAdminUser(user) : null;
  },

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: SAFE_USER_SELECT,
      relationLoadStrategy: "join",
    });
    return user ? formatSuperAdminUser(user) : null;
  },

  async findActiveByEmailForAuth(email: string) {
    const normalized = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: normalized },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalized,
            mode: "insensitive",
          },
        },
      });
    }

    return user;
  },
};
