"use client";

import { useMemo } from "react";
import { UserAvatar } from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { FormattedText, NoteCardPreview, extractAllNoteIds } from "@zsyio/editor";
import type { DashboardNote } from "@/store/api/dashboardNotesApi";
import { StickyNote, FileText, Sparkles } from "lucide-react";

export interface TaskLinkedNotesTabProps {
  isLoading: boolean;
  notes: DashboardNote[];
  timeAgo: (date?: string | null) => string;
  taskDescription?: string | null;
}

export function TaskLinkedNotesTab({
  isLoading,
  notes,
  timeAgo,
  taskDescription,
}: TaskLinkedNotesTabProps) {
  const referencedNoteIds = useMemo(
    () => extractAllNoteIds(taskDescription),
    [taskDescription]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-4 animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  const hasReferenced = referencedNoteIds.length > 0;
  const hasNotes = notes.length > 0;

  if (!hasReferenced && !hasNotes) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/80 bg-surface-subtle/40 text-center">
        <StickyNote className="w-7 h-7 text-muted-foreground/50 mb-2" />
        <p className="text-xs font-bold text-foreground">No notes attached to this ticket</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Paste a Zsyio Canvas link in the ticket description or link notes from your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Referenced Notes from Ticket Description */}
      {hasReferenced && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Referenced Knowledge Documents ({referencedNoteIds.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {referencedNoteIds.map((id) => (
              <NoteCardPreview key={id} noteId={id} className="my-0 max-w-none" />
            ))}
          </div>
        </div>
      )}

      {/* 2. Dashboard Sticky Notes */}
      {hasNotes && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Ticket Sticky Notes ({notes.length})
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs hover:border-border transition-all flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={note.author} size="xs" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">
                        {note.author.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(note.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                    {note.isPersonal ? "Personal Note" : "Client Note"}
                  </Badge>
                </div>

                <div className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
                  <FormattedText content={note.content} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
