import { assertCan, can } from "@zsyio/auth/permissions";
import { productRepository } from "@/server/repositories/product.repository";
import type { CreateProductInput, UpdateProductInput } from "@zsyio/validators";
import type { Session } from "next-auth";

export const productService = {
  async list(user: Session["user"], clientId?: string) {
    const canAccess =
      can(user.role, "product:view", user.permissions) ||
      can(user.role, "client:view", user.permissions) ||
      can(user.role, "task:create", user.permissions) ||
      can(user.role, "task:create:any", user.permissions) ||
      can(user.role, "task:create:support", user.permissions) ||
      can(user.role, "task:view:all", user.permissions) ||
      can(user.role, "task:view:own", user.permissions);

    if (!canAccess) {
      assertCan(user.role, "product:view", user.permissions);
    }
    return productRepository.list(clientId);
  },

  async listByClient(user: Session["user"], clientId: string) {
    return this.list(user, clientId);
  },

  async getById(user: Session["user"], id: string) {
    const canAccess =
      can(user.role, "product:view", user.permissions) ||
      can(user.role, "client:view", user.permissions) ||
      can(user.role, "task:create", user.permissions) ||
      can(user.role, "task:create:any", user.permissions) ||
      can(user.role, "task:create:support", user.permissions) ||
      can(user.role, "task:view:all", user.permissions) ||
      can(user.role, "task:view:own", user.permissions);

    if (!canAccess) {
      assertCan(user.role, "product:view", user.permissions);
    }
    return productRepository.findById(id);
  },

  async create(user: Session["user"], input: CreateProductInput) {
    assertCan(user.role, "product:create", user.permissions);
    return productRepository.create(input);
  },

  async update(user: Session["user"], id: string, input: UpdateProductInput) {
    assertCan(user.role, "product:edit", user.permissions);
    return productRepository.update(id, input);
  },

  async softDelete(user: Session["user"], id: string) {
    assertCan(user.role, "product:delete", user.permissions);
    return productRepository.softDelete(id);
  },
};
