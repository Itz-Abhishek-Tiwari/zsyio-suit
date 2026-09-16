import { prisma } from "@zsyio/database";
import { DEFAULT_ROLE_PERMISSIONS, ForbiddenError, BadRequestError, NotFoundError, type Role } from "@zsyio/auth/permissions";
import type { CreateRoleInput, UpdateRoleInput } from "@zsyio/validators";
import { invalidateAllUserAuth } from "@zsyio/auth/auth-cache";

const SYSTEM_ROLES_CONFIG: Array<{
  name: Role;
  label: string;
  description: string;
  color: string;
  icon: string;
  permissions: string[];
}> = [
  {
    name: "ADMIN",
    label: "Admin",
    description: "Full system administration, permissions configuration & user management",
    color: "purple",
    icon: "shield-check",
    permissions: DEFAULT_ROLE_PERMISSIONS.ADMIN,
  },
  {
    name: "MANAGER",
    label: "Manager",
    description: "Manage clients, products, teams & assign tasks across workspaces",
    color: "amber",
    icon: "user-cog",
    permissions: DEFAULT_ROLE_PERMISSIONS.MANAGER,
  },
  {
    name: "DEVELOPER",
    label: "Developer",
    description: "Work on assigned tasks & view client products and repositories",
    color: "blue",
    icon: "code",
    permissions: DEFAULT_ROLE_PERMISSIONS.DEVELOPER,
  },
  {
    name: "SUPPORT",
    label: "Support",
    description: "Handle support request tickets, customer feedback & client notes",
    color: "emerald",
    icon: "headphones",
    permissions: DEFAULT_ROLE_PERMISSIONS.SUPPORT,
  },
];

let systemRolesEnsured = false;

export const roleRepository = {
  async ensureSystemRoles() {
    if (systemRolesEnsured) return;
    try {
      // Clean up any legacy custom role record for SUPER_ADMIN
      await prisma.customRole.deleteMany({
        where: { name: "SUPER_ADMIN" },
      });

      for (const sysRole of SYSTEM_ROLES_CONFIG) {
        const existing = await prisma.customRole.findUnique({
          where: { name: sysRole.name },
        });

        if (!existing) {
          await prisma.customRole.create({
            data: {
              name: sysRole.name,
              label: sysRole.label,
              description: sysRole.description,
              isSystem: true,
              permissions: sysRole.permissions,
              color: sysRole.color,
              icon: sysRole.icon,
            },
          });
        } else {
          // If system role is missing app:access actions, backfill from defaults
          const existingPerms = (existing.permissions as string[]) || [];
          const hasAppPerms = existingPerms.some((p) => p.startsWith("app:access:"));
          if (!hasAppPerms) {
            const defaultAppPerms = sysRole.permissions.filter((p) => p.startsWith("app:access:"));
            const merged = Array.from(new Set([...existingPerms, ...defaultAppPerms]));
            await prisma.customRole.update({
              where: { id: existing.id },
              data: { permissions: merged },
            });
          }
        }
      }

      // Backfill any legacy custom roles that have no app:access entries yet
      const customRoles = await prisma.customRole.findMany({
        where: { isSystem: false },
      });
      for (const cRole of customRoles) {
        const perms = (cRole.permissions as string[]) || [];
        if (!perms.some((p) => p.startsWith("app:access:"))) {
          const merged = Array.from(new Set([...perms, "app:access:pms", "app:access:notes", "app:access:hrms"]));
          await prisma.customRole.update({
            where: { id: cRole.id },
            data: { permissions: merged },
          });
        }
      }

      systemRolesEnsured = true;
    } catch {
      // If table isn't migrated yet or during tests with mock prisma, don't crash
    }
  },

  async list() {
    await this.ensureSystemRoles();
    const roles = await prisma.customRole.findMany({
      where: {
        name: { not: "SUPER_ADMIN" },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    try {
      const userCountsByRole = await prisma.user.groupBy({
        by: ["role"],
        where: { customRoleId: null },
        _count: { id: true },
      });

      const enumCountsMap: Record<string, number> = {};
      for (const item of userCountsByRole) {
        enumCountsMap[item.role] = item._count.id;
      }

      return roles.map((r) => ({
        ...r,
        _count: {
          users: (r._count?.users || 0) + (r.isSystem ? (enumCountsMap[r.name] ?? 0) : 0),
        },
      }));
    } catch {
      return roles;
    }
  },

  async findById(id: string) {
    await this.ensureSystemRoles();
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return this.attachSystemUserCount(role);
  },

  async findByName(name: string) {
    await this.ensureSystemRoles();
    const normalized = name.toUpperCase().trim();
    const role = await prisma.customRole.findUnique({
      where: { name: normalized },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return this.attachSystemUserCount(role);
  },

  async attachSystemUserCount<T extends { isSystem: boolean; name: string; _count?: { users: number } | null }>(role: T | null) {
    if (!role) return null;
    try {
      let extraCount = 0;
      if (role.isSystem) {
        extraCount = await prisma.user.count({
          where: { role: role.name as Role, customRoleId: null },
        });
      }
      return {
        ...role,
        _count: {
          users: (role._count?.users || 0) + extraCount,
        },
      };
    } catch {
      return role;
    }
  },

  async create(data: CreateRoleInput) {
    const normalizedName = data.name.toUpperCase().trim();
    const existing = await prisma.customRole.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new BadRequestError(`A role with identifier "${normalizedName}" already exists.`);
    }

    const created = await prisma.customRole.create({
      data: {
        name: normalizedName,
        label: data.label.trim(),
        description: data.description?.trim() || null,
        isSystem: false,
        permissions: data.permissions,
        color: data.color || "purple",
        icon: data.icon || "shield",
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    invalidateAllUserAuth();
    return created;
  },

  async update(id: string, data: UpdateRoleInput) {
    const existing = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Role not found");
    }

    if (existing.name === "SUPER_ADMIN") {
      throw new ForbiddenError("Super Admin permissions are immutable and cannot be modified.");
    }

    let updatedPermissions = data.permissions ?? existing.permissions;

    // Safety Invariant: Admin role must always retain user:manage, role:manage, dashboard:view, and app:access:admin
    if (existing.name === "ADMIN" && data.permissions) {
      const set = new Set(data.permissions);
      set.add("user:manage");
      set.add("role:manage");
      set.add("dashboard:view");
      set.add("app:access:admin");
      updatedPermissions = Array.from(set);
    }

    const updated = await prisma.customRole.update({
      where: { id },
      data: {
        ...(data.label ? { label: data.label.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.permissions ? { permissions: updatedPermissions } : {}),
        ...(data.color ? { color: data.color } : {}),
        ...(data.icon ? { icon: data.icon } : {}),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    invalidateAllUserAuth();
    return updated;
  },

  async delete(id: string) {
    const existing = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Role not found");
    }

    if (existing.isSystem) {
      throw new ForbiddenError("Built-in system roles cannot be deleted.");
    }

    if (existing._count.users > 0) {
      throw new BadRequestError(
        `Cannot delete role "${existing.label}" because it is currently assigned to ${existing._count.users} user(s). Reassign them first.`
      );
    }

    const result = await prisma.customRole.delete({
      where: { id },
    });

    invalidateAllUserAuth();
    return result;
  },

  async resetDefaults() {
    await this.ensureSystemRoles();
    for (const sysRole of SYSTEM_ROLES_CONFIG) {
      await prisma.customRole.updateMany({
        where: { name: sysRole.name, isSystem: true },
        data: {
          permissions: sysRole.permissions,
          label: sysRole.label,
          description: sysRole.description,
          color: sysRole.color,
          icon: sysRole.icon,
        },
      });
    }

    invalidateAllUserAuth();
    return this.list();
  },
};
