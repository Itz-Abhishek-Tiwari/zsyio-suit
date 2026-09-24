"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { can, canAccessApp, type Role, type AppId } from "@zsyio/auth/permissions";
import { SuiteHeader, Input, Modal, DropdownMenuItem, UserProfileModal } from "@zsyio/ui";
import {
  Search,
  Users2,
  Clock,
  CalendarDays,
  Loader2,
  User,
} from "lucide-react";
import { LiveClockWidget } from "./LiveClockWidget";
import { TimeZoneToggle } from "./TimeZoneToggle";
import { useGetDirectoryQuery } from "@/store/api/timesheetApi";

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
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const { data: directory, isLoading: isDirLoading } = useGetDirectoryQuery(undefined, {
    skip: !searchOpen,
  });

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

  const canViewTeam =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "MANAGER" ||
    can(role, "timesheet:view:all", permissions);

  const allowedApps = useMemo<AppId[]>(() => {
    return (["pms", "notes", "hrms", "admin", "sales"] as const).filter((appId) =>
      canAccessApp(role, appId, permissions)
    );
  }, [role, permissions]);

  const quickNavItems = useMemo(
    () => [
      {
        title: "Dashboard",
        href: "/",
        icon: <Clock className="w-4 h-4 text-primary" />,
        desc: "My status & daily metrics",
      },
      {
        title: "Timesheets & Logs",
        href: "/timeline",
        icon: <CalendarDays className="w-4 h-4 text-primary" />,
        desc: "Day activity & weekly breakdown",
      },
      {
        title: "Leaves & Time Off",
        href: "/leaves",
        icon: <CalendarDays className="w-4 h-4 text-amber-500" />,
        desc: "Apply for leaves & quotas",
      },
      {
        title: "Company Holidays",
        href: "/holidays",
        icon: <CalendarDays className="w-4 h-4 text-sky-500" />,
        desc: "Company holiday calendar",
      },
      {
        title: "Team Directory",
        href: "/directory",
        icon: <Users2 className="w-4 h-4 text-purple-500" />,
        desc: "Staff directory & live status",
      },
      ...(canViewTeam
        ? [
            {
              title: "Team Attendance & Roster",
              href: "/admin",
              icon: <Users2 className="w-4 h-4 text-primary" />,
              desc: "Attendance roster, approvals & policies",
            },
          ]
        : []),
    ],
    [canViewTeam]
  );

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredNavItems = useMemo(() => {
    if (!trimmedQuery) return quickNavItems;
    return quickNavItems.filter(
      (item) =>
        item.title.toLowerCase().includes(trimmedQuery) ||
        item.desc.toLowerCase().includes(trimmedQuery)
    );
  }, [quickNavItems, trimmedQuery]);

  const matchingEmployees = useMemo(() => {
    if (!trimmedQuery || !directory) return [];
    return directory
      .filter((emp) => {
        const n = emp.name.toLowerCase();
        const e = emp.email.toLowerCase();
        const dept = (emp.department || "").toLowerCase();
        const desig = (emp.designation || "").toLowerCase();
        const r = (emp.role || "").toLowerCase();
        return (
          n.includes(trimmedQuery) ||
          e.includes(trimmedQuery) ||
          dept.includes(trimmedQuery) ||
          desig.includes(trimmedQuery) ||
          r.includes(trimmedQuery)
        );
      })
      .slice(0, 6);
  }, [directory, trimmedQuery]);

  return (
    <>
      <SuiteHeader
        currentApp="hrms"
        currentTitle={currentLabel}
        user={{
          name,
          role: String(role),
        }}
        allowedApps={allowedApps}
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        searchPlaceholder="Search timesheets, attendance (⌘K)..."
        onSearchClick={() => setSearchOpen(true)}
        actionsSlot={
          <div className="flex items-center gap-2">
            <TimeZoneToggle />
            <LiveClockWidget />
          </div>
        }
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
              onClick={() => router.push("/")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Dashboard</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/timeline")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>Timesheets &amp; Logs</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/leaves")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-amber-500" />
              <span>Leaves &amp; Time Off</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/holidays")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-sky-500" />
              <span>Company Holidays</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/directory")}
              className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
            >
              <Users2 className="w-4 h-4 text-primary" />
              <span>Team Directory</span>
            </DropdownMenuItem>

            {canViewTeam && (
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="rounded-xl text-xs gap-2.5 p-2 font-medium cursor-pointer"
              >
                <Users2 className="w-4 h-4 text-muted-foreground" />
                <span>Team Attendance</span>
              </DropdownMenuItem>
            )}
          </>
        }
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      {/* Quick-Search Command Modal */}
      <Modal
        open={searchOpen}
        onOpenChange={(v) => {
          setSearchOpen(v);
          if (!v) setSearchQuery("");
        }}
        title="HRMS Quick Navigator"
        description="Search team members, timesheets, leaves, and sections"
        icon={<Search className="w-4 h-4" />}
        iconVariant="primary"
      >
        <div className="flex flex-col gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members, timesheets, sections..."
              className="pl-9.5 text-xs h-10 rounded-xl bg-surface-subtle"
            />
          </div>

          <div className="py-2 px-1 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
            {/* Matching Employees Section */}
            {trimmedQuery && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Team Members &amp; Timesheets ({matchingEmployees.length})
                </span>

                {isDirLoading ? (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Searching directory...</span>
                  </div>
                ) : matchingEmployees.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-1">
                    No matching team members found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {matchingEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          router.push(`/timeline?userId=${emp.id}`);
                        }}
                        className="p-2.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-surface-subtle text-left flex items-center justify-between gap-3 text-xs transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {emp.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {emp.designation || emp.role} • {emp.email}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Timesheet →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Navigation Section */}
            {filteredNavItems.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {trimmedQuery ? "Matching Pages" : "Quick Navigation"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        router.push(item.href);
                      }}
                      className="p-3 rounded-xl border border-border/80 bg-surface-subtle hover:border-primary/30 hover:bg-surface-elevated text-left flex items-center gap-2.5 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                    >
                      {item.icon}
                      <div>
                        <p className="font-bold text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground font-normal">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trimmedQuery && matchingEmployees.length === 0 && filteredNavItems.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No matching results found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      </Modal>

      <UserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
