import { prisma } from "@zsyio/database";
import { SAFE_USER_SELECT } from "@/server/repositories/shared";
import type { CreateUserInput, AcceptInvitationInput } from "@zsyio/validators";
import { NotFoundError, BadRequestError, ConflictError, GoneError } from "@zsyio/auth/permissions";
import { hashPassword } from "@zsyio/auth/password";
import crypto from "crypto";

export const userInvitations = {
  async findByInvitationToken(token: string) {
    if (!token || typeof token !== "string") return null;
    return prisma.user.findUnique({
      where: { invitationToken: token },
      select: SAFE_USER_SELECT,
    });
  },

  async create(data: CreateUserInput) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictError("A user with this email address already exists.");
    }

    let passwordHash: string | null = null;
    if (data.password && data.password.trim()) {
      passwordHash = await hashPassword(data.password);
    }

    let systemRole: "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" = "DEVELOPER";
    let customRoleId: string | null = data.customRoleId ?? null;

    if (data.role && ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(data.role)) {
      systemRole = data.role as "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT";
    } else if (data.role && !customRoleId) {
      const customRole = await prisma.customRole.findUnique({ where: { name: data.role.toUpperCase().trim() } });
      if (customRole) {
        customRoleId = customRole.id;
      }
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitedAt = new Date();

    const createdUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        role: systemRole,
        customRoleId,
        passwordHash,
        active: true,
        mustChangePassword: true,
        invitationStatus: "PENDING",
        invitationToken,
        invitationExpiresAt,
        invitedAt,
      },
      select: SAFE_USER_SELECT,
    });

    return {
      user: createdUser,
      invitationToken,
    };
  },

  async resendInvitation(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        invitationStatus: "PENDING",
        invitationToken,
        invitationExpiresAt,
        invitedAt,
      },
      select: SAFE_USER_SELECT,
    });

    return {
      user: updatedUser,
      invitationToken,
    };
  },

  async acceptInvitation(token: string, data: AcceptInvitationInput) {
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user) {
      throw new NotFoundError("Invalid or expired invitation link.");
    }

    if (user.invitationStatus === "ACCEPTED") {
      throw new BadRequestError("This invitation has already been accepted.");
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new GoneError("This invitation link has expired. Please ask your administrator to resend it.");
    }

    const passwordHash = await hashPassword(data.password);
    const updatedName = data.name && data.name.trim() ? data.name.trim() : user.name;

    return prisma.user.update({
      where: { id: user.id },
      data: {
        name: updatedName,
        passwordHash,
        invitationStatus: "ACCEPTED",
        invitationToken: null,
        active: true,
        mustChangePassword: false,
      },
      select: SAFE_USER_SELECT,
    });
  },

  async rejectInvitation(token: string) {
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user) {
      throw new NotFoundError("Invalid or expired invitation link.");
    }

    if (user.invitationStatus === "ACCEPTED") {
      throw new BadRequestError("This invitation has already been accepted and cannot be declined.");
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        invitationStatus: "REJECTED",
        invitationToken: null,
        active: false,
      },
      select: SAFE_USER_SELECT,
    });
  },
};
