import { describe, it, expect, vi, beforeEach } from "vitest";
import { testCaseService } from "@/server/services/test-case.service";
import { testCaseRepository } from "@/server/repositories/test-case.repository";
import { prisma } from "@zsyio/database";

vi.mock("@zsyio/database", () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/repositories/test-case.repository", () => ({
  testCaseRepository: {
    listByTaskId: vi.fn(),
    findById: vi.fn(),
    countByTaskId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteByTaskId: vi.fn(),
    createMany: vi.fn(),
  },
}));

const mockDevUser = {
  id: "user-1",
  role: "DEVELOPER",
  mustChangePassword: false,
  email: "dev@zsyio.de",
  name: "Dev User",
  permissions: ["task:edit:any"],
};

const mockAdminUser = {
  id: "user-1",
  role: "ADMIN",
  mustChangePassword: false,
  email: "admin@zsyio.de",
  name: "Admin User",
  permissions: [],
};

describe("testCaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists test cases for a valid task", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce({
      id: "task-1",
      createdById: "user-1",
      assignedToId: "user-1",
      assignees: [],
      deletedAt: null,
    } as never);

    vi.mocked(testCaseRepository.listByTaskId).mockResolvedValueOnce([
      {
        id: "tc-1",
        taskId: "task-1",
        title: "Test login flow",
        status: "PENDING",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ]);

    const result = await testCaseService.listOrSeed(mockDevUser, "task-1");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test login flow");
  });

  it("rejects listing test cases if user is not assigned and lacks task:view:all", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce({
      id: "task-1",
      createdById: "other-user",
      assignedToId: "other-user",
      assignees: [],
      deletedAt: null,
    } as never);

    await expect(
      testCaseService.listOrSeed(mockDevUser, "task-1")
    ).rejects.toThrow("You can only view test cases for tasks you're assigned to.");
  });

  it("rejects creating test cases if task not found", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null);

    await expect(
      testCaseService.create(mockAdminUser, "missing-task", {
        title: "Test missing",
        status: "PENDING",
      })
    ).rejects.toThrow("Task not found.");
  });

  it("rejects update if test case does not belong to specified task", async () => {
    vi.mocked(testCaseRepository.findById).mockResolvedValueOnce({
      id: "tc-1",
      taskId: "task-OTHER",
    } as never);

    await expect(
      testCaseService.update(mockAdminUser, "task-1", "tc-1", {
        title: "Tampered test case",
      })
    ).rejects.toThrow("Test case not found for the specified task.");
  });
});
