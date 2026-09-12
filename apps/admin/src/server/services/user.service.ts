import { assertCan, BadRequestError, NotFoundError, ForbiddenError } from "@zsyio/auth/permissions";
import { userRepository, type UserListFilters } from "@/server/repositories/user.repository";
import type { CreateUserInput, UpdateUserInput } from "@zsyio/validators";
import type { Session } from "next-auth";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { invalidateUserAuth } from "@zsyio/auth/auth-cache";
import { sendUserInvitationEmail, sendPasswordChangedAlertEmail } from "@zsyio/auth/email";
import { isEmailDomainAllowed, getAllowedDomainsNotice, setDynamicAllowedDomains } from "@zsyio/auth/domain-restriction";
import { prisma } from "@zsyio/database";

export type AuthUser = NonNullable<Session["user"]>;

// Note: The Admin repository (user.repository.ts) is a purpose-built CRUD repo
// with team membership support and does not implement the full SharedUserRepository
// interface (no invitation-token queries, no OTP methods). The two shared patterns
// below (create + resendInvitation) are kept inline to avoid requiring a thin
// adapter layer - the logic is identical to @zsyio/auth/user-service.

export const userService = {
  async list(filters?: UserListFilters) {
    return userRepository.list(filters);
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    return user;
  },

  async create(actor: AuthUser, input: CreateUserInput) {
    assertCan(actor.role, "user:manage", actor.permissions);
    const dbDomains = await prisma.allowedDomain.findMany({
      where: { isActive: true },
      select: { domain: true },
    });
    if (dbDomains.length > 0) {
      setDynamicAllowedDomains(dbDomains.map((d) => d.domain));
    }
    if (!isEmailDomainAllowed(input.email)) {
      throw new BadRequestError(
        `Only email addresses from approved corporate domains (${getAllowedDomainsNotice()}) can be invited.`
      );
    }

    const { user: createdUser, invitationToken } = await userRepository.create(input);

    try {
      const roleLabel = createdUser.customRole?.label || createdUser.role || "Team Member";
      await sendUserInvitationEmail({
        to: createdUser.email,
        name: createdUser.name,
        roleName: roleLabel,
        inviterName: actor.name || "Zsyio Workspace Admin",
        inviteToken: invitationToken,
      });
    } catch (emailErr) {
      console.error("[Invitation Email Error] Failed to send email:", emailErr);
    }

    return createdUser;
  },

  async resendInvitation(actor: AuthUser, targetUserId: string) {
    assertCan(actor.role, "user:manage", actor.permissions);

    const { user: updatedUser, invitationToken } = await userRepository.resendInvitation(targetUserId);

    try {
      const roleLabel = updatedUser.customRole?.label || updatedUser.role || "Team Member";
      await sendUserInvitationEmail({
        to: updatedUser.email,
        name: updatedUser.name,
        roleName: roleLabel,
        inviterName: actor.name || "Zsyio Workspace Admin",
        inviteToken: invitationToken,
      });
    } catch (emailErr) {
      console.error("[Invitation Email Error] Failed to resend email:", emailErr);
    }

    return updatedUser;
  },

  async update(actor: AuthUser, id: string, input: UpdateUserInput) {
    assertCan(actor.role, "user:manage", actor.permissions);

    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(existing)) {
      if (input.active === false) {
        throw new ForbiddenError("The Super Admin account cannot be deactivated.");
      }
      if (input.role !== undefined || input.customRoleId !== undefined) {
        throw new ForbiddenError("The Super Admin role cannot be modified or reassigned.");
      }
    }

    // Guard: prevent privilege escalation to SUPER_ADMIN via Admin panel (was missing before)
    if (!isSuperAdmin(existing) && (input.role === "SUPER_ADMIN" || input.customRoleId === "sys-role-super-admin")) {
      throw new ForbiddenError("The Super Admin role is exclusively reserved for the workspace owner.");
    }

    const updated = await userRepository.update(id, input);
    invalidateUserAuth(id);
    if (updated.email) invalidateUserAuth(updated.email);
    return updated;
  },

  /**
   * Administratively reset a user's password and alert them via email.
   * Previously this method did not send an alert email - that gap is now fixed
   * so users know when an admin changes their credentials.
   */
  async resetPassword(actor: AuthUser, id: string, password: string) {
    assertCan(actor.role, "user:manage", actor.permissions);
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User not found.");
    }

    const updated = await userRepository.setPassword(id, password);
    invalidateUserAuth(id);
    try {
      if (updated?.email) {
        invalidateUserAuth(updated.email);
        await sendPasswordChangedAlertEmail({
          to: updated.email,
          name: updated.name || "Workspace Member",
          changedAt: new Date(),
        });
      }
    } catch (emailErr) {
      console.error("[Admin Reset Password Alert Email Error]:", emailErr);
    }
    return updated;
  },

  async delete(actor: AuthUser, id: string) {
    assertCan(actor.role, "user:manage", actor.permissions);
    // Guard: prevent self-deletion via Admin panel (was missing before)
    if (actor.id === id) {
      throw new ForbiddenError("You cannot delete your own account.");
    }
    const result = await userRepository.delete(id, actor.id);
    invalidateUserAuth(id);
    return result;
  },
};
