"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { canAccessApp, type Role, type AppId } from "@zsyio/auth/permissions";
import { cn } from "@zsyio/ui";
import { SuiteHeader, Badge, Input, Modal, DropdownMenuItem, ChangePasswordModal, UserProfileModal } from "@zsyio/ui";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import {
  Search,
  Loader2,
  KeyRound,
  FileText,
  Folder,
  CornerDownLeft,
  X,
  User,
} from "lucide-react";
import { useGetNotesTreeQuery } from "@/store/api/notesApi";

interface HeaderProps {
  role: Role | string;
  permissions?: string[] | null;
  name: string;
  currentLabel: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Header({
  role,
  permissions,
  name,
  currentLabel,
  mobileOpen,
  setMobileOpen,
}: HeaderProps) {
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const resultsRef = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setHighlightedIndex(-1);
    resultsRef.current = [];
  }, [debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch Notes Tree for search
  const { data: notesTree, isFetching } = useGetNotesTreeQuery();

  const query = debouncedQuery.trim().toLowerCase();
  const matchingNotes = query && notesTree?.notes
    ? notesTree.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.content && n.content.toLowerCase().includes(query))
      )
    : [];

  const handleResultActivate = useCallback(
    (noteId: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      setDebouncedQuery("");
      router.push(`/notes?noteId=${noteId}`);
    },
    [router]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!matchingNotes.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % matchingNotes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? matchingNotes.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleResultActivate(matchingNotes[highlightedIndex].id);
    }
  };

  const allowedApps = useMemo<AppId[]>(() => {
    return (["pms", "notes", "hrms", "admin", "sales", "recruit"] as const).filter((appId) =>
      canAccessApp(role, appId, permissions)
    );
  }, [role, permissions]);

  return (
    <>
      <SuiteHeader
        currentApp="notes"
        currentTitle={currentLabel}
        user={{
          name,
          role: String(role),
        }}
        allowedApps={allowedApps}
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        searchPlaceholder="Search notes, wikis & documentation (⌘K)..."
        onSearchClick={() => setSearchOpen(true)}
        actionsSlot={<NotificationDropdown />}
        profileMenuItemsSlot={
          <>
            <DropdownMenuItem
              onClick={() => setProfileModalOpen(true)}
              className="rounded-md text-xs gap-2.5 p-2 font-medium cursor-pointer text-foreground hover:bg-surface-subtle"
            >
              <User className="w-4 h-4 text-primary" />
              <span>My Profile &amp; Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="rounded-md text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span>Change Password</span>
            </DropdownMenuItem>
          </>
        }
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Global Quick-Search Modal */}
      <Modal
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) {
            setSearchQuery("");
            setDebouncedQuery("");
            setHighlightedIndex(-1);
          }
        }}
        title="Search Knowledge Base"
        description="Search notes, folders, and documentation"
        icon={<Search className="w-4 h-4" />}
        iconVariant="primary"
        shortcutBadge="ESC"
        size="lg"
        bodyClassName="p-4 flex flex-col gap-3"
        footer={
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" /> Enter
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
        }
      >
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="Type note title, keyword, or document content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 pr-10 h-11 text-xs sm:text-sm rounded-md bg-surface-subtle/80 border-border font-sans focus:bg-background"
          />
          {isFetching ? (
            <Loader2 className="absolute right-3.5 w-4 h-4 text-muted-foreground animate-spin" />
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDebouncedQuery("");
              }}
              className="absolute right-3 p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-1 py-1 custom-scrollbar" role="listbox" aria-label="Search results">
          {debouncedQuery.trim() ? (
            matchingNotes.length > 0 ? (
              <div className="flex flex-col gap-1 pr-1">
                <p className="text-xs font-semibold   text-muted-foreground px-2 pt-1 pb-0.5 font-mono">
                  Documents ({matchingNotes.length})
                </p>
                {matchingNotes.map((note, idx) => {
                  const isActive = highlightedIndex === idx;
                  return (
                    <button
                      key={note.id}
                      role="option"
                      aria-selected={isActive}
                      ref={(el) => { if (el) resultsRef.current[idx] = el; }}
                      onClick={() => handleResultActivate(note.id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-md border text-left transition-all group cursor-pointer",
                        isActive
                          ? "border-primary/40 bg-primary-light/70 shadow-2xs"
                          : "border-transparent hover:border-border hover:bg-surface-subtle/80"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className={cn("text-xs font-semibold truncate", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                            {note.title || "Untitled"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                            {note.folderId ? "Nested Document" : "Root Document"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 font-mono">
                        {note.generalAccess}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : !isFetching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching documents found for &quot;{debouncedQuery}&quot;
              </div>
            ) : null
          ) : (
            <div className="py-4 px-2 flex flex-col gap-2">
              <span className="text-xs font-semibold   text-muted-foreground font-mono">
                Recent Folders
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notesTree?.folders?.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-md border border-border/80 bg-surface-subtle/80 flex items-center gap-2.5 text-xs font-semibold text-foreground shadow-2xs"
                  >
                    <Folder className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
