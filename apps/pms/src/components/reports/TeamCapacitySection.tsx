"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Zap,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  MinusCircle,
  CircleDot,
} from "lucide-react";
import type { WorkloadUserEntry } from "@/store/api/reportsApi";
import { WorkloadUserCard } from "./WorkloadUserCard";
import { UserWorkloadModal } from "./UserWorkloadModal";
import { UserRoleBadge } from "@zsyio/ui";
import { tasksApi } from "@/store/api/tasksApi";
import { Input } from "@zsyio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SegmentedTabs,
} from "@zsyio/ui";

interface TeamCapacitySectionProps {
  workload: WorkloadUserEntry[];
}

export function TeamCapacitySection({ workload }: TeamCapacitySectionProps) {
  const prefetchTasks = tasksApi.usePrefetch("getTasks");

  // State for controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"active" | "completion" | "total" | "name">("active");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected User for Modal
  const [selectedUserEntry, setSelectedUserEntry] = useState<WorkloadUserEntry | null>(null);

  const roles = useMemo(() => {
    const set = new Set<string>();
    workload.forEach((w) => {
      if (w.user.role) set.add(w.user.role);
    });
    return Array.from(set);
  }, [workload]);

  // Capacity band determination
  const getCapacityBandLabel = (active: number) => {
    if (active >= 7) return "OVERLOADED";
    if (active >= 4) return "HEAVY";
    if (active >= 2) return "OPTIMAL";
    return "AVAILABLE";
  };

  const stats = useMemo(() => {
    let totalActive = 0;
    let totalDone = 0;
    let totalOverdue = 0;
    let overloadedCount = 0;
    let heavyCount = 0;
    let optimalCount = 0;
    let availableCount = 0;

    workload.forEach((entry) => {
      const active = entry.activeTasks ?? (entry.totalTasks - entry.doneTasks);
      const overdue = entry.overdueTasks ?? 0;

      totalActive += active;
      totalDone += entry.doneTasks;
      totalOverdue += overdue;

      const band = getCapacityBandLabel(active);
      if (band === "OVERLOADED") overloadedCount++;
      else if (band === "HEAVY") heavyCount++;
      else if (band === "OPTIMAL") optimalCount++;
      else availableCount++;
    });

    const totalTasksAll = totalActive + totalDone;
    const avgCompletion = totalTasksAll
      ? Math.round((totalDone / totalTasksAll) * 100)
      : 0;

    return {
      totalMembers: workload.length,
      totalActive,
      totalDone,
      totalOverdue,
      avgCompletion,
      overloadedCount,
      heavyCount,
      optimalCount,
      availableCount,
    };
  }, [workload]);

  const filteredWorkload = useMemo(() => {
    return workload
      .filter((entry) => {
        const query = searchQuery.toLowerCase().trim();
        if (query) {
          const matchName = entry.user.name.toLowerCase().includes(query);
          const matchEmail = entry.user.email.toLowerCase().includes(query);
          if (!matchName && !matchEmail) return false;
        }

        if (selectedRole !== "ALL" && entry.user.role !== selectedRole) {
          return false;
        }

        // Capacity filter
        const active = entry.activeTasks ?? (entry.totalTasks - entry.doneTasks);
        const band = getCapacityBandLabel(active);
        if (selectedCapacity !== "ALL" && band !== selectedCapacity) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const activeA = a.activeTasks ?? (a.totalTasks - a.doneTasks);
        const activeB = b.activeTasks ?? (b.totalTasks - b.doneTasks);

        if (sortBy === "active") return activeB - activeA;
        if (sortBy === "completion") return b.completionRate - a.completionRate;
        if (sortBy === "total") return b.totalTasks - a.totalTasks;
        if (sortBy === "name") return a.user.name.localeCompare(b.user.name);
        return 0;
      });
  }, [workload, searchQuery, selectedRole, selectedCapacity, sortBy]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between gap-2 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Team Members
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
            {stats.totalMembers}
          </span>
          <span className="text-xs font-medium text-muted-foreground">Active Contributors</span>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between gap-2 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Active Workload
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
            {stats.totalActive}
          </span>
          <span className="text-xs font-medium text-muted-foreground">Assigned Tickets</span>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between gap-2 shadow-xs hover:border-primary/30 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Bandwidth Balance
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {stats.overloadedCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-primary" />
                {stats.overloadedCount} Overloaded
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" />
              {stats.optimalCount} Optimal
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {stats.availableCount} available bandwidth
          </span>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between gap-2 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Overdue Risk
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${stats.totalOverdue > 0 ? "text-primary" : "text-muted-foreground"}`}>
            {stats.totalOverdue}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {stats.totalOverdue > 0 ? "Requires rebalancing" : "All on schedule"}
          </span>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between gap-2 shadow-xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold   text-muted-foreground">
              Completion Rate
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
            {stats.avgCompletion}%
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {stats.totalDone} items completed
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-border/80 bg-card shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search member by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg bg-surface-subtle border-border/70 focus:bg-card focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="w-[150px]">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-9 text-xs font-semibold rounded-lg bg-surface-subtle border-border/60">
                <div className="flex items-center gap-1.5 truncate">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="All Roles" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles ({roles.length})</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[165px]">
            <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
              <SelectTrigger className="h-9 text-xs font-semibold rounded-lg bg-surface-subtle border-border/60">
                <div className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="All Bandwidths" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="flex items-center gap-2">
                    <CircleDot className="w-3 h-3 text-muted-foreground" />
                    All Bandwidths
                  </span>
                </SelectItem>
                <SelectItem value="OVERLOADED">
                  <span className="flex items-center gap-2 text-primary">
                    <AlertCircle className="w-3 h-3" />
                    Overloaded (7+)
                  </span>
                </SelectItem>
                <SelectItem value="HEAVY">
                  <span className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-3 h-3" />
                    Heavy Load (4-6)
                  </span>
                </SelectItem>
                <SelectItem value="OPTIMAL">
                  <span className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Optimal (2-3)
                  </span>
                </SelectItem>
                <SelectItem value="AVAILABLE">
                  <span className="flex items-center gap-2 text-foreground">
                    <MinusCircle className="w-3 h-3" />
                    Available (0-1)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[155px]">
            <Select value={sortBy} onValueChange={(val: "active" | "completion" | "total" | "name") => setSortBy(val)}>
              <SelectTrigger className="h-9 text-xs font-semibold rounded-lg bg-surface-subtle border-border/60">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Load ↓</SelectItem>
                <SelectItem value="completion">Completion % ↓</SelectItem>
                <SelectItem value="total">Total Tasks ↓</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto md:ml-0">
            <SegmentedTabs<"grid" | "table">
              value={viewMode}
              onChange={setViewMode}
              size="sm"
              tabs={[
                {
                  id: "grid",
                  label: "Grid",
                  icon: <LayoutGrid className="w-3.5 h-3.5" />,
                },
                {
                  id: "table",
                  label: "Table",
                  icon: <List className="w-3.5 h-3.5" />,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {filteredWorkload.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-lg border border-border/80 flex flex-col items-center justify-center gap-2 shadow-xs">
          <Users className="w-8 h-8 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">No Team Members Found</h4>
          <p className="text-xs text-muted-foreground">
            No active members match your filter criteria or search parameters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkload.map((entry) => (
            <WorkloadUserCard
              key={entry.user.id}
              entry={entry}
              onInspect={(e) => setSelectedUserEntry(e)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle/80 border-b border-border/70 text-muted-foreground font-semibold  text-xs">
                <tr>
                  <th className="p-3.5 pl-5">Team Member</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5 text-center">Active Load</th>
                  <th className="p-3.5 text-center">Completed</th>
                  <th className="p-3.5 text-center">Overdue</th>
                  <th className="p-3.5">Capacity Band</th>
                  <th className="p-3.5 text-center">Completion Rate</th>
                  <th className="p-3.5 text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredWorkload.map((entry) => {
                  const active = entry.activeTasks ?? (entry.totalTasks - entry.doneTasks);
                  const overdue = entry.overdueTasks ?? 0;
                  const initials = entry.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const getBandStyle = (a: number) => {
                    const band = getCapacityBandLabel(a);
                    if (band === "OVERLOADED") return { label: "Overloaded", style: "bg-destructive-light text-destructive border-destructive/90" };
                    if (band === "HEAVY") return { label: "Heavy Load", style: "bg-warning-light text-warning border-warning/90" };
                    if (band === "OPTIMAL") return { label: "Optimal", style: "bg-success-light text-success border-success/90" };
                    return { label: "Available", style: "bg-muted text-foreground border-border/90" };
                  };

                  const band = getBandStyle(active);

                  return (
                    <tr
                      key={entry.user.id}
                      onClick={() => setSelectedUserEntry(entry)}
                      onMouseEnter={() => {
                        if (entry.user.id) {
                          prefetchTasks({ assignedToId: entry.user.id, pageSize: 100 });
                        }
                      }}
                      className="border-b border-border/50 hover:bg-surface-subtle/80 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
                              {entry.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground block truncate">
                              {entry.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <UserRoleBadge role={entry.user.role} />
                      </td>

                      <td className="p-3.5 text-center font-semibold text-foreground tabular-nums">
                        {active}
                      </td>

                      <td className="p-3.5 text-center font-semibold text-success tabular-nums">
                        {entry.doneTasks}
                      </td>

                      <td className={`p-3.5 text-center font-semibold tabular-nums ${overdue > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {overdue}
                      </td>

                      <td className="p-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border   ${band.style}`}>
                          {band.label}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold text-foreground tabular-nums">{entry.completionRate}%</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserEntry(entry);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserWorkloadModal
        userEntry={selectedUserEntry}
        isOpen={Boolean(selectedUserEntry)}
        onClose={() => setSelectedUserEntry(null)}
      />
    </div>
  );
}
