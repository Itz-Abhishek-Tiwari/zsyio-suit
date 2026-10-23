"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Button,
  PageHeader,
  ConfirmDialog,
  SearchInput,
  SegmentedTabs,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ROLE_COLOR_STYLES,
} from "@zsyio/ui";
import {
  useCreateUserMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useResendInvitationMutation,
  useDeleteUserMutation,
} from "@/store/api/usersApi";
import { useSession } from "next-auth/react";
import { UserInviteModal, UsersTable } from "@/components/users";
import { useAvailableRoles } from "@/hooks/useAvailableRoles";
import { getErrorMessage, LoadErrorState } from "@zsyio/ui";
import { isEmailDomainAllowed, getAllowedDomainsNotice, getAllowedEmailDomains } from "@zsyio/auth/domain-restriction";
import type { User } from "@zsyio/types";
import { UserPlus, Globe, Building2, Crown } from "lucide-react";
import { useGetDomainsQuery } from "@/store/api/domainsApi";
import { DomainManagementModal } from "@/components/domains/DomainManagementModal";
import { cn } from "@zsyio/ui";

export function UsersView({ serverAllowedDomains }: { serverAllowedDomains?: string[] } = {}) {
  const { data: session } = useSession();
  const { data: users = [], isLoading, isError, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [resendInvitation] = useResendInvitationMutation();
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const { data: dbDomains = [] } = useGetDomainsQuery();

  const allowedDomains = useMemo(() => {
    const activeDbDomains = dbDomains.filter((d) => d.isActive).map((d) => d.domain);
    if (activeDbDomains.length > 0) return activeDbDomains;
    return serverAllowedDomains && serverAllowedDomains.length > 0 ? serverAllowedDomains : getAllowedEmailDomains();
  }, [dbDomains, serverAllowedDomains]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(allowedDomains[0] || "zsyio.com");
  const [role, setRole] = useState<string>("DEVELOPER");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (allowedDomains.length > 0 && !allowedDomains.includes(selectedDomain)) {
      setSelectedDomain(allowedDomains[0]);
    }
  }, [allowedDomains, selectedDomain]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("invite") === "true") {
        setOpen(true);
      }
    }
  }, []);

  const availableRolesList = useAvailableRoles(users);

  const counts = useMemo(() => {
    return {
      all: users.length,
      active: users.filter((u) => u.active && u.invitationStatus === "ACCEPTED").length,
      pending: users.filter((u) => u.invitationStatus === "PENDING").length,
      rejected: users.filter((u) => u.invitationStatus === "REJECTED").length,
      deactivated: users.filter((u) => !u.active).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedRoleFilter !== "ALL") {
        if (selectedRoleFilter === "ADMIN") {
          if (u.role !== "ADMIN" && u.customRole?.name !== "ADMIN") return false;
        } else {
          const roleKey = u.customRole?.name || u.role;
          if (roleKey !== selectedRoleFilter) return false;
        }
      }

      if (statusTab === "ACTIVE") {
        return u.active && u.invitationStatus === "ACCEPTED";
      }
      if (statusTab === "PENDING") {
        return u.invitationStatus === "PENDING";
      }
      if (statusTab === "REJECTED") {
        return u.invitationStatus === "REJECTED";
      }
      if (statusTab === "DEACTIVATED") {
        return !u.active;
      }

      return true;
    });
  }, [users, searchQuery, selectedRoleFilter, statusTab]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    variant: "destructive" | "primary";
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    actionLabel: "",
    variant: "primary",
    action: async () => {},
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    try {
      const selectedRoleObj = availableRolesList.find((r) => r.name === newRole);
      const isCustom = selectedRoleObj && !selectedRoleObj.isSystem && selectedRoleObj.id !== newRole;

      await updateUser({
        id: userId,
        body: {
          role: newRole,
          customRoleId: isCustom ? selectedRoleObj.id : null,
        },
      }).unwrap();

      toast.success(`Updated role for ${targetUser.name} to ${selectedRoleObj?.label || newRole}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to update role."));
    }
  };

  const handleResendInvite = async (user: User) => {
    try {
      setResendingUserId(user.id);
      await resendInvitation(user.id).unwrap();
      toast.success(`Invitation email resent to ${user.email}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to resend invitation."));
    } finally {
      setResendingUserId(null);
    }
  };

  const handleToggleStatus = (user: User) => {
    const willDeactivate = user.active;
    setConfirmDialog({
      open: true,
      title: willDeactivate ? `Deactivate ${user.name}?` : `Reactivate ${user.name}?`,
      description: willDeactivate
        ? `${user.name} will be logged out and cannot sign in until reactivated.`
        : `${user.name} will regain access to their account immediately.`,
      actionLabel: willDeactivate ? "Deactivate User" : "Reactivate User",
      variant: willDeactivate ? "destructive" : "primary",
      action: async () => {
        try {
          await updateUser({
            id: user.id,
            body: { active: !willDeactivate },
          }).unwrap();
          toast.success(willDeactivate ? `Deactivated ${user.name}` : `Reactivated ${user.name}`);
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, "Failed to update user status."));
        }
      },
    });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDialog({
      open: true,
      title: `Delete ${user.name}?`,
      description: `This permanently deletes the user account for ${user.name} (${user.email}). Any tasks will be reassigned. This action cannot be undone.`,
      actionLabel: "Delete User Permanently",
      variant: "destructive",
      action: async () => {
        try {
          await deleteUser(user.id).unwrap();
          toast.success(`Deleted user ${user.name}`);
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, "Failed to delete user."));
        }
      },
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    const cleanName = name.trim();
    const cleanUser = emailUsername.trim().toLowerCase().replace(/^@+|@+$/g, "");
    const fullEmail = `${cleanUser}@${selectedDomain}`;

    if (!cleanName || !cleanUser) {
      toast.error("Please fill in both full name and corporate email.");
      return;
    }

    if (!isEmailDomainAllowed(fullEmail)) {
      toast.error(`Workspace security policy permits only addresses from: ${getAllowedDomainsNotice()}`);
      return;
    }

    try {
      const selectedRoleObj = availableRolesList.find((r) => r.name === role);
      const isCustom = selectedRoleObj && !selectedRoleObj.isSystem && selectedRoleObj.id !== role;

      await createUser({
        name: cleanName,
        email: fullEmail,
        role,
        customRoleId: isCustom ? selectedRoleObj.id : null,
      }).unwrap();

      toast.success(`Invitation sent to ${fullEmail}`);
      setOpen(false);
      setName("");
      setEmailUsername("");
      setRole("DEVELOPER");
      setAttemptedSubmit(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to send invitation."));
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="User Accounts &amp; Access Directory"
        description="Manage member accounts, capability levels, team assignments, and security statuses."
        eyebrow="IAM Directory"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDomainModalOpen(true)}
              className="gap-1.5 rounded-lg text-xs font-semibold border-border/80 bg-surface-subtle/80 hover:bg-surface-subtle shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Corporate Domains</span>
            </Button>
            <Button
              onClick={() => setOpen(true)}
              size="sm"
              className="gap-2 rounded-lg font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite New User</span>
            </Button>
          </div>
        }
      />

      {/* Corporate Domains Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-card border border-border/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Authorized Corporate Domains:</span>
          </div>
          {allowedDomains.map((dom, i) => (
            <span
              key={dom}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border",
                i === 0
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-surface-subtle text-foreground border-border/70"
              )}
            >
              @{dom}
              {i === 0 && (
                <span className="text-xs font-sans font-semibold  text-warning flex items-center gap-0.5 ml-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  Primary
                </span>
              )}
            </span>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDomainModalOpen(true)}
          className="h-7 text-xs font-semibold text-primary hover:bg-primary-light rounded-lg cursor-pointer"
        >
          Manage Domains &rarr;
        </Button>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <SegmentedTabs
          tabs={[
            { id: "ALL", label: `All Users (${counts.all})` },
            { id: "ACTIVE", label: `Active (${counts.active})` },
            { id: "PENDING", label: `Pending (${counts.pending})` },
            { id: "DEACTIVATED", label: `Deactivated (${counts.deactivated})` },
          ]}
          value={statusTab}
          onChange={setStatusTab}
        />

        <div className="flex items-center gap-2.5">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or email..."
            />
          </div>

          <div className="w-[160px] shrink-0">
            <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
              <SelectTrigger className="h-9 text-xs rounded-lg border border-border/80">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-semibold">
                  All Roles ({users.length})
                </SelectItem>
                {availableRolesList.map((r) => {
                  const count = users.filter((u) => {
                    if (r.name === "ADMIN") {
                      return u.role === "ADMIN" || u.customRole?.name === "ADMIN";
                    }
                    return (u.customRole?.name || u.role) === r.name;
                  }).length;
                  const colorKey = r.color || "purple";
                  const colorStyle = ROLE_COLOR_STYLES[colorKey] ?? ROLE_COLOR_STYLES.purple;
                  return (
                    <SelectItem key={r.id || r.name} value={r.name} className="text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                        <span>{r.label}</span>
                        <span className="text-muted-foreground font-mono text-xs ml-auto">({count})</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isError && users.length === 0 ? (
        <LoadErrorState title="Couldn't load users" onRetry={refetch} />
      ) : (
        <UsersTable
          users={filteredUsers}
          isLoading={isLoading}
          searchQuery={searchQuery}
          currentUserId={session?.user?.id}
          availableRolesList={availableRolesList}
          resendingUserId={resendingUserId}
          onOpenInvite={() => setOpen(true)}
          onRoleChange={handleRoleChange}
          onResendInvite={handleResendInvite}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* User Invite Modal */}
      <UserInviteModal
        isOpen={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) setAttemptedSubmit(false);
        }}
        name={name}
        setName={setName}
        emailUsername={emailUsername}
        setEmailUsername={setEmailUsername}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        allowedDomains={allowedDomains}
        role={role}
        setRole={setRole}
        availableRolesList={availableRolesList}
        attemptedSubmit={attemptedSubmit}
        isCreating={isCreating}
        onSubmit={handleCreateSubmit}
      />

      {/* Corporate Domain Governance Modal */}
      <DomainManagementModal
        open={isDomainModalOpen}
        onOpenChange={setIsDomainModalOpen}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.actionLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
