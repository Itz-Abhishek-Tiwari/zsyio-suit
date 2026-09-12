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
  PageHeader,
  ConfirmDialog,
  SearchInput,
  UserAvatar,
  UserAvatarGroup,
  EmptyState,
  KpiCard,
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
  UserCheck,
  Users,
  Crown,
  LayoutGrid,
  Network,
  ListTree,
  Building2,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import type { Team } from "@zsyio/types";

const TEAM_COLORS = [
  { id: "purple", label: "Purple", dot: "bg-purple-500", border: "border-purple-500/30", light: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { id: "blue", label: "Blue", dot: "bg-blue-500", border: "border-blue-500/30", light: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { id: "emerald", label: "Emerald", dot: "bg-emerald-500", border: "border-emerald-500/30", light: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { id: "amber", label: "Amber", dot: "bg-amber-500", border: "border-amber-500/30", light: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { id: "pink", label: "Pink", dot: "bg-pink-500", border: "border-pink-500/30", light: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  { id: "gray", label: "Gray", dot: "bg-gray-500", border: "border-gray-500/30", light: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
];

type ViewMode = "grid" | "hierarchy" | "matrix";

export function TeamsView() {
  const { data: teams = [], isLoading } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedLeadUserId, setSelectedLeadUserId] = useState<string | null>(null);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Quick Lead Assignment Modal
  const [assignLeadTeam, setAssignLeadTeam] = useState<Team | null>(null);
  const [quickLeadUserId, setQuickLeadUserId] = useState<string | null>(null);
  const [isAssigningLead, setIsAssigningLead] = useState(false);

  // Delete Dialog State
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);

  // Helper to find Team Lead
  const getTeamLead = (team: Team) => {
    return team.members.find((m) => m.role === "LEAD" || m.role === "TEAM_LEAD");
  };

  const getTeamMembers = (team: Team) => {
    return team.members.filter((m) => m.role !== "LEAD" && m.role !== "TEAM_LEAD");
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter((team) => {
      const matchName = team.name.toLowerCase().includes(q);
      const matchDesc = team.description?.toLowerCase().includes(q) ?? false;
      const matchMember = team.members.some(
        (m) =>
          m.user.name.toLowerCase().includes(q) ||
          m.user.email?.toLowerCase().includes(q) ||
          m.user.role.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      );
      return matchName || matchDesc || matchMember;
    });
  }, [teams, searchQuery]);

  const totalAssignedMembers = useMemo(() => {
    const uniqueUserIds = new Set<string>();
    teams.forEach((t) => t.members.forEach((m) => uniqueUserIds.add(m.userId)));
    return uniqueUserIds.size;
  }, [teams]);

  const teamsWithLeadsCount = useMemo(() => {
    return teams.filter((t) => t.members.some((m) => m.role === "LEAD" || m.role === "TEAM_LEAD")).length;
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

    const currentLead = team.members.find((m) => m.role === "LEAD" || m.role === "TEAM_LEAD");
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
          : `Removed Team Lead from "${assignLeadTeam.name}".`
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
        (u.email && u.email.toLowerCase().includes(q))
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
      role: userId === selectedLeadUserId ? "LEAD" : memberRoles[userId] || "MEMBER",
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
      toast.error(editingTeamId ? "Failed to update team." : "Failed to create team.");
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
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Teams &amp; Organizational Hierarchy"
        description="Structure company departments, assign team leads and managers, and track departmental reporting hierarchies."
        eyebrow="Organization Structure"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="font-bold text-xs h-9 px-4 gap-1.5 shadow-xs rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Team</span>
            </Button>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Teams"
          value={teams.length}
          icon={<Users2 className="w-5 h-5" />}
          variant="primary"
        />
        <KpiCard
          label="Team Leads Designated"
          value={`${teamsWithLeadsCount} / ${teams.length}`}
          icon={<Crown className="w-5 h-5 text-amber-500" />}
          variant="amber"
        />
        <KpiCard
          label="Assigned Members"
          value={totalAssignedMembers}
          icon={<UserCheck className="w-5 h-5" />}
          variant="sky"
        />
        <KpiCard
          label="Total Accounts"
          value={users.length}
          icon={<Users className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* Toolbar: View Mode Switcher + Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-subtle border border-border/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("hierarchy")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              viewMode === "hierarchy"
                ? "bg-card text-foreground shadow-2xs font-bold border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Network className="w-3.5 h-3.5 text-primary" />
            <span>Org Hierarchy Tree</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-card text-foreground shadow-2xs font-bold border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
            <span>Squad Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              viewMode === "matrix"
                ? "bg-card text-foreground shadow-2xs font-bold border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListTree className="w-3.5 h-3.5 text-amber-500" />
            <span>Leadership Matrix</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 flex-1 md:max-w-md">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search teams by name, lead, or member..."
            />
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
            <span className="font-semibold text-foreground">{filteredTeams.length}</span> of {teams.length} teams
          </div>
        </div>
      </div>

      {/* Content Rendering based on ViewMode */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl border border-border/80 bg-card p-5" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching teams found" : "No teams configured"}
          description={
            searchQuery
              ? `No teams or leaders match "${searchQuery}". Try adjusting your search query.`
              : "Create organizational squads and designate team leads to structure your company hierarchy."
          }
          action={
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 rounded-xl font-bold bg-primary hover:bg-primary-hover text-primary-foreground">
              <Plus className="w-4 h-4" />
              Create First Team
            </Button>
          }
        />
      ) : viewMode === "hierarchy" ? (
        /* ========================================================================= */
        /* VIEW 1: ORGANIZATIONAL HIERARCHY TREE VIEW                                 */
        /* ========================================================================= */
        <div className="flex flex-col gap-6">
          {/* Executive Command / Workspace Root Node */}
          <div className="flex flex-col items-center">
            <div className="p-4 sm:p-5 rounded-2xl bg-card border-2 border-primary/40 shadow-md flex items-center gap-4 max-w-lg w-full relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-black text-lg shadow-sm shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-foreground truncate font-display">
                    Company Headquarters
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    Tier 0 • Executive
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  Central organizational authority • {teams.length} Functional Departments • {totalAssignedMembers} Members
                </p>
              </div>
            </div>

            {/* Connecting Vertical Trunk Line */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-primary/40 via-border to-border/80" />
          </div>

          {/* Department Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {filteredTeams.map((team) => {
              const colorDef = TEAM_COLORS.find((c) => c.id === team.color) || TEAM_COLORS[0];
              const lead = getTeamLead(team);
              const members = getTeamMembers(team);

              return (
                <div
                  key={team.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col gap-4 hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Subtle Accent Glow Top Border */}
                  <div
                    className={cn("absolute top-0 inset-x-0 h-1", colorDef.dot)}
                  />

                  {/* Department Node Header */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs",
                          colorDef.light
                        )}
                      >
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate font-display">
                          {team.name}
                        </h4>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {team.members.length} Total Members • Tier 1 Department
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(team)}
                        className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit Team Roster"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTeamToDelete({ id: team.id, name: team.name })}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Tier 1.5: Department Leadership Node */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
                      <span className="flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        <Crown className="w-3 h-3 text-amber-500" />
                        Department Leadership
                      </span>
                      {lead && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignLead(team)}
                          className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                        >
                          Change Lead
                        </button>
                      )}
                    </div>

                    {lead ? (
                      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between gap-3 shadow-2xs relative overflow-hidden group/lead">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <UserAvatar name={lead.user.name} size="md" className="ring-2 ring-amber-500/40" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                              <Crown className="w-2.5 h-2.5" />
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-foreground truncate">
                                {lead.user.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 uppercase">
                                Team Lead
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono truncate">
                              {lead.user.email}
                            </span>
                            <span className="text-[10px] text-muted-foreground/75 capitalize mt-0.5 truncate">
                              {lead.user.role.toLowerCase()}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAssignLead(team)}
                          className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-amber-500/15 rounded-lg opacity-80 group-hover/lead:opacity-100 transition-opacity cursor-pointer shrink-0"
                        >
                          Reassign
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              No Team Lead Assigned
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Appoint a department head to oversee tasks.
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAssignLead(team)}
                          className="h-7 px-2.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer shrink-0"
                        >
                          + Assign Lead
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Tier 2: Reporting Squad Members (Tree branch styling) */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
                      <span className="uppercase tracking-wider text-[10px]">
                        Reporting Members ({members.length})
                      </span>
                      {members.length > 0 && (
                        <UserAvatarGroup
                          users={members.map((m) => m.user)}
                          max={4}
                          size="xs"
                        />
                      )}
                    </div>

                    {members.length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {members.map((m) => (
                          <div
                            key={m.userId}
                            className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle/60 border border-border/60 text-xs hover:bg-surface-subtle transition-colors group/member"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar name={m.user.name} size="sm" className="shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate text-xs">
                                  {m.user.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono truncate">
                                  {m.user.email}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border",
                                  m.role === "CO_LEAD"
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                    : "bg-muted text-muted-foreground border-border/60"
                                )}
                              >
                                {m.role === "CO_LEAD" ? "Co-Lead" : m.role.toLowerCase()}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => setAsLead(m.userId, e)}
                                title="Promote to Team Lead"
                                className="w-6 h-6 rounded-md hover:bg-amber-500/15 text-muted-foreground hover:text-amber-500 opacity-0 group-hover/member:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground/60 italic">
                        No subordinate squad members assigned yet.
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[10px]">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(team)}
                      className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg gap-1 transition-colors cursor-pointer group/btn"
                    >
                      <span>Manage Roster</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ========================================================================= */
        /* VIEW 2: STANDARD SQUAD CARDS VIEW                                          */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const colorDef = TEAM_COLORS.find((c) => c.id === team.color) || TEAM_COLORS[0];
            const lead = getTeamLead(team);
            const otherMembers = getTeamMembers(team);
            const maxVisible = 4;
            const visibleMembers = otherMembers.slice(0, maxVisible);
            const remainingCount = Math.max(0, otherMembers.length - maxVisible);

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs",
                          colorDef.light
                        )}
                      >
                        <Users2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-foreground truncate font-display">
                            {team.name}
                          </h3>
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs shrink-0",
                              colorDef.light
                            )}
                          >
                            {team.members.length} {team.members.length === 1 ? "member" : "members"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium truncate block mt-0.5">
                          Department Roster
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(team)}
                        className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit Team"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTeamToDelete({ id: team.id, name: team.name })}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {team.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                      {team.description}
                    </p>
                  ) : (
                    <div className="min-h-[32px] flex items-center">
                      <span className="text-xs text-muted-foreground/40 italic">
                        No description provided
                      </span>
                    </div>
                  )}

                  {/* Prominent Team Lead Section */}
                  <div className="p-3 rounded-xl bg-surface-subtle border border-border/80 flex items-center justify-between gap-3">
                    {lead ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar name={lead.user.name} size="sm" />
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] shadow-xs">
                            <Crown className="w-2 h-2" />
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-foreground truncate">
                              {lead.user.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                              Lead
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {lead.user.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Crown className="w-3.5 h-3.5 text-amber-500/40" />
                        <span className="text-[11px] italic">No Team Lead assigned</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssignLead(team)}
                      className="h-6 px-2 text-[10px] font-semibold rounded-md border-border/80 hover:bg-card cursor-pointer shrink-0"
                    >
                      {lead ? "Change" : "Assign"}
                    </Button>
                  </div>

                  {/* Roster Section: Avatar Stack + Clean Chips */}
                  <div className="pt-2 border-t border-border/50 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80 text-[11px] uppercase tracking-wider">
                        Squad Members ({otherMembers.length})
                      </span>
                      {otherMembers.length > 0 && (
                        <UserAvatarGroup
                          users={otherMembers.map((m) => m.user)}
                          max={5}
                          size="xs"
                        />
                      )}
                    </div>

                    {otherMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {visibleMembers.map((m) => (
                          <div
                            key={m.userId}
                            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-lg bg-surface-subtle border border-border/60 text-[11px] font-medium text-foreground shadow-2xs"
                            title={`${m.user.name} (${m.role})`}
                          >
                            <UserAvatar name={m.user.name} size="xs" className="shrink-0" />
                            <span className="truncate max-w-[110px]">{m.user.name}</span>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(team)}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted border border-border/60 text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          >
                            +{remainingCount} more
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50 italic py-0.5">
                        No subordinate members assigned yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Creation Date and Edit Roster Action */}
                <div className="pt-3.5 mt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono text-[10px]">
                    Created: {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(team)}
                    className="h-7 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg gap-1 transition-colors cursor-pointer group/btn"
                  >
                    <span>Edit Roster</span>
                    <span className="transition-transform group-hover/btn:translate-x-0.5">&rarr;</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: LEADERSHIP MATRIX VIEW                                            */
        /* ========================================================================= */
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Department / Squad
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Designated Team Lead
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Squad Size
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">
                  Hierarchy Status
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => {
                const colorDef = TEAM_COLORS.find((c) => c.id === team.color) || TEAM_COLORS[0];
                const lead = getTeamLead(team);
                const otherCount = getTeamMembers(team).length;

                return (
                  <TableRow key={team.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                            colorDef.light
                          )}
                        >
                          <Users2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-foreground truncate font-display">
                            {team.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-xs">
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
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px]">
                              <Crown className="w-2 h-2" />
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-foreground truncate">
                              {lead.user.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {lead.user.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 italic">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          No Lead Assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {team.members.length} members
                        </span>
                        {lead && otherCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            (1 Lead + {otherCount} Subordinates)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      {lead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          Lead Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
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
        title={editingTeamId ? `Edit Team: ${name}` : "Create New Team"}
        description="Organize workspace users into functional squads, assign leadership roles, and establish departmental hierarchies."
        icon={<Users2 className="w-5 h-5" />}
        iconVariant="primary"
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="team-form"
              disabled={isSaving}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
            >
              {isSaving ? "Saving..." : editingTeamId ? "Save Team Changes" : "Create Team"}
            </Button>
          </>
        }
      >
        <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                "h-9 text-xs rounded-xl",
                attemptedSubmit && !name.trim() && "border-destructive focus-visible:ring-destructive"
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
              placeholder="Brief summary of department responsibilities and reporting domain..."
              className="text-xs min-h-[60px] rounded-xl resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Team Accent Color</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs",
                    c.dot,
                    selectedColor === c.id ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-75 hover:opacity-100"
                  )}
                  title={c.label}
                >
                  {selectedColor === c.id && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Leadership & Hierarchy Section */}
          <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <Label className="text-xs font-bold text-foreground">
                  Designated Team Lead
                </Label>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Tier 1 Leadership Authority
              </span>
            </div>

            {selectedUserIds.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedLeadUserId ? (
                    (() => {
                      const lead = users.find((u) => u.id === selectedLeadUserId);
                      return lead ? (
                        <>
                          <UserAvatar name={lead.name} size="sm" className="ring-2 ring-amber-500/50" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-foreground truncate">
                              {lead.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {lead.email}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Lead user selected</span>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>No team lead selected yet. Pick a member below.</span>
                    </div>
                  )}
                </div>

                {selectedLeadUserId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLeadUserId(null)}
                    className="h-6 px-2 text-[10px] font-semibold text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                  >
                    Clear Lead
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg border border-dashed border-border/80 text-[11px] text-muted-foreground text-center">
                Select members below to designate a Team Lead.
              </div>
            )}
          </div>

          {/* Member Selection Roster */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Select Squad Members ({selectedUserIds.length} selected)
              </Label>
              <div className="w-48">
                <Input
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Filter users..."
                  className="h-7 text-[11px] rounded-lg"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-border/80 bg-muted/20 p-2 divide-y divide-border/40 custom-scrollbar">
              {filteredModalUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isLead = selectedLeadUserId === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs",
                      isSelected ? "bg-primary-light text-foreground" : "hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar name={u.name} size="sm" />
                        {isLead && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px]">
                            <Crown className="w-2 h-2" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate">{u.name}</span>
                          {isLead && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                              Team Lead 👑
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => setAsLead(u.id, e)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                            isLead
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-muted text-muted-foreground border-border/80 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/40"
                          )}
                          title={isLead ? "Remove as Team Lead" : "Designate as Team Lead"}
                        >
                          {isLead ? "👑 Lead" : "Make Lead"}
                        </button>
                      )}

                      <div
                        className={cn(
                          "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-card"
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
        title={assignLeadTeam ? `Designate Team Lead: ${assignLeadTeam.name}` : "Designate Team Lead"}
        description="Select the primary team leader who will oversee projects, assign tasks, and guide squad members."
        icon={<Crown className="w-5 h-5 text-amber-500" />}
        iconVariant="primary"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignLeadTeam(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isAssigningLead}
              onClick={handleSaveQuickLead}
              className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
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
                className="text-[11px] text-destructive hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-muted/20 p-2 divide-y divide-border/40 custom-scrollbar">
            {assignLeadTeam?.members && assignLeadTeam.members.length > 0 ? (
              assignLeadTeam.members.map((m) => {
                const isSelected = quickLeadUserId === m.userId;
                return (
                  <div
                    key={m.userId}
                    onClick={() => setQuickLeadUserId(m.userId)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs",
                      isSelected
                        ? "bg-amber-500/10 text-foreground border border-amber-500/30"
                        : "hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={m.user.name} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">{m.user.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                          {m.user.email}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border transition-colors",
                        isSelected
                          ? "bg-amber-500 border-amber-500 text-white shadow-2xs"
                          : "border-border bg-card"
                      )}
                    >
                      {isSelected && <Crown className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                This team has no assigned members yet. Please add members first using &ldquo;Edit Roster&rdquo;.
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
