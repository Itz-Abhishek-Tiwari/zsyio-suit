import { prisma } from "@zsyio/database";
import { testCaseRepository } from "@/server/repositories/test-case.repository";
import { DEFAULT_TICKET_TEST_CASES } from "@/lib/test-sheet-defaults";
import { generateGeminiTestCases } from "@/lib/ai/gemini-testcase-helper";
import { can, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";
import { isOwner, assertActingUserId } from "@/lib/task-access";
import type { Session } from "next-auth";
import type { CreateTestCaseInput, UpdateTestCaseInput } from "@zsyio/validators";

async function resolveTaskAndCheckEditPermission(
  userId: string,
  userRole: string,
  userPermissions: string[] | null | undefined,
  taskId: string,
  actionDescription = "manage test cases for this task"
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      createdById: true,
      assignedToId: true,
      assignees: { select: { userId: true } },
      assignedTeam: { select: { members: { select: { userId: true } } } },
      teams: { select: { team: { select: { members: { select: { userId: true } } } } } },
      deletedAt: true,
      title: true,
      description: true,
      type: true,
      priority: true,
    },
  });

  if (!task || task.deletedAt) {
    throw new NotFoundError("Task not found.");
  }

  const owns = isOwner(userId, task);

  const canEdit =
    can(userRole, "task:test_case:manage", userPermissions) ||
    can(userRole, "task:edit:any", userPermissions) ||
    (can(userRole, "task:edit:own", userPermissions) && owns);

  if (!canEdit) {
    throw new ForbiddenError(`You do not have permission to ${actionDescription}.`);
  }

  return task;
}

export const testCaseService = {
  async listOrSeed(user: Session["user"], taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        createdById: true,
        assignedToId: true,
        assignees: { select: { userId: true } },
        assignedTeam: { select: { members: { select: { userId: true } } } },
        teams: { select: { team: { select: { members: { select: { userId: true } } } } } },
        deletedAt: true,
      },
    });
    if (!task || task.deletedAt) {
      throw new NotFoundError("Task not found.");
    }

    const owns = isOwner(user?.id, task);

    if (user && !can(user.role, "task:view:all", user.permissions) && !owns) {
      throw new ForbiddenError("You can only view test cases for tasks you're assigned to.");
    }

    return testCaseRepository.listByTaskId(taskId);
  },

  async create(user: Session["user"], taskId: string, input: CreateTestCaseInput) {
    await resolveTaskAndCheckEditPermission(
      user.id,
      user.role,
      user.permissions,
      taskId,
      "add test cases to this task"
    );

    const count = await testCaseRepository.countByTaskId(taskId);

    const isTested = input.status && input.status !== "PENDING";
    const testedById = isTested ? input.testedById || user.id : input.testedById;
    const testedAt = isTested ? new Date() : null;

    const created = await testCaseRepository.create({
      taskId,
      title: input.title.trim(),
      description: input.description,
      steps: input.steps,
      expectedResult: input.expectedResult,
      status: input.status || "PENDING",
      notes: input.notes,
      testedById,
      testedAt,
      order: count,
    });

    try {
      const validActorId = assertActingUserId(user.id);
      await prisma.activityLog.create({
        data: {
          taskId,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "testCase",
          newValue: `Added QA test: "${created.title}"`,
        },
      });
    } catch (e) {
      console.error("Failed to log test case create activity:", e);
    }

    return created;
  },

  async update(user: Session["user"], taskId: string, testCaseId: string, input: UpdateTestCaseInput) {
    const existing = await testCaseRepository.findById(testCaseId);
    if (!existing || existing.taskId !== taskId) {
      throw new NotFoundError("Test case not found for the specified task.");
    }

    await resolveTaskAndCheckEditPermission(
      user.id,
      user.role,
      user.permissions,
      taskId,
      "update test cases on this task"
    );

    let testedById = input.testedById !== undefined ? input.testedById : existing.testedById;
    let testedAt = existing.testedAt;

    if (input.status && input.status !== "PENDING") {
      if (!testedById) {
        testedById = user.id;
      }
      testedAt = new Date();
    } else if (input.status === "PENDING") {
      testedById = null;
      testedAt = null;
    }

    const updated = await testCaseRepository.update(testCaseId, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.steps !== undefined ? { steps: input.steps } : {}),
      ...(input.expectedResult !== undefined ? { expectedResult: input.expectedResult } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      testedById,
      testedAt,
    });

    if (input.status && input.status !== existing.status) {
      try {
        const validActorId = assertActingUserId(user.id);
        await prisma.activityLog.create({
          data: {
            taskId,
            actorId: validActorId,
            action: "FIELD_EDITED",
            field: "testCase",
            oldValue: `${existing.title}: ${existing.status}`,
            newValue: `${existing.title}: ${input.status}`,
          },
        });
      } catch (e) {
        console.error("Failed to log test case update activity:", e);
      }
    }

    return updated;
  },

  async delete(user: Session["user"], taskId: string, testCaseId: string) {
    const existing = await testCaseRepository.findById(testCaseId);
    if (!existing || existing.taskId !== taskId) {
      throw new NotFoundError("Test case not found for the specified task.");
    }

    await resolveTaskAndCheckEditPermission(
      user.id,
      user.role,
      user.permissions,
      taskId,
      "delete test cases from this task"
    );

    await testCaseRepository.delete(testCaseId);

    try {
      const validActorId = assertActingUserId(user.id);
      await prisma.activityLog.create({
        data: {
          taskId,
          actorId: validActorId,
          action: "FIELD_EDITED",
          field: "testCase",
          oldValue: `Deleted QA test: "${existing.title}"`,
        },
      });
    } catch (e) {
      console.error("Failed to log test case delete activity:", e);
    }

    return { success: true };
  },

  async reset(user: Session["user"], taskId: string) {
    await resolveTaskAndCheckEditPermission(
      user.id,
      user.role,
      user.permissions,
      taskId,
      "reset test cases on this task"
    );

    await testCaseRepository.deleteByTaskId(taskId);

    await testCaseRepository.createMany(
      DEFAULT_TICKET_TEST_CASES.map((tc) => ({
        taskId,
        title: tc.title,
        description: tc.description,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        status: "PENDING",
        order: tc.order,
      }))
    );

    return testCaseRepository.listByTaskId(taskId);
  },

  async generateAi(user: Session["user"], taskId: string) {
    const task = await resolveTaskAndCheckEditPermission(
      user.id,
      user.role,
      user.permissions,
      taskId,
      "generate test cases for this task"
    );

    const { testCases: aiCases } = await generateGeminiTestCases({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
    });

    if (aiCases.length === 0) {
      throw new Error("AI generation produced no test cases. Please ensure Gemini API key is configured or add cases manually.");
    }

    const currentCount = await testCaseRepository.countByTaskId(taskId);

    await testCaseRepository.createMany(
      aiCases.map((tc, idx) => ({
        taskId,
        title: tc.title,
        description: tc.description,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        status: "PENDING",
        order: currentCount + idx,
      }))
    );

    return testCaseRepository.listByTaskId(taskId);
  },
};
