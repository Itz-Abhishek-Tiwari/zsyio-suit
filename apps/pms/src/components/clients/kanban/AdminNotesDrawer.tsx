"use client";

import { useState, useMemo } from "react";
import { formatRelativeTime } from "@zsyio/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Textarea } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { UserAvatar } from "@zsyio/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zsyio/ui";
import {
  useGetDashboardNotesQuery,
  useCreateDashboardNoteMutation,
  useDeleteDashboardNoteMutation,
} from "@/store/api/dashboardNotesApi";
import { useGetClientsLiteQuery } from "@/store/api/clientsApi";
import { toast } from "sonner";
import {
  StickyNote,
  Trash2,
  Building2,
  Search,
  Lock,
  Globe,
  Loader2,
  Calendar,
  Send,
  Sparkles,
} from "lucide-react";
import { can } from "@zsyio/auth/permissions";
import { useSession } from "next-auth/react";

interface AdminNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientId?: string | null;
  onSelectClient?: (clientId: string | null) => void;
}

export function AdminNotesDrawer({
  isOpen,
  onClose,
  selectedClientId,
  onSelectClient,
}: AdminNotesDrawerProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions;
  const canDeleteNote =
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    can(userRole, "dashboard:note:delete", userPermissions);

  const [activeFilterClient, setActiveFilterClient] = useState<string>(
    selectedClientId || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [targetClientId, setTargetClientId] = useState<string>(
    selectedClientId || ""
  );
  const [isPersonal, setIsPersonal] = useState(false);

  const { data: rawNotes = [], isLoading: isLoadingNotes } = useGetDashboardNotesQuery(
    activeFilterClient !== "ALL" ? { clientId: activeFilterClient } : undefined
  );
  const { data: clients = [] } = useGetClientsLiteQuery();

  const [createNote, { isLoading: isCreating }] = useCreateDashboardNoteMutation();
  const [deleteNote] = useDeleteDashboardNoteMutation();

  const filteredNotes = useMemo(() => {
    return rawNotes.filter((n) => {
      // Must have client attached or be relevant to clients
      if (activeFilterClient !== "ALL" && n.clientId !== activeFilterClient) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = n.content.toLowerCase().includes(q);
        const authorMatch = n.author?.name?.toLowerCase().includes(q);
        const clientMatch = n.client?.name?.toLowerCase().includes(q);
        if (!contentMatch && !authorMatch && !clientMatch) return false;
      }
      return true;
    });
  }, [rawNotes, activeFilterClient, searchQuery]);

  const handleCreateNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newNoteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    try {
      await createNote({
        clientId: targetClientId ? targetClientId : null,
        taskId: null,
        content: newNoteContent.trim(),
        targetAll: !isPersonal,
        isPersonal,
        targetTeamIds: [],
        targetUserIds: [],
      }).unwrap();
      toast.success("Short note saved!");
      setNewNoteContent("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error(msg);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id).unwrap();
      toast.success("Note deleted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete note";
      toast.error(msg);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] p-0 flex flex-col h-full bg-card border-border shadow-md z-50"
      >
        {/* Header */}
        <div className="p-5 border-b border-border/80 bg-surface/50 shrink-0">
          <SheetHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-base">
              <StickyNote className="w-5 h-5" />
              <SheetTitle className="text-foreground text-base font-semibold">
                Admin Short Notes & Feed
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Quickly jot down internal client tracking reminders, follow-ups, and milestone notes.
            </SheetDescription>
          </SheetHeader>

          {/* Quick Create Note Card */}
          <form
            onSubmit={handleCreateNote}
            className="mt-4 p-3.5 rounded-lg border border-primary/25 bg-background shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground   flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Quick Note
              </span>
              <div className="w-[180px]">
                <Select
                  value={targetClientId || "GENERAL"}
                  onValueChange={(v) => setTargetClientId(v === "GENERAL" ? "" : v)}
                >
                  <SelectTrigger className="h-7 text-xs border-border/80">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="GENERAL">General Workspace</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Take a quick note, log a client update, or set an admin reminder..."
              rows={3}
              className="resize-none text-xs leading-relaxed border-border/70 focus:border-primary"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPersonal}
                  onChange={(e) => setIsPersonal(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Private</span>
              </label>

              <Button
                type="submit"
                size="sm"
                disabled={!newNoteContent.trim() || isCreating}
                className="h-7 px-3 text-xs font-semibold gap-1.5 shadow-2xs"
              >
                {isCreating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Save Note
              </Button>
            </div>
          </form>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes..."
              className="h-8 text-xs pl-8 border-border/70"
            />
          </div>
          <div className="w-[140px]">
            <Select
              value={activeFilterClient}
              onValueChange={(val) => {
                setActiveFilterClient(val);
                if (onSelectClient) onSelectClient(val === "ALL" ? null : val);
              }}
            >
              <SelectTrigger className="h-8 text-xs border-border/70">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="ALL">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoadingNotes ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2 border border-dashed border-border rounded-lg p-6">
              <StickyNote className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-xs font-semibold text-foreground">No notes recorded yet</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Use the input box above to jot down quick notes for any client.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group relative rounded-lg border border-border/80 bg-background/80 hover:bg-background hover:border-primary/40 hover:shadow-sm p-3.5 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.client ? (
                      <Badge variant="default" className="text-xs font-semibold gap-1 py-0 h-5">
                        <Building2 className="w-3 h-3" />
                        <span>{note.client.name}</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs font-medium gap-1 py-0 h-5">
                        <Globe className="w-3 h-3" />
                        <span>General</span>
                      </Badge>
                    )}

                    {note.isPersonal && (
                      <Badge variant="warning" className="text-xs font-semibold gap-1 py-0 h-5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Private</span>
                      </Badge>
                    )}
                  </div>

                  {canDeleteNote && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all p-1 rounded-md hover:bg-destructive/10 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground/70 pt-1.5 border-t border-border/40">
                  <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                    <UserAvatar
                      name={note.author?.name || "Admin"}
                      size="xs"
                    />
                    <span>{note.author?.name || "Admin"}</span>
                  </div>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-2.5 h-2.5" />
                    {formatRelativeTime(note.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
