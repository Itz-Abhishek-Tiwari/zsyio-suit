import type { CreateUserInput, AcceptInvitationInput } from "@zsyio/validators";
import { assertCan, BadRequestError, NotFoundError, ForbiddenError, TooManyRequestsError } from "./permissions";
import { isSuperAdmin } from "./super-admin";
import { sendUserInvitationEmail, sendPasswordResetOtpEmail, sendPasswordChangedAlertEmail } from "./email";
import { isEmailDomainAllowed, getAllowedDomainsNotice } from "./domain-restriction";
import { invalidateUserAuth } from "./auth-cache";
import { comparePassword, hashPassword } from "./password";
import type { Session } from "next-auth";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Minimal user shapes the shared service cares about.
// Each app's repository returns a superset — structural typing handles the rest.
// ---------------------------------------------------------------------------

export type SharedSafeUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  customRole?: { label?: string | null } | null;
};

export type SharedInvitationUser = SharedSafeUser & {
  invitationStatus?: string | null;
  invitationExpiresAt?: Date | null;
  invitedAt?: Date | null;
};

export type SharedAuthUser = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  resetOtpHash: string | null;
  resetOtpExpiresAt: Date | null;
  resetOtpAttempts: number;
};

/**
 * Minimal repository interface the shared user service needs.
 * Each app's userRepository must structurally satisfy this contract.
 * The repositories may return richer types (e.g. with teamMemberships) — that's fine.
 */
export interface SharedUserRepository {
  findByInvitationToken(token: string): Promise<SharedInvitationUser | null>;
  findById(id: string): Promise<SharedSafeUser | null>;
  findActiveByEmailForAuth(email: string): Promise<SharedAuthUser | null>;
  create(data: CreateUserInput): Promise<{ user: SharedSafeUser; invitationToken: string }>;
  resendInvitation(userId: string): Promise<{ user: SharedSafeUser; invitationToken: string }>;
  acceptInvitation(token: string, data: AcceptInvitationInput): Promise<{ id: string; email: string }>;
  rejectInvitation(token: string): Promise<unknown>;
  setPassword(id: string, password: string): Promise<{ id: string; email: string; name: string } | null | undefined>;
  setResetOtp(userId: string, otpHash: string, expiresAt: Date): Promise<unknown>;
  incrementResetOtpAttempts(userId: string): Promise<unknown>;
  clearResetOtp(userId: string): Promise<unknown>;
  resetPasswordWithOtp(userId: string, newPassword: string): Promise<{ id: string; email: string; name: string }>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates the shared subset of user service methods that are identical
 * across pms, notes, and admin. Accepts each app's userRepository so it
 * remains decoupled from Prisma.
 *
 * @example
 * ```ts
 * // In each app's user.service.ts:
 * import { createSharedUserService } from "@zsyio/auth/user-service";
 * import { userRepository } from "@/server/repositories/user";
 *
 * const shared = createSharedUserService(userRepository);
 *
 * export const userService = {
 *   ...shared,
 *   // app-specific overrides / additions below
 *   async list(filters) { ... },
 *   async update(user, id, input) { ... },
 * };
 * ```
 */
export function createSharedUserService(userRepository: SharedUserRepository) {
  return {
    /**
     * Fetch invitation metadata for a given token (for the accept-invitation page).
     */
    async getInvitation(token: string) {
      if (!token) {
        throw new BadRequestError("Invitation token is required.");
      }
      const user = await userRepository.findByInvitationToken(token);
      if (!user) {
        throw new NotFoundError("Invitation not found or token has already been used.");
      }

      const isExpired = user.invitationExpiresAt
        ? new Date(user.invitationExpiresAt) < new Date()
        : false;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customRole: user.customRole,
        invitationStatus: user.invitationStatus,
        invitationExpiresAt: user.invitationExpiresAt,
        invitedAt: user.invitedAt,
        isExpired,
      };
    },

    /**
     * Accept an invitation and set an initial password. Invalidates the user's
     * auth cache so the new session is immediately valid.
     */
    async acceptInvitation(token: string, input: AcceptInvitationInput) {
      const res = await userRepository.acceptInvitation(token, input);
      invalidateUserAuth(res.id);
      invalidateUserAuth(res.email);
      return res;
    },

    /**
     * Decline an invitation.
     */
    async rejectInvitation(token: string) {
      return userRepository.rejectInvitation(token);
    },

    /**
     * Create a new user and send them an invitation email.
     * Requires the actor to have `user:manage` permission.
     */
    async create(actor: Session["user"], input: CreateUserInput) {
      assertCan(actor.role, "user:manage", actor.permissions);
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
        console.error("[Invitation Email Error] Failed to send email via ZeptoMail:", emailErr);
      }

      return createdUser;
    },

    /**
     * Regenerate the invitation token and re-send the invitation email.
     * Requires the actor to have `user:manage` permission.
     */
    async resendInvitation(actor: Session["user"], targetUserId: string) {
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
        console.error("[Resend Invitation Email Error] Failed to send email via ZeptoMail:", emailErr);
      }

      return updatedUser;
    },

    /**
     * Administratively set a user's password and alert them via email.
     * Requires the actor to have `user:manage` permission.
     */
    async setPassword(actor: Session["user"], targetUserId: string, password: string) {
      assertCan(actor.role, "user:manage", actor.permissions);
      const updated = await userRepository.setPassword(targetUserId, password);
      invalidateUserAuth(targetUserId);
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
        console.error("[Admin Set Password Alert Email Error]:", emailErr);
      }
      return updated;
    },

    /**
     * Initiate a self-service password reset by sending a 6-digit OTP via email.
     * Uses a constant-time response to avoid leaking whether the email is registered.
     */
    async requestPasswordResetOtp(email: string) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!isEmailDomainAllowed(trimmedEmail)) {
        throw new BadRequestError(
          `Only email addresses from approved domains (${getAllowedDomainsNotice()}) are authorized.`
        );
      }

      const user = await userRepository.findActiveByEmailForAuth(trimmedEmail);

      // Constant-time response: don't reveal whether the email exists
      if (!user || !user.active) {
        return {
          success: true,
          message:
            "If an active account is registered with this email, a 6-digit verification code has been dispatched.",
        };
      }

      const expiresInMinutes = 10;

      // Rate limiting: enforce 60-second cooldown between OTP requests
      if (user.resetOtpExpiresAt) {
        const remainingMs = new Date(user.resetOtpExpiresAt).getTime() - Date.now();
        const cooldownRemainingMs = remainingMs - (expiresInMinutes - 1) * 60 * 1000;
        if (cooldownRemainingMs > 0) {
          const waitSeconds = Math.ceil(cooldownRemainingMs / 1000);
          throw new TooManyRequestsError(
            `A verification code was recently sent. Please wait ${waitSeconds}s before requesting a new code.`
          );
        }
      }

      const rawOtp = crypto.randomInt(100000, 999999).toString();
      const otpHash = await hashPassword(rawOtp, 10);
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      if (process.env.NODE_ENV !== "production") {
        console.log("\n=======================================================");
        console.log(`🔐 [PASSWORD RESET OTP] For: ${user.email}`);
        console.log(`🔑 OTP CODE: >>>  ${rawOtp}  <<<`);
        console.log(`⏰ Expires in: ${expiresInMinutes} minutes`);
        console.log("=======================================================\n");
      }

      await userRepository.setResetOtp(user.id, otpHash, expiresAt);

      try {
        await sendPasswordResetOtpEmail({
          to: user.email,
          name: user.name || "Workspace Member",
          otp: rawOtp,
          expiresInMinutes,
        });
      } catch (emailErr) {
        console.error("[Password Reset OTP Email Error]:", emailErr);
      }

      return {
        success: true,
        message:
          "If an active account is registered with this email, a 6-digit verification code has been dispatched.",
      };
    },

    /**
     * Verify a password-reset OTP and apply the new password if valid.
     * Enforces: 10-minute expiry, 5-attempt lockout, bcrypt verify.
     *
     * Note: remaining attempts uses (attempts + 1) to reflect the just-incremented
     * value, fixing an off-by-one in the original per-app implementations.
     */
    async verifyPasswordResetOtp(email: string, otp: string, newPassword: string) {
      const trimmedEmail = email.trim().toLowerCase();
      const user = await userRepository.findActiveByEmailForAuth(trimmedEmail);

      if (!user || !user.active) {
        throw new BadRequestError("Invalid verification request or user account not found.");
      }

      if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
        throw new BadRequestError(
          "No active password reset request found. Please request a new verification code."
        );
      }

      if (user.resetOtpAttempts >= 5) {
        await userRepository.clearResetOtp(user.id);
        throw new TooManyRequestsError(
          "Too many failed verification attempts. For your security, this code has been invalidated. Please request a new code."
        );
      }

      const now = new Date();
      if (new Date(user.resetOtpExpiresAt) < now) {
        await userRepository.clearResetOtp(user.id);
        throw new BadRequestError("This verification code has expired. Please request a new code.");
      }

      const isMatch = await comparePassword(otp.trim(), user.resetOtpHash);
      if (!isMatch) {
        await userRepository.incrementResetOtpAttempts(user.id);
        const newAttempts = user.resetOtpAttempts + 1;
        const remainingAttempts = Math.max(0, 5 - newAttempts);
        throw new BadRequestError(
          remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
            : "Invalid verification code. Maximum attempts exceeded. Please request a new code."
        );
      }

      await userRepository.resetPasswordWithOtp(user.id, newPassword);
      invalidateUserAuth(user.id);
      invalidateUserAuth(user.email);

      try {
        await sendPasswordChangedAlertEmail({
          to: user.email,
          name: user.name || "Workspace Member",
          changedAt: new Date(),
        });
      } catch (emailErr) {
        console.error("[Password Reset Alert Email Error]:", emailErr);
      }

      return {
        success: true,
        message: "Your password has been successfully reset. You can now sign in with your new password.",
      };
    },
  };
}
