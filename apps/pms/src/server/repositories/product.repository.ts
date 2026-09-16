import { prisma } from "@zsyio/database";
import type { CreateProductInput, UpdateProductInput } from "@zsyio/validators";

export const productRepository = {
  async list(clientId?: string, includeDeleted = false) {
    return prisma.product.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        client: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async listByClient(clientId: string, includeDeleted = false) {
    return this.list(clientId, includeDeleted);
  },

  async findById(id: string, includeDeleted = false) {
    return prisma.product.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: { client: true },
      relationLoadStrategy: "join",
    });
  },

  async create(data: CreateProductInput) {
    return prisma.product.create({ data });
  },

  async update(id: string, data: UpdateProductInput) {
    return prisma.product.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    const now = new Date();
    return prisma.$transaction(
      async (tx) => {
        await tx.product.update({ where: { id }, data: { deletedAt: now } });
        await tx.task.updateMany({ where: { productId: id }, data: { deletedAt: now } });
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },
};
