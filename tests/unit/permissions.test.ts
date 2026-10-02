import { describe, it, expect } from "vitest";
import { can, assertCan, canAccessApp, type AppId, ForbiddenError, type Role, ALL_ACTIONS, ACTION_GROUPS } from "@zsyio/auth/permissions";

// ── Permission Matrix Tests ──────────────────────────────────────────────────

describe("can()", () => {
  describe("ADMIN role", () => {
    const role: Role = "ADMIN";

    it("can perform all client actions", () => {
      expect(can(role, "client:view")).toBe(true);
      expect(can(role, "client:create")).toBe(true);
      expect(can(role, "client:edit")).toBe(true);
      expect(can(role, "client:delete")).toBe(true);
    });

    it("can manage users and roles", () => {
      expect(can(role, "user:manage")).toBe(true);
      expect(can(role, "user:view")).toBe(true);
      expect(can(role, "role:manage")).toBe(true);
      expect(can(role, "role:view")).toBe(true);
    });

    it("can manage teams", () => {
      expect(can(role, "team:view")).toBe(true);
      expect(can(role, "team:manage")).toBe(true);
    });

    it("can delete tasks and manage workflows", () => {
      expect(can(role, "task:delete")).toBe(true);
      expect(can(role, "task:view:all")).toBe(true);
      expect(can(role, "task:create")).toBe(true);
      expect(can(role, "task:create:any")).toBe(true);
      expect(can(role, "task:assign")).toBe(true);
      expect(can(role, "task:comment")).toBe(true);
      expect(can(role, "task:test_case:manage")).toBe(true);
      expect(can(role, "task:attachment:manage")).toBe(true);
      expect(can(role, "task:column:manage")).toBe(true);
    });

    it("can manage announcements and reports", () => {
      expect(can(role, "dashboard:note:create")).toBe(true);
      expect(can(role, "dashboard:note:delete")).toBe(true);
      expect(can(role, "report:export")).toBe(true);
    });
  });

  describe("MANAGER role", () => {
    const role: Role = "MANAGER";

    it("can view and edit clients but NOT delete", () => {
      expect(can(role, "client:view")).toBe(true);
      expect(can(role, "client:edit")).toBe(true);
      expect(can(role, "client:delete")).toBe(false);
    });

    it("can view users and manage teams, but cannot manage users or roles", () => {
      expect(can(role, "user:view")).toBe(true);
      expect(can(role, "user:manage")).toBe(false);
      expect(can(role, "team:view")).toBe(true);
      expect(can(role, "team:manage")).toBe(true);
      expect(can(role, "role:view")).toBe(true);
      expect(can(role, "role:manage")).toBe(false);
    });

    it("can create any type of task and assign", () => {
      expect(can(role, "task:create:any")).toBe(true);
      expect(can(role, "task:assign")).toBe(true);
      expect(can(role, "task:test_case:manage")).toBe(true);
    });

    it("cannot delete tasks", () => {
      expect(can(role, "task:delete")).toBe(false);
    });
  });

  describe("DEVELOPER role", () => {
    const role: Role = "DEVELOPER";

    it("can view clients and products but cannot create or edit clients", () => {
      expect(can(role, "client:view")).toBe(true);
      expect(can(role, "product:view")).toBe(true);
      expect(can(role, "client:create")).toBe(false);
      expect(can(role, "client:edit")).toBe(false);
      expect(can(role, "client:delete")).toBe(false);
    });

    it("cannot manage users or roles", () => {
      expect(can(role, "user:manage")).toBe(false);
      expect(can(role, "role:manage")).toBe(false);
    });

    it("can create any type of task, comment, and manage test cases", () => {
      expect(can(role, "task:create:any")).toBe(true);
      expect(can(role, "task:comment")).toBe(true);
      expect(can(role, "task:test_case:manage")).toBe(true);
      expect(can(role, "task:attachment:manage")).toBe(true);
    });

    it("cannot delete tasks", () => {
      expect(can(role, "task:delete")).toBe(false);
    });

    it("can view all tasks", () => {
      expect(can(role, "task:view:all")).toBe(true);
    });
  });

  describe("SUPPORT role", () => {
    const role: Role = "SUPPORT";

    it("has read-only client access", () => {
      expect(can(role, "client:view")).toBe(true);
      expect(can(role, "client:create")).toBe(false);
      expect(can(role, "client:edit")).toBe(false);
      expect(can(role, "client:delete")).toBe(false);
    });

    it("cannot create any task type (only support requests)", () => {
      expect(can(role, "task:create:any")).toBe(false);
      expect(can(role, "task:create:support")).toBe(true);
    });

    it("cannot delete tasks", () => {
      expect(can(role, "task:delete")).toBe(false);
    });

    it("cannot manage users", () => {
      expect(can(role, "user:manage")).toBe(false);
    });

    it("cannot view reports", () => {
      expect(can(role, "report:view")).toBe(false);
    });
  });

  describe("Custom permissions and fallback handling", () => {
    it("respects custom permissions array directly", () => {
      expect(can("CUSTOM", "client:view", ["client:view"])).toBe(true);
      expect(can("CUSTOM", "client:create", ["client:view"])).toBe(false);
    });

    it("falls back gracefully from high-level actions to sub-actions", () => {
      expect(can("CUSTOM", "task:create", ["task:create:any"])).toBe(true);
      expect(can("CUSTOM", "task:create:any", ["task:create"])).toBe(true);
      expect(can("CUSTOM", "task:create:support", ["task:create"])).toBe(true);
      expect(can("CUSTOM", "team:manage", ["user:manage"])).toBe(true);
      expect(can("CUSTOM", "team:view", ["user:manage"])).toBe(true);
      expect(can("CUSTOM", "user:view", ["user:manage"])).toBe(true);
      expect(can("CUSTOM", "role:view", ["user:manage"])).toBe(true);
      expect(can("CUSTOM", "task:assign", ["task:edit:any"])).toBe(true);
      expect(can("CUSTOM", "task:test_case:manage", ["task:edit:any"])).toBe(true);
      expect(can("CUSTOM", "task:column:manage", ["task:edit:any"])).toBe(true);
      expect(can("CUSTOM", "report:export", ["report:view"])).toBe(true);
    });
  });

  it("ALL_ACTIONS covers every action defined in ACTION_GROUPS", () => {
    const groupActionIds = ACTION_GROUPS.flatMap((g) => g.actions.map((a) => a.id));
    expect(new Set(groupActionIds).size).toBe(ALL_ACTIONS.length);
    for (const act of ALL_ACTIONS) {
      expect(groupActionIds).toContain(act);
    }
  });

  describe("Client documentation editing access", () => {
    it("ADMIN and MANAGER can edit client docs via client:edit and note:edit", () => {
      expect(can("ADMIN", "client:edit") || can("ADMIN", "note:edit")).toBe(true);
      expect(can("MANAGER", "client:edit") || can("MANAGER", "note:edit")).toBe(true);
    });

    it("DEVELOPER and SUPPORT can edit client docs via note:edit", () => {
      expect(can("DEVELOPER", "client:edit") || can("DEVELOPER", "note:edit")).toBe(true);
      expect(can("SUPPORT", "client:edit") || can("SUPPORT", "note:edit")).toBe(true);
    });
  });

  it("returns false for an unknown action", () => {
    // cast to any to bypass TS — confirms runtime guard works for unknown strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(can("ADMIN", "unknown:action" as any)).toBe(false);
  });
});

describe("assertCan()", () => {
  it("does not throw when permission is granted", () => {
    expect(() => assertCan("ADMIN", "client:delete")).not.toThrow();
  });

  it("throws ForbiddenError when permission is denied", () => {
    expect(() => assertCan("SUPPORT", "client:delete")).toThrow(ForbiddenError);
  });

  it("thrown error message contains the role and action", () => {
    try {
      assertCan("DEVELOPER", "task:delete");
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      expect((err as ForbiddenError).message).toContain("DEVELOPER");
      expect((err as ForbiddenError).message).toContain("task:delete");
    }
  });
});

describe("ForbiddenError", () => {
  it("has name 'ForbiddenError'", () => {
    const err = new ForbiddenError("test");
    expect(err.name).toBe("ForbiddenError");
  });

  it("uses default message when none provided", () => {
    const err = new ForbiddenError();
    expect(err.message).toBeTruthy();
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("is an instance of Error", () => {
    expect(new ForbiddenError()).toBeInstanceOf(Error);
  });
});

describe("canAccessApp()", () => {
  describe("SUPER_ADMIN role", () => {
    it("can access all 4 applications", () => {
      expect(canAccessApp("SUPER_ADMIN", "pms")).toBe(true);
      expect(canAccessApp("SUPER_ADMIN", "notes")).toBe(true);
      expect(canAccessApp("SUPER_ADMIN", "hrms")).toBe(true);
      expect(canAccessApp("SUPER_ADMIN", "admin")).toBe(true);
    });
  });

  describe("ADMIN role", () => {
    it("can access all 4 applications", () => {
      expect(canAccessApp("ADMIN", "pms")).toBe(true);
      expect(canAccessApp("ADMIN", "notes")).toBe(true);
      expect(canAccessApp("ADMIN", "hrms")).toBe(true);
      expect(canAccessApp("ADMIN", "admin")).toBe(true);
    });
  });

  describe("MANAGER role", () => {
    it("can access PMS, Notes, and HRMS, but NOT Admin by default", () => {
      expect(canAccessApp("MANAGER", "pms")).toBe(true);
      expect(canAccessApp("MANAGER", "notes")).toBe(true);
      expect(canAccessApp("MANAGER", "hrms")).toBe(true);
      expect(canAccessApp("MANAGER", "admin")).toBe(false);
    });
  });

  describe("DEVELOPER role", () => {
    it("can access PMS, Notes, and HRMS, but NOT Admin", () => {
      expect(canAccessApp("DEVELOPER", "pms")).toBe(true);
      expect(canAccessApp("DEVELOPER", "notes")).toBe(true);
      expect(canAccessApp("DEVELOPER", "hrms")).toBe(true);
      expect(canAccessApp("DEVELOPER", "admin")).toBe(false);
    });
  });

  describe("SUPPORT role", () => {
    it("can access PMS, Notes, and HRMS, but NOT Admin", () => {
      expect(canAccessApp("SUPPORT", "pms")).toBe(true);
      expect(canAccessApp("SUPPORT", "notes")).toBe(true);
      expect(canAccessApp("SUPPORT", "hrms")).toBe(true);
      expect(canAccessApp("SUPPORT", "admin")).toBe(false);
    });
  });

  describe("Custom roles", () => {
    it("respects explicit app access permissions granted to custom roles", () => {
      const perms = ["app:access:pms", "app:access:notes"];
      expect(canAccessApp("CUSTOM_EXTERNAL", "pms", perms)).toBe(true);
      expect(canAccessApp("CUSTOM_EXTERNAL", "notes", perms)).toBe(true);
      expect(canAccessApp("CUSTOM_EXTERNAL", "hrms", perms)).toBe(false);
      expect(canAccessApp("CUSTOM_EXTERNAL", "admin", perms)).toBe(false);
    });

    it("allows granting admin app access to custom roles", () => {
      const perms = ["app:access:admin", "user:manage"];
      expect(canAccessApp("CUSTOM_IAM", "admin", perms)).toBe(true);
      expect(canAccessApp("CUSTOM_IAM", "pms", perms)).toBe(false);
    });

    it("falls back cleanly to default role matrix when no app:access permissions specified (legacy role)", () => {
      const legacyPerms = ["dashboard:view", "task:create"];
      expect(canAccessApp("DEVELOPER", "pms", legacyPerms)).toBe(true);
      expect(canAccessApp("DEVELOPER", "notes", legacyPerms)).toBe(true);
      expect(canAccessApp("DEVELOPER", "hrms", legacyPerms)).toBe(true);
      expect(canAccessApp("DEVELOPER", "admin", legacyPerms)).toBe(false);
    });
  });
});

