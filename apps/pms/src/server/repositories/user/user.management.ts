import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import type { UpdateUserInput } from "@zsyio/validators";
import { NotFoundError, ForbiddenError, BadRequestError } from "@zsyio/auth/permissions";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { formatSuperAdminUser } from "./user.shared";
import { hashPassword } from "@zsyio/auth/password";

export const userManagement = {
  async update(id: string, data: UpdateUserInput) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(existing)) {
      if (data.active === false) {
        throw new ForbiddenError("The Super Admin account cannot be deactivated.");
      }
      if (data.role !== undefined || data.customRoleId !== undefined) {
        throw new ForbiddenError("The Super Admin role cannot be modified or reassigned.");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.active !== undefined) updateData.active = data.active;
    if (data.customRoleId !== undefined) updateData.customRoleId = data.customRoleId;

    if (data.role !== undefined) {
      if (["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(data.role)) {
        updateData.role = data.role;
        if (data.customRoleId === undefined) {
          updateData.customRoleId = null;
        }
      } else {
        const customRole = await prisma.customRole.findUnique({ where: { name: data.role.toUpperCase().trim() } });
        if (customRole) {
          updateData.customRoleId = customRole.id;
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });
    return formatSuperAdminUser(updated);
  },

  async setPassword(id: string, password: string) {
    const passwordHash = await hashPassword(password);
    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
      select: SAFE_USER_SELECT,
    });
    return formatSuperAdminUser(updated);
  },

  async delete(id: string, fallbackAdminId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(user)) {
      throw new ForbiddenError(
        "The Super Admin account is permanently protected and cannot be deleted."
      );
    }

    let fallbackId = fallbackAdminId;
    if (!fallbackId || fallbackId === id) {
      const admin = await prisma.user.findFirst({
        where: { id: { not: id }, role: "ADMIN", active: true },
        select: { id: true },
      });
      fallbackId = admin?.id;
    }

    if (user.role === "ADMIN" && !fallbackId) {
      throw new BadRequestError(
        "Cannot delete the only active administrator account. Please promote another active administrator first."
      );
    }

    return prisma.$transaction(
      async (tx) => {
        await tx.task.updateMany({
          where: { assignedToId: id },
          data: { assignedToId: null },
        });

        await tx.taskAssignee.deleteMany({ where: { userId: id } });

        if (fallbackId) {
          await tx.task.updateMany({
            where: { createdById: id },
            data: { createdById: fallbackId },
          });
          await tx.note.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.noteFolder.updateMany({
            where: { createdById: id },
            data: { createdById: fallbackId },
          });
          await tx.dashboardNote.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.comment.updateMany({
            where: { authorId: id },
            data: { authorId: fallbackId },
          });
          await tx.activityLog.updateMany({
            where: { actorId: id },
            data: { actorId: fallbackId },
          });
        }

        await tx.user.delete({ where: { id } });

        return { success: true };
      },
      { maxWait: 5000, timeout: 15000 }
    );
  },

  async setResetOtp(userId: string, otpHash: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetOtpHash: otpHash,
        resetOtpExpiresAt: expiresAt,
        resetOtpAttempts: 0,
      },
    });
  },

  async incrementResetOtpAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetOtpAttempts: { increment: 1 },
      },
    });
  },

  async resetPasswordWithOtp(userId: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        resetOtpAttempts: 0,
      },
      select: SAFE_USER_SELECT,
    });
  },

  async clearResetOtp(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        resetOtpAttempts: 0,
      },
    });
  },

  async getProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SAFE_USER_SELECT,
        teamMemberships: {
          select: {
            teamId: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const [assignedTasksCount, completedTasksCount, authoredNotesCount] = await Promise.all([
      prisma.task.count({ where: { assignees: { some: { userId: id } } } }),
      prisma.task.count({ where: { assignees: { some: { userId: id } }, status: "DONE" } }),
      prisma.note.count({ where: { authorId: id } }),
    ]);

    return {
      user: formatSuperAdminUser(user),
      stats: {
        assignedTasksCount,
        completedTasksCount,
        authoredNotesCount,
      },
    };
  },

  async updateProfile(id: string, data: {
    name?: string;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    timeZone?: string | null;
    theme?: string | null;
  }) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("User not found.");
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle ? data.jobTitle.trim() : null;
    if (data.department !== undefined) updateData.department = data.department ? data.department.trim() : null;
    if (data.bio !== undefined) updateData.bio = data.bio ? data.bio.trim() : null;
    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl ? data.avatarUrl.trim() : null;
    if (data.timeZone !== undefined) updateData.timeZone = data.timeZone ? data.timeZone.trim() : null;
    if (data.theme !== undefined) updateData.theme = data.theme;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        ...SAFE_USER_SELECT,
        teamMemberships: {
          select: {
            teamId: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return formatSuperAdminUser(updated);
  },
};
