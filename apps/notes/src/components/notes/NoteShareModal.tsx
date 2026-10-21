"use client";

import React, { useState } from "react";
import { Modal } from "@zsyio/ui";
import {
  useGetNoteSharesQuery,
  useAddNoteShareMutation,
  useDeleteNoteShareMutation,
  useUpdateNoteMutation,
  type NoteItem,
} from "@/store/api/notesApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetRolesQuery } from "@/store/api/rolesApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import {
  Users,
  Shield,
  Users2,
  Globe,
  Lock,
  Link as LinkIcon,
  Check,
  Trash2,
  Folder,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { MultiPersonSelect } from "@zsyio/editor";
import { toast } from "sonner";
import { cn } from "@zsyio/ui";

interface NoteShareModalProps {
  note: NoteItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoteShareModal({ note, open, onOpenChange }: NoteShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [targetType, setTargetType] = useState<"user" | "role" | "team" | "everyone">("user");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedAccess, setSelectedAccess] = useState<"VIEW" | "EDIT" | "FULL">("VIEW");
  const [everyoneAccess, setEveryoneAccess] = useState<"WORKSPACE_VIEW" | "WORKSPACE_EDIT">("WORKSPACE_VIEW");

  const { data: sharesData, isLoading: sharesLoading } = useGetNoteSharesQuery(note.id, {
    skip: !open,
  });

  const { data: users = [] } = useGetUsersQuery(undefined, { skip: !open });
  const { data: customRoles = [] } = useGetRolesQuery(undefined, { skip: !open });
  const { data: teams = [] } = useGetTeamsQuery(undefined, { skip: !open });

  const [addShare, { isLoading: isAdding }] = useAddNoteShareMutation();
  const [deleteShare] = useDeleteNoteShareMutation();
  const [updateNote] = useUpdateNoteMutation();

  const handleCopyLink = () => {
    const url = `${window.location.origin}/notes?id=${note.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Document link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddShare = async () => {
    if (targetType === "everyone") {
      try {
        await updateNote({
          id: note.id,
          generalAccess: everyoneAccess,
        }).unwrap();
        toast.success(
          everyoneAccess === "WORKSPACE_VIEW"
            ? "Note shared with everyone in organization (Can view)"
            : "Note shared with everyone in organization (Can edit)"
        );
      } catch {
        toast.error("Failed to share with everyone");
      }
      return;
    }

    if (targetType === "user" && selectedUserIds.length === 0) {
      toast.error("Please select at least one person.");
      return;
    }
    if ((targetType === "role" || targetType === "team") && !selectedTargetId) {
      toast.error("Please select a role or team.");
      return;
    }

    try {
      if (targetType === "user") {
        await addShare({
          noteId: note.id,
          userIds: selectedUserIds,
          accessLevel: selectedAccess,
        }).unwrap();
        toast.success(
          `Access granted to ${selectedUserIds.length} ${selectedUserIds.length === 1 ? "person" : "people"}`
        );
        setSelectedUserIds([]);
      } else if (targetType === "role") {
        const isSystemRole = ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"].includes(selectedTargetId);
        if (isSystemRole) {
          await addShare({
            noteId: note.id,
            role: selectedTargetId,
            accessLevel: selectedAccess,
          }).unwrap();
        } else {
          await addShare({
            noteId: note.id,
            customRoleId: selectedTargetId,
            accessLevel: selectedAccess,
          }).unwrap();
        }
        toast.success("Access updated successfully");
        setSelectedTargetId("");
      } else if (targetType === "team") {
        await addShare({
          noteId: note.id,
          teamId: selectedTargetId,
          accessLevel: selectedAccess,
        }).unwrap();
        toast.success("Access updated successfully");
        setSelectedTargetId("");
      }
    } catch {
      toast.error("Failed to grant access");
    }
  };

  const handleUpdateGeneralAccess = async (access: "INHERIT" | "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT") => {
    try {
      await updateNote({
        id: note.id,
        generalAccess: access,
      }).unwrap();
      toast.success("General access updated");
    } catch {
      toast.error("Failed to change general access");
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await deleteShare({ noteId: note.id, shareId }).unwrap();
      toast.success("Access revoked");
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  const canManage = sharesData?.canManage ?? (note.effectiveAccess === "FULL");
  const directShares = sharesData?.directShares ?? [];
  const inheritedShares = sharesData?.inheritedShares ?? [];
  const directUserIds = directShares.map((s) => s.userId).filter(Boolean) as string[];
  const generalAccess = note.generalAccess;

  const isInviteDisabled =
    targetType === "user"
      ? selectedUserIds.length === 0
      : targetType === "everyone"
      ? false
      : !selectedTargetId;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share Note"
      description={
        canManage
          ? `Manage person, role, and workspace access for "${note.title}"`
          : `Access permissions for "${note.title}"`
      }
      icon={<Users className="w-4 h-4" />}
      iconVariant="purple"
      size="lg"
      bodyClassName="p-5 flex flex-col gap-4"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/80 hover:bg-card text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />}
            <span>{copied ? "Link Copied!" : "Copy Internal Link"}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      {/* 1. Add Collaborator Form or Read-Only Notice */}
      {!canManage ? (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle/80 border border-border text-xs text-muted-foreground">
          <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">Sharing permissions are restricted</span>
            <span>
              You have {note.effectiveAccess === "EDIT" ? "editing" : "view-only"} access. Only note owners, editors with full access, or workspace administrators can invite new collaborators or change access levels.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/80 bg-surface-subtle/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Share with People, Roles or Teams
            </span>
            <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setTargetType("user");
                  setSelectedTargetId("");
                }}
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  targetType === "user" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Person
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("role");
                  setSelectedUserIds([]);
                  setSelectedTargetId("");
                }}
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  targetType === "role" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Role
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("team");
                  setSelectedUserIds([]);
                  setSelectedTargetId("");
                }}
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  targetType === "team" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Team
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("everyone");
                  setSelectedUserIds([]);
                  setSelectedTargetId("");
                }}
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  targetType === "everyone" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Everyone
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 min-w-0">
            <div className="flex-1 min-w-0">
              {targetType === "everyone" && (
                <div className="flex items-center gap-2.5 px-3 h-9 rounded-lg bg-card border border-border text-xs text-foreground min-w-0">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs truncate">Everyone at Zsyio</span>
                    <span className="text-xs text-muted-foreground truncate">All organization members</span>
                  </div>
                </div>
              )}

              {targetType === "user" && (
                <MultiPersonSelect
                  users={users}
                  selectedUserIds={selectedUserIds}
                  onChange={setSelectedUserIds}
                  alreadySharedUserIds={directUserIds}
                  placeholder="Select people to share..."
                />
              )}

              {targetType === "role" && (
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger className="w-full h-9 rounded-lg bg-card min-w-0">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>System Roles</SelectLabel>
                      <SelectItem value="ADMIN">ADMIN (All Administrators)</SelectItem>
                      <SelectItem value="MANAGER">MANAGER (All Managers)</SelectItem>
                      <SelectItem value="DEVELOPER">DEVELOPER (All Developers)</SelectItem>
                      <SelectItem value="SUPPORT">SUPPORT (All Support Staff)</SelectItem>
                    </SelectGroup>
                    {customRoles.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Custom Roles</SelectLabel>
                        {customRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label} ({r.name})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              )}

              {targetType === "team" && (
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger className="w-full h-9 rounded-lg bg-card min-w-0">
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {targetType === "everyone" ? (
              <Select
                value={everyoneAccess}
                onValueChange={(val) => setEveryoneAccess(val as "WORKSPACE_VIEW" | "WORKSPACE_EDIT")}
              >
                <SelectTrigger className="w-28 shrink-0 h-9 rounded-lg bg-card font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKSPACE_VIEW">Can View</SelectItem>
                  <SelectItem value="WORKSPACE_EDIT">Can Edit</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={selectedAccess}
                onValueChange={(val) => setSelectedAccess(val as "VIEW" | "EDIT" | "FULL")}
              >
                <SelectTrigger className="w-28 shrink-0 h-9 rounded-lg bg-card font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">Can View</SelectItem>
                  <SelectItem value="EDIT">Can Edit</SelectItem>
                  <SelectItem value="FULL">Full Access</SelectItem>
                </SelectContent>
              </Select>
            )}

            <button
              type="button"
              onClick={handleAddShare}
              disabled={isInviteDisabled || isAdding}
              className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : targetType === "everyone" ? (
                "Share to All"
              ) : targetType === "user" && selectedUserIds.length > 1 ? (
                `Invite (${selectedUserIds.length})`
              ) : (
                "Invite"
              )}
            </button>
          </div>

          {/* Selected people pill tags */}
          {targetType === "user" && selectedUserIds.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 max-h-20 overflow-y-auto">
              {users
                .filter((u) => selectedUserIds.includes(u.id))
                .map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                  >
                    <span className="truncate max-w-[140px]">{u.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds((prev) => prev.filter((id) => id !== u.id))}
                      className="hover:text-destructive p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 2. General Workspace Access */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center border border-border shrink-0">
            {generalAccess === "PRIVATE" ? (
              <Lock className="w-4 h-4 text-warning" />
            ) : (
              <Globe className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground">General Workspace Access</span>
            <span className="text-xs text-muted-foreground">
              {generalAccess === "INHERIT" && (note.folder ? `Inherited from folder "${note.folder.name}"` : "Inherited")}
              {generalAccess === "PRIVATE" && "Only people and roles invited have access"}
              {generalAccess === "WORKSPACE_VIEW" && "Anyone in the organization can view"}
              {generalAccess === "WORKSPACE_EDIT" && "Anyone in the organization can edit"}
            </span>
          </div>
        </div>

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <span>
                  {generalAccess === "INHERIT" && "Inherit"}
                  {generalAccess === "PRIVATE" && "Restricted"}
                  {generalAccess === "WORKSPACE_VIEW" && "Can view"}
                  {generalAccess === "WORKSPACE_EDIT" && "Can edit"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-lg">
              {note.folderId && (
                <DropdownMenuItem
                  onClick={() => handleUpdateGeneralAccess("INHERIT")}
                  className="text-xs cursor-pointer font-medium"
                >
                  Inherit from Folder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleUpdateGeneralAccess("PRIVATE")}
                className="text-xs cursor-pointer font-medium"
              >
                Restricted (Private)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateGeneralAccess("WORKSPACE_VIEW")}
                className="text-xs cursor-pointer font-medium"
              >
                Anyone with link - View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUpdateGeneralAccess("WORKSPACE_EDIT")}
                className="text-xs cursor-pointer font-medium"
              >
                Anyone with link - Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-border">
            {generalAccess === "INHERIT" && "Inherited"}
            {generalAccess === "PRIVATE" && "Restricted"}
            {generalAccess === "WORKSPACE_VIEW" && "Workspace View"}
            {generalAccess === "WORKSPACE_EDIT" && "Workspace Edit"}
          </span>
        )}
      </div>

      {/* 3. Who has access list */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold   text-muted-foreground px-1">
          Who has access
        </span>

        <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1">
          {/* Owner */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle/60 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary-light text-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                {note.author?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">{note.author?.name || "Author"}</span>
                  <Badge variant="outline" className="text-xs py-0 px-1 font-mono">
                    Owner
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate">{note.author?.email}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-semibold px-2">Full access</span>
          </div>

          {/* Workspace-wide Access (Everyone in Organization) */}
          {generalAccess && generalAccess !== "PRIVATE" && generalAccess !== "INHERIT" && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">Everyone in Organization</span>
                    <Badge variant="outline" className="text-xs py-0 px-1 font-mono text-primary border-primary/30">
                      Workspace
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">All members of Zsyio</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {canManage ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <span>{generalAccess === "WORKSPACE_VIEW" ? "Can view" : "Can edit"}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 p-1 rounded-lg">
                        <DropdownMenuItem
                          onClick={() => handleUpdateGeneralAccess("WORKSPACE_VIEW")}
                          className="text-xs cursor-pointer"
                        >
                          Can view
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateGeneralAccess("WORKSPACE_EDIT")}
                          className="text-xs cursor-pointer"
                        >
                          Can edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      type="button"
                      onClick={() => handleUpdateGeneralAccess(note.folderId ? "INHERIT" : "PRIVATE")}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Revoke workspace access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground px-2 py-1">
                    {generalAccess === "WORKSPACE_VIEW" ? "Can view" : "Can edit"}
                  </span>
                )}
              </div>
            </div>
          )}

          {sharesLoading && (
            <div className="py-4 flex justify-center text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}

          {/* Direct Shares */}
          {directShares.map((s) => {
            const label = s.user?.name || s.team?.name || s.customRole?.label || s.role;
            const sub = s.user?.email || (s.team ? "Team" : "Role Group");
            const icon = s.user ? (
              <Users className="w-3.5 h-3.5 text-primary" />
            ) : s.team ? (
              <Users2 className="w-3.5 h-3.5 text-success" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-notion-purple-fg" />
            );

            const accessLabel =
              s.accessLevel === "VIEW" ? "Can view" : s.accessLevel === "EDIT" ? "Can edit" : "Full access";

            return (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 border border-border">
                    {icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">{label}</span>
                    <span className="text-xs text-muted-foreground truncate">{sub}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canManage ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <span>{accessLabel}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 p-1 rounded-lg">
                          <DropdownMenuItem
                            onClick={() =>
                              addShare({
                                noteId: note.id,
                                userId: s.userId || undefined,
                                role: s.role || undefined,
                                teamId: s.teamId || undefined,
                                customRoleId: s.customRoleId || undefined,
                                accessLevel: "VIEW",
                              })
                            }
                            className="text-xs cursor-pointer"
                          >
                            Can view
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              addShare({
                                noteId: note.id,
                                userId: s.userId || undefined,
                                role: s.role || undefined,
                                teamId: s.teamId || undefined,
                                customRoleId: s.customRoleId || undefined,
                                accessLevel: "EDIT",
                              })
                            }
                            className="text-xs cursor-pointer"
                          >
                            Can edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              addShare({
                                noteId: note.id,
                                userId: s.userId || undefined,
                                role: s.role || undefined,
                                teamId: s.teamId || undefined,
                                customRoleId: s.customRoleId || undefined,
                                accessLevel: "FULL",
                              })
                            }
                            className="text-xs cursor-pointer"
                          >
                            Full access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        type="button"
                        onClick={() => handleRemoveShare(s.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Remove access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground px-2 py-1">
                      {accessLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Inherited Folder Shares */}
          {inheritedShares.map((is) => {
            const label = is.user?.name || is.team?.name || is.customRole?.label || is.role;
            return (
              <div
                key={`inherited-${is.id}`}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle/30 opacity-80"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-subtle flex items-center justify-center shrink-0 border border-border/60">
                    <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate">{label}</span>
                      <span className="text-xs bg-muted px-1.5 py-0.2 rounded font-mono text-muted-foreground">
                        via Folder
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground px-2">
                  {is.accessLevel === "VIEW" ? "Can view" : is.accessLevel === "EDIT" ? "Can edit" : "Full access"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
