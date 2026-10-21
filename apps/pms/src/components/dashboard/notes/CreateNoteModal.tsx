"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zsyio/ui";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@zsyio/editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 w-full rounded-lg border border-border/80 bg-surface-muted/30 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading editor...
      </div>
    ),
  }
);
import {
  MessageSquarePlus,
  StickyNote,
  Building2,
  CheckSquare,
  Users,
  User,
  Globe,
  X,
  Search,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NoteScope = "CLIENT" | "ANNOUNCEMENT" | "PERSONAL";

export interface CreateNoteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isManagerOrAdmin: boolean;
  clients: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; role: string }>;
  clientTasks: Array<{ id: string; title: string; status: string }>;
  clientId: string;
  setClientId: (id: string) => void;
  taskId: string;
  setTaskId: (id: string) => void;
  isCreating: boolean;
  onSubmit: (data: {
    noteScope: NoteScope;
    clientId: string;
    taskId: string;
    content: string;
    audienceType: "ALL" | "TEAMS" | "USERS";
    selectedTeamIds: string[];
    selectedUserIds: string[];
  }) => Promise<void>;
}

export function CreateNoteModal({
  isOpen,
  onOpenChange,
  isManagerOrAdmin,
  clients,
  teams,
  users,
  clientTasks,
  clientId,
  setClientId,
  taskId,
  setTaskId,
  isCreating,
  onSubmit,
}: CreateNoteModalProps) {
  const [noteScope, setNoteScope] = useState<NoteScope>(
    isManagerOrAdmin ? "CLIENT" : "PERSONAL"
  );
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState<"ALL" | "TEAMS" | "USERS">("ALL");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [targetUserSearchQuery, setTargetUserSearchQuery] = useState("");

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredTargetUsers = users.filter((u) => {
    if (!targetUserSearchQuery.trim()) return true;
    const q = targetUserSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      noteScope,
      clientId,
      taskId,
      content,
      audienceType,
      selectedTeamIds,
      selectedUserIds,
    });
    setContent("");
    setClientId("");
    setTaskId("");
    setSelectedTeamIds([]);
    setSelectedUserIds([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl md:max-w-4xl w-full p-0 overflow-hidden border-border/80 bg-background shadow-md rounded-lg flex flex-col max-h-[90vh]">
        <div className="shrink-0 border-b border-border/70 p-5 sm:p-6 pb-4 bg-surface-subtle">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold font-display text-foreground flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              <span>Leave Note or Announcement</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Post formatted rich notes for clients, broadcast workspace announcements, or save private personal notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5">
            {isManagerOrAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setNoteScope("CLIENT")}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer",
                    noteScope === "CLIENT"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-xs"
                      : "border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      noteScope === "CLIENT" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Client Note</div>
                    <div className="text-xs text-muted-foreground">Attach to specific client</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNoteScope("ANNOUNCEMENT")}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer",
                    noteScope === "ANNOUNCEMENT"
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-xs"
                      : "border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      noteScope === "ANNOUNCEMENT" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Workspace Notice</div>
                    <div className="text-xs text-muted-foreground">General workspace notice</div>
                  </div>
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => setNoteScope("PERSONAL")}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer",
                noteScope === "PERSONAL"
                  ? "border-warning/30 bg-warning/10 text-foreground ring-1 ring-warning/30 shadow-xs"
                  : "border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  noteScope === "PERSONAL" ? "bg-warning text-white" : "bg-muted"
                )}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Private Memo</div>
                <div className="text-xs text-muted-foreground">Visible only to you</div>
              </div>
            </button>
          </div>
        </div>

        <form id="create-note-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {noteScope !== "ANNOUNCEMENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Client Associated {noteScope === "CLIENT" ? "*" : "(Optional)"}</span>
                </label>
                <Select
                  value={clientId || "none"}
                  onValueChange={(v) => {
                    setClientId(v === "none" ? "" : v);
                    setTaskId("");
                  }}
                >
                  <SelectTrigger className="h-10 text-xs font-semibold rounded-lg w-full bg-background border-border/80">
                    <SelectValue placeholder={noteScope === "CLIENT" ? "-- Choose a Client --" : "-- Standalone Note (No Client) --"} />
                  </SelectTrigger>
                  <SelectContent>
                    {noteScope === "PERSONAL" && (
                      <SelectItem value="none" className="text-xs font-medium">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <span>No Client (Standalone Memo)</span>
                        </span>
                      </SelectItem>
                    )}
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-warning" />
                  <span>Attach to Ticket / Task (Optional)</span>
                </label>
                <Select
                  value={taskId || "none"}
                  disabled={!clientId}
                  onValueChange={(v) => setTaskId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-10 text-xs font-semibold rounded-lg w-full bg-background border-border/80 disabled:opacity-50">
                    <SelectValue
                      placeholder={
                        !clientId
                          ? "Select a client first"
                          : "-- General Client Note (No ticket) --"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-medium">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span>General Note (No specific ticket)</span>
                      </span>
                    </SelectItem>
                    {clientTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs font-medium">
                        <span className="inline-flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-warning shrink-0" />
                          <span>{t.title} ({t.status})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-primary" />
                <span>Note Content *</span>
              </label>
              <span className="text-xs text-muted-foreground">Formatting & tables enabled</span>
            </div>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your detailed note, update, acceptance criteria, or memo here..."
              minHeight="min-h-[200px]"
              className="w-full bg-card"
            />
          </div>

          {noteScope !== "PERSONAL" && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Target Audience Visibility</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceType("ALL")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                    audienceType === "ALL"
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-surface-subtle text-foreground border-border hover:bg-muted"
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Everyone</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType("TEAMS")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                    audienceType === "TEAMS"
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-surface-subtle text-foreground border-border hover:bg-muted"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Teams</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType("USERS")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                    audienceType === "USERS"
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-surface-subtle text-foreground border-border hover:bg-muted"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Specific People</span>
                </button>
              </div>

              {audienceType === "TEAMS" && (
                <div className="flex flex-col gap-2 mt-1 p-3.5 rounded-lg bg-surface-subtle border border-border/70 animate-fade-in">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Select target teams who can view this note:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {teams.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No teams created yet.</span>
                    ) : (
                      teams.map((t) => {
                        const isSelected = selectedTeamIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToggleTeam(t.id)}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                : "bg-background text-foreground border-border hover:bg-muted"
                            )}
                          >
                            {t.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {audienceType === "USERS" && (
                <div className="flex flex-col gap-2.5 mt-1 p-3.5 rounded-lg bg-surface-subtle border border-border/70 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Select specific team members who can view this note:
                    </span>
                    {selectedUserIds.length > 0 && (
                      <span className="text-xs font-semibold text-primary bg-primary-light border border-primary/20 px-2 py-0.5 rounded-full">
                        {selectedUserIds.length} selected
                      </span>
                    )}
                  </div>

                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={targetUserSearchQuery}
                      onChange={(e) => setTargetUserSearchQuery(e.target.value)}
                      placeholder="Search members by name or role..."
                      className="pl-9 pr-8 text-xs h-8.5 rounded-lg bg-background border-border/80"
                    />
                    {targetUserSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTargetUserSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                    {filteredTargetUsers.length === 0 ? (
                      <span className="text-xs text-muted-foreground p-2">
                        No members found matching &quot;{targetUserSearchQuery}&quot;
                      </span>
                    ) : (
                      filteredTargetUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleToggleUser(u.id)}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                : "bg-background text-foreground border-border hover:bg-muted"
                            )}
                          >
                            {u.name} <span className="text-xs opacity-75 font-normal">({u.role})</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="shrink-0 border-t border-border/70 bg-surface-subtle/95 backdrop-blur-xs px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {noteScope === "PERSONAL" ? (
              <span className="text-xs font-semibold text-warning inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Personal Note (Only you)</span>
              </span>
            ) : noteScope === "ANNOUNCEMENT" ? (
              <span className="text-xs font-semibold text-success inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Workspace Notice</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-foreground/80 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Client Note</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-note-form"
              size="sm"
              disabled={isCreating}
              className="text-xs font-semibold h-9 rounded-lg shadow-xs gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{isCreating ? "Posting..." : "Post Note"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
