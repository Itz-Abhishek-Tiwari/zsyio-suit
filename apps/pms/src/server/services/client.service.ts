import { assertCan, can, BadRequestError, ForbiddenError } from "@zsyio/auth/permissions";
import { clientRepository, type ClientListFilters } from "@/server/repositories/client.repository";
import type { CreateClientInput, UpdateClientInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export const clientService = {
  async listLite() {
    return clientRepository.listLite();
  },

  async list(user: Session["user"], filters: Omit<ClientListFilters, "includeDeleted"> & { includeDeleted?: boolean }) {
    assertCan(user.role, "client:view", user.permissions);
    const canSeeDeleted = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    return clientRepository.list({
      ...filters,
      includeDeleted: filters.includeDeleted && canSeeDeleted ? true : false,
    });
  },

  async getById(user: Session["user"], id: string) {
    assertCan(user.role, "client:view", user.permissions);
    return clientRepository.findById(id);
  },

  async create(user: Session["user"], input: CreateClientInput) {
    assertCan(user.role, "client:create", user.permissions);
    return clientRepository.create(input);
  },

  async update(user: Session["user"], id: string, input: UpdateClientInput) {
    const keys = Object.keys(input) as (keyof UpdateClientInput)[];
    const isNotesOnly = keys.length === 1 && keys[0] === "notes";

    if (isNotesOnly) {
      if (!can(user.role, "client:edit", user.permissions) && !can(user.role, "note:edit", user.permissions)) {
        throw new ForbiddenError("You do not have permission to edit client documentation.");
      }
    } else {
      assertCan(user.role, "client:edit", user.permissions);
    }

    if (input.status === "INTAKE") {
      const existing = await clientRepository.findById(id);
      if (existing && existing.status !== "INTAKE") {
        throw new BadRequestError("Clients cannot be moved back to the Intake stage once onboarding has commenced.");
      }
    }
    return clientRepository.update(id, input);
  },

  async softDelete(user: Session["user"], id: string) {
    assertCan(user.role, "client:delete", user.permissions);
    return clientRepository.softDelete(id);
  },
};
