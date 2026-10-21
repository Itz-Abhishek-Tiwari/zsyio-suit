"use client";

import { Badge } from "@zsyio/ui";
import { FormattedText } from "@zsyio/editor";
import { StaggerItem } from "@zsyio/ui";
import { cn } from "@/lib/utils";
import type { DashboardNote } from "@/store/api/dashboardNotesApi";
import {
  Building2,
  CheckSquare,
  Users,
  User,
  Globe,
  Trash2,
  Lock,
  ArrowRight,
  Shield,
  ChevronRight,
} from "lucide-react";

export interface NoteCardProps {
  note: DashboardNote;
  canDelete: boolean;
  onView: (note: DashboardNote) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({
  note,
  canDelete,
  onView,
  onDelete,
}: NoteCardProps) {
  const authorInitials = note.author.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const dateFormatted = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <StaggerItem
      onClick={() => onView(note)}
      className={cn(
        "group relative flex flex-col gap-3 p-4.5 rounded-lg border transition-all cursor-pointer shadow-2xs hover:shadow-md",
        note.isPersonal
          ? "border-warning/30 bg-warning/5 hover:bg-warning/10 hover:border-warning/50"
          : "border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle/80 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 border",
              note.isPersonal
                ? "bg-warning/20 text-warning border-warning/30"
                : "bg-primary-light text-primary border-primary/20"
            )}
          >
            {authorInitials || "U"}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-foreground">
                {note.author.name}
              </span>
              <span className="text-xs font-semibold   px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/40">
                {note.author.role}
              </span>

              {note.isPersonal && (
                <Badge className="bg-warning/15 text-warning border-warning/30 gap-1 text-xs py-0 px-1.5 font-semibold">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Personal</span>
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{dateFormatted}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              title="Delete Note"
              className="text-muted-foreground hover:text-destructive p-1.5 rounded-md transition-colors cursor-pointer opacity-80 hover:opacity-100 hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all p-1">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {note.client && (
          <Badge variant="outline" className="gap-1 bg-background text-foreground text-xs font-medium border-border/70">
            <Building2 className="w-3 h-3 text-primary" />
            <span>{note.client.name}</span>
          </Badge>
        )}

        {note.task && (
          <Badge
            variant="secondary"
            className="gap-1 text-xs font-medium border border-warning/20 bg-warning/5 text-foreground"
          >
            <CheckSquare className="w-3 h-3 text-warning" />
            <span className="truncate max-w-[180px]">{note.task.title}</span>
          </Badge>
        )}

        {note.isPersonal ? (
          <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/30 text-xs">
            <Shield className="w-3 h-3" />
            <span>Private to You</span>
          </Badge>
        ) : note.targetAll ? (
          <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/30 text-xs">
            <Globe className="w-3 h-3" />
            <span>Everyone</span>
          </Badge>
        ) : note.targetTeams && note.targetTeams.length > 0 ? (
          <Badge variant="outline" className="gap-1 bg-notion-purple-fg/10 text-notion-purple-fg border-notion-purple-fg/30 text-xs">
            <Users className="w-3 h-3" />
            <span>Teams: {note.targetTeams.map((t) => t.team.name).join(", ")}</span>
          </Badge>
        ) : note.targetUsers && note.targetUsers.length > 0 ? (
          <Badge variant="outline" className="gap-1 bg-notion-blue-fg/10 text-notion-blue-fg border-notion-blue-fg/30 text-xs">
            <User className="w-3 h-3" />
            <span>Targeted: {note.targetUsers.map((u) => u.user.name).join(", ")}</span>
          </Badge>
        ) : null}
      </div>

      <div className="text-xs text-foreground/90 leading-relaxed pl-0.5 line-clamp-3">
        <FormattedText content={note.content} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 font-medium">
        <span className="text-primary group-hover:underline inline-flex items-center gap-1">
          <span>View full note</span>
          <ArrowRight className="w-3 h-3" />
        </span>
        <span className="text-xs text-muted-foreground/60">Click card to open modal</span>
      </div>
    </StaggerItem>
  );
}
