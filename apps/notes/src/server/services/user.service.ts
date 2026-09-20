import { assertCan, NotFoundError, ForbiddenError } from "@zsyio/auth/permissions";
import { userRepository } from "@/server/repositories/user";
import type { UpdateUserInput } from "@zsyio/validators";
import type { Session } from "next-auth";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { invalidateUserAuth } from "@zsyio/auth/auth-cache";
import { createSharedUserService } from "@zsyio/auth/user-service";

import type { UserListFilters } from "@/server/repositories/user";

// Shared service methods: create, resendInvitation, getInvitation, acceptInvitation,
// rejectInvitation, setPassword, requestPasswordResetOtp, verifyPasswordResetOtp
const shared = createSharedUserService(userRepository);

export const userService = {
  // ── Shared methods ──────────────────────────────────────────────────────────
  // Previously these were copy-pasted per app and the Notes copy incorrectly
  // threw errorResponse() HTTP objects from the service layer instead of domain
  // errors. That bug is fixed by delegating to the shared implementation.
  getInvitation: shared.getInvitation,
  acceptInvitation: shared.acceptInvitation,
  rejectInvitation: shared.rejectInvitation,
  create: shared.create,
  resendInvitation: shared.resendInvitation,
  setPassword: shared.setPassword,
  requestPasswordResetOtp: shared.requestPasswordResetOtp,
  verifyPasswordResetOtp: shared.verifyPasswordResetOtp,

  // ── Notes-specific methods ───────────────────────────────────────────────────

  async list(filters?: UserListFilters) {
    return userRepository.list(filters);
  },

  async searchLite(params?: { q?: string; limit?: number }) {
    return userRepository.searchLite(params);
  },

  async update(user: Session["user"], id: string, input: UpdateUserInput) {
    assertCan(user.role, "user:manage", user.permissions);
    const targetUser = await userRepository.findById(id);
    if (!targetUser) {
      throw new NotFoundError("User not found.");
    }

    if (isSuperAdmin(targetUser)) {
      if (input.active === false) {
        throw new ForbiddenError("The Super Admin account cannot be deactivated.");
      }
      if (input.role !== undefined || input.customRoleId !== undefined) {
        throw new ForbiddenError("The Super Admin role cannot be modified or reassigned.");
      }
    }

    if (!isSuperAdmin(targetUser) && (input.role === "SUPER_ADMIN" || input.customRoleId === "sys-role-super-admin")) {
      throw new ForbiddenError("The Super Admin role is exclusively reserved for the workspace owner.");
    }

    const updated = await userRepository.update(id, input);
    invalidateUserAuth(id);
    if (targetUser.email) invalidateUserAuth(targetUser.email);
    return updated;
  },

  async delete(user: Session["user"], targetUserId: string) {
    assertCan(user.role, "user:manage", user.permissions);
    if (user.id === targetUserId) {
      throw new ForbiddenError("You cannot delete your own account.");
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (targetUser && isSuperAdmin(targetUser)) {
      throw new ForbiddenError("The Super Admin account is permanently protected and cannot be deleted.");
    }
    invalidateUserAuth(targetUserId);
    if (targetUser?.email) invalidateUserAuth(targetUser.email);
    return userRepository.delete(targetUserId, user.id);
  },
};
