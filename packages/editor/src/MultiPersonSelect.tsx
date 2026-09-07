"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { UserRoleBadge } from "@zsyio/ui";
import type { User } from "@zsyio/types";
import {
  Users,
  Check,
  Search,
  X,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { cn } from "@zsyio/ui";

export interface MultiPersonSelectProps {
  users: User[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  alreadySharedUserIds?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiPersonSelect({
  users = [],
  selectedUserIds = [],
  onChange,
  alreadySharedUserIds = [],
  placeholder = "Select people...",
  className = "",
  disabled = false,
}: MultiPersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedUserIds.includes(u.id)),
    [users, selectedUserIds]
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.customRole?.name?.toLowerCase().includes(q) ||
        u.customRole?.label?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map((u) => u.id);
    const combined = Array.from(new Set([...selectedUserIds, ...allFilteredIds]));
    onChange(combined);
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredUsers.map((u) => u.id));
    onChange(selectedUserIds.filter((id) => !filteredIdSet.has(id)));
  };

  const isAllFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const hasSelection = selectedUserIds.length > 0;

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 cursor-pointer select-none gap-2 outline-none",
            hasSelection
              ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/70 shadow-xs"
              : "border-border/80 bg-card text-foreground hover:border-border-strong hover:bg-surface-elevated",
            disabled && "opacity-50 pointer-events-none cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate min-w-0 flex-1">
            {selectedUserIds.length === 0 ? (
              <>
                <Users className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground font-normal">{placeholder}</span>
              </>
            ) : selectedUserIds.length === 1 && selectedUsers[0] ? (
              <>
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                  {selectedUsers[0].name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="truncate font-semibold text-foreground">
                  {selectedUsers[0].name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground hidden sm:inline">
                  ({selectedUsers[0].email})
                </span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate font-semibold text-foreground">
                  {selectedUsers.slice(0, 2).map((u) => u.name).join(", ")}
                  {selectedUsers.length > 2 ? ` +${selectedUsers.length - 2} more` : ""}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full font-bold bg-primary/10 text-primary border-primary/20 shrink-0">
                  {selectedUserIds.length}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {hasSelection && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClear();
                }}
                title="Clear selected people"
                className="p-0.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-transform duration-150",
                hasSelection ? "text-primary/70" : "text-muted-foreground",
                open && "rotate-180"
              )}
            />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(calc(100vw-3rem),380px)] sm:w-[400px] p-0 shadow-2xl rounded-2xl border border-border/80 bg-surface-elevated text-foreground z-50 overflow-hidden backdrop-blur-md"
      >
        {/* Search header */}
        <div className="p-2.5 border-b border-border/60 bg-surface-subtle/50 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by name, email, or role..."
              className="h-8 pl-8 pr-7 text-xs bg-card rounded-lg border border-input-border text-foreground placeholder:text-muted-foreground shadow-2xs focus:border-ring"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick toggle bar */}
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-medium">
            <span>
              {selectedUserIds.length === 0
                ? "No people selected"
                : `${selectedUserIds.length} selected`}
            </span>
            <div className="flex items-center gap-2">
              {filteredUsers.length > 0 && (
                <button
                  type="button"
                  onClick={
                    isAllFilteredSelected
                      ? handleDeselectAllFiltered
                      : handleSelectAllFiltered
                  }
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  {isAllFilteredSelected ? "Deselect all" : "Select all"}
                </button>
              )}
              {hasSelection && !isAllFilteredSelected && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User list */}
        <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-border/20 scrollbar-thin">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No people found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              const isAlreadyShared = alreadySharedUserIds.includes(user.id);

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    "w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-xl hover:bg-surface-subtle transition-colors text-left cursor-pointer group",
                    isSelected
                      ? "bg-primary/10 text-foreground font-semibold"
                      : "text-foreground font-medium"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={cn(
                        "w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors shadow-2xs",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/15 text-primary group-hover:bg-primary/25"
                      )}
                    >
                      {user.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">{user.name}</span>
                        {isAlreadyShared && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-surface-subtle text-muted-foreground border border-border/60">
                            Shared
                          </span>
                        )}
                      </div>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <UserRoleBadge role={user.role} customRole={user.customRole} className="text-[10px]" />
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground shadow-2xs"
                          : "border-input-border bg-input group-hover:border-border-strong"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
