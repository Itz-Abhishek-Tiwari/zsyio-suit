"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { can, canAccessApp, type Role, type AppId } from "@zsyio/auth/permissions";
import { cn } from "@/lib/utils";
import { SuiteHeader, Input, Badge, Modal, DropdownMenuItem, ChangePasswordModal, UserProfileModal } from "@zsyio/ui";
import {
  Search,
  Kanban,
  Users,
  Activity,
  CornerDownLeft,
  Building2,
  ShieldCheck,
  KeyRound,
  User,
} from "lucide-react";
import { useGetSalesLeadsQuery } from "@/store/api/salesLeadsApi";

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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
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

  // Reset highlight on query change
  useEffect(() => {
    setHighlightedIndex(-1);
    resultsRef.current = [];
  }, [debouncedQuery]);

  // Keep highlighted result in view
  useEffect(() => {
    if (highlightedIndex < 0) return;
    resultsRef.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // Fetch leads for quick global search
  const { data: leadsData, isFetching } = useGetSalesLeadsQuery(
    { q: debouncedQuery, pageSize: 6 },
    { skip: !searchOpen || !debouncedQuery.trim() }
  );

  const leads = leadsData?.items ?? [];

  const handleResultActivate = (leadId: string) => {
    setSearchOpen(false);
    router.push(`/leads/${leadId}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (leads.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < leads.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : leads.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleResultActivate(leads[highlightedIndex].id);
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
        currentApp="sales"
        currentTitle={currentLabel}
        user={{
          name,
          role: String(role),
        }}
        allowedApps={allowedApps}
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        searchPlaceholder="Search leads, clients, companies (⌘K)..."
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
              onClick={() => router.push("/kanban")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Kanban className="w-4 h-4 text-muted-foreground" />
              <span>Pipeline Kanban Board</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/leads")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Manage All Leads</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span>Change Password</span>
            </DropdownMenuItem>
          </>
        }
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Quick Search Command Modal */}
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
        title="Quick Search Leads &amp; Clients"
        description="Jump directly to sales leads, clients, or pipeline stages"
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
            placeholder="Search by client name, domain, email..."
            className="pl-10 h-11 text-sm bg-surface-subtle"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
          {debouncedQuery.trim() ? (
            leads.length > 0 ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-0.5">
                  Sales Leads
                </p>
                {leads.map((lead, idx) => {
                  const isActive = highlightedIndex === idx;
                  return (
                    <button
                      key={lead.id}
                      role="option"
                      aria-selected={isActive}
                      ref={(el) => {
                        if (el) resultsRef.current[idx] = el;
                      }}
                      onClick={() => handleResultActivate(lead.id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
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
                          <span
                            className={cn(
                              "text-xs font-bold truncate",
                              isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {lead.client?.name ?? "Unknown Lead"}
                          </span>
                          {lead.client?.domain && (
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                              {lead.client.domain}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {lead.stage?.name ?? lead.currentStage}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                          {lead.priority.toLowerCase()}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : !isFetching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching sales leads found for &quot;{debouncedQuery}&quot;
              </div>
            ) : null
          ) : (
            <div className="py-3 px-1 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Navigation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/kanban");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <Kanban className="w-4 h-4 text-primary" />
                  <span>Kanban Pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/leads");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <span>All Sales Leads</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    router.push("/activities");
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Sales Activities</span>
                </button>
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

