import { describe, it, expect, vi, beforeEach } from "vitest";
import { roleService } from "@/server/services/role.service";
import { roleRepository } from "@/server/repositories/role.repository";
import { prisma } from "@zsyio/database";
import { ForbiddenError, can } from "@zsyio/auth/permissions";

vi.mock("@zsyio/database", () => ({
  prisma: {
    customRole: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

type AuthUser = {
  id: string;
  role: "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" | string;
  mustChangePassword: boolean;
  email?: string | null;
  name?: string | null;
};

const mockAdminUser: AuthUser = {
  id: "admin-1",
  role: "ADMIN",
  mustChangePassword: false,
  email: "admin@mediloon.de",
  name: "Admin User",
};

const mockDevUser: AuthUser = {
  id: "dev-1",
  role: "DEVELOPER",
  mustChangePassword: false,
  email: "dev@mediloon.de",
  name: "Dev User",
};

describe("Roles & Dynamic Permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("can() with dynamic permissions array", () => {
    it("evaluates permissions from a custom permissions array", () => {
      const customPerms = ["dashboard:view", "task:view:all", "task:create:any"];
      expect(can("QA_TESTER", "dashboard:view", customPerms)).toBe(true);
      expect(can("QA_TESTER", "task:create:any", customPerms)).toBe(true);
      expect(can("QA_TESTER", "client:delete", customPerms)).toBe(false);
      expect(can("QA_TESTER", "user:manage", customPerms)).toBe(false);
    });

    it("falls back to default role permissions when no custom array provided", () => {
      expect(can("ADMIN", "user:manage")).toBe(true);
      expect(can("DEVELOPER", "user:manage")).toBe(false);
    });
  });

  describe("roleService authorization", () => {
    it("allows ADMIN to list and create custom roles", async () => {
      vi.mocked(prisma.customRole.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.customRole.create).mockResolvedValueOnce({
        id: "role-1",
        name: "QA_ENGINEER",
        label: "QA Engineer",
        description: "Quality assurance and testing",
        isSystem: false,
        permissions: ["dashboard:view", "task:view:all"],
        color: "teal",
        icon: "sparkles",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await roleService.create(mockAdminUser, {
        name: "QA_ENGINEER",
        label: "QA Engineer",
        description: "Quality assurance and testing",
        permissions: ["dashboard:view", "task:view:all"],
        color: "teal",
        icon: "sparkles",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("QA_ENGINEER");
    });

    it("prevents non-admin DEVELOPER from creating custom roles", async () => {
      await expect(
        roleService.create(mockDevUser, {
          name: "HACKER",
          label: "Hacker Role",
          permissions: ["user:manage"],
          color: "purple",
          icon: "shield",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("prevents non-admin DEVELOPER from deleting custom roles", async () => {
      await expect(roleService.delete(mockDevUser, "role-1")).rejects.toThrow(ForbiddenError);
    });
  });

  describe("roleRepository safety invariants", () => {
    it("preserves user:manage and dashboard:view for ADMIN role updates", async () => {
      vi.mocked(prisma.customRole.findUnique).mockResolvedValueOnce({
        id: "role-admin",
        name: "ADMIN",
        label: "Admin",
        description: "System admin",
        isSystem: true,
        permissions: ["user:manage", "dashboard:view", "client:delete"],
        color: "purple",
        icon: "shield-check",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.customRole.update).mockImplementation(((args: { data: { permissions?: string[] } }) => {
        return Promise.resolve({
          id: "role-admin",
          name: "ADMIN",
          label: "Admin",
          description: "System admin",
          isSystem: true,
          permissions: args.data.permissions || [],
          color: "purple",
          icon: "shield-check",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { users: 0 },
        });
      }) as never);

      // Try stripping user:manage and role:manage from ADMIN
      const updated = await roleRepository.update("role-admin", {
        permissions: ["task:view:all"],
      });

      expect(updated.permissions).toContain("user:manage");
      expect(updated.permissions).toContain("role:manage");
      expect(updated.permissions).toContain("dashboard:view");
      expect(updated.permissions).toContain("task:view:all");
    });

    it("rejects deleting built-in system roles", async () => {
      vi.mocked(prisma.customRole.findUnique).mockResolvedValueOnce({
        id: "sys-role-1",
        name: "DEVELOPER",
        label: "Developer",
        description: "Developer",
        isSystem: true,
        permissions: ["dashboard:view"],
        color: "blue",
        icon: "code",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { users: 0 },
      } as unknown as {
        id: string;
        name: string;
        label: string;
        description: string | null;
        isSystem: boolean;
        permissions: string[];
        color: string | null;
        icon: string | null;
        createdAt: Date;
        updatedAt: Date;
        _count: { users: number };
      });

      await expect(roleRepository.delete("sys-role-1")).rejects.toThrow(
        "Built-in system roles cannot be deleted."
      );
    });

    it("rejects deleting custom roles that have assigned users", async () => {
      vi.mocked(prisma.customRole.findUnique).mockResolvedValueOnce({
        id: "custom-role-1",
        name: "TESTER",
        label: "Tester",
        description: "Tester",
        isSystem: false,
        permissions: ["dashboard:view"],
        color: "pink",
        icon: "zap",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { users: 3 },
      } as unknown as {
        id: string;
        name: string;
        label: string;
        description: string | null;
        isSystem: boolean;
        permissions: string[];
        color: string | null;
        icon: string | null;
        createdAt: Date;
        updatedAt: Date;
        _count: { users: number };
      });

      await expect(roleRepository.delete("custom-role-1")).rejects.toThrow(
        /currently assigned to 3 user\(s\)/
      );
    });
  });
});

