"use client";

import Link from "next/link";
import {
  UserAvatar,
  EmptyState,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserStatusBadge,
  ROLE_COLOR_STYLES,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@zsyio/ui";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { formatDate, TableSkeleton } from "@zsyio/ui";
import type { User } from "@zsyio/types";
import type { AvailableRole } from "./UserInviteModal";
import {
  UserPlus,
  Crown,
  Lock,
  Send,
  UserX,
  Check,
  Trash2,
  MoreVertical,
  ExternalLink,
  Users2,
} from "lucide-react";

export interface UsersTableProps {
  users: (User & {
    teamMembers?: Array<{
      teamId: string;
      role: string;
      team: { id: string; name: string; color: string };
    }>;
  })[];
  isLoading: boolean;
  searchQuery: string;
  currentUserId?: string;
  availableRolesList: AvailableRole[];
  resendingUserId: string | null;
  onOpenInvite: () => void;
  onRoleChange: (userId: string, newRole: string) => void;
  onResendInvite: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function UsersTable({
  users,
  isLoading,
  searchQuery,
  currentUserId,
  availableRolesList,
  resendingUserId,
  onOpenInvite,
  onRoleChange,
  onResendInvite,
  onToggleStatus,
  onDeleteUser,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <TableSkeleton columns={5} rows={6} showHeader />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title={searchQuery ? "No matching users" : "No users found"}
        description={
          searchQuery
            ? `No user accounts match "${searchQuery}". Try adjusting your search query or filters.`
            : "No accounts registered in this category yet."
        }
        action={
          <Button size="sm" onClick={onOpenInvite} className="gap-1.5 rounded-md font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs">
            <UserPlus className="w-4 h-4" />
            Invite New User
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="py-3 px-5 min-w-[220px] text-xs font-semibold  ">User</TableHead>
            <TableHead className="py-3 px-5 min-w-[200px] text-xs font-semibold  ">Email &amp; Teams</TableHead>
            <TableHead className="py-3 px-5 min-w-[150px] text-xs font-semibold  ">Clearance Role</TableHead>
            <TableHead className="py-3 px-5 min-w-[130px] text-xs font-semibold  ">Status</TableHead>
            <TableHead className="py-3 px-5 min-w-[120px] text-xs font-semibold  ">Joined</TableHead>
            <TableHead className="py-3 px-5 min-w-[80px] text-right text-xs font-semibold  ">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isPending = u.invitationStatus === "PENDING";
            const isUserResending = resendingUserId === u.id;
            const isUserSuperAdmin = isSuperAdmin(u);
            const isCurrentUser = currentUserId === u.id;

            return (
              <TableRow key={u.id} className="hover:bg-muted/30 transition-colors group">
                <TableCell className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} className="w-9 h-9 text-xs ring-1 ring-border shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/users/${u.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {u.name}
                        </Link>
                        {isUserSuperAdmin && (
                          <span
                            title="Permanent Super Administrator"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20 shrink-0"
                          >
                            <Crown className="w-2.5 h-2.5" />
                            ROOT
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        ID: {u.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3.5 px-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-foreground truncate">{u.email}</span>
                    {u.teamMembers && u.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.teamMembers.map((tm) => (
                          <span
                            key={tm.teamId}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-foreground-secondary border border-border/60"
                          >
                            <Users2 className="w-2.5 h-2.5 text-muted-foreground" />
                            {tm.team.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No teams assigned</span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3.5 px-5">
                  {isUserSuperAdmin ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </div>
                  ) : (
                    <Select
                      value={u.customRole?.name || u.role}
                      onValueChange={(newRole) => onRoleChange(u.id, newRole)}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium rounded-lg border-border/60 hover:border-border max-w-[150px]">
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
                  )}
                </TableCell>

                <TableCell className="py-3.5 px-5">
                  <UserStatusBadge
                    active={u.active}
                    invitationStatus={u.invitationStatus}
                  />
                </TableCell>

                <TableCell className="py-3.5 px-5 text-muted-foreground font-mono text-xs">
                  {formatDate(u.createdAt)}
                </TableCell>

                <TableCell className="py-3.5 px-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs">
                      <DropdownMenuItem asChild>
                        <Link href={`/users/${u.id}`} className="cursor-pointer gap-2">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View Account Profile</span>
                        </Link>
                      </DropdownMenuItem>

                      {isPending && !isUserSuperAdmin && (
                        <DropdownMenuItem
                          onClick={() => onResendInvite(u)}
                          disabled={isUserResending}
                          className="cursor-pointer gap-2"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{isUserResending ? "Resending..." : "Resend Invite"}</span>
                        </DropdownMenuItem>
                      )}

                      {!isUserSuperAdmin && !isCurrentUser && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(u)}
                            className="cursor-pointer gap-2"
                          >
                            {u.active ? (
                              <>
                                <UserX className="h-3.5 w-3.5 text-warning" />
                                <span>Deactivate User</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 text-success" />
                                <span>Reactivate User</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onDeleteUser(u)}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Account</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
