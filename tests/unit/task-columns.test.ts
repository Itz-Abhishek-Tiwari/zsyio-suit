import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEFAULT_TASK_COLUMNS,
  STANDARD_STATUS_KEYS,
  taskColumnsRepository,
} from "@/server/repositories/task-columns.repository";
import { prisma } from "@zsyio/database";

vi.mock("@zsyio/database", () => ({
  prisma: {
    customKanbanColumn: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

describe("taskColumnsRepository & Column Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Constants & Default Columns", () => {
    it("defines the 7 canonical standard columns in standard sequence", () => {
      expect(DEFAULT_TASK_COLUMNS).toHaveLength(7);
      const keys = DEFAULT_TASK_COLUMNS.map((c) => c.statusKey);
      expect(keys).toEqual([
        "BACKLOG",
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "QA",
        "BLOCKED",
        "DONE",
      ]);
    });

    it("identifies standard status keys correctly", () => {
      expect(STANDARD_STATUS_KEYS.has("BACKLOG")).toBe(true);
      expect(STANDARD_STATUS_KEYS.has("QA")).toBe(true);
      expect(STANDARD_STATUS_KEYS.has("CUSTOM_UAT")).toBe(false);
    });
  });

  describe("list()", () => {
    it("returns standard columns sorted by order if DB is empty", async () => {
      vi.mocked(prisma.customKanbanColumn.findMany).mockResolvedValueOnce([]);

      const columns = await taskColumnsRepository.list();
      expect(columns).toHaveLength(7);
      expect(columns.map((c) => c.statusKey)).toEqual([
        "BACKLOG",
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "QA",
        "BLOCKED",
        "DONE",
      ]);
      expect(columns.every((c) => c.isCustom === false)).toBe(true);
    });

    it("merges persisted DB columns with custom columns and respects DB ordering", async () => {
      const now = new Date();
      vi.mocked(prisma.customKanbanColumn.findMany).mockResolvedValueOnce([
        {
          id: "col-1",
          statusKey: "BACKLOG",
          label: "Backlog",
          icon: "BACKLOG",
          color: "slate",
          order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "col-2",
          statusKey: "QA",
          label: "QA",
          icon: "QA",
          color: "purple",
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "col-3",
          statusKey: "CUSTOM_UAT",
          label: "UAT",
          icon: "flask",
          color: "purple",
          order: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "col-4",
          statusKey: "TODO",
          label: "To Do",
          icon: "TODO",
          color: "blue",
          order: 3,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const columns = await taskColumnsRepository.list();
      expect(columns).toHaveLength(8); // 7 standard (some from DB, some missing) + 1 custom
      expect(columns[0].statusKey).toBe("BACKLOG");
      expect(columns[1].statusKey).toBe("QA");
      expect(columns[2].statusKey).toBe("CUSTOM_UAT");
      expect(columns[2].isCustom).toBe(true);
      expect(columns[3].statusKey).toBe("TODO");
    });
  });

  describe("reorder()", () => {
    it("upserts column orders in transaction and returns updated columns", async () => {
      const now = new Date();
      vi.mocked(prisma.customKanbanColumn.upsert).mockResolvedValue({
        id: "mock-id",
        statusKey: "QA",
        label: "QA",
        icon: "QA",
        color: "purple",
        order: 0,
        createdAt: now,
        updatedAt: now,
      });

      vi.mocked(prisma.customKanbanColumn.findMany).mockResolvedValueOnce([
        {
          id: "col-1",
          statusKey: "QA",
          label: "QA",
          icon: "QA",
          color: "purple",
          order: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "col-2",
          statusKey: "BACKLOG",
          label: "Backlog",
          icon: "BACKLOG",
          color: "slate",
          order: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const updated = await taskColumnsRepository.reorder([
        "QA",
        "BACKLOG",
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "BLOCKED",
        "DONE",
      ]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(updated[0].statusKey).toBe("QA");
      expect(updated[1].statusKey).toBe("BACKLOG");
    });
  });

  describe("delete() & deleteByStatusKey() protection", () => {
    it("throws an error when attempting to delete a default standard column", async () => {
      vi.mocked(prisma.customKanbanColumn.findUnique).mockResolvedValueOnce({
        id: "std-backlog",
        statusKey: "BACKLOG",
        label: "Backlog",
        icon: "BACKLOG",
        color: "slate",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(taskColumnsRepository.delete("std-backlog")).rejects.toThrow(
        "Default workspace columns cannot be deleted."
      );

      await expect(taskColumnsRepository.deleteByStatusKey("QA")).rejects.toThrow(
        "Default workspace columns cannot be deleted."
      );
    });

    it("allows deleting custom columns", async () => {
      const now = new Date();
      vi.mocked(prisma.customKanbanColumn.findUnique).mockResolvedValueOnce({
        id: "custom-1",
        statusKey: "CUSTOM_UAT",
        label: "UAT",
        icon: "flask",
        color: "purple",
        order: 5,
        createdAt: now,
        updatedAt: now,
      });
      vi.mocked(prisma.customKanbanColumn.delete).mockResolvedValueOnce({
        id: "custom-1",
        statusKey: "CUSTOM_UAT",
        label: "UAT",
        icon: "flask",
        color: "purple",
        order: 5,
        createdAt: now,
        updatedAt: now,
      });

      const deleted = await taskColumnsRepository.delete("custom-1");
      expect(deleted.id).toBe("custom-1");
    });
  });
});
