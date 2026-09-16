"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { FormattedText } from "@zsyio/editor";
import { useGetDashboardNoteByIdQuery, type DashboardNote } from "@/store/api/dashboardNotesApi";
import { toast } from "sonner";
import {
  StickyNote,
  Building2,
  CheckSquare,
  Users,
  User,
  Globe,
  Lock,
  Copy,
  Check,
  Trash2,
  Calendar,
  ExternalLink,
  Shield,
} from "lucide-react";
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { useSession } from "next-auth/react";

interface NoteViewModalProps {
  note?: DashboardNote | null;
  noteId?: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (noteId: string) => void;
  currentUserId?: string;
  userRole?: string;
}

export function NoteViewModal({
  note,
  noteId,
  isOpen,
  onClose,
  onDelete,
  currentUserId,
  userRole,
}: NoteViewModalProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const targetNoteId = noteId || note?.id || "";

  const { data: fetchedNote } = useGetDashboardNoteByIdQuery(targetNoteId, {
    skip: !targetNoteId || !isOpen,
  });

  const isFetchedForCurrentNote = Boolean(fetchedNote && fetchedNote.id === targetNoteId);
  const isInitialForCurrentNote = Boolean(note && note.id === targetNoteId);

  const currentResolvedNote = isFetchedForCurrentNote
    ? fetchedNote
    : isInitialForCurrentNote
    ? note
    : null;

  const lastNoteRef = useRef<DashboardNote | null>(null);
  if (currentResolvedNote) {
    lastNoteRef.current = currentResolvedNote;
  }
  const activeNote = currentResolvedNote || lastNoteRef.current;

  if (!isOpen && !activeNote) return null;
  if (!activeNote) return null;

  const authorInitials = activeNote.author.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const formattedFullDate = new Date(activeNote.createdAt).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const canDelete =
    Boolean(onDelete) &&
    (activeNote.authorId === currentUserId ||
      userRole === "ADMIN" ||
      userRole === "MANAGER" ||
      userRole === "SUPER_ADMIN" ||
      isSuperAdmin(session?.user));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeNote.content);
      setCopied(true);
      toast.success("Note content copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy note content.");
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(activeNote.id);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-0 gap-0 border-l border-border/80 bg-background shadow-2xl flex flex-col h-full overflow-hidden"
      >
        <div className="shrink-0 relative border-b border-border/70 bg-gradient-to-r from-surface-subtle via-card to-surface-subtle p-5 sm:p-6 pr-14">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-sm font-bold shadow-xs shrink-0 mt-0.5">
                {authorInitials || "U"}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetHeader className="p-0 border-none space-y-0 text-left">
                    <SheetTitle className="text-base sm:text-lg font-bold font-display text-foreground leading-tight">
                      {activeNote.author.name}
                    </SheetTitle>
                  </SheetHeader>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                    {activeNote.author.role}
                  </span>

                  {activeNote.isPersonal ? (
                    <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-bold shadow-2xs">
                      <Lock className="w-3 h-3" />
                      <span>Personal Note (Private)</span>
                    </Badge>
                  ) : activeNote.client ? (
                    <Badge variant="outline" className="bg-primary-light text-primary border-primary/30 gap-1 text-[11px] font-semibold">
                      <Building2 className="w-3 h-3" />
                      <span>{activeNote.client.name}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-semibold">
                      <Globe className="w-3 h-3" />
                      <span>Workspace Announcement</span>
                    </Badge>
                  )}
                </div>

                <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                    {formattedFullDate}
                  </span>
                  <span>•</span>
                  <span>{activeNote.author.email}</span>
                </SheetDescription>
              </div>
            </div>


            <div className="flex items-center gap-2 self-start shrink-0 mr-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs font-semibold gap-1.5 rounded-md border-border/80 hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Copy Text</span>
                  </>
                )}
              </Button>

              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 text-xs font-semibold gap-1.5 rounded-md text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border/80 transition-all cursor-pointer shadow-2xs"
                  title="Delete this note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/50">
            {activeNote.client && (
              <Badge variant="outline" className="gap-1.5 bg-background text-foreground text-xs py-1 px-2.5 font-medium border-border">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Client: <strong>{activeNote.client.name}</strong></span>
              </Badge>
            )}

            {activeNote.task && (
              <Link href={`/tasks?taskId=${activeNote.task.id}`} onClick={onClose}>
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs py-1 px-2.5 hover:bg-muted font-medium cursor-pointer transition-colors border border-amber-500/20 bg-amber-500/5 text-foreground"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Ticket: <strong>{activeNote.task.title}</strong></span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                </Badge>
              </Link>
            )}

            {activeNote.isPersonal ? (
              <Badge variant="outline" className="gap-1.5 bg-amber-500/5 text-amber-800 dark:text-amber-300 border-amber-500/30 text-xs py-1 px-2.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Visibility: <strong>Only You (Private)</strong></span>
              </Badge>
            ) : activeNote.targetAll ? (
              <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs py-1 px-2.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Visibility: <strong>Everyone in Workspace</strong></span>
              </Badge>
            ) : activeNote.targetTeams && activeNote.targetTeams.length > 0 ? (
              <Badge variant="outline" className="gap-1.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 text-xs py-1 px-2.5">
                <Users className="w-3.5 h-3.5" />
                <span>Teams: <strong>{activeNote.targetTeams.map((t) => t.team.name).join(", ")}</strong></span>
              </Badge>
            ) : activeNote.targetUsers && activeNote.targetUsers.length > 0 ? (
              <Badge variant="outline" className="gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs py-1 px-2.5">
                <User className="w-3.5 h-3.5" />
                <span>Targeted to: <strong>{activeNote.targetUsers.map((u) => u.user.name).join(", ")}</strong></span>
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-card">
          <div className="prose dark:prose-invert max-w-none">
            <FormattedText content={activeNote.content} className="text-sm sm:text-base leading-relaxed" />
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-surface-subtle/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-primary" />
            <span>Dashboard Note</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

