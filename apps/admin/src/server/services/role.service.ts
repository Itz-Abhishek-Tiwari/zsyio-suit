import { assertCan } from "@zsyio/auth/permissions";
import { roleRepository } from "@/server/repositories/role.repository";
import type { CreateRoleInput, UpdateRoleInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export type AuthUser = NonNullable<Session["user"]>;

export const roleService = {
  async list() {
    return roleRepository.list();
  },

  async getById(id: string) {
    return roleRepository.findById(id);
  },

  async create(user: AuthUser, input: CreateRoleInput) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.create(input);
  },

  async update(user: AuthUser, id: string, input: UpdateRoleInput) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.update(id, input);
  },

  async delete(user: AuthUser, id: string) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.delete(id);
  },

  async resetDefaults(user: AuthUser) {
    assertCan(user.role, "role:manage", user.permissions);
    return roleRepository.resetDefaults();
  },
};
