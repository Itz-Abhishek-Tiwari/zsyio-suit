"use client";

import { Fragment, useState, useMemo } from "react";
import { UserRoleBadge } from "@zsyio/ui";
import { ACTION_GROUPS, type Action, type ActionGroup } from "@zsyio/auth/permissions";
import { cn } from "@zsyio/ui";
import type { CustomRole } from "@zsyio/types";
import {
  Sliders,
  Pencil,
  Check,
  Plus,
  Lock,
  LayoutGrid,
  LayoutDashboard,
  Building2,
  Layers,
  CheckSquare,
  BarChart3,
  UserCog,
  Clock,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FolderKanban,
  BookOpen,
  Users2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  apps: LayoutGrid,
  dashboard: LayoutDashboard,
  notes: BookOpen,
  clients: Building2,
  products: Layers,
  tasks: CheckSquare,
  reports: BarChart3,
  teams: Users2,
  users: UserCog,
  roles: Sliders,
  timesheet: Clock,
  sales: TrendingUp,
};

const APP_ACTION_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  "app:access:pms": {
    icon: FolderKanban,
    color: "text-destructive bg-destructive/10 border-destructive/30",
    badge: "Zsyio Flow",
  },
  "app:access:notes": {
    icon: BookOpen,
    color: "text-notion-purple-fg bg-notion-purple-fg/10 border-notion-purple-fg/30",
    badge: "Zsyio Canvas",
  },
  "app:access:hrms": {
    icon: Users2,
    color: "text-notion-blue-fg bg-notion-blue-fg/10 border-notion-blue-fg/30",
    badge: "Zsyio People",
  },
  "app:access:admin": {
    icon: ShieldCheck,
    color: "text-destructive bg-destructive/10 border-destructive/30",
    badge: "Zsyio Console",
  },
  "app:access:sales": {
    icon: TrendingUp,
    color: "text-notion-purple-fg bg-notion-purple-fg/10 border-notion-purple-fg/30",
    badge: "Zsyio Pulse",
  },
};

export interface RolesMatrixViewProps {
  roles: CustomRole[];
  filteredActionGroups: ActionGroup[];
  savingKeys: Record<string, boolean>;
  onEdit: (role: CustomRole) => void;
  onToggleMatrix: (role: CustomRole, actionId: Action) => void;
  onToggleCategory: (role: CustomRole, groupActionIds: Action[], categoryId: string) => void;
}

export function RolesMatrixView({
  roles,
  filteredActionGroups,
  savingKeys,
  onEdit,
  onToggleMatrix,
  onToggleCategory,
}: RolesMatrixViewProps) {
  // By default, keep "apps" open and collapse other modules so users are not overwhelmed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    return new Set(ACTION_GROUPS.filter((g) => g.id !== "apps").map((g) => g.id));
  });
  // Show technical code IDs like "dashboard:note:create" (false by default for clean human labels)
  const [showTechnicalIds, setShowTechnicalIds] = useState(false);

  // If only 1 or 2 groups are displayed (e.g. from tab filtering), auto-expand for instant view
  const isFiltering = filteredActionGroups.length <= 2;
  const activeCollapsed = useMemo(() => {
    if (isFiltering) return new Set<string>();
    return collapsedGroups;
  }, [isFiltering, collapsedGroups]);

  const allCollapsed = useMemo(() => {
    return (
      filteredActionGroups.length > 0 &&
      filteredActionGroups.every((g) => activeCollapsed.has(g.id))
    );
  }, [filteredActionGroups, activeCollapsed]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(filteredActionGroups.map((g) => g.id)));
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-xs overflow-hidden">
      {/* Matrix Controls & Explanatory Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-surface-subtle/60 border-b border-border/80 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 hover:border-primary/40 bg-card hover:bg-surface-elevated text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
          >
            {allCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                <span>Expand All Modules</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Collapse All Modules</span>
              </>
            )}
          </button>

          {/* Friendly Legend for Non-Technical Users */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground border-l border-border/80 pl-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>Full Access</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span>Partial Access</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span>No Access</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTechnicalIds(!showTechnicalIds)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer shadow-2xs",
              showTechnicalIds
                ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                : "border-border/80 bg-card hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
            )}
            title="Toggle display of technical permission strings for developers"
          >
            {showTechnicalIds ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showTechnicalIds ? "Hide Developer IDs" : "Show Developer IDs"}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs table-fixed">
          <colgroup>
            <col className="w-auto min-w-[320px]" />
            {roles.map((role) => (
              <col key={role.id} className="w-36 min-w-[130px]" />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 backdrop-blur-xs text-xs font-semibold text-muted-foreground   sticky top-0 z-10 shadow-2xs">
              <th className="py-4 px-4 sm:px-6 border-r border-border/40">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Capabilities &amp; Permissions</span>
                </div>
              </th>
              {roles.map((role) => (
                <th key={role.id} className="py-4 px-3 text-center border-r border-border/40 last:border-r-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <UserRoleBadge customRole={role} showIcon />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                      <span className="font-semibold text-foreground/80">{role._count?.users || 0}</span>
                      <span>user(s)</span>
                      {!role.isSystem && (
                        <button
                          type="button"
                          onClick={() => onEdit(role)}
                          className="p-1 hover:text-primary transition-colors cursor-pointer rounded hover:bg-muted"
                          title="Edit role"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredActionGroups.map((group) => {
              const CategoryIcon = CATEGORY_ICONS[group.id] ?? Sliders;
              const groupActionIds = group.actions.map((a) => a.id);
              const isCollapsed = activeCollapsed.has(group.id);
              const isAppGroup = group.id === "apps";

              return (
                <Fragment key={group.id}>
                  {/* Category Accordion Header */}
                  <tr
                    className={cn(
                      "transition-colors border-y border-border/80 group/cat",
                      isAppGroup
                        ? "bg-primary/5 hover:bg-primary/10 border-primary/20"
                        : "bg-surface-subtle/80 hover:bg-surface-subtle"
                    )}
                  >
                    <td
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="py-3 px-4 sm:px-6 border-r border-border/40 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground group-hover/cat:text-foreground transition-colors shrink-0">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>

                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs",
                            isAppGroup
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          <CategoryIcon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-foreground   group-hover/cat:text-primary transition-colors">
                              {group.title}
                            </span>
                            {isAppGroup ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold  ">
                                App Access Gateway
                              </span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-mono font-medium">
                                {group.actions.length} {group.actions.length === 1 ? "action" : "actions"}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {group.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {roles.map((role) => {
                      const groupKey = `${role.id}:cat:${group.id}`;
                      const isGroupSaving = Boolean(savingKeys[groupKey]);
                      const currentPerms = (role.permissions as Action[]) || [];
                      const activeInGroup = groupActionIds.filter((a) => currentPerms.includes(a)).length;
                      const allSelected = activeInGroup === groupActionIds.length;
                      const isLockedAdmin = role.name === "ADMIN" && group.id === "dashboard";

                      return (
                        <td
                          key={role.id}
                          className="py-3 px-3 text-center align-middle border-r border-border/40 last:border-r-0"
                        >
                          <button
                            type="button"
                            disabled={isLockedAdmin || isGroupSaving}
                            onClick={() => onToggleCategory(role, groupActionIds, group.id)}
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer border shadow-2xs font-semibold",
                              allSelected
                                ? "bg-success/15 text-success border-success/30 hover:bg-success/25"
                                : activeInGroup > 0
                                ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                                : "bg-muted/40 text-muted-foreground/60 border-border/60 hover:text-foreground hover:border-border hover:bg-surface-elevated",
                              isGroupSaving && "opacity-75 cursor-wait animate-pulse",
                              isLockedAdmin && "cursor-not-allowed opacity-60"
                            )}
                            title={
                              isLockedAdmin
                                ? "Required Administrator clearance"
                                : allSelected
                                ? `Click to deselect all in ${group.title} for ${role.label}`
                                : `Click to select all in ${group.title} for ${role.label}`
                            }
                          >
                            {allSelected ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Full ({group.actions.length})</span>
                              </>
                            ) : activeInGroup > 0 ? (
                              <span>{activeInGroup} of {group.actions.length}</span>
                            ) : (
                              <span>No Access</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Category Action Rows (Hidden if Collapsed) */}
                  {!isCollapsed &&
                    group.actions.map((actionDef) => {
                      const appMeta = APP_ACTION_META[actionDef.id];
                      const ActionIcon = appMeta?.icon;

                      return (
                        <tr
                          key={actionDef.id}
                          className="hover:bg-surface-subtle/40 transition-colors group/row"
                        >
                          <td className="py-3 px-4 sm:px-6 pl-10 border-r border-border/40">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ActionIcon && (
                                <span className={cn("p-1 rounded-md border shrink-0", appMeta.color)}>
                                  <ActionIcon className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span className="font-semibold text-foreground text-xs group-hover/row:text-primary transition-colors">
                                {actionDef.label}
                              </span>
                              {showTechnicalIds && (
                                <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-muted/80 border border-border/70 text-muted-foreground">
                                  {actionDef.id}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {actionDef.description}
                            </div>
                          </td>

                          {roles.map((role) => {
                            const cellKey = `${role.id}:${actionDef.id}`;
                            const isCellSaving = Boolean(savingKeys[cellKey]);
                            const currentPerms = (role.permissions as Action[]) || [];
                            const hasPerm = currentPerms.includes(actionDef.id);
                            const isLockedAdmin =
                              role.name === "ADMIN" &&
                              (actionDef.id === "user:manage" ||
                                actionDef.id === "role:manage" ||
                                actionDef.id === "dashboard:view" ||
                                actionDef.id === "app:access:admin");

                            return (
                              <td
                                key={role.id}
                                className="py-3 px-3 text-center align-middle border-r border-border/40 last:border-r-0 group/td"
                              >
                                <button
                                  type="button"
                                  disabled={isLockedAdmin || isCellSaving}
                                  onClick={() => onToggleMatrix(role, actionDef.id)}
                                  className={cn(
                                    "w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all duration-150 cursor-pointer border shadow-2xs font-semibold text-xs",
                                    hasPerm
                                      ? "bg-primary text-primary-foreground border-primary shadow-xs hover:opacity-90  "
                                      : "bg-muted/40 border-border/70 text-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10 hover:text-primary  ",
                                    isCellSaving && "opacity-75 cursor-wait",
                                    isLockedAdmin && "bg-muted/80 text-muted-foreground border-border/80 cursor-not-allowed opacity-75 "
                                  )}
                                  title={
                                    isLockedAdmin
                                      ? "Locked for platform security (Required Admin clearance)"
                                      : hasPerm
                                      ? `Enabled: Click to revoke "${actionDef.label}" from ${role.label}`
                                      : `Disabled: Click to grant "${actionDef.label}" to ${role.label}`
                                  }
                                >
                                  {isLockedAdmin ? (
                                    <Lock className="w-3 h-3 text-muted-foreground" />
                                  ) : hasPerm ? (
                                    <Check className={cn("w-3.5 h-3.5 stroke-[2.5]", isCellSaving && "animate-pulse")} />
                                  ) : (
                                    <Plus className={cn("w-3 h-3 opacity-0 group-hover/td:opacity-70 transition-opacity", isCellSaving && "opacity-40 animate-pulse")} />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

