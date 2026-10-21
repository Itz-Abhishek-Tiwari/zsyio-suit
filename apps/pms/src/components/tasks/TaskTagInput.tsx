"use client";

import React, { useState, useRef } from "react";
import { useGetTaskTagsQuery, useCreateTaskTagMutation } from "@/store/api/taskTagsApi";
import { TaskTagBadge, TAG_COLORS } from "./TaskTagBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@zsyio/ui";
import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { Plus, Check, Search, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLOR_KEYS = ["blue", "emerald", "purple", "amber", "rose", "cyan", "orange", "indigo"] as const;

interface TaskTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TaskTagInput({
  value = [],
  onChange,
  disabled = false,
  placeholder = "Add tags...",
  className,
}: TaskTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("blue");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allTags = [], isLoading } = useGetTaskTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateTaskTagMutation();

  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const isExactMatch = allTags.some(
    (t) => t.name.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  const handleToggleTag = (tagName: string) => {
    if (disabled) return;
    if (value.includes(tagName)) {
      onChange(value.filter((t) => t !== tagName));
    } else {
      onChange([...value, tagName]);
    }
  };

  const handleCreateNewTag = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    try {
      await createTag({ name: trimmed, color: selectedColor }).unwrap();
      if (!value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setSearchTerm("");
      toast.success(`Tag "${trimmed}" created`);
    } catch {
      toast.error("Failed to create custom tag");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isExactMatch && searchTerm.trim()) {
        handleCreateNewTag();
      } else if (filteredTags.length > 0) {
        handleToggleTag(filteredTags[0].name);
        setSearchTerm("");
      }
    }
  };

  const getTagColor = (name: string) => {
    const found = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    return found?.color || "blue";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-1.5 rounded-lg border border-border/80 bg-background hover:border-border transition-colors">
          {value.map((tagName) => (
            <TaskTagBadge
              key={tagName}
              name={tagName}
              color={getTagColor(tagName)}
              onRemove={disabled ? undefined : () => handleToggleTag(tagName)}
            />
          ))}

          {!disabled && (
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span className="text-xs font-medium">{value.length === 0 ? placeholder : "Add"}</span>
              </button>
            </PopoverTrigger>
          )}
        </div>

        <PopoverContent align="start" className="w-64 p-2 shadow-md">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or type new tag..."
                className="h-8 pl-8 text-xs"
                autoFocus
              />
            </div>

            {/* List of existing tags */}
            <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
              {isLoading ? (
                <div className="text-xs text-muted-foreground py-2 text-center">Loading tags...</div>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag) => {
                  const isSelected = value.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer text-left",
                        isSelected ? "bg-muted font-semibold" : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            TAG_COLORS[tag.color || "blue"]?.dot || "bg-notion-blue-fg"
                          )}
                        />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground py-1 text-center">
                  No matching tags found
                </div>
              )}
            </div>

            {/* Create new custom tag prompt */}
            {searchTerm.trim() && !isExactMatch && (
              <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Color:</span>
                  <div className="flex items-center gap-1">
                    {COLOR_KEYS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full transition-transform cursor-pointer",
                          TAG_COLORS[c].dot,
                          selectedColor === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-80 hover:opacity-100"
                        )}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  type="button"
                  onClick={handleCreateNewTag}
                  disabled={isCreating}
                  className="h-7 text-xs gap-1.5 w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create &quot;{searchTerm.trim()}&quot;</span>
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
