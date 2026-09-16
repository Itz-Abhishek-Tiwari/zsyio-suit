"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { can, canAccessApp, type Role, type AppId } from "@zsyio/auth/permissions";
import { cn, formatTicketId } from "@/lib/utils";
import { SuiteHeader, Input, Badge, Modal, DropdownMenuItem } from "@zsyio/ui";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import {
  X,
  Search,
  CheckSquare,
  Briefcase,
  Bell,
  Loader2,
  Building2,
  KeyRound,
  BookOpen,
  CornerDownLeft,
  ShieldCheck,
  User,
} from "lucide-react";
import { useGetTasksQuery } from "@/store/api/tasksApi";
import { useGetClientsQuery } from "@/store/api/clientsApi";
import { ChangePasswordModal } from "@zsyio/ui";
import { UserProfileModal } from "@/components/profile/UserProfileModal";

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

  // 300ms debounce - avoids firing a query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset highlight whenever results change
  useEffect(() => {
    setHighlightedIndex(-1);
    resultsRef.current = [];
  }, [debouncedQuery]);

  // Keep the keyboard-highlighted search result scrolled into view as the
  // user arrows through the list.
  useEffect(() => {
    if (highlightedIndex < 0) return;
    resultsRef.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // Keyboard shortcut: ⌘K or Ctrl+K to open search dialog
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

  // Fetch tasks for quick global search results (debounced). Tagged as a
  // background request so a 401 here just fails quietly instead of forcing
  // a hard /login redirect mid-search (see baseApi.ts).
  const { data: tasksData, isFetching: tasksFetching } = useGetTasksQuery(
    { q: debouncedQuery, background: true },
    { skip: !searchOpen || !debouncedQuery.trim() }
  );

  // Fetch clients for quick global search results (role-gated, debounced).
  // Also tagged as background for the same reason as the task search above.
  const { data: clientsData, isFetching: clientsFetching } = useGetClientsQuery(
    { q: debouncedQuery, pageSize: 5, background: true },
    { skip: !searchOpen || !debouncedQuery.trim() || !can(role, "client:view", permissions) }
  );

  const isFetching = tasksFetching || clientsFetching;

  const taskResults = tasksData?.items ?? [];
  const clientResults = clientsData?.items ?? [];

  // Flat list of all results for keyboard nav
  type ResultItem =
    | { kind: "task"; id: string; label: string; sub: string; status: string }
    | { kind: "client"; id: string; label: string; sub: string; status: string };

  const allResults: ResultItem[] = [
    ...taskResults.map((t) => ({
      kind: "task" as const,
      id: t.id,
      label: t.title,
      sub: `${t.product?.name ?? "General"} • ${t.priority} Priority`,
      status: t.status,
    })),
    ...clientResults.map((c) => ({
      kind: "client" as const,
      id: c.id,
      label: c.name,
      sub: c.domain ?? c.contactEmail ?? "",
      status: c.status,
    })),
  ];

  const handleResultActivate = useCallback(
    (item: ResultItem) => {
      setSearchOpen(false);
      setSearchQuery("");
      setDebouncedQuery("");
      if (item.kind === "task") {
        router.push(`/tasks?taskId=${item.id}`);
      } else {
        router.push(`/clients/${item.id}`);
      }
    },
    [router]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!allResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? allResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleResultActivate(allResults[highlightedIndex]);
    }
  };

  const allowedApps = useMemo<AppId[]>(() => {
    return (["pms", "notes", "hrms", "admin", "sales"] as const).filter((appId) =>
      canAccessApp(role, appId, permissions)
    );
  }, [role, permissions]);

  return (
    <>
      <SuiteHeader
        currentApp="pms"
        currentTitle={currentLabel}
        user={{
          name,
          role: String(role),
        }}
        allowedApps={allowedApps}
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        searchPlaceholder="Search tasks, ticket # (e.g. TSK-123)..."
        onSearchClick={() => setSearchOpen(true)}
        actionsSlot={<NotificationDropdown />}
        profileMenuItemsSlot={
          <>
            <DropdownMenuItem
              onClick={() => setProfileModalOpen(true)}
              className="rounded-lg text-xs gap-2.5 p-2 font-medium cursor-pointer text-foreground hover:bg-surface-subtle"
            >
              <User className="w-4 h-4 text-primary" />
              <span>My Profile &amp; Settings</span>
            </DropdownMenuItem>
            {can(role, "user:manage", permissions) && (
              <DropdownMenuItem
                onClick={() => {
                  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3003";
                  window.location.href = `${adminUrl}/users`;
                }}
                className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-600"
              >
                <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Zsyio Console (Users &amp; Roles)</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => router.push("/settings/notifications")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span>Notification Preferences</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span>Change Password</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/tasks")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <span>My Task Queue</span>
            </DropdownMenuItem>
          </>
        }
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Global Quick-Search Command Modal */}
      <Modal
        open={searchOpen}
        onOpenChange={(v) => {
          setSearchOpen(v);
          if (!v) {
            setSearchQuery("");
            setDebouncedQuery("");
            setHighlightedIndex(-1);
          }
        }}
        title="Global Workspace Search"
        description="Jump directly to tasks, tickets, and client profiles"
        icon={<Search className="w-4 h-4" />}
        iconVariant="primary"
        shortcutBadge="ESC"
        size="lg"
        bodyClassName="p-4 flex flex-col gap-3"
        footer={
          <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" /> Enter
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
        }
      >
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type ticket # (e.g. TSK-123), task title, or client..."
            className="pl-10 pr-10 h-11 text-xs sm:text-sm rounded-xl bg-surface-subtle/80 border-border font-sans focus:bg-background"
            autoFocus
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
              className="absolute right-3 p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-1 py-1 custom-scrollbar" role="listbox" aria-label="Search results">
          {debouncedQuery.trim() ? (
            allResults.length > 0 ? (
              <>
                {taskResults.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-0.5">Tasks & Tickets</p>
                    {taskResults.map((task, idx) => {
                      const shortId = formatTicketId(task);
                      const isActive = highlightedIndex === idx;
                      return (
                        <button
                          key={task.id}
                          role="option"
                          aria-selected={isActive}
                          ref={(el) => { if (el) resultsRef.current[idx] = el; }}
                          onClick={() => handleResultActivate({ kind: "task", id: task.id, label: task.title, sub: "", status: task.status })}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group cursor-pointer",
                            isActive
                              ? "border-primary/40 bg-primary-light/70 shadow-2xs"
                              : "border-transparent hover:border-border hover:bg-surface-subtle/80"
                          )}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                {shortId}
                              </span>
                              <span className={cn("text-xs font-bold truncate", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                              {task.product?.name ?? "General"} • {task.priority} Priority
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                            {task.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </>
                )}

                {clientResults.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-0.5">Clients</p>
                    {clientResults.map((client, idx) => {
                      const globalIdx = taskResults.length + idx;
                      const isActive = highlightedIndex === globalIdx;
                      return (
                        <button
                          key={client.id}
                          role="option"
                          aria-selected={isActive}
                          ref={(el) => { if (el) resultsRef.current[globalIdx] = el; }}
                          onClick={() => handleResultActivate({ kind: "client", id: client.id, label: client.name, sub: "", status: client.status })}
                          onMouseEnter={() => setHighlightedIndex(globalIdx)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group cursor-pointer",
                            isActive
                              ? "border-primary/40 bg-primary-light/70 shadow-2xs"
                              : "border-transparent hover:border-border hover:bg-surface-subtle/80"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className={cn("text-xs font-bold truncate", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                {client.name}
                              </span>
                              {client.domain && (
                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{client.domain}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0 font-mono", client.status === "ACTIVE" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400")}>
                            {client.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            ) : !isFetching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching tasks or clients found for &quot;{debouncedQuery}&quot;
              </div>
            ) : null
          ) : (
            <div className="py-4 px-2 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Shortcuts
              </span>
              <div className={cn("grid gap-2", can(role, "client:view", permissions) ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/notes");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Notes & Docs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/tasks");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span>All Tasks</span>
                </button>

                {can(role, "client:view", permissions) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      router.push("/clients");
                    }}
                    className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                  >
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span>Clients</span>
                  </button>
                )}
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
