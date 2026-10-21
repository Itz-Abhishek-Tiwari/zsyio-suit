import { can, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";
import { taskRepository } from "@/server/repositories/task.repository";
import { isOwner } from "@/lib/task-access";
import { timeEntryRepository } from "@/server/repositories/time-entry.repository";
import type { CreateTimeEntryInput, UpdateTimeEntryInput, StopTimeEntryInput } from "@zsyio/validators";
import type { Session } from "next-auth";

async function assertTaskAccess(user: Session["user"], taskId: string) {
  const task = await taskRepository.findOwnershipInfo(taskId);
  if (!task) throw new NotFoundError("Task not found.");
  if (!can(user.role, "task:view:all", user.permissions) && !isOwner(user.id, task)) {
    throw new ForbiddenError("You can only access time entries on tasks you're assigned to.");
  }
  return task;
}

export const timeEntryService = {
  async getActive(user: Session["user"]) {
    return timeEntryRepository.getActive(user.id);
  },

  async getByTaskId(user: Session["user"], taskId: string) {
    if (!can(user.role, "task:view:all", user.permissions) && !can(user.role, "task:view:own", user.permissions)) {
      throw new ForbiddenError("You do not have permission to view task time entries.");
    }
    const task = await assertTaskAccess(user, taskId);
    return timeEntryRepository.getByTaskId(task.id);
  },

  async create(user: Session["user"], input: CreateTimeEntryInput) {
    if (!can(user.role, "task:view:all", user.permissions) && !can(user.role, "task:view:own", user.permissions)) {
      throw new ForbiddenError("You do not have permission to log time on this task.");
    }
    const task = await assertTaskAccess(user, input.taskId);
    return timeEntryRepository.create({
      ...input,
      taskId: task.id,
      userId: user.id,
    });
  },

  async stop(user: Session["user"], id: string, input: StopTimeEntryInput) {
    const existing = await timeEntryRepository.getById(id);
    if (!existing) {
      throw new NotFoundError("Time entry not found.");
    }

    const isOwner = existing.userId === user.id;
    const isManager = can(user.role, "task:edit:any", user.permissions);
    if (!isOwner && !isManager) {
      throw new ForbiddenError("You can only stop your own timer.");
    }

    return timeEntryRepository.stop(id, input);
  },

  async update(user: Session["user"], id: string, input: UpdateTimeEntryInput) {
    const existing = await timeEntryRepository.getById(id);
    if (!existing) {
      throw new NotFoundError("Time entry not found.");
    }

    const isOwner = existing.userId === user.id;
    const isManager = can(user.role, "task:edit:any", user.permissions);
    if (!isOwner && !isManager) {
      throw new ForbiddenError("You can only modify your own time entries.");
    }

    return timeEntryRepository.update(id, input);
  },

  async delete(user: Session["user"], id: string) {
    const existing = await timeEntryRepository.getById(id);
    if (!existing) {
      throw new NotFoundError("Time entry not found.");
    }

    const isOwner = existing.userId === user.id;
    const isManager = can(user.role, "task:edit:any", user.permissions);
    if (!isOwner && !isManager) {
      throw new ForbiddenError("You can only delete your own time entries.");
    }

    return timeEntryRepository.delete(id);
  },
};
