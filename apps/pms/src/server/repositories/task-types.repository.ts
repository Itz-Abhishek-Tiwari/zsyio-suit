import { prisma } from "@zsyio/database";

export const taskTypesRepository = {
  async list() {
    return prisma.customTaskType.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(data: { name: string; icon?: string; color?: string }) {
    return prisma.customTaskType.create({
      data: {
        name: data.name.trim(),
        icon: data.icon || "sparkles",
        color: data.color || "purple",
      },
    });
  },
};
