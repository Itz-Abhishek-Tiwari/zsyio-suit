"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger, Input, cn } from "@zsyio/ui";
import { Search, X, Sparkles } from "lucide-react";
import { NoteIcon } from "./NoteIcon";

const ICON_GROUPS = [
  {
    category: "General & Documents",
    icons: [
      { id: "file-text", label: "Document" },
      { id: "book-open", label: "Book / Knowledge" },
      { id: "file-check", label: "Checked Spec" },
      { id: "bookmark", label: "Bookmark" },
      { id: "folder", label: "Folder" },
      { id: "archive", label: "Archive" },
      { id: "calendar", label: "Calendar / Meeting" },
      { id: "sparkles", label: "Sparkles / Highlights" },
    ],
  },
  {
    category: "Tech & Engineering",
    icons: [
      { id: "code", label: "Code" },
      { id: "file-code", label: "Code File" },
      { id: "cpu", label: "Architecture / CPU" },
      { id: "terminal", label: "Terminal / CLI" },
      { id: "database", label: "Database / Schema" },
      { id: "server", label: "Server / Cloud" },
      { id: "workflow", label: "Workflow / Pipeline" },
      { id: "boxes", label: "Modules / Packages" },
      { id: "lock", label: "Security / Lock" },
      { id: "shield", label: "Compliance / Shield" },
      { id: "bug", label: "Bug / RCA" },
      { id: "zap", label: "Fast / Sync" },
    ],
  },
  {
    category: "Product & Operations",
    icons: [
      { id: "layers", label: "Layers / PRD" },
      { id: "target", label: "Goal / Roadmap" },
      { id: "compass", label: "Direction / Strategy" },
      { id: "rocket", label: "Launch / Release" },
      { id: "lightbulb", label: "Idea / Proposal" },
      { id: "users", label: "Team / Sync" },
      { id: "briefcase", label: "Business / Client" },
      { id: "activity", label: "Monitoring / Health" },
      { id: "bar-chart", label: "Analytics" },
      { id: "trending-up", label: "Growth / Metrics" },
      { id: "message-square", label: "Discussion" },
      { id: "alert-triangle", label: "Incident / Warning" },
      { id: "check-circle", label: "Success / Review" },
      { id: "settings", label: "Configuration" },
    ],
  },
];

interface IconPickerProps {
  currentIcon?: string | null;
  onSelect: (icon: string | null) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function IconPicker({ currentIcon, onSelect, children, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const filteredGroups = ICON_GROUPS.map((group) => ({
    ...group,
    icons: group.icons.filter(
      (icon) =>
        !query ||
        icon.id.toLowerCase().includes(query) ||
        icon.label.toLowerCase().includes(query)
    ),
  })).filter((group) => group.icons.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children ? (
          children
        ) : (
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-elevated text-sm transition-colors cursor-pointer border border-transparent hover:border-border"
            title="Change Document Icon"
          >
            {currentIcon ? (
              <NoteIcon icon={currentIcon} size="md" />
            ) : (
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-3 rounded-2xl shadow-xl border border-border bg-card/95 backdrop-blur-md"
      >
        <div className="flex flex-col gap-2.5">
          {/* Search input */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="h-8 pl-8 pr-7 text-xs rounded-lg bg-surface-subtle"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Categorized Icons Grid */}
          <div className="max-h-64 overflow-y-auto pr-1 flex flex-col gap-3">
            {filteredGroups.map((group) => (
              <div key={group.category} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  {group.category}
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {group.icons.map((icon) => {
                    const isSelected = currentIcon === icon.id;
                    return (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          onSelect(icon.id);
                          setOpen(false);
                        }}
                        title={icon.label}
                        className={cn(
                          "w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer border",
                          isSelected
                            ? "bg-primary/15 border-primary text-primary shadow-xs"
                            : "border-transparent bg-surface-subtle/70 hover:bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                      >
                        <NoteIcon icon={icon.id} size="md" className={isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching icons found
              </div>
            )}
          </div>

          {currentIcon && (
            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="text-xs text-destructive hover:underline font-medium cursor-pointer"
              >
                Remove Icon
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
