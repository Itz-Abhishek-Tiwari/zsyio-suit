"use client";

import React, { useState } from "react";
import { Modal } from "@zsyio/ui";
import {
  useUpdateNoteMutation,
  useUpdateFolderMutation,
  type NoteItem,
  type FolderItem,
} from "@/store/api/notesApi";
import { Folder, FolderInput, FileText, Check, Search, X, Loader2 } from "lucide-react";
import { Input } from "@zsyio/ui";
import { toast } from "sonner";
import { cn } from "@zsyio/ui";

interface MoveNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { type: "note"; note: NoteItem } | { type: "folder"; folder: FolderItem } | null;
  folders: FolderItem[];
}

export function MoveNoteModal({ open, onOpenChange, item, folders }: MoveNoteModalProps) {
  const [search, setSearch] = useState("");
  const [updateNote, { isLoading: isMovingNote }] = useUpdateNoteMutation();
  const [updateFolder, { isLoading: isMovingFolder }] = useUpdateFolderMutation();

  if (!item) return null;

  const isNote = item.type === "note";
  const currentParentId = isNote ? item.note.folderId : item.folder.parentId;
  const currentTitle = isNote ? item.note.title || "Untitled" : item.folder.name;

  // Filter eligible folders (exclude the folder itself and its descendants if moving a folder)
  const eligibleFolders = folders.filter((f) => {
    if (!isNote && f.id === item.folder.id) return false;
    if (search.trim() && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleMove = async (targetFolderId: string | null) => {
    try {
      if (isNote) {
        await updateNote({
          id: item.note.id,
          folderId: targetFolderId,
        }).unwrap();
        const targetName = targetFolderId ? folders.find((f) => f.id === targetFolderId)?.name || "Folder" : "Private Pages (Root)";
        toast.success(`Moved "${currentTitle}" to ${targetName}`);
      } else {
        await updateFolder({
          id: item.folder.id,
          parentId: targetFolderId,
        }).unwrap();
        const targetName = targetFolderId ? folders.find((f) => f.id === targetFolderId)?.name || "Folder" : "Workspace Root";
        toast.success(`Moved "${currentTitle}" to ${targetName}`);
      }
      onOpenChange(false);
    } catch {
      toast.error(`Failed to move ${isNote ? "document" : "folder"}`);
    }
  };

  const isSubmitting = isMovingNote || isMovingFolder;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Move "${currentTitle}"`}
      description={`Select destination folder for this ${isNote ? "document" : "folder"}`}
      icon={<FolderInput className="w-4 h-4" />}
      iconVariant="purple"
      size="md"
    >
      <div className="flex flex-col gap-3 pt-1">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destination folder..."
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

        {/* Options List */}
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
          {/* Root option */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleMove(null)}
            className={cn(
              "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border select-none",
              currentParentId === null
                ? "bg-surface-elevated text-foreground border-border font-semibold shadow-xs"
                : "border-transparent hover:bg-surface-elevated/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{isNote ? "Private Pages (No Folder / Root)" : "Workspace Root (Top Level)"}</span>
            </div>
            {currentParentId === null && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>

          {/* Folders */}
          {eligibleFolders.map((f) => {
            const isCurrent = currentParentId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleMove(f.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border select-none",
                  isCurrent
                    ? "bg-surface-elevated text-foreground border-border font-semibold shadow-xs"
                    : "border-transparent hover:bg-surface-elevated/70 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Folder className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}

          {eligibleFolders.length === 0 && search && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching folders found
            </div>
          )}
        </div>

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Moving...</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
