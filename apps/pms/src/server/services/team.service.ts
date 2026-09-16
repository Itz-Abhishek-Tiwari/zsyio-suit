import { assertCan } from "@zsyio/auth/permissions";
import { teamRepository } from "@/server/repositories/team.repository";
import type { CreateTeamInput, UpdateTeamInput } from "@zsyio/validators";

export interface AuthUserSession {
  id?: string;
  role?: string;
  permissions?: string[] | null;
}

export const teamService = {
  async list(user: AuthUserSession) {
    assertCan(user.role, "team:view", user.permissions);
    return teamRepository.list();
  },

  async findById(user: AuthUserSession, id: string) {
    assertCan(user.role, "team:view", user.permissions);
    return teamRepository.findById(id);
  },

  async create(user: AuthUserSession, data: CreateTeamInput) {
    assertCan(user.role, "team:manage", user.permissions);
    return teamRepository.create(data);
  },

  async update(user: AuthUserSession, id: string, data: UpdateTeamInput) {
    assertCan(user.role, "team:manage", user.permissions);
    return teamRepository.update(id, data);
  },

  async delete(user: AuthUserSession, id: string) {
    assertCan(user.role, "team:manage", user.permissions);
    return teamRepository.delete(id);
  },
};
