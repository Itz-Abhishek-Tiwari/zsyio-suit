"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SegmentedTabs,
} from "@zsyio/ui";
import {
  Search,
  X,
  RotateCcw,
  Layers,
  Flame,
  Users2,
  LayoutGrid,
  List,
} from "lucide-react";
import { SALES_STAGE_LABELS, SALES_PRIORITY_LABELS } from "@zsyio/types";
import type { SalesStage, SalesPriority } from "@zsyio/types";
import { useGetUsersQuery } from "@/store/api/usersApi";

interface SalesKanbanFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  onRefresh?: () => void;
}

const ALL_STAGES: SalesStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const ALL_PRIORITIES: SalesPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function SalesKanbanFilters({ filters, onChange }: SalesKanbanFiltersProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(filters.q ?? "");
  const { data: users } = useGetUsersQuery();

  const activeCount = useMemo(() => {
    return Object.keys(filters).filter((k) => Boolean(filters[k])).length;
  }, [filters]);

  const hasActiveFilters = activeCount > 0;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const next = { ...filters };
      if (value && value !== "ALL") {
        next[key] = value;
      } else {
        delete next[key];
      }
      onChange(next);
    },
    [filters, onChange]
  );

  const clearAll = () => {
    setLocalSearch("");
    onChange({});
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 flex flex-col gap-3 shadow-xs">
      {/* Top row: Search input, active badges, and view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, companies..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter("q", localSearch);
            }}
            onBlur={() => updateFilter("q", localSearch)}
            className="w-full pl-8.5 pr-8 h-8.5 text-xs rounded-md border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/50 focus:border-primary transition-colors"
          />
          {localSearch ? (
            <button
              onClick={() => {
                setLocalSearch("");
                updateFilter("q", "");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-muted/60 rounded border border-border/60 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {hasActiveFilters && (
          <span className="shrink-0 hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeCount} active filter{activeCount > 1 ? "s" : ""}
          </span>
        )}

        <div className="flex-1 hidden sm:block" />

        <SegmentedTabs
          value="kanban"
          onChange={(v) => {
            if (v === "table") router.push("/leads");
          }}
          size="sm"
          tabs={[
            {
              id: "kanban",
              label: "Board",
              icon: <LayoutGrid className="w-3.5 h-3.5" />,
            },
            {
              id: "table",
              label: "List",
              icon: <List className="w-3.5 h-3.5" />,
            },
          ]}
        />
      </div>

      {/* Bottom row: Filter selectors matching PMS */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 border-t border-border/40 sm:border-0 sm:pt-0">
        {/* Stages filter */}
        <Select
          value={filters.stage ?? "ALL"}
          onValueChange={(val) => updateFilter("stage", val)}
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-md gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.stage
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 shrink-0 ${filters.stage ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent className="rounded-md border-border/80 bg-surface-elevated shadow-md">
            <SelectItem value="ALL">All Stages</SelectItem>
            {ALL_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {SALES_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priorities filter */}
        <Select
          value={filters.priority ?? "ALL"}
          onValueChange={(val) => updateFilter("priority", val)}
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-md gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.priority
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Flame className={`w-3.5 h-3.5 shrink-0 ${filters.priority ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent className="rounded-md border-border/80 bg-surface-elevated shadow-md">
            <SelectItem value="ALL">All Priorities</SelectItem>
            {ALL_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {SALES_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Salespeople filter */}
        <Select
          value={filters.assignedToId ?? "ALL"}
          onValueChange={(val) => updateFilter("assignedToId", val)}
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-md gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.assignedToId
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Users2 className={`w-3.5 h-3.5 shrink-0 ${filters.assignedToId ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Salespeople" />
          </SelectTrigger>
          <SelectContent className="rounded-md border-border/80 bg-surface-elevated shadow-md">
            <SelectItem value="ALL">All Salespeople</SelectItem>
            {users?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset filters button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8.5 px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
