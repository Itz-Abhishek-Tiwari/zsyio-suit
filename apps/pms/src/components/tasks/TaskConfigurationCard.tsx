"use client";

import React, { useState, useMemo } from "react";
import { Label } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { DatePicker } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@zsyio/ui";
import {
  ArrowDown,
  Equal,
  ArrowUp,
  Flame,
  Bug,
  LifeBuoy,
  Sliders,
  Rocket,
  Wrench,
  Paintbrush,
  Layers,
  Boxes,
  Building2,
  Plus,
  Loader2,
  Check,
  Tag,
  Users2,
  UserPlus,
  UserCheck,
  Search,
  X,
  Calendar,
} from "lucide-react";
import type { Priority, TaskType } from "@prisma/client";
import { type TaskStatus, TASK_STATUS_LIST } from "@zsyio/types";
import { TaskTagInput } from "./TaskTagInput";

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = TASK_STATUS_LIST.map((s) => ({
  value: s.status,
  label: s.label,
}));

export const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ReactNode }[] = [
  { value: "LOW", label: "Low", icon: <ArrowDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
  { value: "MEDIUM", label: "Medium", icon: <Equal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" /> },
  { value: "HIGH", label: "High", icon: <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" /> },
  { value: "CRITICAL", label: "Urgent", icon: <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" /> },
];

export const TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode }[] = [
  { value: "FEATURE", label: "Feature", icon: <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" /> },
  { value: "BUG", label: "Bug", icon: <Bug className="w-3.5 h-3.5 text-red-600 shrink-0" /> },
  { value: "SUPPORT_REQUEST", label: "Support", icon: <LifeBuoy className="w-3.5 h-3.5 text-blue-600 shrink-0" /> },
  { value: "CUSTOMIZATION", label: "Custom", icon: <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" /> },
  { value: "DEPLOYMENT", label: "Deploy", icon: <Rocket className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> },
  { value: "MAINTENANCE", label: "Infra", icon: <Wrench className="w-3.5 h-3.5 text-gray-600 shrink-0" /> },
  { value: "NEW_DESIGN", label: "New Design", icon: <Paintbrush className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> },
  { value: "DESIGN_CHANGE", label: "Design Changes", icon: <Layers className="w-3.5 h-3.5 text-pink-600 shrink-0" /> },
];

export interface TaskConfigurationUser {
  id: string;
  name: string;
  role: string;
  email?: string | null;
}

export interface TaskConfigurationTeam {
  id: string;
  name: string;
  members?: { userId: string }[] | unknown[];
}

export interface TaskConfigurationCardProps {
  title?: string;
  statusLabel?: string;
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  priority: Priority;
  onPriorityChange: (priority: Priority) => void;
  type: string;
  onTypeChange: (type: string) => void;
  customTaskTypes?: { id: string; name: string }[];
  onOpenCustomTypeModal?: () => void;
  canCreateCustomType?: boolean;
  selectedAssigneeIds: string[];
  onToggleAssignee: (userId: string) => void;
  allUsers?: TaskConfigurationUser[];
  selectedReviewerId?: string | null;
  selectedReviewerIds?: string[];
  onReviewerChange?: (reviewerId: string | null) => void;
  onToggleReviewer?: (userId: string) => void;
  selectedTeamIds: string[];
  onToggleTeam: (teamId: string) => void;
  allTeams?: TaskConfigurationTeam[];
  dueDate: string;
  onDueDateChange: (date: string) => void;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
  pendingAssigneeId?: string | null;
  pendingTeamId?: string | null;
}

export function TaskConfigurationCard({
  title = "Task Configuration",
  statusLabel = "Status",
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  type,
  onTypeChange,
  customTaskTypes = [],
  onOpenCustomTypeModal,
  canCreateCustomType = true,
  selectedAssigneeIds,
  onToggleAssignee,
  allUsers = [],
  selectedReviewerId,
  selectedReviewerIds,
  onReviewerChange,
  onToggleReviewer,
  selectedTeamIds,
  onToggleTeam,
  allTeams = [],
  dueDate,
  onDueDateChange,
  tags,
  onTagsChange,
  disabled = false,
  className,
  pendingAssigneeId,
  pendingTeamId,
}: TaskConfigurationCardProps) {
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers;
    const q = userSearchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [allUsers, userSearchQuery]);

  const filteredReviewerUsers = useMemo(() => {
    if (!reviewerSearchQuery.trim()) return allUsers;
    const q = reviewerSearchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [allUsers, reviewerSearchQuery]);

  const activeReviewerIds = useMemo(() => {
    if (selectedReviewerIds !== undefined) return selectedReviewerIds;
    return selectedReviewerId ? [selectedReviewerId] : [];
  }, [selectedReviewerIds, selectedReviewerId]);

  const selectedReviewers = useMemo(() => {
    return allUsers.filter((u) => activeReviewerIds.includes(u.id));
  }, [allUsers, activeReviewerIds]);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return allTeams;
    const q = teamSearchQuery.toLowerCase();
    return allTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTeams, teamSearchQuery]);

  const selectedUsers = useMemo(
    () => allUsers.filter((u) => selectedAssigneeIds.includes(u.id)),
    [allUsers, selectedAssigneeIds]
  );

  const selectedTeams = useMemo(
    () => allTeams.filter((t) => selectedTeamIds.includes(t.id)),
    [allTeams, selectedTeamIds]
  );

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs ${className ?? ""}`}>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3">
        {title}
      </h2>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-foreground">{statusLabel}</Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as TaskStatus)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-xs font-semibold rounded-xl border-border/70 bg-surface-subtle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((st) => (
              <SelectItem key={st.value} value={st.value} className="text-xs font-medium">
                {st.label}
              </SelectItem>
            ))}
            {!STATUS_OPTIONS.some((st) => st.value === status) && status && (
              <SelectItem value={status} className="text-xs font-medium">
                {status.replace(/^CUSTOM_/i, "").replace(/_/g, " ")}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-foreground">Priority</Label>
        <Select
          value={priority}
          onValueChange={(v) => onPriorityChange(v as Priority)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-xs font-semibold rounded-xl border-border/70 bg-surface-subtle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((pr) => (
              <SelectItem key={pr.value} value={pr.value} className="text-xs font-medium">
                <span className="inline-flex items-center gap-2">
                  {pr.icon}
                  <span>{pr.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">Task Type</Label>
          {canCreateCustomType && onOpenCustomTypeModal && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenCustomTypeModal}
              className="h-5 text-[11px] px-1.5 text-primary hover:text-primary gap-1 font-bold cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Custom
            </Button>
          )}
        </div>
        <Select
          value={type}
          onValueChange={onTypeChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 text-xs font-semibold rounded-xl border-border/70 bg-surface-subtle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((tp) => (
              <SelectItem key={tp.value} value={tp.value} className="text-xs font-medium">
                <span className="inline-flex items-center gap-2">
                  {tp.icon}
                  <span>{tp.label}</span>
                </span>
              </SelectItem>
            ))}
            {customTaskTypes
              .filter((ct) => !TYPE_OPTIONS.some((o) => o.value === ct.name))
              .map((ct) => (
                <SelectItem key={ct.id} value={ct.name} className="text-xs font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>{ct.name}</span>
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-foreground/80" /> Assignees
          </Label>
          <span className="text-[10px] font-mono text-muted-foreground">
            {selectedAssigneeIds.length === 0
              ? "None assigned"
              : `${selectedAssigneeIds.length} assigned`}
          </span>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {selectedUsers.map((u) => (
              <div
                key={u.id}
                className="inline-flex items-center gap-1.5 bg-surface-subtle hover:bg-muted/80 border border-border/80 text-foreground px-2.5 py-1 rounded-xl text-xs font-semibold shadow-2xs group transition-colors"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="truncate max-w-[130px] text-xs font-medium">{u.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onToggleAssignee(u.id)}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted-foreground/15 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!disabled && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-between text-xs font-semibold rounded-xl border-dashed border-border/80 hover:border-foreground/30 hover:bg-surface-subtle gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <UserPlus className="w-3.5 h-3.5 text-foreground/70" />
                  <span>{selectedAssigneeIds.length > 0 ? "Add another developer..." : "Select developers..."}</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={6}
              collisionPadding={16}
              className="w-72 p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80 bg-surface-elevated z-50"
            >
              <div className="flex items-center px-3 py-2.5 border-b border-border/70 gap-2 bg-surface-subtle/50">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
                  autoFocus
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isAssigned = selectedAssigneeIds.includes(u.id);
                    const isPending = pendingAssigneeId === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => onToggleAssignee(u.id)}
                        disabled={Boolean(pendingAssigneeId)}
                        className={`w-full flex items-center justify-between text-xs cursor-pointer py-2 px-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left group ${
                          isAssigned ? "bg-muted/70 text-foreground font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isAssigned
                              ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-foreground group-hover:text-primary">
                              {u.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase">
                              {u.role}
                            </span>
                          </div>
                        </div>

                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0 ml-2" />
                        ) : (
                          <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isAssigned
                              ? "bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-white dark:text-slate-900"
                              : "border-border/80"
                          }`}>
                            {isAssigned && <Check className="w-3 h-3" />}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground italic">
                    No developers found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-purple-600" /> Assigned Teams
          </Label>
          <span className="text-[10px] font-mono text-muted-foreground">
            {selectedTeamIds.length === 0
              ? "Optional"
              : `${selectedTeamIds.length} selected`}
          </span>
        </div>

        {selectedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {selectedTeams.map((team) => (
              <div
                key={team.id}
                className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-950 dark:text-purple-300 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-2xs group animate-fade-in"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate max-w-[130px] text-xs font-medium">{team.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onToggleTeam(team.id)}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!disabled && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-between text-xs font-semibold rounded-xl border-dashed border-border/80 hover:border-purple-500/40 hover:bg-surface-subtle gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>{selectedTeamIds.length > 0 ? "Add another team..." : "Select teams (optional)..."}</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={6}
              collisionPadding={16}
              className="w-72 p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80 bg-surface-elevated z-50"
            >
              <div className="flex items-center px-3 py-2.5 border-b border-border/70 gap-2 bg-surface-subtle/50">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
                  autoFocus
                />
                {teamSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeamSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
                {filteredTeams.length > 0 ? (
                  filteredTeams.map((team) => {
                    const isAssigned = selectedTeamIds.includes(team.id);
                    const isPending = pendingTeamId === team.id;
                    const memberCount = Array.isArray(team.members) ? team.members.length : 0;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => onToggleTeam(team.id)}
                        disabled={Boolean(pendingTeamId)}
                        className={`w-full flex items-center justify-between text-xs cursor-pointer py-2 px-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left group ${
                          isAssigned ? "bg-purple-500/10 text-purple-900 dark:text-purple-300 font-bold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-foreground group-hover:text-purple-600">
                              {team.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {memberCount} member{memberCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 shrink-0 ml-2" />
                        ) : (
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${isAssigned ? "bg-purple-600 border-purple-600 text-white" : "border-border/80"}`}>
                            {isAssigned && <Check className="w-3 h-3" />}
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground italic">
                    No teams found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Reviewer Section */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Reviewers
          </Label>
          <span className="text-[10px] font-mono text-muted-foreground">
            {selectedReviewers.length > 0 ? `${selectedReviewers.length} Assigned` : "Optional"}
          </span>
        </div>

        {selectedReviewers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {selectedReviewers.map((rev) => (
              <div
                key={rev.id}
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-2xs group transition-colors"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {rev.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="truncate max-w-[130px] text-xs font-medium">{rev.name}</span>
                {!disabled && (onToggleReviewer || onReviewerChange) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleReviewer) onToggleReviewer(rev.id);
                      else onReviewerChange?.(null);
                    }}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title={`Remove ${rev.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!disabled && (onToggleReviewer || onReviewerChange) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-between text-xs font-semibold rounded-xl border-dashed border-border/80 hover:border-emerald-500/40 hover:bg-surface-subtle gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {selectedReviewers.length > 0
                      ? `Select reviewers (${selectedReviewers.length} selected)...`
                      : "Select reviewers (optional)..."}
                  </span>
                </span>
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={6}
              collisionPadding={16}
              className="w-72 p-0 overflow-hidden shadow-2xl rounded-2xl border-border/80 bg-surface-elevated z-50"
            >
              <div className="flex items-center px-3 py-2.5 border-b border-border/70 gap-2 bg-surface-subtle/50">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search reviewers..."
                  value={reviewerSearchQuery}
                  onChange={(e) => setReviewerSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
                  autoFocus
                />
                {reviewerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReviewerSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
                {filteredReviewerUsers.length > 0 ? (
                  filteredReviewerUsers.map((u) => {
                    const isSelected = activeReviewerIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (onToggleReviewer) {
                            onToggleReviewer(u.id);
                          } else if (onReviewerChange) {
                            onReviewerChange(isSelected ? null : u.id);
                          }
                        }}
                        className={`w-full flex items-center justify-between text-xs cursor-pointer py-2 px-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left group ${
                          isSelected ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-foreground group-hover:text-primary">
                              {u.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase">
                              {u.role}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-border/80"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground italic">
                    No users found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {onTagsChange && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Tags (Custom)
          </Label>
          <TaskTagInput
            value={tags || []}
            onChange={onTagsChange}
            disabled={disabled}
            placeholder="Add custom tags..."
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
        <Label htmlFor="dueDate" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Due Date (Optional)
        </Label>
        <DatePicker
          id="dueDate"
          value={dueDate}
          onChange={onDueDateChange}
          disabled={disabled}
          placeholder="Select due date..."
        />
      </div>
    </div>
  );
}
