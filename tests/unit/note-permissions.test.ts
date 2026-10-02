import { describe, it, expect } from "vitest";
import { can, type Role } from "@zsyio/auth/permissions";
import { compareAccess, hasPermissionLevel } from "@zsyio/auth/note-permissions";

describe("Note Permissions & Access Controls", () => {
  describe("can() for Note Actions", () => {
    it("ADMIN has full permissions on notes", () => {
      const role: Role = "ADMIN";
      expect(can(role, "note:view")).toBe(true);
      expect(role, "note:create").toBeDefined();
      expect(can(role, "note:create")).toBe(true);
      expect(can(role, "note:edit")).toBe(true);
      expect(can(role, "note:delete")).toBe(true);
      expect(can(role, "note:share")).toBe(true);
    });

    it("DEVELOPER has view, create, edit, delete, and share permissions", () => {
      const role: Role = "DEVELOPER";
      expect(can(role, "note:view")).toBe(true);
      expect(can(role, "note:create")).toBe(true);
      expect(can(role, "note:edit")).toBe(true);
      expect(can(role, "note:delete")).toBe(true);
      expect(can(role, "note:share")).toBe(true);
    });

    it("SUPPORT has view, create, edit permissions but not delete or share by default", () => {
      const role: Role = "SUPPORT";
      expect(can(role, "note:view")).toBe(true);
      expect(can(role, "note:create")).toBe(true);
      expect(can(role, "note:edit")).toBe(true);
      expect(can(role, "note:delete")).toBe(false);
      expect(can(role, "note:share")).toBe(false);
    });

    it("Custom permissions override role defaults", () => {
      expect(can("SUPPORT", "note:share", ["note:share"])).toBe(true);
      expect(can("DEVELOPER", "note:edit", ["note:view"])).toBe(false);
    });
  });

  describe("compareAccess()", () => {
    it("correctly determines highest access level", () => {
      expect(compareAccess("NONE", "VIEW")).toBe("VIEW");
      expect(compareAccess("VIEW", "EDIT")).toBe("EDIT");
      expect(compareAccess("EDIT", "FULL")).toBe("FULL");
      expect(compareAccess("FULL", "VIEW")).toBe("FULL");
      expect(compareAccess("EDIT", "VIEW")).toBe("EDIT");
    });
  });

  describe("hasPermissionLevel()", () => {
    it("correctly evaluates threshold requirements", () => {
      expect(hasPermissionLevel("FULL", "VIEW")).toBe(true);
      expect(hasPermissionLevel("FULL", "EDIT")).toBe(true);
      expect(hasPermissionLevel("FULL", "FULL")).toBe(true);

      expect(hasPermissionLevel("EDIT", "VIEW")).toBe(true);
      expect(hasPermissionLevel("EDIT", "EDIT")).toBe(true);
      expect(hasPermissionLevel("EDIT", "FULL")).toBe(false);

      expect(hasPermissionLevel("VIEW", "VIEW")).toBe(true);
      expect(hasPermissionLevel("VIEW", "EDIT")).toBe(false);
      expect(hasPermissionLevel("VIEW", "FULL")).toBe(false);

      expect(hasPermissionLevel("NONE", "VIEW")).toBe(false);
    });
  });

  describe("Cycle protection in evaluateFolderAccess()", () => {
    it("safely terminates when visited set detects a loop", async () => {
      const visited = new Set<string>(["folder-cycle-1"]);
      // Calling evaluateFolderAccess with a pre-visited ID returns NONE immediately without DB query
      const { evaluateFolderAccess } = await import("@zsyio/auth/note-permissions");
      const access = await evaluateFolderAccess(
        "folder-cycle-1",
        { id: "user-1", role: "DEVELOPER" },
        visited
      );
      expect(access).toBe("NONE");
    });
  });

  describe("Multi-user access level resolution", () => {
    it("resolves the highest permission among multiple access levels", () => {
      const accessLevels = ["VIEW", "EDIT", "VIEW"] as const;
      const effective = accessLevels.reduce<import("@zsyio/auth/note-permissions").EffectiveAccess>(
        (acc, curr) => compareAccess(acc, curr),
        "NONE"
      );
      expect(effective).toBe("EDIT");
    });

    it("grants FULL when at least one grant has FULL access", () => {
      const accessLevels = ["VIEW", "FULL", "EDIT"] as const;
      const effective = accessLevels.reduce<import("@zsyio/auth/note-permissions").EffectiveAccess>(
        (acc, curr) => compareAccess(acc, curr),
        "NONE"
      );
      expect(effective).toBe("FULL");
    });
  });

  describe("Same-role privacy & Workspace-wide sharing (evaluateNoteAccess)", () => {
    it("ensures two users with the same role (e.g. ADMIN) cannot access each other's private notes", async () => {
      const { evaluateNoteAccess } = await import("@zsyio/auth/note-permissions");

      const privateNote = {
        id: "note-1",
        title: "Admin A Private Document",
        content: null,
        icon: null,
        coverImage: null,
        authorId: "admin-user-a",
        folderId: null,
        generalAccess: "PRIVATE" as const,
        isPinned: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        shares: [],
        folder: null,
      };

      // Admin A (creator) has FULL access
      const accessA = await evaluateNoteAccess(
        "note-1",
        { id: "admin-user-a", role: "ADMIN", teamIds: [] },
        privateNote as any
      );
      expect(accessA).toBe("FULL");

      // Admin B (different user, same role) has NO access by default
      const accessB = await evaluateNoteAccess(
        "note-1",
        { id: "admin-user-b", role: "ADMIN", teamIds: [] },
        privateNote as any
      );
      expect(accessB).toBe("NONE");
    });

    it("grants view or edit access when generalAccess is WORKSPACE_VIEW or WORKSPACE_EDIT", async () => {
      const { evaluateNoteAccess } = await import("@zsyio/auth/note-permissions");

      const workspaceViewNote = {
        id: "note-workspace-view",
        authorId: "user-creator",
        folderId: null,
        generalAccess: "WORKSPACE_VIEW" as const,
        shares: [],
        folder: null,
      };

      const accessOtherView = await evaluateNoteAccess(
        "note-workspace-view",
        { id: "other-user", role: "ADMIN", teamIds: [] },
        workspaceViewNote as any
      );
      expect(accessOtherView).toBe("VIEW");

      const workspaceEditNote = {
        id: "note-workspace-edit",
        authorId: "user-creator",
        folderId: null,
        generalAccess: "WORKSPACE_EDIT" as const,
        shares: [],
        folder: null,
      };

      const accessOtherEdit = await evaluateNoteAccess(
        "note-workspace-edit",
        { id: "other-user", role: "ADMIN", teamIds: [] },
        workspaceEditNote as any
      );
      expect(accessOtherEdit).toBe("EDIT");
    });

    it("grants access to another user of same role only when explicitly shared with user or role", async () => {
      const { evaluateNoteAccess } = await import("@zsyio/auth/note-permissions");

      // Shared directly with Admin B
      const sharedWithUserNote = {
        id: "note-shared-user",
        authorId: "admin-user-a",
        folderId: null,
        generalAccess: "PRIVATE" as const,
        shares: [
          {
            id: "share-1",
            noteId: "note-shared-user",
            userId: "admin-user-b",
            role: null,
            customRoleId: null,
            teamId: null,
            accessLevel: "EDIT",
            createdAt: new Date(),
          },
        ],
        folder: null,
      };

      const accessB = await evaluateNoteAccess(
        "note-shared-user",
        { id: "admin-user-b", role: "ADMIN", teamIds: [] },
        sharedWithUserNote as any
      );
      expect(accessB).toBe("EDIT");

      // Admin C (not invited) still gets NONE
      const accessC = await evaluateNoteAccess(
        "note-shared-user",
        { id: "admin-user-c", role: "ADMIN", teamIds: [] },
        sharedWithUserNote as any
      );
      expect(accessC).toBe("NONE");
    });
  });
});

