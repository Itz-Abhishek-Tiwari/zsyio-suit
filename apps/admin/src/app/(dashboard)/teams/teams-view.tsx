"use client";

import { useState, useMemo } from "react";
import { cn } from "@zsyio/ui";
import {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} from "@/store/api/teamsApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import {
  Button,
  Input,
  Label,
  Textarea,
  ConfirmDialog,
  SearchInput,
  UserAvatar,
  UserAvatarGroup,
  EmptyState,
  Modal,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@zsyio/ui";
import { toast } from "sonner";
import {
  Users2,
  Plus,
  Trash2,
  Pencil,
  Check,
  Crown,
  LayoutGrid,
  Network,
  ListTree,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import type { Team } from "@zsyio/types";

const TEAM_COLORS = [
  {
    id: "purple",
    label: "Purple",
    dot: "bg-notion-purple-fg",
    border: "border-notion-purple-fg/30",
    light:
      "bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/20",
  },
  {
    id: "blue",
    label: "Blue",
    dot: "bg-notion-blue-fg",
    border: "border-notion-blue-fg/30",
    light: "bg-notion-blue-fg/10 text-notion-blue-fg border-notion-blue-fg/20",
  },
  {
    id: "emerald",
    label: "Emerald",
    dot: "bg-success",
    border: "border-success/30",
    light: "bg-success/10 text-success border-success/20",
  },
  {
    id: "amber",
    label: "Amber",
    dot: "bg-warning",
    border: "border-warning/30",
    light: "bg-warning/10 text-warning border-warning/20",
  },
  {
    id: "pink",
    label: "Pink",
    dot: "bg-notion-pink-fg",
    border: "border-notion-pink-fg/30",
    light: "bg-notion-pink-fg/10 text-notion-pink-fg border-notion-pink-fg/20",
  },
  {
    id: "gray",
    label: "Gray",
    dot: "bg-muted-foreground",
    border: "border-border/30",
    light: "bg-muted-foreground/10 text-foreground border-border/20",
  },
];

type ViewMode = "grid" | "hierarchy" | "matrix";

export function TeamsView() {
  const { data: teams = [], isLoading, isError, refetch } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [leadFilter, setLeadFilter] = useState<"all" | "missing">("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedLeadUserId, setSelectedLeadUserId] = useState<string | null>(
    null,
  );
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Quick Lead Assignment Modal
  const [assignLeadTeam, setAssignLeadTeam] = useState<Team | null>(null);
  const [quickLeadUserId, setQuickLeadUserId] = useState<string | null>(null);
  const [isAssigningLead, setIsAssigningLead] = useState(false);

  // Delete Dialog State
  const [teamToDelete, setTeamToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Helper to find Team Lead
  const getTeamLead = (team: Team) => {
    return team.members.find(
      (m) => m.role === "LEAD" || m.role === "TEAM_LEAD",
    );
  };

  const getTeamMembers = (team: Team) => {
    return team.members.filter(
      (m) => m.role !== "LEAD" && m.role !== "TEAM_LEAD",
    );
  };

  const filteredTeams = useMemo(() => {
    const source =
      leadFilter === "missing"
        ? teams.filter((team) => !getTeamLead(team))
        : teams;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase().trim();
    return source.filter((team) => {
      const matchName = team.name.toLowerCase().includes(q);
      const matchDesc = team.description?.toLowerCase().includes(q) ?? false;
      const matchMember = team.members.some(
        (m) =>
          m.user.name.toLowerCase().includes(q) ||
          m.user.email?.toLowerCase().includes(q) ||
          m.user.role.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q),
      );
      return matchName || matchDesc || matchMember;
    });
  }, [teams, searchQuery, leadFilter]);

  const totalAssignedMembers = useMemo(() => {
    const uniqueUserIds = new Set<string>();
    teams.forEach((t) => t.members.forEach((m) => uniqueUserIds.add(m.userId)));
    return uniqueUserIds.size;
  }, [teams]);

  const teamsWithLeadsCount = useMemo(() => {
    return teams.filter((t) =>
      t.members.some((m) => m.role === "LEAD" || m.role === "TEAM_LEAD"),
    ).length;
  }, [teams]);

  const handleOpenCreate = () => {
    setEditingTeamId(null);
    setName("");
    setDescription("");
    setSelectedColor("purple");
    setSelectedUserIds([]);
    setSelectedLeadUserId(null);
    setMemberRoles({});
    setMemberSearchQuery("");
    setAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setName(team.name);
    setDescription(team.description || "");
    setSelectedColor(team.color || "purple");
    setSelectedUserIds(team.members.map((m) => m.userId));

    const currentLead = team.members.find(
      (m) => m.role === "LEAD" || m.role === "TEAM_LEAD",
    );
    setSelectedLeadUserId(currentLead ? currentLead.userId : null);

    const rolesMap: Record<string, string> = {};
    team.members.forEach((m) => {
      rolesMap[m.userId] = m.role;
    });
    setMemberRoles(rolesMap);

    setMemberSearchQuery("");
    setAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const handleOpenAssignLead = (team: Team) => {
    setAssignLeadTeam(team);
    const lead = getTeamLead(team);
    setQuickLeadUserId(lead ? lead.userId : null);
  };

  const handleSaveQuickLead = async () => {
    if (!assignLeadTeam) return;
    setIsAssigningLead(true);
    try {
      await updateTeam({
        id: assignLeadTeam.id,
        leadUserId: quickLeadUserId,
      }).unwrap();
      const leadUser = users.find((u) => u.id === quickLeadUserId);
      toast.success(
        quickLeadUserId && leadUser
          ? `Assigned ${leadUser.name} as Team Lead for "${assignLeadTeam.name}".`
          : `Removed Team Lead from "${assignLeadTeam.name}".`,
      );
      setAssignLeadTeam(null);
    } catch {
      toast.error("Failed to update team leadership.");
    } finally {
      setIsAssigningLead(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      if (selectedLeadUserId === userId) {
        setSelectedLeadUserId(null);
      }
      const updated = { ...memberRoles };
      delete updated[userId];
      setMemberRoles(updated);
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
      setMemberRoles((prev) => ({ ...prev, [userId]: "MEMBER" }));
    }
  };

  const setAsLead = (userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedLeadUserId === userId) {
      setSelectedLeadUserId(null);
      setMemberRoles((prev) => ({ ...prev, [userId]: "MEMBER" }));
    } else {
      if (!selectedUserIds.includes(userId)) {
        setSelectedUserIds([...selectedUserIds, userId]);
      }
      setSelectedLeadUserId(userId);
      setMemberRoles((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] === "LEAD") next[k] = "MEMBER";
        });
        next[userId] = "LEAD";
        return next;
      });
    }
  };

  const filteredModalUsers = useMemo(() => {
    if (!memberSearchQuery.trim()) return users;
    const q = memberSearchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }, [users, memberSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!name.trim()) {
      toast.error("Please enter a valid Team Name.");
      return;
    }

    const memberAssignments = selectedUserIds.map((userId) => ({
      userId,
      role:
        userId === selectedLeadUserId
          ? "LEAD"
          : memberRoles[userId] || "MEMBER",
    }));

    try {
      if (editingTeamId) {
        await updateTeam({
          id: editingTeamId,
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          leadUserId: selectedLeadUserId,
          members: memberAssignments,
        }).unwrap();
        toast.success(`Team "${name.trim()}" updated successfully!`);
      } else {
        await createTeam({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          leadUserId: selectedLeadUserId,
          members: memberAssignments,
        }).unwrap();
        toast.success(`Team "${name.trim()}" created successfully!`);
      }

      setIsModalOpen(false);
      setName("");
      setDescription("");
      setSelectedUserIds([]);
      setSelectedLeadUserId(null);
      setMemberRoles({});
      setEditingTeamId(null);
      setAttemptedSubmit(false);
    } catch {
      toast.error(
        editingTeamId ? "Failed to update team." : "Failed to create team.",
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeam(teamToDelete.id).unwrap();
      toast.success(`Team "${teamToDelete.name}" deleted.`);
      setTeamToDelete(null);
    } catch {
      toast.error("Failed to delete team.");
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-7 pb-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary mb-2">Organization</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Teams
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
            The people behind the work. Keep rosters current and give every team
            a clear lead.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create team
        </Button>
      </header>

      <section
        aria-label="Organization overview"
        className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-border bg-card divide-x divide-border overflow-hidden"
      >
        {[
          {
            label: "Teams",
            value: teams.length,
            detail: "Across your organization",
          },
          {
            label: "People in teams",
            value: totalAssignedMembers,
            detail: "Unique members",
          },
          {
            label: "With a team lead",
            value: teamsWithLeadsCount,
            detail: "Ownership in place",
          },
          {
            label: "Need a lead",
            value: teams.length - teamsWithLeadsCount,
            detail: "Review team ownership",
          },
        ].map((stat) => (
          <div key={stat.label} className="px-5 py-5 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums mt-2">
              {isLoading ? "—" : stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section
        aria-label="Team directory controls"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="w-full lg:max-w-md">
            <SearchInput
              aria-label="Search teams"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search teams, people, or roles…"
            />
          </div>
          <div
            className="inline-flex self-start flex-wrap items-center gap-1 rounded-lg bg-muted/50 p-1"
            role="group"
            aria-label="Team view"
          >
            {(
              [
                { id: "grid", label: "Directory", icon: LayoutGrid },
                { id: "hierarchy", label: "Hierarchy", icon: Network },
                { id: "matrix", label: "Table", icon: ListTree },
              ] as const
            ).map((view) => (
              <button
                key={view.id}
                type="button"
                aria-pressed={viewMode === view.id}
                onClick={() => setViewMode(view.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                  viewMode === view.id
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <view.icon className="w-4 h-4" />
                {view.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div
            className="flex gap-2"
            role="group"
            aria-label="Filter by leadership"
          >
            {(
              [
                { id: "all", label: "All teams", count: teams.length },
                {
                  id: "missing",
                  label: "Needs a lead",
                  count: teams.length - teamsWithLeadsCount,
                },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={leadFilter === filter.id}
                onClick={() => setLeadFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                  leadFilter === filter.id
                    ? "bg-primary-light text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {filter.label}
                <span className="tabular-nums opacity-70">{filter.count}</span>
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {filteredTeams.length} of {teams.length} teams
          </span>
        </div>
      </section>

      {/* Directory, reporting relationships, and leadership table share the same filters. */}
      {isError ? (
        <EmptyState
          title="Couldn’t load teams"
          description="Check your connection and try again."
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-lg border border-border/80 bg-card p-5"
            />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title={
            searchQuery || leadFilter !== "all"
              ? "No teams match this view"
              : "Bring your first team together"
          }
          description={
            searchQuery || leadFilter !== "all"
              ? "Try another search or show all teams."
              : "Create a team, add its people, and choose who leads it."
          }
          action={
            searchQuery || leadFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setLeadFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create team
              </Button>
            )
          }
        />
      ) : viewMode !== "matrix" ? (
        <section
          aria-label={
            viewMode === "hierarchy" ? "Team hierarchy" : "Team directory"
          }
          className="flex flex-col gap-6"
        >
          {viewMode === "hierarchy" && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
              <Network className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground">
                  Your organization
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {teams.length} teams · {totalAssignedMembers} people · Team
                  leads and their members
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTeams.map((team) => {
              const lead = getTeamLead(team);
              const members = getTeamMembers(team);
              const colorDef =
                TEAM_COLORS.find((color) => color.id === team.color) ||
                TEAM_COLORS[0];
              return (
                <article
                  key={team.id}
                  className="flex flex-col rounded-xl border border-border bg-card transition-colors hover:border-primary/40 overflow-hidden"
                >
                  <div className="p-5 sm:p-6 flex flex-col gap-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            colorDef.light,
                          )}
                        >
                          <Users2 className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="font-semibold text-base leading-snug break-words">
                            {team.name}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                            {team.members.length}{" "}
                            {team.members.length === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 shrink-0 text-muted-foreground"
                        aria-label={`Edit ${team.name}`}
                        onClick={() => handleOpenEdit(team)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-10">
                      {team.description ||
                        "Add a description to make this team’s purpose clear."}
                    </p>
                    <div className="border-t border-border pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Team lead
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignLead(team)}
                          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded cursor-pointer"
                        >
                          {lead ? "Change" : "Assign lead"}
                        </button>
                      </div>
                      {lead ? (
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={lead.user.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lead.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {lead.user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          No lead assigned
                        </div>
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs font-medium text-muted-foreground">
                          {viewMode === "hierarchy" ? "Team members" : "People"}
                        </h3>
                        {members.length > 0 && (
                          <UserAvatarGroup
                            users={members.map((member) => member.user)}
                            max={4}
                            size="xs"
                          />
                        )}
                      </div>
                      {viewMode === "hierarchy" ? (
                        <div className="mt-3 border-l border-border ml-3 pl-4 space-y-3 max-h-48 overflow-y-auto">
                          {members.length ? (
                            members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center gap-2.5 min-w-0"
                              >
                                <UserAvatar name={member.user.name} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {member.user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {member.user.email}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {member.role === "CO_LEAD"
                                    ? "Co-lead"
                                    : "Member"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No additional members yet.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                          {members.length
                            ? `${members
                                .slice(0, 3)
                                .map((member) => member.user.name.split(" ")[0])
                                .join(
                                  ", ",
                                )}${members.length > 3 ? ` and ${members.length - 3} more` : ""}`
                            : "Add members to complete this team."}
                        </p>
                      )}
                    </div>
                  </div>
                  <footer className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(team)}
                      className="text-primary gap-1 -ml-2"
                    >
                      Manage team
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTeamToDelete({ id: team.id, name: team.name })
                      }
                      className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${team.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: LEADERSHIP MATRIX VIEW                                            */
        /* ========================================================================= */
        <div className="rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="py-3 px-4 text-xs font-semibold  ">
                  Team
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold  ">
                  Team lead
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold  ">
                  Members
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold  ">
                  Leadership
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold   text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => {
                const colorDef =
                  TEAM_COLORS.find((c) => c.id === team.color) ||
                  TEAM_COLORS[0];
                const lead = getTeamLead(team);
                const otherCount = getTeamMembers(team).length;

                return (
                  <TableRow
                    key={team.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                            colorDef.light,
                          )}
                        >
                          <Users2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate font-display">
                            {team.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-xs">
                            {team.description || "No description provided"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      {lead ? (
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <UserAvatar name={lead.user.name} size="sm" />
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning text-white flex items-center justify-center text-[8px]">
                              <Crown className="w-2 h-2" />
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {lead.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {lead.user.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-warning italic">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          No Lead Assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {team.members.length} members
                        </span>
                        {lead && otherCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            1 lead · {otherCount}{" "}
                            {otherCount === 1 ? "member" : "members"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      {lead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-success/10 text-success border border-success/20">
                          <Check className="w-3 h-3" />
                          Lead Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-warning/10 text-warning border border-warning/20">
                          <ShieldAlert className="w-3 h-3" />
                          Lead Vacancy
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignLead(team)}
                          className="h-7 text-xs font-semibold rounded-lg border-border/80 hover:bg-card cursor-pointer"
                        >
                          {lead ? "Change Lead" : "Designate Lead"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(team)}
                          className="h-7 text-xs font-semibold rounded-lg hover:bg-muted cursor-pointer"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT TEAM MODAL (WITH HIERARCHY LEAD SELECTOR)          */}
      {/* ========================================================================= */}
      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingTeamId ? `Edit team: ${name}` : "Create team"}
        description="Give the team a name, add people, and choose a lead."
        icon={<Users2 className="w-5 h-5" />}
        iconVariant="primary"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="team-form"
              disabled={isSaving}
              className="rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
            >
              {isSaving
                ? "Saving..."
                : editingTeamId
                  ? "Save changes"
                  : "Create team"}
            </Button>
          </>
        }
      >
        <form
          id="team-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-name" className="text-xs font-semibold">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Engineering, QA Core, Product Ops"
              className={cn(
                "h-9 text-xs rounded-lg",
                attemptedSubmit &&
                  !name.trim() &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="team-desc" className="text-xs font-semibold">
              Description
            </Label>
            <Textarea
              id="team-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team work on?"
              className="text-xs min-h-[60px] rounded-lg resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Team color</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs",
                    c.dot,
                    selectedColor === c.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                      : "opacity-75 hover:opacity-100",
                  )}
                  aria-label={c.label}
                  aria-pressed={selectedColor === c.id}
                  title={c.label}
                >
                  {selectedColor === c.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Leadership & Hierarchy Section */}
          <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-warning" />
                <Label className="text-xs font-semibold text-foreground">
                  Team lead
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                One lead per team
              </span>
            </div>

            {selectedUserIds.length > 0 ? (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedLeadUserId ? (
                    (() => {
                      const lead = users.find(
                        (u) => u.id === selectedLeadUserId,
                      );
                      return lead ? (
                        <>
                          <UserAvatar
                            name={lead.name}
                            size="sm"
                            className="ring-2 ring-warning/50"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {lead.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {lead.email}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Lead user selected
                        </span>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="w-4 h-4 text-warning" />
                      <span>
                        No team lead selected yet. Pick a member below.
                      </span>
                    </div>
                  )}
                </div>

                {selectedLeadUserId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLeadUserId(null)}
                    className="h-6 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                  >
                    Clear Lead
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground text-center">
                Select members below to designate a Team Lead.
              </div>
            )}
          </div>

          {/* Member Selection Roster */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-xs font-semibold">
                Team members ({selectedUserIds.length} selected)
              </Label>
              <div className="w-full sm:w-48">
                <Input
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Filter users..."
                  className="h-7 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-lg border border-border/80 bg-muted/20 p-2 divide-y divide-border/40 custom-scrollbar">
              {filteredModalUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isLead = selectedLeadUserId === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        toggleUser(u.id);
                      }
                    }}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Include ${u.name} in team`}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-primary-light text-foreground"
                        : "hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar name={u.name} size="sm" />
                        {isLead && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning text-white flex items-center justify-center text-[8px]">
                            <Crown className="w-2 h-2" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {u.name}
                          </span>
                          {isLead && (
                            <span className="px-1.5 py-0.2 rounded text-xs font-mono font-semibold bg-warning/20 text-warning border border-warning/30 ">
                              Team lead
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => setAsLead(u.id, e)}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-semibold border transition-colors cursor-pointer",
                            isLead
                              ? "bg-warning text-white border-warning/30"
                              : "bg-muted text-muted-foreground border-border/80 hover:bg-warning/10 hover:text-warning hover:border-warning/40",
                          )}
                          title={
                            isLead
                              ? "Remove as Team Lead"
                              : "Designate as Team Lead"
                          }
                        >
                          {isLead ? "Lead" : "Make Lead"}
                        </button>
                      )}

                      <div
                        className={cn(
                          "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-card",
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK DESIGNATE TEAM LEAD MODAL                                  */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(assignLeadTeam)}
        onOpenChange={(open) => !open && setAssignLeadTeam(null)}
        title={
          assignLeadTeam
            ? `Assign team lead: ${assignLeadTeam.name}`
            : "Assign team lead"
        }
        description="Choose a member to lead this team."
        icon={<Crown className="w-5 h-5 text-warning" />}
        iconVariant="primary"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignLeadTeam(null)}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isAssigningLead}
              onClick={handleSaveQuickLead}
              className="rounded-lg text-xs font-semibold bg-warning hover:bg-warning text-white cursor-pointer"
            >
              {isAssigningLead ? "Saving..." : "Save Team Lead"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Select a member to serve as the Team Lead:</span>
            {quickLeadUserId && (
              <button
                type="button"
                onClick={() => setQuickLeadUserId(null)}
                className="text-xs text-destructive hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-border/80 bg-muted/20 p-2 divide-y divide-border/40 custom-scrollbar">
            {assignLeadTeam?.members && assignLeadTeam.members.length > 0 ? (
              assignLeadTeam.members.map((m) => {
                const isSelected = quickLeadUserId === m.userId;
                return (
                  <div
                    key={m.userId}
                    onClick={() => setQuickLeadUserId(m.userId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setQuickLeadUserId(m.userId);
                      }
                    }}
                    tabIndex={0}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Assign ${m.user.name} as lead`}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-warning/10 text-foreground border border-warning/30"
                        : "hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={m.user.name} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">
                          {m.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          {m.user.email}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border transition-colors",
                        isSelected
                          ? "bg-warning border-warning/30 text-white shadow-2xs"
                          : "border-border bg-card",
                      )}
                    >
                      {isSelected && <Crown className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                This team has no assigned members yet. Please add members first
                using &ldquo;Edit Roster&rdquo;.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Team Dialog */}
      <ConfirmDialog
        open={Boolean(teamToDelete)}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title={`Delete Team: ${teamToDelete?.name}?`}
        description="Are you sure you want to delete this team? Member user accounts will not be affected."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Team"}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
