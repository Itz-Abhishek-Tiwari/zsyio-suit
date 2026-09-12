import { assertCan, NotFoundError } from "@zsyio/auth/permissions";
import { teamRepository } from "@/server/repositories/team.repository";
import type { CreateTeamInput, UpdateTeamInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export type AuthUser = NonNullable<Session["user"]>;

export const teamService = {
  async list() {
    return teamRepository.list();
  },

  async getById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new NotFoundError("Team not found.");
    }
    return team;
  },

  async create(user: AuthUser, input: CreateTeamInput) {
    assertCan(user.role, "team:manage", user.permissions);
    return teamRepository.create(input);
  },

  async update(user: AuthUser, id: string, input: UpdateTeamInput) {
    assertCan(user.role, "team:manage", user.permissions);
    const existing = await teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Team not found.");
    }
    return teamRepository.update(id, input);
  },

  async delete(user: AuthUser, id: string) {
    assertCan(user.role, "team:manage", user.permissions);
    const existing = await teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Team not found.");
    }
    return teamRepository.delete(id);
  },
};
