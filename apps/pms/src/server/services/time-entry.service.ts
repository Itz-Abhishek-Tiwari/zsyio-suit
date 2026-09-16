import { can, ForbiddenError, NotFoundError } from "@zsyio/auth/permissions";
import { timeEntryRepository } from "@/server/repositories/time-entry.repository";
import type { CreateTimeEntryInput, UpdateTimeEntryInput, StopTimeEntryInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export const timeEntryService = {
  async getActive(user: Session["user"]) {
    return timeEntryRepository.getActive(user.id);
  },

  async getByTaskId(user: Session["user"], taskId: string) {
    if (!can(user.role, "task:view:all", user.permissions) && !can(user.role, "task:view:own", user.permissions)) {
      throw new ForbiddenError("You do not have permission to view task time entries.");
    }
    return timeEntryRepository.getByTaskId(taskId);
  },

  async create(user: Session["user"], input: CreateTimeEntryInput) {
    if (!can(user.role, "task:view:all", user.permissions) && !can(user.role, "task:view:own", user.permissions)) {
      throw new ForbiddenError("You do not have permission to log time on this task.");
    }
    return timeEntryRepository.create({
      ...input,
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
