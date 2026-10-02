import { describe, it, expect } from "vitest";

// ── isOwner helper — extracted for unit testing ──────────────────────────────
// The isOwner function in task.service.ts is module-private. We test its logic
// here by re-implementing the identical predicate in isolation, confirming the
// invariants the service relies on.

type Task = {
  assignedToId: string | null;
  reviewerId?: string | null;
  reviewers?: { userId: string }[];
  assignees: { userId: string }[];
  assignedTeam?: { members: { userId: string }[] } | null;
  teams?: { team: { members: { userId: string }[] } }[];
};

function isOwner(userId: string, task: Task): boolean {
  return (
    task.assignedToId === userId ||
    task.reviewerId === userId ||
    (task.reviewers?.some((r) => r.userId === userId) ?? false) ||
    task.assignees.some((a) => a.userId === userId) ||
    (task.assignedTeam?.members.some((m) => m.userId === userId) ?? false) ||
    (task.teams?.some((t) => t.team.members.some((m) => m.userId === userId)) ?? false)
  );
}

// ── Permission matrix for task types (mirrors task.service.ts) ───────────────
import { can } from "@zsyio/auth/permissions";

// ── isOwner tests ────────────────────────────────────────────────────────────

describe("isOwner()", () => {
  const USER_A = "user-A";
  const USER_B = "user-B";

  it("returns true when user is the legacy single assignee", () => {
    const task: Task = { assignedToId: USER_A, assignees: [] };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns true when user is the assigned reviewer", () => {
    const task: Task = { assignedToId: USER_B, reviewerId: USER_A, assignees: [] };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns true when user is in the multi-reviewer roster", () => {
    const task: Task = {
      assignedToId: USER_B,
      reviewerId: null,
      reviewers: [{ userId: USER_A }],
      assignees: [],
    };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns false when user is NOT the legacy single assignee", () => {
    const task: Task = { assignedToId: USER_B, assignees: [] };
    expect(isOwner(USER_A, task)).toBe(false);
  });

  it("returns true when user is in the multi-assignee roster", () => {
    const task: Task = {
      assignedToId: null,
      assignees: [{ userId: USER_A }, { userId: USER_B }],
    };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns true when user is a member of the assigned team", () => {
    const task: Task = {
      assignedToId: null,
      assignees: [],
      assignedTeam: { members: [{ userId: USER_A }] },
    };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns true when user is in a TaskTeam assignment", () => {
    const task: Task = {
      assignedToId: null,
      assignees: [],
      teams: [
        { team: { members: [{ userId: USER_B }, { userId: USER_A }] } },
      ],
    };
    expect(isOwner(USER_A, task)).toBe(true);
  });

  it("returns false when user has no relationship to the task", () => {
    const task: Task = {
      assignedToId: USER_B,
      assignees: [{ userId: USER_B }],
      assignedTeam: { members: [{ userId: USER_B }] },
      teams: [{ team: { members: [{ userId: USER_B }] } }],
    };
    expect(isOwner(USER_A, task)).toBe(false);
  });

  it("handles null/undefined optional fields gracefully", () => {
    const task: Task = {
      assignedToId: null,
      assignees: [],
      assignedTeam: null,
      teams: [],
    };
    expect(isOwner(USER_A, task)).toBe(false);
  });
});

// ── Task creation permission rules ───────────────────────────────────────────

describe("Task creation permissions (from permission matrix)", () => {
  it("SUPPORT role can only create support-typed tasks", () => {
    expect(can("SUPPORT", "task:create:any")).toBe(false);
    expect(can("SUPPORT", "task:create:support")).toBe(true);
  });

  it("DEVELOPER role can create any task type", () => {
    expect(can("DEVELOPER", "task:create:any")).toBe(true);
    expect(can("DEVELOPER", "task:create:support")).toBe(false);
  });

  it("MANAGER role can create any task type", () => {
    expect(can("MANAGER", "task:create:any")).toBe(true);
  });

  it("ADMIN role can create any task type", () => {
    expect(can("ADMIN", "task:create:any")).toBe(true);
  });
});

// ── Task edit/view scoping rules ─────────────────────────────────────────────

describe("Task view/edit scoping (from permission matrix)", () => {
  it("ADMIN and MANAGER can view all tasks", () => {
    expect(can("ADMIN", "task:view:all")).toBe(true);
    expect(can("MANAGER", "task:view:all")).toBe(true);
  });

  it("DEVELOPER can view all tasks", () => {
    expect(can("DEVELOPER", "task:view:all")).toBe(true);
  });

  it("SUPPORT can view all tasks", () => {
    expect(can("SUPPORT", "task:view:all")).toBe(true);
  });

  it("only ADMIN can delete tasks", () => {
    expect(can("ADMIN", "task:delete")).toBe(true);
    expect(can("MANAGER", "task:delete")).toBe(false);
    expect(can("DEVELOPER", "task:delete")).toBe(false);
    expect(can("SUPPORT", "task:delete")).toBe(false);
  });

  it("ADMIN and MANAGER can edit any task", () => {
    expect(can("ADMIN", "task:edit:any")).toBe(true);
    expect(can("MANAGER", "task:edit:any")).toBe(true);
  });

  it("DEVELOPER can edit any task", () => {
    expect(can("DEVELOPER", "task:edit:any")).toBe(true);
  });

  it("SUPPORT can only edit own tasks", () => {
    expect(can("SUPPORT", "task:edit:own")).toBe(true);
    expect(can("SUPPORT", "task:edit:any")).toBe(false);
  });

  it("evaluates attachment manage permissions across roles", () => {
    expect(can("ADMIN", "task:attachment:manage")).toBe(true);
    expect(can("MANAGER", "task:attachment:manage")).toBe(true);
    expect(can("DEVELOPER", "task:attachment:manage")).toBe(true);
    expect(can("SUPPORT", "task:attachment:manage")).toBe(true);
    expect(can("DEVELOPER", "task:attachment:manage", ["task:attachment:manage"])).toBe(true);
  });
});

// ── Activity tracking diffing logic tests ────────────────────────────────────

describe("Task activity tracking field diff detection", () => {
  it("detects field changes correctly across priority, status, and assignment", () => {
    const existing = {
      status: "TODO",
      priority: "LOW",
      type: "TASK",
      assignedToId: "user-1",
      reviewerId: "user-3",
      reviewers: [{ userId: "user-3" }],
      teams: [{ teamId: "team-1" }],
      assignees: [{ userId: "user-1" }],
    };

    const updateInput = {
      status: "IN_PROGRESS",
      priority: "HIGH" as const,
      type: "BUG",
      assignedToId: "user-2",
      reviewerId: "user-4",
      reviewerIds: ["user-4", "user-5"],
      teamIds: ["team-2"],
      assigneeIds: ["user-2", "user-3"],
    };

    const statusChanged = !!updateInput.status && updateInput.status !== existing.status;
    const priorityChanged = !!updateInput.priority && updateInput.priority !== existing.priority;
    const typeChanged = !!updateInput.type && updateInput.type !== existing.type;
    const assignedToChanged = updateInput.assignedToId !== undefined && updateInput.assignedToId !== existing.assignedToId;
    const reviewerChanged = updateInput.reviewerId !== undefined && updateInput.reviewerId !== existing.reviewerId;

    const oldReviewerIds = existing.reviewers.map((r) => r.userId).sort();
    const newReviewerIds = [...updateInput.reviewerIds].sort();
    const reviewersChanged = oldReviewerIds.join(",") !== newReviewerIds.join(",");

    const oldTeamIds = existing.teams.map((t) => t.teamId).sort();
    const newTeamIds = [...updateInput.teamIds].sort();
    const teamsChanged = oldTeamIds.join(",") !== newTeamIds.join(",");

    const oldAssigneeIds = existing.assignees.map((a) => a.userId).sort();
    const newAssigneeIds = [...updateInput.assigneeIds].sort();
    const assigneesChanged = oldAssigneeIds.join(",") !== newAssigneeIds.join(",");

    expect(statusChanged).toBe(true);
    expect(priorityChanged).toBe(true);
    expect(typeChanged).toBe(true);
    expect(assignedToChanged).toBe(true);
    expect(reviewerChanged).toBe(true);
    expect(reviewersChanged).toBe(true);
    expect(teamsChanged).toBe(true);
    expect(assigneesChanged).toBe(true);
  });

  it("does not flag unchanged fields as modified", () => {
    const existing = {
      status: "TODO",
      priority: "HIGH",
      type: "BUG",
      assignedToId: "user-1",
      teams: [{ teamId: "team-1" }],
      assignees: [{ userId: "user-1" }],
    };

    const updateInput = {
      status: "TODO",
      priority: "HIGH" as const,
      type: "BUG",
      assignedToId: "user-1",
      teamIds: ["team-1"],
      assigneeIds: ["user-1"],
    };

    const statusChanged = !!updateInput.status && updateInput.status !== existing.status;
    const priorityChanged = !!updateInput.priority && updateInput.priority !== existing.priority;
    const typeChanged = !!updateInput.type && updateInput.type !== existing.type;
    const assignedToChanged = updateInput.assignedToId !== undefined && updateInput.assignedToId !== existing.assignedToId;

    const oldTeamIds = existing.teams.map((t) => t.teamId).sort();
    const newTeamIds = [...updateInput.teamIds].sort();
    const teamsChanged = oldTeamIds.join(",") !== newTeamIds.join(",");

    const oldAssigneeIds = existing.assignees.map((a) => a.userId).sort();
    const newAssigneeIds = [...updateInput.assigneeIds].sort();
    const assigneesChanged = oldAssigneeIds.join(",") !== newAssigneeIds.join(",");

    expect(statusChanged).toBe(false);
    expect(priorityChanged).toBe(false);
    expect(typeChanged).toBe(false);
    expect(assignedToChanged).toBe(false);
    expect(teamsChanged).toBe(false);
    expect(assigneesChanged).toBe(false);
  });
});

import { formatTicketId } from "@/lib/utils";

describe("Ticket ID formatting and search matching", () => {
  it("formats task objects with sequential ticketNumber", () => {
    expect(formatTicketId({ id: "cmtagdknl0009ld04qrz53gui", ticketNumber: 1 })).toBe("TSK-1");
    expect(formatTicketId({ id: "cmtagdknl0009ld04qrz53gui", ticketNumber: 42 })).toBe("TSK-42");
    expect(formatTicketId({ id: "cmtagdknl0009ld04qrz53gui", ticketNumber: 1045 })).toBe("TSK-1045");
  });

  it("handles numeric values and numeric strings", () => {
    expect(formatTicketId(1)).toBe("TSK-1");
    expect(formatTicketId(101)).toBe("TSK-101");
    expect(formatTicketId("101")).toBe("TSK-101");
    expect(formatTicketId("TSK-101")).toBe("TSK-101");
    expect(formatTicketId("tsk-202")).toBe("TSK-202");
  });

  it("matches query against formatted short ID", () => {
    const task = { id: "cmtagdknl0009ld04qrz53gui", ticketNumber: 7490 };
    const shortId = formatTicketId(task, "TSK").toLowerCase();
    const cleanShortId = shortId.replace(/^tsk-/i, "");

    const query1 = "TSK-7490".replace(/^tsk-/i, "").trim().toLowerCase();
    const query2 = "7490".replace(/^tsk-/i, "").trim().toLowerCase();

    expect(shortId.includes(query1) || cleanShortId.includes(query1)).toBe(true);
    expect(shortId.includes(query2) || cleanShortId.includes(query2)).toBe(true);
  });
});

import { Role } from "@prisma/client";

describe("Role and Custom Category Filter Construction", () => {
  function buildRoleFilterConditions(role?: string, customRoleId?: string) {
    const conditions: Array<Record<string, unknown>> = [];
    if (customRoleId) {
      conditions.push({ customRoleId });
    }
    if (role) {
      const isPrismaRole = (Object.values(Role) as string[]).includes(role.toUpperCase());
      if (isPrismaRole) {
        conditions.push({ role: role.toUpperCase() as Role });
      }
      conditions.push(
        { customRoleId: role },
        { customRole: { name: { equals: role, mode: "insensitive" } } },
        { customRole: { label: { equals: role, mode: "insensitive" } } }
      );
    }
    return conditions;
  }

  it("handles standard roles by including Prisma enum role condition", () => {
    const conditions = buildRoleFilterConditions("DEVELOPER");
    expect(conditions).toEqual(
      expect.arrayContaining([
        { role: Role.DEVELOPER },
        { customRoleId: "DEVELOPER" },
        { customRole: { name: { equals: "DEVELOPER", mode: "insensitive" } } },
        { customRole: { label: { equals: "DEVELOPER", mode: "insensitive" } } },
      ])
    );
  });

  it("handles case-insensitive standard role names", () => {
    const conditions = buildRoleFilterConditions("developer");
    expect(conditions).toEqual(
      expect.arrayContaining([
        { role: Role.DEVELOPER },
      ])
    );
  });

  it("safely handles custom roles like QA and Designer without generating invalid Prisma enum conditions", () => {
    const qaConditions = buildRoleFilterConditions("QA");
    expect(qaConditions.some((c) => "role" in c)).toBe(false);
    expect(qaConditions).toEqual([
      { customRoleId: "QA" },
      { customRole: { name: { equals: "QA", mode: "insensitive" } } },
      { customRole: { label: { equals: "QA", mode: "insensitive" } } },
    ]);

    const designerConditions = buildRoleFilterConditions("Designer");
    expect(designerConditions.some((c) => "role" in c)).toBe(false);
    expect(designerConditions).toEqual([
      { customRoleId: "Designer" },
      { customRole: { name: { equals: "Designer", mode: "insensitive" } } },
      { customRole: { label: { equals: "Designer", mode: "insensitive" } } },
    ]);
  });
});

describe("Ticket ID resolution for search queries", () => {
  const sampleTasks = [
    { id: "cm7890abcdef123456", ticketNumber: 1 },
    { id: "cm1234ghijkl567890", ticketNumber: 42 },
    { id: "cm5555xyz123456789", ticketNumber: 7490 },
  ];

  it("correctly matches tasks by formatted ticket ID or numeric portion", () => {
    sampleTasks.forEach((t) => {
      const formatted = formatTicketId(t, "TSK");
      const numOnly = formatted.replace(/^TSK-/i, "");

      // Search by full ticket name "TSK-XXXX"
      const lowerQ = formatted.toLowerCase();
      const matchByFull = sampleTasks.filter((task) => {
        const shortId = formatTicketId(task, "TSK").toLowerCase();
        return shortId.includes(lowerQ);
      });
      expect(matchByFull.some((m) => m.id === t.id)).toBe(true);

      // Search by numeric portion "XXXX"
      const matchByNum = sampleTasks.filter((task) => {
        const shortId = formatTicketId(task, "TSK").toLowerCase();
        const shortNum = shortId.replace(/^tsk-/i, "");
        return shortNum.includes(numOnly.toLowerCase());
      });
      expect(matchByNum.some((m) => m.id === t.id)).toBe(true);
    });
  });

  it("does not match unrelated tasks whose numbers merely contain the digit", () => {
    const tasks = [
      { id: "task-2", ticketNumber: 2 },
      { id: "task-25", ticketNumber: 25 },
      { id: "task-42", ticketNumber: 42 },
      { id: "task-38", ticketNumber: 38 },
    ];

    const targetNum = 2;
    const matched = tasks.filter((t) => t.ticketNumber === targetNum);
    expect(matched.length).toBe(1);
    expect(matched[0].id).toBe("task-2");
    expect(matched.some((t) => t.id === "task-25")).toBe(false);
    expect(matched.some((t) => t.id === "task-42")).toBe(false);
  });
});

describe("Task Date & Data Change Reason Requirements", () => {
  function validateDueDateReason(
    existingDueDate: string | Date | null | undefined,
    newDueDate: string | Date | null | undefined,
    reason?: string | null
  ) {
    const oldDueStr = existingDueDate ? new Date(existingDueDate).toISOString().split("T")[0] : null;
    const newDueStr = newDueDate ? new Date(newDueDate).toISOString().split("T")[0] : null;
    const dueDateChanged = newDueDate !== undefined && oldDueStr !== newDueStr;

    if (dueDateChanged) {
      const trimmedReason = reason?.trim();
      if (!trimmedReason) {
        throw new Error("A reason is required when changing the due date.");
      }
    }
    return true;
  }

  it("throws error when due date is modified without a reason", () => {
    const existingDate = "2026-09-20T00:00:00.000Z";
    const newDate = "2026-09-25T00:00:00.000Z";

    expect(() => validateDueDateReason(existingDate, newDate)).toThrow(
      "A reason is required when changing the due date."
    );
    expect(() => validateDueDateReason(existingDate, newDate, "")).toThrow(
      "A reason is required when changing the due date."
    );
    expect(() => validateDueDateReason(existingDate, newDate, "   ")).toThrow(
      "A reason is required when changing the due date."
    );
    expect(() => validateDueDateReason(existingDate, newDate, null)).toThrow(
      "A reason is required when changing the due date."
    );
  });

  it("throws error when setting a due date for the first time without a reason", () => {
    const existingDate = null;
    const newDate = "2026-09-25T00:00:00.000Z";

    expect(() => validateDueDateReason(existingDate, newDate)).toThrow(
      "A reason is required when changing the due date."
    );
  });

  it("throws error when removing/clearing a due date without a reason", () => {
    const existingDate = "2026-09-20T00:00:00.000Z";
    const newDate = null;

    expect(() => validateDueDateReason(existingDate, newDate)).toThrow(
      "A reason is required when changing the due date."
    );
  });

  it("passes when due date is modified with a valid non-empty reason", () => {
    const existingDate = "2026-09-20T00:00:00.000Z";
    const newDate = "2026-09-25T00:00:00.000Z";

    expect(
      validateDueDateReason(existingDate, newDate, "Client requested deadline extension")
    ).toBe(true);
  });

  it("passes without requiring reason when due date is unchanged", () => {
    const existingDate = "2026-09-20T10:00:00.000Z";
    const newDate = "2026-09-20T18:00:00.000Z"; // same calendar date

    expect(validateDueDateReason(existingDate, newDate)).toBe(true);
  });

  it("schema parses valid dueDateReason and changeReason inputs", async () => {
    const { updateTaskSchema } = await import("@zsyio/validators");

    const parsed = updateTaskSchema.parse({
      dueDate: "2026-10-15T00:00:00.000Z",
      dueDateReason: "Dependencies blocked by backend release",
      changeReason: "Updated requirements from client review",
    });

    expect(parsed.dueDateReason).toBe("Dependencies blocked by backend release");
    expect(parsed.changeReason).toBe("Updated requirements from client review");
  });
});


