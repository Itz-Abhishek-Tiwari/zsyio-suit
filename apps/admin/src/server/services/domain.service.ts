import { assertCan } from "@zsyio/auth/permissions";
import { domainRepository } from "@/server/repositories/domain.repository";
import type { CreateDomainInput, UpdateDomainInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export type AuthUser = NonNullable<Session["user"]>;

export const domainService = {
  async list() {
    return domainRepository.list();
  },

  async getActive() {
    return domainRepository.getActiveDomains();
  },

  async create(user: AuthUser, input: CreateDomainInput) {
    assertCan(user.role, "user:manage", user.permissions);
    return domainRepository.create(input);
  },

  async update(user: AuthUser, id: string, input: UpdateDomainInput) {
    assertCan(user.role, "user:manage", user.permissions);
    return domainRepository.update(id, input);
  },

  async setPrimary(user: AuthUser, id: string) {
    assertCan(user.role, "user:manage", user.permissions);
    return domainRepository.setPrimary(id);
  },

  async delete(user: AuthUser, id: string) {
    assertCan(user.role, "user:manage", user.permissions);
    return domainRepository.delete(id);
  },
};
