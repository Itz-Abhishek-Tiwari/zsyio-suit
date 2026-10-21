"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PageHeader,
  Input,
  KpiCard,
  TimesheetStatusBadge,
  EmptyState,
  SegmentedTabs,
  Button,
  UserAvatar,
} from "@zsyio/ui";
import {
  Users2,
  Search,
  Clock,
  Coffee,
  CheckCircle2,
  Mail,
  Loader2,
  List,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react";
import { useGetDirectoryQuery } from "@/store/api/timesheetApi";
import { formatDuration, localTimeToIso } from "@zsyio/ui";
import { useTimeZone } from "@/context/TimeZoneContext";

export default function DirectoryPage() {
  const { formatTime, timeZoneConfig } = useTimeZone();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data: directory, isLoading } = useGetDirectoryQuery();

  // Convert base shift (09:00 - 18:00 IST) to user's active timezone dynamically
  const formattedShift = useMemo(() => {
    try {
      const today = new Date();
      const dStr = today.toISOString().split("T")[0];
      const startIso = localTimeToIso(dStr, "09:00", "Asia/Kolkata");
      const endIso = localTimeToIso(dStr, "18:00", "Asia/Kolkata");
      return `${formatTime(startIso)} – ${formatTime(endIso)}`;
    } catch {
      return "09:00 AM – 06:00 PM";
    }
  }, [formatTime]);

  const filteredEmployees = useMemo(() => {
    if (!directory) return [];
    return directory.filter((emp) => {
      const matchSearch =
        !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        (emp.department && emp.department !== "_" && emp.department.toLowerCase().includes(search.toLowerCase())) ||
        emp.role.toLowerCase().includes(search.toLowerCase());

      const normalizedRole = emp.role.toUpperCase().replace(/\s+/g, "_");
      const normalizedFilter = roleFilter.toUpperCase();
      const matchRole =
        roleFilter === "ALL" ||
        normalizedRole === normalizedFilter ||
        (normalizedFilter === "ADMIN" && (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN" || normalizedRole.includes("ADMIN"))) ||
        (normalizedFilter === "MANAGER" && normalizedRole.includes("MANAGER")) ||
        (normalizedFilter === "DEVELOPER" && normalizedRole.includes("DEVELOPER"));

      return matchSearch && matchRole;
    });
  }, [directory, search, roleFilter]);

  const metrics = useMemo(() => {
    if (!directory) return { total: 0, working: 0, ooo: 0, clockedOut: 0 };
    return {
      total: directory.length,
      working: directory.filter((e) => e.attendanceState === "WORKING").length,
      ooo: directory.filter((e) => e.attendanceState === "OOO").length,
      clockedOut: directory.filter((e) => e.attendanceState === "CLOCKED_OUT").length,
    };
  }, [directory]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Organization"
        title="Team Directory & Live Presence"
        titleIcon={<Users2 className="w-5 h-5 text-primary" />}
        description="Browse team members across departments and monitor real-time working status."
        borderBottom
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Team Members"
          value={isLoading ? "-" : metrics.total}
          icon={<Users2 className="w-5 h-5" />}
          variant="default"
          subtext="Active company members"
        />

        <KpiCard
          label="Working Now"
          value={isLoading ? "-" : metrics.working}
          icon={<Clock className="w-5 h-5" />}
          variant="emerald"
          subtext="Logged in on active shifts"
        />

        <KpiCard
          label="On Break"
          value={isLoading ? "-" : metrics.ooo}
          icon={<Coffee className="w-5 h-5" />}
          variant="amber"
          subtext="Temporary break intervals"
        />

        <KpiCard
          label="Clocked Out / Off"
          value={isLoading ? "-" : metrics.clockedOut}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="sky"
          subtext="Completed shift or off duty"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-card border border-border/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department, or role..."
            className="pl-9.5 text-xs h-9.5 rounded-lg bg-surface-subtle"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <SegmentedTabs
            value={roleFilter}
            onChange={setRoleFilter}
            size="sm"
            tabs={[
              { id: "ALL", label: "All Roles" },
              { id: "DEVELOPER", label: "Developer" },
              { id: "MANAGER", label: "Manager" },
              { id: "ADMIN", label: "Admin" },
            ]}
          />

          {/* View Switcher: Table / Grid */}
          <SegmentedTabs<"table" | "grid">
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            tabs={[
              {
                id: "table",
                label: "Table",
                icon: <List className="w-3.5 h-3.5" />,
              },
              {
                id: "grid",
                label: "Grid",
                icon: <LayoutGrid className="w-3.5 h-3.5" />,
              },
            ]}
          />
        </div>
      </div>

      {/* Directory Content */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-card rounded-lg border border-border/80">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading organization directory...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-8 rounded-lg bg-card border border-border/80">
          <EmptyState
            title="No Employees Found"
            description="No team members match your filter criteria."
            icon={<Users2 className="w-8 h-8 text-muted-foreground" />}
          />
        </div>
      ) : viewMode === "table" ? (
        /* Primary Table View */
        <div className="rounded-lg bg-card border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-surface-subtle/70 text-xs font-semibold   text-muted-foreground">
                  <th className="py-3.5 pl-4 pr-3 min-w-[220px]">Employee</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Role</th>
                  <th className="py-3.5 px-3 min-w-[160px]">Department</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">
                    Shift Schedule <span className="font-mono text-xs opacity-75">({timeZoneConfig.code})</span>
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Live Status</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Today&apos;s Work</th>
                  <th className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEmployees.map((emp) => {
                  const isWorking = emp.attendanceState === "WORKING";
                  const isOoo = emp.attendanceState === "OOO";
                  const hasWork = emp.todayWorkedMinutes > 0;
                  const isTargetMet = emp.todayWorkedMinutes >= 480;

                  return (
                    <tr key={emp.id} className="group hover:bg-surface-subtle/50 transition-colors">
                      {/* Employee Profile */}
                      <td className="py-3 pl-4 pr-3 align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <UserAvatar
                              user={{ name: emp.name, email: emp.email }}
                              size="sm"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${
                                isWorking
                                  ? "bg-success animate-pulse"
                                  : isOoo
                                  ? "bg-warning"
                                  : "bg-muted-foreground/40"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs leading-snug truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate font-mono">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20  ">
                          {emp.role}
                        </span>
                      </td>

                      {/* Department / Team */}
                      <td className="py-3 px-3 align-middle text-muted-foreground text-xs">
                        {emp.department && emp.department !== "_" ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <Users2 className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate font-medium text-foreground/90">{emp.department}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground/60 pl-1">_</span>
                        )}
                      </td>

                      {/* Shift Timing */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-muted-foreground text-xs font-mono" suppressHydrationWarning>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          <span>{formattedShift}</span>
                        </div>
                      </td>

                      {/* Live Status */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          <TimesheetStatusBadge status={emp.attendanceState} size="xs" />
                          {emp.sessionStartedAt && (isWorking || isOoo) && (
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                              <span>Since</span>
                              <span className="font-semibold text-foreground/85">{formatTime(emp.sessionStartedAt)}</span>
                              <span className="text-xs opacity-75">({timeZoneConfig.code})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Today's Work */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs">
                        <span
                          className={
                            isTargetMet
                              ? "text-success font-semibold"
                              : hasWork
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground/60"
                          }
                        >
                          {formatDuration(emp.todayWorkedMinutes)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 pr-4 pl-3 align-middle text-right whitespace-nowrap">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs rounded-lg gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Link href={`/timeline?userId=${emp.id}`}>
                            <span>Timeline</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Alternative Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const isWorking = emp.attendanceState === "WORKING";
            const isOoo = emp.attendanceState === "OOO";

            return (
              <div
                key={emp.id}
                className="p-5 rounded-lg border border-border/80 bg-card hover:border-primary/30 hover:bg-surface-subtle/30 transition-all space-y-4 shadow-xs flex flex-col justify-between"
              >
                {/* Top Profile Strip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <UserAvatar
                        user={{ name: emp.name, email: emp.email }}
                        size="md"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-card ${
                          isWorking
                            ? "bg-success animate-pulse"
                            : isOoo
                            ? "bg-warning"
                            : "bg-muted-foreground/50"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{emp.name}</h4>
                      <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20  ">
                        {emp.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <TimesheetStatusBadge status={emp.attendanceState} size="xs" />
                    {emp.sessionStartedAt && (isWorking || isOoo) && (
                      <span className="text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                        Since {formatTime(emp.sessionStartedAt)} ({timeZoneConfig.code})
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Block */}
                <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users2 className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="truncate font-medium text-foreground/90">
                      {emp.department && emp.department !== "_" ? emp.department : "_"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-mono text-xs">{emp.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground" suppressHydrationWarning>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-xs font-mono">{formattedShift} ({timeZoneConfig.code})</span>
                  </div>
                </div>

                {/* Bottom Hours Pill & Action */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Today&apos;s Work:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatDuration(emp.todayWorkedMinutes)}
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs rounded-lg gap-1 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Link href={`/timeline?userId=${emp.id}`}>
                      <span>Timeline</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

