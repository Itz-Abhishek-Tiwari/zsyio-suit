"use client";

import { Button, ROLE_COLOR_STYLES, ROLE_ICONS_MAP } from "@zsyio/ui";
import { ALL_ACTIONS, ACTION_GROUPS, canAccessApp, type AppId } from "@zsyio/auth/permissions";
import { cn } from "@zsyio/ui";
import type { CustomRole } from "@zsyio/types";
import {
  Shield,
  Users,
  Pencil,
  Trash2,
  FolderKanban,
  BookOpen,
  Users2,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";

export interface RolesCardGridProps {
  roles: CustomRole[];
  onEdit: (role: CustomRole) => void;
  onDelete: (role: CustomRole) => void;
  onConfigureInMatrix?: (role: CustomRole) => void;
}

const APPS_CONFIG: { id: AppId; name: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "pms", name: "PMS", icon: FolderKanban, color: "text-destructive bg-destructive/10 border-destructive/30" },
  { id: "notes", name: "Notes", icon: BookOpen, color: "text-notion-purple-fg bg-notion-purple-fg/10 border-notion-purple-fg/30" },
  { id: "hrms", name: "HRMS", icon: Users2, color: "text-notion-blue-fg bg-notion-blue-fg/10 border-notion-blue-fg/30" },
  { id: "admin", name: "Admin", icon: ShieldCheck, color: "text-warning bg-warning/10 border-warning/30" },
];

export function RolesCardGrid({
  roles,
  onEdit,
  onDelete,
  onConfigureInMatrix,
}: RolesCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {roles.map((role) => {
        const IconComponent = ROLE_ICONS_MAP[role.icon || "shield"] ?? Shield;
        const colorKey = role.color || "purple";
        const colorStyle = ROLE_COLOR_STYLES[colorKey] ?? ROLE_COLOR_STYLES.purple;
        const perms = (role.permissions as string[]) || [];
        const percent = Math.round((perms.length / ALL_ACTIONS.length) * 100);

        // Calculate module clearance summaries for friendly display
        const moduleSummaries = ACTION_GROUPS.filter((g) => g.id !== "apps")
          .map((group) => {
            const groupActionIds = group.actions.map((a) => a.id);
            const activeInGroup = groupActionIds.filter((a) => perms.includes(a)).length;
            return {
              id: group.id,
              title: group.title,
              total: groupActionIds.length,
              active: activeInGroup,
              isFull: activeInGroup === groupActionIds.length,
              isNone: activeInGroup === 0,
            };
          })
          .filter((m) => !m.isNone);

        return (
          <div
            key={role.id}
            className="rounded-lg border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex flex-col gap-4">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-md flex items-center justify-center border shrink-0 shadow-2xs font-semibold text-sm",
                      colorStyle.badgeClass
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {role.label}
                      </h3>
                      {role.isSystem ? (
                        <span className="text-xs font-semibold  px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          System
                        </span>
                      ) : (
                        <span className="text-xs font-semibold  px-1.5 py-0.5 rounded bg-primary-light text-primary border border-primary/20">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate block mt-0.5">
                      Role ID: {role.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(role)}
                    className="w-8 h-8 rounded-md hover:bg-muted cursor-pointer"
                    title="Edit role details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(role)}
                      className="w-8 h-8 rounded-md hover:bg-destructive/10 text-destructive cursor-pointer"
                      title="Delete custom role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground min-h-[32px] line-clamp-2 leading-relaxed">
                {role.description || "Standard role configuration with configured workspace access."}
              </p>

              {/* Application Suite Clearance */}
              <div className="rounded-md bg-surface-subtle/80 p-3 border border-border/70 flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground  ">
                  Authorized Applications
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {APPS_CONFIG.map((app) => {
                    const hasAccess = canAccessApp(role.name, app.id, perms);
                    const AppIcon = app.icon;

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-md border text-xs transition-all",
                          hasAccess
                            ? cn("border font-medium shadow-2xs", app.color)
                            : "bg-muted/40 border-border/50 text-muted-foreground/60 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AppIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate text-xs font-semibold">{app.name}</span>
                        </div>
                        {hasAccess ? (
                          <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clearance Scope & Progress */}
              <div className="rounded-md bg-muted/30 p-3 border border-border/70 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Access Scope</span>
                  <span className="font-semibold text-primary tabular-nums">
                    {perms.length} / {ALL_ACTIONS.length} capabilities ({percent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-sm bg-muted overflow-hidden border border-border/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-150",
                      percent > 70
                        ? "bg-success"
                        : percent > 35
                        ? "bg-primary"
                        : "bg-warning"
                    )}
                    style={{ width: `${Math.max(percent, 4)}%` }}
                  />
                </div>

                {/* Module badges */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {moduleSummaries.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No module permissions granted yet
                    </span>
                  ) : (
                    <>
                      {moduleSummaries.slice(0, 4).map((mod) => (
                        <span
                          key={mod.id}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-md border font-medium",
                            mod.isFull
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-surface-elevated text-foreground/80 border-border/80"
                          )}
                        >
                          {mod.title.split("&")[0].trim()} ({mod.active}/{mod.total})
                        </span>
                      ))}
                      {moduleSummaries.length > 4 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                          +{moduleSummaries.length - 4} more modules
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>
                  <strong className="text-foreground font-semibold">
                    {role._count?.users || 0}
                  </strong>{" "}
                  user(s) assigned
                </span>
              </div>
              <button
                type="button"
                onClick={() => onConfigureInMatrix?.(role) ?? onEdit(role)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                <span>Manage Permissions</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
