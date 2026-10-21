"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@zsyio/ui";
import {
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useGetFoldersQuery,
  type FolderItem,
} from "@/store/api/notesApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zsyio/ui";
import { Folder, Loader2 } from "lucide-react";
import { Input } from "@zsyio/ui";
import { toast } from "sonner";

const FOLDER_COLORS = [
  { name: "Purple", value: "purple", bg: "bg-notion-purple-fg", ring: "ring-notion-purple-fg/30" },
  { name: "Blue", value: "blue", bg: "bg-notion-blue-fg", ring: "ring-notion-blue-fg/30" },
  { name: "Emerald", value: "emerald", bg: "bg-success", ring: "ring-success/30" },
  { name: "Amber", value: "amber", bg: "bg-warning", ring: "ring-warning/30" },
  { name: "Rose", value: "rose", bg: "bg-destructive", ring: "ring-destructive/30" },
  { name: "Cyan", value: "cyan", bg: "bg-notion-blue-fg", ring: "ring-notion-blue-fg/30" },
  { name: "Slate", value: "slate", bg: "bg-muted-foreground", ring: "ring-border" },
];

interface FolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: FolderItem | null;
  defaultParentId?: string | null;
}

export function FolderModal({ open, onOpenChange, folder, defaultParentId }: FolderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [isWorkspaceRoot, setIsWorkspaceRoot] = useState(false);
  const [generalAccess, setGeneralAccess] = useState<"PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT">("PRIVATE");

  const { data: foldersData } = useGetFoldersQuery(undefined, { skip: !open });
  const allFolders = foldersData?.folders ?? [];

  const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();
  const [updateFolder, { isLoading: isUpdating }] = useUpdateFolderMutation();

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color || "purple");
      setDescription(folder.description || "");
      setParentId(folder.parentId);
      setIsWorkspaceRoot(folder.isWorkspaceRoot);
      setGeneralAccess(folder.generalAccess);
    } else {
      setName("");
      setColor("purple");
      setDescription("");
      setParentId(defaultParentId || null);
      setIsWorkspaceRoot(false);
      setGeneralAccess("PRIVATE");
    }
  }, [folder, defaultParentId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a folder name.");
      return;
    }

    try {
      if (folder) {
        await updateFolder({
          id: folder.id,
          name: name.trim(),
          color,
          description: description.trim() || undefined,
          parentId: isWorkspaceRoot ? null : parentId,
          generalAccess,
        }).unwrap();
        toast.success("Folder updated");
      } else {
        await createFolder({
          name: name.trim(),
          color,
          description: description.trim() || undefined,
          parentId: isWorkspaceRoot ? null : parentId,
          isWorkspaceRoot,
          generalAccess,
        }).unwrap();
        toast.success(isWorkspaceRoot ? "Workspace created" : "Folder created");
      }
      onOpenChange(false);
    } catch {
      toast.error("Failed to save folder");
    }
  };

  const isLoading = isCreating || isUpdating;

  // Filter out current folder and its children to prevent circular nesting
  const eligibleParents = allFolders.filter((f) => !folder || f.id !== folder.id);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={folder ? "Edit Folder" : isWorkspaceRoot ? "Create Workspace" : "New Folder"}
      description={folder ? "Update folder details and color theme" : "Create a new folder or top-level workspace"}
      icon={<Folder className="w-4 h-4" />}
      iconVariant="purple"
      size="md"
      bodyClassName="p-5 flex flex-col gap-4"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Folder Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Engineering Docs, Sprint 42 Specs..."
            className="h-10 text-xs rounded-lg bg-surface-subtle"
            autoFocus
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Color Theme</label>
          <div className="flex items-center gap-2.5">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer ${
                  color === c.value ? `ring-2 ${c.ring} ring-offset-2 scale-110` : " opacity-80 hover:opacity-100"
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {!folder && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-subtle/50">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Top-Level Workspace</span>
              <span className="text-xs text-muted-foreground">
                Display as an independent root workspace in the sidebar
              </span>
            </div>
            <input
              type="checkbox"
              checked={isWorkspaceRoot}
              onChange={(e) => {
                setIsWorkspaceRoot(e.target.checked);
                if (e.target.checked) setParentId(null);
              }}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </div>
        )}

        {!isWorkspaceRoot && eligibleParents.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Parent Folder (Optional)</label>
            <Select
              value={parentId || "none"}
              onValueChange={(val) => setParentId(val === "none" ? null : val)}
            >
              <SelectTrigger className="w-full h-10 rounded-lg bg-card">
                <SelectValue placeholder="(None - Root Level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(None - Root Level)</SelectItem>
                {eligibleParents.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} {f.isWorkspaceRoot ? "[Workspace]" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose of this folder..."
            className="h-10 text-xs rounded-lg bg-surface-subtle"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border mt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{folder ? "Save Changes" : "Create Folder"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
