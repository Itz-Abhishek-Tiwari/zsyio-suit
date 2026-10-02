import { describe, it, expect } from "vitest";
import {
  getTaskDeadlineCategory,
  getTaskVisualHierarchy,
  compareTaskHierarchy,
} from "@/lib/task-hierarchy";
import type { Task } from "@zsyio/types";

describe("task-hierarchy", () => {
  const baseTask: Task = {
    id: "tsk_1",
    productId: "prod_1",
    title: "Test Task",
    description: null,
    status: "TODO",
    priority: "MEDIUM",
    type: "FEATURE",
    dueDate: null,
    blockedReason: null,
    gitBranchSlug: null,
    aiSummary: null,
    assignedToId: null,
    createdById: "usr_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  describe("getTaskDeadlineCategory", () => {
    it("returns NO_DEADLINE when dueDate is missing", () => {
      expect(getTaskDeadlineCategory({ ...baseTask, dueDate: null })).toBe("NO_DEADLINE");
    });

    it("returns NO_DEADLINE when status is DONE even if past due date", () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTaskDeadlineCategory({ ...baseTask, status: "DONE", dueDate: pastDate })).toBe(
        "NO_DEADLINE"
      );
    });

    it("returns OVERDUE when status is not DONE and dueDate is in the past", () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(getTaskDeadlineCategory({ ...baseTask, status: "TODO", dueDate: pastDate })).toBe(
        "OVERDUE"
      );
    });
  });

  describe("getTaskVisualHierarchy", () => {
    it("marks isOverdue as false when status is DONE", () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const visual = getTaskVisualHierarchy({ ...baseTask, status: "DONE", dueDate: pastDate });
      expect(visual.isOverdue).toBe(false);
      expect(visual.deadlineCat).toBe("NO_DEADLINE");
    });

    it("marks isOverdue as true when status is IN_PROGRESS and past due", () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const visual = getTaskVisualHierarchy({
        ...baseTask,
        status: "IN_PROGRESS",
        dueDate: pastDate,
      });
      expect(visual.isOverdue).toBe(true);
      expect(visual.deadlineCat).toBe("OVERDUE");
    });
  });

  describe("compareTaskHierarchy", () => {
    it("places overdue active tasks above completed tasks", () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const activeOverdue = { ...baseTask, id: "task_active", status: "TODO", dueDate: pastDate };
      const doneTask = { ...baseTask, id: "task_done", status: "DONE", dueDate: pastDate };

      expect(compareTaskHierarchy(activeOverdue, doneTask)).toBeLessThan(0);
      expect(compareTaskHierarchy(doneTask, activeOverdue)).toBeGreaterThan(0);
    });
  });
});
