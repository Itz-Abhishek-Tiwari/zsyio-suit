"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useGetDashboardNotesQuery,
  useCreateDashboardNoteMutation,
  useDeleteDashboardNoteMutation,
  type DashboardNote,
} from "@/store/api/dashboardNotesApi";
import { useGetClientsLiteQuery } from "@/store/api/clientsApi";
import { useGetTasksQuery } from "@/store/api/tasksApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Skeleton } from "@zsyio/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@zsyio/ui";
import { SegmentedTabs } from "@zsyio/ui";
import { Stagger } from "@zsyio/ui";
import { ConfirmDialog } from "@zsyio/ui";
import dynamic from "next/dynamic";
import { NoteCard } from "./notes/NoteCard";
import type { NoteScope } from "./notes/CreateNoteModal";

const NoteViewModal = dynamic(
  () => import("./NoteViewModal").then((mod) => mod.NoteViewModal),
  { ssr: false }
);

const CreateNoteModal = dynamic(
  () => import("./notes/CreateNoteModal").then((mod) => mod.CreateNoteModal),
  { ssr: false }
);
import { isSuperAdmin } from "@zsyio/auth/super-admin";
import { can } from "@zsyio/auth/permissions";
import { toast } from "sonner";
import {
  MessageSquarePlus,
  StickyNote,
  Building2,
  Globe,
  Search,
  Filter,
  Lock,
  Layers,
  X,
} from "lucide-react";

export type FeedTab = "ALL" | "PERSONAL" | "CLIENT" | "ANNOUNCEMENTS";

export function DashboardNotesFeed({ userRole: initialUserRole }: { userRole: string }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const userRole = session?.user?.role || initialUserRole;

  // Filter States
  const [selectedFilterClient, setSelectedFilterClient] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FeedTab>("ALL");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlNoteId = searchParams?.get("noteId");

  // Modal States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<DashboardNote | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  // Form selections for modal
  const isSuper = isSuperAdmin(session?.user);
  const isManagerOrAdmin =
    userRole === "ADMIN" ||
    userRole === "MANAGER" ||
    userRole === "SUPER_ADMIN" ||
    isSuper ||
    can(userRole, "client:create", session?.user?.permissions) ||
    can(userRole, "user:manage", session?.user?.permissions);

  const [clientId, setClientId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");

  // Queries
  const shouldApplyClientFilter = Boolean(
    selectedFilterClient && (activeTab === "ALL" || activeTab === "CLIENT")
  );
  const { data: notes = [], isLoading } = useGetDashboardNotesQuery(
    shouldApplyClientFilter ? { clientId: selectedFilterClient } : undefined
  );
  const { data: clients = [] } = useGetClientsLiteQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const [createNote, { isLoading: isCreating }] = useCreateDashboardNoteMutation();
  const [deleteNote] = useDeleteDashboardNoteMutation();

  useEffect(() => {
    if (urlNoteId && notes.length > 0) {
      const match = notes.find((n) => n.id === urlNoteId);
      if (match) {
        setViewingNote(match);
      }
    }
  }, [urlNoteId, notes]);

  const handleCloseViewModal = () => {
    setViewingNote(null);
    if (urlNoteId) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("noteId");
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
    }
  };

  // Fetch selected client's tasks
  const { data: clientTasksData } = useGetTasksQuery(
    { clientId, pageSize: 50 },
    { skip: !clientId }
  );
  const clientProductsTasks = clientTasksData?.items ?? [];

  const handleOpenLeaveModal = () => {
    setClientId("");
    setTaskId("");
    setIsLeaveModalOpen(true);
  };

  const handleCreateNoteSubmit = async (data: {
    noteScope: NoteScope;
    clientId: string;
    taskId: string;
    content: string;
    audienceType: "ALL" | "TEAMS" | "USERS";
    selectedTeamIds: string[];
    selectedUserIds: string[];
  }) => {
    if (!data.content.trim()) {
      toast.error("Note content cannot be empty.");
      return;
    }

    if (data.noteScope === "CLIENT" && !data.clientId) {
      toast.error("Please select a client for client notes.");
      return;
    }

    try {
      if (data.noteScope === "PERSONAL") {
        await createNote({
          clientId: data.clientId?.trim() ? data.clientId.trim() : undefined,
          taskId: data.taskId?.trim() ? data.taskId.trim() : undefined,
          content: data.content.trim(),
          isPersonal: true,
          targetAll: false,
          targetTeamIds: [],
          targetUserIds: [],
        }).unwrap();
        toast.success("Personal memo saved!");
      } else if (data.noteScope === "ANNOUNCEMENT") {
        await createNote({
          clientId: undefined,
          taskId: undefined,
          content: data.content.trim(),
          isPersonal: false,
          targetAll: data.audienceType === "ALL",
          targetTeamIds: data.audienceType === "TEAMS" ? data.selectedTeamIds : [],
          targetUserIds: data.audienceType === "USERS" ? data.selectedUserIds : [],
        }).unwrap();
        toast.success("Workspace announcement posted!");
      } else {
        await createNote({
          clientId: data.clientId.trim(),
          taskId: data.taskId?.trim() ? data.taskId.trim() : undefined,
          content: data.content.trim(),
          isPersonal: false,
          targetAll: data.audienceType === "ALL",
          targetTeamIds: data.audienceType === "TEAMS" ? data.selectedTeamIds : [],
          targetUserIds: data.audienceType === "USERS" ? data.selectedUserIds : [],
        }).unwrap();
        toast.success("Client note posted successfully!");
      }

      setIsLeaveModalOpen(false);
      setClientId("");
      setTaskId("");
    } catch (err: unknown) {
      console.error("Failed to post note:", err);
      const apiErr = err as { data?: { message?: string; error?: string }; message?: string };
      toast.error(
        apiErr?.data?.message ||
          apiErr?.data?.error ||
          apiErr?.message ||
          "Failed to post note. Please try again."
      );
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDeleteId(noteId);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDeleteId) return;
    try {
      await deleteNote(noteToDeleteId).unwrap();
      toast.success("Note deleted.");
      if (viewingNote?.id === noteToDeleteId) {
        setViewingNote(null);
      }
      setNoteToDeleteId(null);
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  // Counts for tabs
  const personalNotesCount = notes.filter((n) => n.isPersonal).length;
  const clientNotesCount = notes.filter((n) => !n.isPersonal && Boolean(n.clientId || n.client)).length;
  const announcementsCount = notes.filter((n) => !n.isPersonal && !n.clientId && !n.client).length;

  // Filter notes client-side for tab + search query
  const filteredNotes = notes.filter((n) => {
    if (activeTab === "PERSONAL" && !n.isPersonal) return false;
    if (activeTab === "CLIENT" && (n.isPersonal || (!n.clientId && !n.client))) return false;
    if (activeTab === "ANNOUNCEMENTS" && (n.isPersonal || Boolean(n.clientId || n.client))) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.content.toLowerCase().includes(q) ||
      (n.client?.name && n.client.name.toLowerCase().includes(q)) ||
      n.author.name.toLowerCase().includes(q) ||
      (n.task?.title && n.task.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-4.5 rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-foreground flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            <span>Workspace & Client Notes</span>
            {notes.length > 0 && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-primary-light text-primary border border-primary/20">
                {notes.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Internal announcements, client updates, and private personal notes.
          </p>
        </div>

        <Button
          onClick={handleOpenLeaveModal}
          size="sm"
          className="font-bold gap-1.5 shrink-0 self-start sm:self-auto shadow-xs rounded-md cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Leave Note</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <SegmentedTabs<FeedTab>
            value={activeTab}
            onChange={setActiveTab}
            size="md"
            tabs={[
              {
                id: "ALL",
                label: "All Notes",
                icon: <Layers className="w-3.5 h-3.5" />,
                count: notes.length,
              },
              {
                id: "PERSONAL",
                label: "Personal Notes",
                icon: <Lock className="w-3.5 h-3.5" />,
                count: personalNotesCount > 0 ? personalNotesCount : undefined,
                badgeVariant: "amber",
              },
              {
                id: "CLIENT",
                label: "Client Notes",
                icon: <Building2 className="w-3.5 h-3.5" />,
                count: clientNotesCount > 0 ? clientNotesCount : undefined,
              },
              {
                id: "ANNOUNCEMENTS",
                label: "Announcements",
                icon: <Globe className="w-3.5 h-3.5" />,
                count: announcementsCount > 0 ? announcementsCount : undefined,
                badgeVariant: "emerald",
              },
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search note content, clients, tickets, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 rounded-md bg-surface-subtle/60 border-border/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select
              value={selectedFilterClient || "all"}
              onValueChange={(val) => setSelectedFilterClient(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-9 text-xs font-semibold rounded-md w-full sm:w-48 bg-surface-subtle/60 border-border/70">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>All Clients</span>
                  </span>
                </SelectItem>
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
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border/80 bg-card p-4.5 flex flex-col gap-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-3 w-16 rounded-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <Skeleton className="h-4 w-24 rounded-sm" />
                <Skeleton className="h-4 w-28 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center rounded-lg border border-dashed border-border/80 bg-surface-subtle/30">
          <div className="w-12 h-12 rounded-md bg-muted/60 flex items-center justify-center mb-3">
            <StickyNote className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-bold text-foreground">No Notes Found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery || selectedFilterClient || activeTab !== "ALL"
              ? "No notes match your current search or tab filters."
              : "No notes have been posted yet. Click 'Leave Note' above to get started!"}
          </p>
          <Button
            onClick={handleOpenLeaveModal}
            variant="outline"
            size="sm"
            className="mt-4 text-xs font-semibold gap-1.5 rounded-md cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Create First Note</span>
          </Button>
        </div>
      ) : (
        <Stagger className="flex flex-col gap-3.5">
          {filteredNotes.map((note) => {
            const canDeleteThisNote =
              note.authorId === currentUserId || isManagerOrAdmin;

            return (
              <NoteCard
                key={note.id}
                note={note}
                canDelete={canDeleteThisNote}
                onView={setViewingNote}
                onDelete={handleDeleteNote}
              />
            );
          })}
        </Stagger>
      )}

      <CreateNoteModal
        isOpen={isLeaveModalOpen}
        onOpenChange={setIsLeaveModalOpen}
        isManagerOrAdmin={isManagerOrAdmin}
        clients={clients}
        teams={teams}
        users={users}
        clientTasks={clientProductsTasks}
        clientId={clientId}
        setClientId={setClientId}
        taskId={taskId}
        setTaskId={setTaskId}
        isCreating={isCreating}
        onSubmit={handleCreateNoteSubmit}
      />

      {viewingNote && (
        <NoteViewModal
          noteId={viewingNote.id}
          isOpen={Boolean(viewingNote)}
          onClose={handleCloseViewModal}
          currentUserId={currentUserId}
          userRole={userRole}
          onDelete={handleDeleteNote}
        />
      )}

      <ConfirmDialog
        open={Boolean(noteToDeleteId)}
        onOpenChange={(open) => {
          if (!open) setNoteToDeleteId(null);
        }}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
