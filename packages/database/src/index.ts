import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }));

export default prisma;

/**
 * Common safe user projection omitting password hashes and sensitive auth tokens.
 * Use wherever a user relation is included or returned in client-facing APIs.
 */
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  customRoleId: true,
  customRole: {
    select: {
      id: true,
      name: true,
      label: true,
      description: true,
      isSystem: true,
      permissions: true,
      color: true,
      icon: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  active: true,
  mustChangePassword: true,
  theme: true,
  jobTitle: true,
  department: true,
  bio: true,
  phone: true,
  avatarUrl: true,
  timeZone: true,
  invitationStatus: true,
  invitationExpiresAt: true,
  invitedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;
