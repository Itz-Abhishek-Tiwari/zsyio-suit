"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PageHeader,
  UserAvatar,
  UserRoleBadge,
  UserStatusBadge,
  ConfirmDialog,
  Modal,
  ROLE_COLOR_STYLES,
} from "@zsyio/ui";
import {
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} from "@/store/api/usersApi";
import type { User, Role } from "@zsyio/types";
import {
  Trash2,
  Crown,
  ChevronLeft,
  KeyRound,
  Users2,
  Calendar,
} from "lucide-react";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { useAvailableRoles } from "@/hooks/useAvailableRoles";
import { getErrorMessage } from "@zsyio/ui";
import { formatDate } from "@zsyio/ui";

export function UserDetailView({
  user,
}: {
  user: User & {
    teamMembers?: Array<{
      teamId: string;
      role: string;
      team: { id: string; name: string; color?: string | null; description?: string | null };
    }>;
  };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();

  const [role, setRole] = useState(user.customRole?.name || String(user.role));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Password reset modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isSuper = isSuperAdmin(user);
  const isCurrentUser = session?.user?.id === user.id;

  const availableRolesList = useAvailableRoles(user);

  const activeRoleObj = useMemo(() => {
    return availableRolesList.find((r) => r.name === role || r.id === role) ?? user.customRole;
  }, [availableRolesList, role, user.customRole]);

  async function saveRole(newRole: string) {
    setRole(newRole);
    try {
      const selectedRoleObj = availableRolesList.find((r) => r.name === newRole || r.id === newRole);
      if (selectedRoleObj && !selectedRoleObj.isSystem) {
        await updateUser({ id: user.id, body: { customRoleId: selectedRoleObj.id, role: "DEVELOPER" } }).unwrap();
      } else {
        await updateUser({ id: user.id, body: { role: newRole as Role, customRoleId: null } }).unwrap();
      }
      toast.success("Role updated");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Couldn't update role"));
    }
  }

  async function toggleActive() {
    try {
      await updateUser({ id: user.id, body: { active: !user.active } }).unwrap();
      toast.success(user.active ? "User deactivated" : "User reactivated");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Couldn't update user status"));
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    try {
      await resetPassword({ id: user.id, password: newPassword }).unwrap();
      toast.success(`Password reset successfully for ${user.name}`);
      setPasswordModalOpen(false);
      setNewPassword("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to reset password."));
    }
  }

  async function handleDeleteUser() {
    try {
      await deleteUser(user.id).unwrap();
      toast.success(`User "${user.name}" account permanently deleted.`);
      setDeleteDialogOpen(false);
      router.push("/users");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete user account."));
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl pb-12">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/users">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{user.name}</span>
            {isSuper ? (
              <UserRoleBadge role="SUPER_ADMIN" showIcon />
            ) : (
              <UserRoleBadge role={role} customRole={activeRoleObj} showIcon />
            )}
            <UserStatusBadge active={user.active} invitationStatus={user.invitationStatus} />
          </div>
        }
        description={user.email}
      />

      {/* Account Details Card */}
      <div className="rounded-lg border border-border/80 bg-card p-6 shadow-xs flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.name} className="w-16 h-16 text-lg ring-2 ring-border" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
            <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {formatDate(user.createdAt)}</span>
            </span>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col gap-4">
          <h3 className="font-semibold text-sm text-foreground">Access &amp; Role Clearance</h3>

          {isSuper ? (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-4 flex items-start gap-3">
              <Crown className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs text-foreground">Permanent Super Administrator</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This root administrative account cannot be modified, demoted, or deactivated.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Assigned Role</Label>
                <Select value={role} onValueChange={saveRole} disabled={isUpdating}>
                  <SelectTrigger className="h-10 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRolesList.map((r) => {
                      const colorKey = r.color || "purple";
                      const colorStyle = ROLE_COLOR_STYLES[colorKey] ?? ROLE_COLOR_STYLES.purple;
                      return (
                        <SelectItem key={r.id || r.name} value={r.name} className="text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                            <span>{r.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 justify-end">
                <Label className="text-xs font-semibold">Account State</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={user.active ? "outline" : "default"}
                    size="sm"
                    onClick={toggleActive}
                    disabled={isUpdating || isCurrentUser}
                    className="h-10 text-xs rounded-lg font-semibold"
                  >
                    {user.active ? "Deactivate Account" : "Activate Account"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPasswordModalOpen(true)}
                    className="h-10 text-xs rounded-lg font-semibold gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teams Membership Section */}
        <div className="border-t border-border/60 pt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Assigned Teams</h3>
            <Button asChild variant="link" size="sm" className="text-xs font-semibold text-primary p-0 h-auto">
              <Link href="/teams">Manage Teams &rarr;</Link>
            </Button>
          </div>

          {user.teamMembers && user.teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.teamMembers.map((tm) => (
                <div
                  key={tm.teamId}
                  className="rounded-lg border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-notion-blue-fg/10 text-notion-blue-fg flex items-center justify-center font-semibold text-xs">
                      <Users2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground">{tm.team.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{tm.role.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">User is not currently assigned to any teams.</p>
          )}
        </div>

        {/* Danger Zone */}
        {!isSuper && !isCurrentUser && (
          <div className="border-t border-destructive/20 pt-6 flex flex-col gap-3">
            <h3 className="font-semibold text-sm text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Permanently remove this account and reassign associated tasks and logs to an active admin.
            </p>
            <div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="gap-2 rounded-lg text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      <Modal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        title={`Reset Password: ${user.name}`}
        description="Set a new secure password for this account."
        icon={<KeyRound className="w-4 h-4" />}
        iconVariant="primary"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(false)}
              disabled={isResettingPassword}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="reset-password-form"
              size="sm"
              disabled={isResettingPassword}
              className="rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {isResettingPassword ? "Updating Password..." : "Set New Password"}
            </Button>
          </>
        }
      >
        <form id="reset-password-form" onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-xs font-semibold">
              New Password (min 8 chars)
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 text-xs font-mono rounded-lg "
              required
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Permanently delete ${user.name}?`}
        description={`This action permanently deletes ${user.name} (${user.email}). Any tasks assigned will be set to unassigned. This cannot be undone.`}
        confirmLabel="Delete User Permanently"
        variant="destructive"
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
