import { assertCan } from "@zsyio/auth/permissions";
import { roleRepository } from "@/server/repositories/role.repository";
import type { CreateRoleInput, UpdateRoleInput } from "@zsyio/validators";

export interface AuthUserSession {
  id?: string;
  role?: string;
  permissions?: string[] | null;
}

export const roleService = {

  async list() {
    return roleRepository.list();
  },

  async findById(id: string) {
    return roleRepository.findById(id);
  },

  async create(user: AuthUserSession, data: CreateRoleInput) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.create(data);
  },

  async update(user: AuthUserSession, id: string, data: UpdateRoleInput) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.update(id, data);
  },

  async delete(user: AuthUserSession, id: string) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.delete(id);
  },

  async resetDefaults(user: AuthUserSession) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.resetDefaults();
  },
};

