"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SegmentedTabs } from "@zsyio/ui";

import { Input } from "@zsyio/ui";
import { Button } from "@zsyio/ui";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFilter, resetFilters } from "@/store/slices/filtersSlice";
import { setBoardView, type BoardView } from "@/store/slices/boardViewSlice";
import { useGetClientsLiteQuery } from "@/store/api/clientsApi";
import { useGetProductsQuery } from "@/store/api/productsApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetRolesQuery } from "@/store/api/rolesApi";
import { useGetCustomTaskTypesQuery } from "@/store/api/taskTypesApi";
import { useGetTaskTagsQuery } from "@/store/api/taskTagsApi";
import { TAG_COLORS } from "./TaskTagBadge";
import { MultiAssigneeFilter } from "./MultiAssigneeFilter";
import {
  Building2,
  Package,
  Users2,
  Shield,
  LayoutGrid,
  List,
  X,
  Flame,
  Tag,
  Search,
  RotateCcw,
} from "lucide-react";

const TEAM_COLOR_DOT: Record<string, string> = {
  purple:  "bg-purple-500",
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
  red:     "bg-red-500",
  cyan:    "bg-cyan-500",
  default: "bg-muted-foreground",
};

const ROLE_DOT_COLOR: Record<string, string> = {
  purple:  "bg-purple-500",
  blue:    "bg-blue-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  pink:    "bg-pink-500",
  rose:    "bg-rose-500",
  indigo:  "bg-indigo-500",
  teal:    "bg-teal-500",
  cyan:    "bg-cyan-500",
  orange:  "bg-orange-500",
  gray:    "bg-muted-foreground",
};

const STANDARD_TYPES = [
  { value: "FEATURE", label: "Feature" },
  { value: "BUG", label: "Bug" },
  { value: "SUPPORT_REQUEST", label: "Support" },
  { value: "CUSTOMIZATION", label: "Custom" },
  { value: "DEPLOYMENT", label: "Deploy" },
  { value: "MAINTENANCE", label: "Infra" },
  { value: "NEW_DESIGN", label: "New Design" },
  { value: "DESIGN_CHANGE", label: "Design Changes" },
];

export function TaskFiltersBar() {
  const dispatch = useAppDispatch();
  const boardView = useAppSelector((s) => s.boardView);
  const filters = useAppSelector((s) => s.filters);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Typing dispatches to Redux on every keystroke, which changes the RTK
  // Query cache key and fires a new /api/tasks request per character. Keep
  // the input itself instant via local state, and debounce the dispatch.
  const [searchInput, setSearchInput] = useState(filters.q ?? "");

  useEffect(() => {
    setSearchInput(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== (filters.q ?? "")) {
        dispatch(setFilter({ q: searchInput || undefined }));
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data: clients = [] } = useGetClientsLiteQuery();
  const { data: products = [], isFetching: isFetchingProducts } = useGetProductsQuery(
    filters.clientId ? { clientId: filters.clientId } : undefined,
    { skip: !filters.clientId }
  );
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: roles = [] } = useGetRolesQuery();
  const { data: customTaskTypes = [] } = useGetCustomTaskTypesQuery();
  const { data: taskTags = [] } = useGetTaskTagsQuery();

  const availableRolesList = useMemo(() => {
    const roleMap = new Map<string, { id?: string; name: string; label: string; color?: string | null }>();

    // 1. System standard roles
    const standardRoles = [
      { name: "ADMIN", label: "Admin", color: "purple" },
      { name: "MANAGER", label: "Manager", color: "amber" },
      { name: "DEVELOPER", label: "Developer", color: "blue" },
      { name: "SUPPORT", label: "Support", color: "emerald" },
    ];
    for (const sys of standardRoles) {
      roleMap.set(sys.name, {
        id: sys.name,
        name: sys.name,
        label: sys.label,
        color: sys.color,
      });
    }

    // 2. Dynamic custom roles from DB
    for (const r of roles) {
      roleMap.set(r.name, {
        id: r.id,
        name: r.name,
        label: r.label || r.name,
        color: r.color || "purple",
      });
    }

    return Array.from(roleMap.values());
  }, [roles]);

  const selectedAssigneeIds = useMemo(() => {
    if (filters.assignedToIds) {
      return filters.assignedToIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (filters.assignedToId && filters.assignedToId !== "ALL") {
      return [filters.assignedToId];
    }
    return [];
  }, [filters.assignedToIds, filters.assignedToId]);

  const handleAssigneesChange = (userIds: string[]) => {
    dispatch(
      setFilter({
        assignedToIds: userIds.length > 0 ? userIds.join(",") : undefined,
        assignedToId: undefined,
      })
    );
  };

  const activeCount = Object.entries(filters).filter(
    ([key, val]) =>
      key !== "page" &&
      key !== "pageSize" &&
      val !== undefined &&
      val !== "" &&
      val !== "ALL"
  ).length;

  const hasActiveFilters = activeCount > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-3 bg-card p-3 sm:p-3.5 rounded-2xl border border-border shadow-xs transition-all">
      {/* Top row: Search input + active filter count + View Switcher */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search tasks, ticket # (e.g. TSK-123)…"
            className="pl-9 pr-14 h-9 text-xs rounded-xl bg-input border-input-border focus:border-ring shadow-2xs"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput ? (
            <button
              onClick={() => {
                setSearchInput("");
                dispatch(setFilter({ q: undefined }));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 rounded border border-border/60 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {hasActiveFilters && (
          <span className="shrink-0 hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeCount} active filter{activeCount > 1 ? "s" : ""}
          </span>
        )}

        <div className="flex-1 hidden sm:block" />

        <SegmentedTabs<BoardView>
          value={boardView}
          onChange={(v) => dispatch(setBoardView(v))}
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

      {/* Bottom row: Filter selectors */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 border-t border-border/40 sm:border-0 sm:pt-0">
        {/* Clients filter */}
        <Select
          value={filters.clientId ?? "ALL"}
          onValueChange={(val) =>
            dispatch(
              setFilter({
                clientId: val === "ALL" ? undefined : val,
                productId: undefined,
              })
            )
          }
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.clientId
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${filters.clientId ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
            <SelectItem value="ALL">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      client.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : client.status === "ONBOARDING"
                        ? "bg-amber-400"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {client.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Product filter (conditional on client selection) */}
        {filters.clientId && (
          <Select
            value={filters.productId ?? "ALL"}
            onValueChange={(val) =>
              dispatch(setFilter({ productId: val === "ALL" ? undefined : val }))
            }
          >
            <SelectTrigger
              className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer animate-in fade-in-50 zoom-in-95 duration-150 ${
                filters.productId
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                  : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
              }`}
            >
              <Package className={`w-3.5 h-3.5 shrink-0 ${filters.productId ? "text-primary" : "text-muted-foreground"}`} />
              <SelectValue placeholder={isFetchingProducts ? "Loading..." : "All Products"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
              <SelectItem value="ALL">All Products</SelectItem>
              {products.map((prod) => (
                <SelectItem key={prod.id} value={prod.id}>
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="truncate">{prod.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Teams filter */}
        <Select
          value={filters.assignedTeamId ?? "ALL"}
          onValueChange={(val) =>
            dispatch(setFilter({ assignedTeamId: val === "ALL" ? undefined : val }))
          }
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.assignedTeamId
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Users2 className={`w-3.5 h-3.5 shrink-0 ${filters.assignedTeamId ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
            <SelectItem value="ALL">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      TEAM_COLOR_DOT[team.color ?? "default"] ?? TEAM_COLOR_DOT.default
                    }`}
                  />
                  {team.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role & Custom Role filter */}
        <Select
          value={filters.role ?? "ALL"}
          onValueChange={(val) =>
            dispatch(setFilter({ role: val === "ALL" ? undefined : val }))
          }
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.role
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Shield className={`w-3.5 h-3.5 shrink-0 ${filters.role ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
            <SelectItem value="ALL">All Roles</SelectItem>
            {availableRolesList.map((r) => (
              <SelectItem key={r.name} value={r.name}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      ROLE_DOT_COLOR[r.color ?? "purple"] ?? "bg-purple-500"
                    }`}
                  />
                  <span>{r.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignees multi-filter */}
        <MultiAssigneeFilter
          users={users}
          selectedUserIds={selectedAssigneeIds}
          onChange={handleAssigneesChange}
        />

        {/* Priority filter */}
        <Select
          value={filters.priority ?? "ALL"}
          onValueChange={(val) =>
            dispatch(setFilter({ priority: val === "ALL" ? undefined : val }))
          }
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.priority
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Flame className={`w-3.5 h-3.5 shrink-0 ${filters.priority ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="CRITICAL">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-2xs" /> Urgent
              </span>
            </SelectItem>
            <SelectItem value="HIGH">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-2xs" /> High
              </span>
            </SelectItem>
            <SelectItem value="MEDIUM">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-2xs" /> Medium
              </span>
            </SelectItem>
            <SelectItem value="LOW">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-2xs" /> Low
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Type & Custom Task Type filter */}
        <Select
          value={filters.type ?? "ALL"}
          onValueChange={(val) =>
            dispatch(setFilter({ type: val === "ALL" ? undefined : val }))
          }
        >
          <SelectTrigger
            className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
              filters.type
                ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
            }`}
          >
            <Tag className={`w-3.5 h-3.5 shrink-0 ${filters.type ? "text-primary" : "text-muted-foreground"}`} />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
            <SelectItem value="ALL">All Types</SelectItem>
            {STANDARD_TYPES.map((tp) => (
              <SelectItem key={tp.value} value={tp.value}>
                {tp.label}
              </SelectItem>
            ))}
            {customTaskTypes
              .filter((ct) => !STANDARD_TYPES.some((st) => st.value.toLowerCase() === ct.name.toLowerCase()))
              .map((ct) => (
                <SelectItem key={ct.id} value={ct.name}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span>{ct.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Tag Filter */}
        {taskTags.length > 0 && (
          <Select
            value={filters.tag ?? "ALL"}
            onValueChange={(val) =>
              dispatch(setFilter({ tag: val === "ALL" ? undefined : val }))
            }
          >
            <SelectTrigger
              className={`h-8.5 w-auto min-w-fit max-w-[180px] px-3 text-xs rounded-xl gap-2 transition-all shadow-2xs cursor-pointer ${
                filters.tag
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:border-primary/70 shadow-xs"
                  : "border-input-border bg-input text-foreground hover:border-border-strong hover:bg-surface-elevated"
              }`}
            >
              <Tag className={`w-3.5 h-3.5 shrink-0 ${filters.tag ? "text-primary" : "text-muted-foreground"}`} />
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/80 bg-surface-elevated shadow-xl">
              <SelectItem value="ALL">All Tags</SelectItem>
              {taskTags.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        TAG_COLORS[t.color || "blue"]?.dot || "bg-blue-500"
                      }`}
                    />
                    <span>{t.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear all active filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(resetFilters())}
            className="h-8.5 px-3 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
