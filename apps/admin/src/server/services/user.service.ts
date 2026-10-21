import { assertCan, can, DEFAULT_ROLE_PERMISSIONS, BadRequestError, NotFoundError, ForbiddenError } from "@zsyio/auth/permissions";
import { userRepository, type UserListFilters } from "@/server/repositories/user.repository";
import type { CreateUserInput, UpdateUserInput } from "@zsyio/validators";
import type { Session } from "next-auth";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { invalidateUserAuth } from "@zsyio/auth/auth-cache";
import { sendUserInvitationEmail, sendPasswordChangedAlertEmail } from "@zsyio/auth/email";
import { isEmailDomainAllowed, getAllowedDomainsNotice, setDynamicAllowedDomains } from "@zsyio/auth/domain-restriction";
import { prisma } from "@zsyio/database";

export type AuthUser = NonNullable<Session["user"]>;

const isAdminActor = (actor: AuthUser) => actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";

/**
 * Prevents privilege escalation: nobody may assign the SUPER_ADMIN role, and
 * non-admin actors may only assign roles whose permissions they already hold.
 */
async function assertRoleAssignable(
  actor: AuthUser,
  input: { role?: string | null; customRoleId?: string | null }
) {
  const roleName = input.role?.trim().toUpperCase();
  let customRole: { name: string; permissions: string[] } | null = null;
  if (input.customRoleId) {
    customRole = await prisma.customRole.findUnique({
      where: { id: input.customRoleId },
      select: { name: true, permissions: true },
    });
    if (!customRole) throw new BadRequestError("Selected role does not exist.");
  } else if (roleName) {
    customRole = await prisma.customRole.findUnique({
      where: { name: roleName },
      select: { name: true, permissions: true },
    });
  }
  const targetName = customRole?.name ?? roleName;
  if (targetName === "SUPER_ADMIN" || input.customRoleId === "sys-role-super-admin") {
    throw new ForbiddenError("The Super Admin role is exclusively reserved for the workspace owner.");
  }
  if (!targetName || isAdminActor(actor)) return;
  const perms =
    customRole?.permissions ??
    (DEFAULT_ROLE_PERMISSIONS as Record<string, string[]>)[targetName] ??
    [];
  if (targetName === "ADMIN" || perms.some((p) => !can(actor.role, p as never, actor.permissions))) {
    throw new ForbiddenError("You cannot assign a role with more privileges than your own.");
  }
}

/**
 * Only admins may act on admin accounts; only the Super Admin may act on the Super Admin.
 */
function assertCanManageTarget(
  actor: AuthUser,
  target: { id: string; email: string; role?: string | null; customRole?: { name?: string | null } | null }
) {
  if ((isSuperAdmin(target) || target.customRole?.name === "SUPER_ADMIN") && actor.role !== "SUPER_ADMIN" && !isSuperAdmin(actor.email)) {
    throw new ForbiddenError("Only the Super Admin can manage the Super Admin account.");
  }
  const targetIsAdmin = target.role === "ADMIN" || target.customRole?.name === "ADMIN";
  if (targetIsAdmin && !isAdminActor(actor) && actor.id !== target.id) {
    throw new ForbiddenError("Only administrators can manage administrator accounts.");
  }
}

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

    await assertRoleAssignable(actor, input);

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
    const target = await userRepository.findById(targetUserId);
    if (!target) {
      throw new NotFoundError("User not found.");
    }
    assertCanManageTarget(actor, target);

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

    assertCanManageTarget(actor, existing);
    if (actor.id === id && (input.role !== undefined || input.customRoleId !== undefined)) {
      throw new ForbiddenError("You cannot change your own role.");
    }
    if (actor.id === id && input.active === false) {
      throw new ForbiddenError("You cannot deactivate your own account.");
    }
    // Guard: prevent privilege escalation to SUPER_ADMIN / above the actor's own privileges
    if (input.role !== undefined || input.customRoleId) {
      await assertRoleAssignable(actor, input);
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
    assertCanManageTarget(actor, existing);

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
    const target = await userRepository.findById(id);
    if (target) assertCanManageTarget(actor, target);
    const result = await userRepository.delete(id, actor.id);
    invalidateUserAuth(id);
    return result;
  },
};
