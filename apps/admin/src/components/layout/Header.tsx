"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { canAccessApp, type AppId } from "@zsyio/auth/permissions";
import {
  Search,
  ShieldCheck,
  Users,
  Users2,
  ExternalLink,
  Loader2,
  CornerDownLeft,
  X,
  User,
} from "lucide-react";
import {
  SuiteHeader,
  Modal,
  Input,
  Badge,
  DropdownMenuItem,
  UserProfileModal,
} from "@zsyio/ui";
import { cn } from "@zsyio/ui";
import { useGetUsersQuery } from "@/store/api/usersApi";

interface HeaderProps {
  role: string;
  permissions?: string[] | null;
  name: string;
  email?: string;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onMenuClick?: () => void;
}

function getBreadcrumb(pathname: string): string {
  if (pathname === "/") return "Overview";
  if (pathname.startsWith("/users/")) return "User Profile";
  if (pathname === "/users") return "User Management";
  if (pathname === "/roles") return "Roles & Permissions";
  if (pathname === "/teams") return "Teams & Departments";
  return "Administration";
}

export function Header({
  role,
  permissions,
  name,
  email,
  mobileOpen = false,
  setMobileOpen,
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentTitle = getBreadcrumb(pathname);

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const resultsRef = useRef<HTMLButtonElement[]>([]);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setHighlightedIndex(-1);
    resultsRef.current = [];
  }, [debouncedQuery]);

  const { data: usersData, isFetching } = useGetUsersQuery(
    { q: debouncedQuery.trim() },
    { skip: !searchOpen || !debouncedQuery.trim() }
  );

  const userResults = usersData ?? [];

  const handleResultActivate = useCallback(
    (userId: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      setDebouncedQuery("");
      router.push(`/users/${userId}`);
    },
    [router]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!userResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % userResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? userResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleResultActivate(userResults[highlightedIndex].id);
    }
  };

  const handleToggleMobile = () => {
    if (setMobileOpen) {
      setMobileOpen(!mobileOpen);
    } else if (onMenuClick) {
      onMenuClick();
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
        currentApp="admin"
        currentTitle={currentTitle}
        user={{ name, role, email }}
        allowedApps={allowedApps}
        mobileOpen={mobileOpen}
        onMenuClick={handleToggleMobile}
        searchPlaceholder="Search users, roles, teams (⌘K)..."
        onSearchClick={() => setSearchOpen(true)}
        profileMenuItemsSlot={
          <>
            <DropdownMenuItem
              onClick={() => setProfileModalOpen(true)}
              className="rounded-lg text-xs gap-2.5 p-2 font-medium cursor-pointer text-foreground hover:bg-surface-subtle"
            >
              <User className="w-4 h-4 text-primary" />
              <span>My Profile &amp; Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/users")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>User Directory</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/roles")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Roles &amp; Permissions</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/teams")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Users2 className="w-4 h-4 text-primary" />
              <span>Teams &amp; Departments</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                const pmsUrl = process.env.NEXT_PUBLIC_PMS_URL || "http://localhost:3000";
                window.location.href = pmsUrl;
              }}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <span>Switch to Zsyio Flow</span>
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
        title="Admin Workspace Search"
        description="Jump directly to users, roles, teams, and security controls"
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
            placeholder="Search by user name, email, or role..."
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
            userResults.length > 0 ? (
              <div className="flex flex-col gap-1 pr-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-0.5 font-mono">
                  Users ({userResults.length})
                </p>
                {userResults.map((user, idx) => {
                  const isActive = highlightedIndex === idx;
                  return (
                    <button
                      key={user.id}
                      role="option"
                      aria-selected={isActive}
                      ref={(el) => { if (el) resultsRef.current[idx] = el; }}
                      onClick={() => handleResultActivate(user.id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group cursor-pointer",
                        isActive
                          ? "border-primary/40 bg-primary-light/70 shadow-2xs"
                          : "border-transparent hover:border-border hover:bg-surface-subtle/80"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-light text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("text-xs font-bold truncate", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                            {user.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {user.role}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : !isFetching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No users found for &quot;{debouncedQuery}&quot;
              </div>
            ) : null
          ) : (
            <div className="py-3 px-1 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Admin Shortcuts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/users");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/40 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <span>User Directory</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/roles");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/40 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Roles &amp; Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/teams");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/40 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <Users2 className="w-4 h-4 text-primary" />
                  <span>Teams &amp; Depts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
