import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import type { Prisma } from "@prisma/client";

export const testCaseRepository = {
  async listByTaskId(taskId: string) {
    return prisma.testCase.findMany({
      where: { taskId },
      include: {
        testedBy: { select: SAFE_USER_SELECT },
      },
      orderBy: { order: "asc" },
      relationLoadStrategy: "join",
    });
  },

  async findById(id: string) {
    return prisma.testCase.findUnique({
      where: { id },
      include: {
        testedBy: { select: SAFE_USER_SELECT },
      },
      relationLoadStrategy: "join",
    });
  },

  async countByTaskId(taskId: string) {
    return prisma.testCase.count({ where: { taskId } });
  },

  async create(data: Prisma.TestCaseUncheckedCreateInput) {
    return prisma.testCase.create({
      data,
      include: {
        testedBy: { select: SAFE_USER_SELECT },
      },
      relationLoadStrategy: "join",
    });
  },

  async update(id: string, data: Prisma.TestCaseUncheckedUpdateInput) {
    return prisma.testCase.update({
      where: { id },
      data,
      include: {
        testedBy: { select: SAFE_USER_SELECT },
      },
      relationLoadStrategy: "join",
    });
  },

  async delete(id: string) {
    return prisma.testCase.delete({
      where: { id },
    });
  },

  async deleteByTaskId(taskId: string) {
    return prisma.testCase.deleteMany({
      where: { taskId },
    });
  },

  async createMany(data: Prisma.TestCaseCreateManyInput[]) {
    return prisma.testCase.createMany({ data });
  },
};
