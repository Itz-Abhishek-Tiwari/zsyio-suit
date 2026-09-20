"use client";

import React, { useState, useMemo } from "react";
import {
  FolderItem,
  NoteItem,
  NotesTreeResponse,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useDeleteFolderMutation,
  useUpdateNoteMutation,
  useUpdateFolderMutation,
} from "@/store/api/notesApi";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  FolderInput,
  FilePlus,
  Star,
  Search,
  MoreHorizontal,
  Share2,
  Trash2,
  LayoutTemplate,
  Globe,
  RotateCcw,
  Users,
  Edit2,
  X,
  GripVertical,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zsyio/ui";
import { NoteIcon } from "@zsyio/editor";
import { toast } from "sonner";
import { cn } from "@zsyio/ui";
import { MoveNoteModal } from "./MoveNoteModal";

interface NoteSidebarTreeProps {
  tree: NotesTreeResponse;
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onOpenNewFolder: (parentId?: string | null) => void;
  onOpenEditFolder: (folder: FolderItem) => void;
  onOpenShareFolder: (folder: FolderItem) => void;
  onOpenTemplates: (folderId?: string | null) => void;
  onOpenShareNote: (note: NoteItem) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FOLDER_COLOR_MAP: Record<string, string> = {
  purple: "text-purple-500 fill-purple-500/10",
  blue: "text-blue-500 fill-blue-500/10",
  emerald: "text-emerald-500 fill-emerald-500/10",
  amber: "text-amber-500 fill-amber-500/10",
  rose: "text-rose-500 fill-rose-500/10",
  cyan: "text-cyan-500 fill-cyan-500/10",
  slate: "text-slate-400 fill-slate-400/10",
};

type DragPayload = {
  type: "note" | "folder";
  id: string;
  title: string;
};

type ViewFilter = "all" | "starred" | "shared" | "recent";

export function NoteSidebarTree({
  tree,
  activeNoteId,
  onSelectNote,
  onOpenNewFolder,
  onOpenEditFolder,
  onOpenShareFolder,
  onOpenTemplates,
  onOpenShareNote,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: NoteSidebarTreeProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ViewFilter>("all");
  const [showTrash, setShowTrash] = useState(false);

  // Drag and Drop state
  const [draggingItem, setDraggingItem] = useState<DragPayload | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // Move Modal state
  const [moveModalItem, setMoveModalItem] = useState<
    { type: "note"; note: NoteItem } | { type: "folder"; folder: FolderItem } | null
  >(null);

  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [deleteFolder] = useDeleteFolderMutation();
  const [updateNote] = useUpdateNoteMutation();
  const [updateFolder] = useUpdateFolderMutation();

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleQuickCreateNote = async (folderId?: string | null) => {
    try {
      const newNote = await createNote({
        title: "Untitled",
        content: "",
        folderId: folderId || null,
      }).unwrap();
      if (folderId) {
        setExpandedFolderIds((prev) => new Set([...prev, folderId]));
      }
      onSelectNote(newNote.id);
      toast.success("New page created");
    } catch {
      toast.error("Failed to create page");
    }
  };

  const handleDeleteNotePrompt = async (noteId: string, permanent = false) => {
    try {
      await deleteNote({ id: noteId, permanent }).unwrap();
      toast.success(permanent ? "Note permanently deleted" : "Note moved to trash");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleRestoreNote = async (noteId: string) => {
    try {
      await updateNote({ id: noteId, isArchived: false }).unwrap();
      toast.success("Note restored from trash");
    } catch {
      toast.error("Failed to restore note");
    }
  };

  const handleDeleteFolderPrompt = async (folderId: string, permanent = false) => {
    try {
      await deleteFolder({ id: folderId, permanent }).unwrap();
      toast.success(permanent ? "Folder deleted" : "Folder moved to trash");
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: DragPayload) => {
    e.stopPropagation();
    setDraggingItem(item);
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingItem) {
      if (draggingItem.type === "folder" && draggingItem.id === targetId) return;
      setDragOverTargetId(targetId);
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTargetId === targetId) {
      setDragOverTargetId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    let item = draggingItem;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) item = JSON.parse(raw);
      } catch {}
    }

    if (!item) return;

    if (item.type === "note") {
      try {
        await updateNote({ id: item.id, folderId: targetFolderId }).unwrap();
        const targetName = targetFolderId
          ? tree.folders.find((f) => f.id === targetFolderId)?.name || "Folder"
          : "Private Pages (Root)";
        toast.success(`Moved "${item.title || "Untitled"}" to ${targetName}`);
        if (targetFolderId) {
          setExpandedFolderIds((prev) => new Set([...prev, targetFolderId]));
        }
      } catch {
        toast.error("Failed to move page");
      }
    } else if (item.type === "folder") {
      if (item.id === targetFolderId) return;
      try {
        await updateFolder({ id: item.id, parentId: targetFolderId }).unwrap();
        const targetName = targetFolderId
          ? tree.folders.find((f) => f.id === targetFolderId)?.name || "Folder"
          : "Workspace Root";
        toast.success(`Moved folder "${item.title}" to ${targetName}`);
        if (targetFolderId) {
          setExpandedFolderIds((prev) => new Set([...prev, targetFolderId]));
        }
      } catch {
        toast.error("Failed to move folder");
      }
    }
    setDraggingItem(null);
  };

  // Build Folder Tree Map
  const folderMap = useMemo(() => {
    const map = new Map<string, FolderItem>();
    tree.folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [tree.folders]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, FolderItem[]>();
    tree.folders.forEach((f) => {
      if (f.parentId && folderMap.has(f.parentId)) {
        if (!map.has(f.parentId)) map.set(f.parentId, []);
        map.get(f.parentId)!.push(f);
      }
    });
    return map;
  }, [tree.folders, folderMap]);

  const folderNotesMap = useMemo(() => {
    const map = new Map<string, NoteItem[]>();
    tree.notes.forEach((n) => {
      if (n.folderId && folderMap.has(n.folderId)) {
        if (!map.has(n.folderId)) map.set(n.folderId, []);
        map.get(n.folderId)!.push(n);
      }
    });
    return map;
  }, [tree.notes, folderMap]);

  const rootFolders = useMemo(() => {
    return tree.folders.filter((f) => !f.parentId || !folderMap.has(f.parentId));
  }, [tree.folders, folderMap]);

  // Filter notes by search if typed
  const filterQuery = searchQuery.trim().toLowerCase();
  const searchMatchingNotes = useMemo(() => {
    if (!filterQuery) return [];
    return tree.notes.filter(
      (n) =>
        n.title.toLowerCase().includes(filterQuery) ||
        (n.content && n.content.toLowerCase().includes(filterQuery))
    );
  }, [tree.notes, filterQuery]);

  // Recent notes (sorted by updatedAt descending)
  const recentNotes = useMemo(() => {
    return [...tree.notes]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 10);
  }, [tree.notes]);

  const renderNoteItem = (note: NoteItem, depth = 0) => {
    const isActive = activeNoteId === note.id;
    const isBeingDragged = draggingItem?.type === "note" && draggingItem.id === note.id;

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(e) =>
          handleDragStart(e, { type: "note", id: note.id, title: note.title || "Untitled" })
        }
        onDragEnd={() => {
          setDraggingItem(null);
          setDragOverTargetId(null);
        }}
        style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
        className={cn(
          "group relative flex items-center justify-between py-1.5 px-2 rounded-md text-xs transition-all duration-150 cursor-pointer select-none hover:translate-x-0.5",
          isBeingDragged && "opacity-30 scale-95",
          isActive
            ? "bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80 border border-transparent"
        )}
        onClick={() => onSelectNote(note.id)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -ml-1 cursor-grab" />
          <NoteIcon
            icon={note.icon}
            size="sm"
            className={cn(
              "shrink-0 transition-transform duration-150",
              isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span className="truncate">{note.title || "Untitled"}</span>
          {note.isPinned && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />}
        </div>

        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-1 animate-pulse" />
        )}

        {/* Hover action menu */}
        <div
          className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-md shadow-lg border border-border/80">
              <DropdownMenuItem
                onClick={() => setMoveModalItem({ type: "note", note })}
                className="text-xs gap-2 cursor-pointer"
              >
                <FolderInput className="w-3.5 h-3.5 text-primary" />
                <span>Move to folder...</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOpenShareNote(note)}
                className="text-xs gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Share Note</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleQuickCreateNote(note.folderId)}
                className="text-xs gap-2 cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5 text-muted-foreground" />
                <span>New Page Here</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => handleDeleteNotePrompt(note.id, false)}
                className="text-xs gap-2 text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderFolderTree = (folder: FolderItem, depth = 0) => {
    const isExpanded = expandedFolderIds.has(folder.id);
    const subfolders = childrenMap.get(folder.id) || [];
    const notesInFolder = folderNotesMap.get(folder.id) || [];
    const colorClass = FOLDER_COLOR_MAP[folder.color || "purple"] || "text-purple-500 fill-purple-500/10";
    const isDragOver = dragOverTargetId === folder.id;
    const isBeingDragged = draggingItem?.type === "folder" && draggingItem.id === folder.id;

    return (
      <div key={folder.id} className="flex flex-col">
        <div
          draggable
          onDragStart={(e) =>
            handleDragStart(e, { type: "folder", id: folder.id, title: folder.name })
          }
          onDragEnd={() => {
            setDraggingItem(null);
            setDragOverTargetId(null);
          }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={(e) => handleDragLeave(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
          style={{ paddingLeft: `${Math.max(4, depth * 14 + 4)}px` }}
          className={cn(
            "group relative flex items-center justify-between py-1.5 pr-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer select-none hover:translate-x-0.5",
            isBeingDragged && "opacity-30 scale-95",
            isDragOver
              ? "bg-primary/15 ring-2 ring-primary border border-primary/40 text-foreground"
              : "hover:bg-surface-elevated text-foreground/90"
          )}
          onClick={() => toggleFolder(folder.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <GripVertical className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -ml-1 cursor-grab" />
            <span className="p-0.5 text-muted-foreground hover:text-foreground inline-flex items-center">
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-150", isExpanded && "rotate-90")} />
            </span>
            <Folder className={cn("w-4 h-4 shrink-0 transition-colors", colorClass)} />
            <span className="truncate font-semibold text-foreground/90">
              {folder.name}
            </span>
            {folder.generalAccess !== "PRIVATE" && (
              <span title="Workspace Shared" className="flex items-center">
                <Globe className="w-2.5 h-2.5 text-primary/80 shrink-0" />
              </span>
            )}
          </div>

          <div
            className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleQuickCreateNote(folder.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Add Page in Folder"
            >
              <FilePlus className="w-3 h-3" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1 rounded-md shadow-lg border border-border/80">
                <DropdownMenuItem
                  onClick={() => setMoveModalItem({ type: "folder", folder })}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5 text-primary" />
                  <span>Move Folder...</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onOpenShareFolder(folder)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Share Folder</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onOpenNewFolder(folder.id)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>New Subfolder</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onOpenEditFolder(folder)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Rename & Color</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => handleDeleteFolderPrompt(folder.id, false)}
                  className="text-xs gap-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move Folder to Trash</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expanded Contents */}
        {isExpanded && (
          <div className="flex flex-col gap-0.5 mt-0.5 border-l border-border/50 ml-4 pl-1">
            {subfolders.map((sf) => renderFolderTree(sf, depth + 1))}
            {notesInFolder.map((n) => renderNoteItem(n, depth + 1))}
            {subfolders.length === 0 && notesInFolder.length === 0 && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
                className="py-1 text-[10px] text-muted-foreground/50 italic"
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-full flex flex-col border-r border-border suite-sidebar-gradient shadow-xs select-none shrink-0 transition-[width] duration-150 ease-out z-20 overflow-hidden relative",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* Top ambient radial gradient glow */}
        <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-primary/6 via-indigo-500/3 to-transparent pointer-events-none dark:from-primary/12 dark:via-indigo-500/6" />

        {/* Right border fine gradient accent */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary/35 via-indigo-500/20 to-transparent pointer-events-none" />

        {isCollapsed ? (
          /* ── Collapsed Rail Content (Instant Render) ── */
          <div className="w-16 h-full flex flex-col items-center py-3 select-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="w-10 h-10 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer border border-transparent hover:border-border mb-3"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>

            <div className="w-8 h-px bg-border/80 my-1" />

            <div className="flex flex-col items-center gap-2 mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleQuickCreateNote(null)}
                    disabled={isCreating}
                    className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-xs shadow-primary/20 hover:bg-primary-hover transition-all cursor-pointer"
                  >
                    <FilePlus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">New Page</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onOpenTemplates()}
                    className="w-10 h-10 rounded-md border border-border/80 bg-surface-subtle hover:bg-surface-elevated text-foreground flex items-center justify-center transition-all cursor-pointer"
                  >
                    <LayoutTemplate className="w-4 h-4 text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Browse Templates</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onOpenNewFolder(null)}
                    className="w-10 h-10 rounded-md border border-border/80 bg-surface-subtle hover:bg-surface-elevated text-foreground flex items-center justify-center transition-all cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">New Folder</TooltipContent>
              </Tooltip>
            </div>

            <div className="mt-auto flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      toggleCollapse();
                      setShowTrash(true);
                    }}
                    className="w-10 h-10 rounded-md border border-border/80 bg-surface-subtle hover:bg-surface-elevated text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer relative"
                  >
                    <Trash2 className="w-4 h-4" />
                    {(tree.archivedNotes.length + tree.archivedFolders.length) > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Trash ({tree.archivedNotes.length + tree.archivedFolders.length})</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          /* ── Expanded Full Sidebar Content ── */
          <div className="w-72 h-full flex flex-col min-w-[288px] relative z-10">
            {/* 1. Header with search & actions */}
            <div className="relative p-3 border-b border-border/70 flex flex-col gap-2.5 bg-gradient-to-r from-primary/4 via-transparent to-primary/4 dark:via-primary/8">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/30 via-indigo-500/20 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-display uppercase tracking-wider text-muted-foreground font-mono">
                    Knowledge Base
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenTemplates()}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all cursor-pointer"
                    title="Browse Templates"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenNewFolder(null)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all cursor-pointer"
                    title="New Folder"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCreateNote(null)}
                    disabled={isCreating}
                    className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-all cursor-pointer shadow-2xs shadow-primary/20"
                    title="New Page"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all cursor-pointer ml-0.5"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/70" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter pages & workspaces..."
                  className="h-8 pl-8 pr-7 text-xs rounded-md bg-surface-subtle/80 hover:bg-surface-subtle focus:bg-card border-border/70 focus:border-primary/50 transition-all shadow-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips */}
              {!searchQuery && (
                <div className="flex items-center gap-1 pt-0.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer",
                      activeFilter === "all"
                        ? "bg-surface-elevated text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("starred")}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1",
                      activeFilter === "starred"
                        ? "bg-surface-elevated text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Starred</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("shared")}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1",
                      activeFilter === "shared"
                        ? "bg-surface-elevated text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>Shared</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("recent")}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1",
                      activeFilter === "recent"
                        ? "bg-surface-elevated text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>Recent</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Scrollable Tree Body */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 custom-scrollbar">
              {filterQuery ? (
                /* Search Results */
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 font-mono">
                    Search Results ({searchMatchingNotes.length})
                  </span>
                  {searchMatchingNotes.map((n) => renderNoteItem(n, 0))}
                  {searchMatchingNotes.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No matching documents found.
                    </div>
                  )}
                </div>
              ) : activeFilter === "starred" ? (
                /* Starred Filter View */
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 flex items-center gap-1.5 font-mono">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Starred Pages ({tree.starredNotes.length})</span>
                  </span>
                  {tree.starredNotes.map((n) => renderNoteItem(n, 0))}
                  {tree.starredNotes.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No starred pages yet. Star a note to keep it here.
                    </div>
                  )}
                </div>
              ) : activeFilter === "shared" ? (
                /* Shared Filter View */
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 flex items-center gap-1.5 font-mono">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>Shared with You ({tree.sharedWithMeNotes.length})</span>
                  </span>
                  {tree.sharedWithMeNotes.map((n) => renderNoteItem(n, 0))}
                  {tree.sharedWithMeNotes.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No documents shared with you yet.
                    </div>
                  )}
                </div>
              ) : activeFilter === "recent" ? (
                /* Recent Filter View */
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>Recently Updated</span>
                  </span>
                  {recentNotes.map((n) => renderNoteItem(n, 0))}
                </div>
              ) : (
                /* Standard Hierarchy View */
                <>
                  {/* ⭐ Starred / Favorites */}
                  {tree.starredNotes.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 flex items-center gap-1.5 font-mono">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Favorites</span>
                      </span>
                      {tree.starredNotes.map((n) => renderNoteItem(n, 0))}
                    </div>
                  )}

                  {/* 🏢 Workspaces & Folders */}
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 rounded-md transition-all duration-150",
                      dragOverTargetId === "workspace-root" && "bg-primary/10 ring-2 ring-primary p-1"
                    )}
                    onDragOver={(e) => handleDragOver(e, "workspace-root")}
                    onDragLeave={(e) => handleDragLeave(e, "workspace-root")}
                    onDrop={(e) => handleDrop(e, null)}
                  >
                    <div className="flex items-center justify-between px-2 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 font-mono flex items-center gap-1">
                        <Layers className="w-3 h-3 text-primary" />
                        <span>Folders & Workspaces</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenNewFolder(null)}
                        className="text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                        title="New Folder"
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    </div>

                    {rootFolders.map((f) => renderFolderTree(f, 0))}

                    {rootFolders.length === 0 && (
                      <div className="py-2 px-2 text-[11px] text-muted-foreground/60 italic">
                        No folders yet. Click + to organize.
                      </div>
                    )}
                  </div>

                  {/* 👥 Shared with Me */}
                  {tree.sharedWithMeNotes.length > 0 && (
                    <div className="flex flex-col gap-0.5 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 flex items-center gap-1.5 font-mono">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span>Shared with Me</span>
                      </span>
                      {tree.sharedWithMeNotes.map((n) => renderNoteItem(n, 0))}
                    </div>
                  )}

                  {/* 📝 My Notes / Private Pages */}
                  <div
                    className={cn(
                      "flex flex-col gap-0.5 pt-2 border-t border-border/50 rounded-md transition-all duration-150",
                      dragOverTargetId === "private-root" && "bg-primary/10 ring-2 ring-primary p-1"
                    )}
                    onDragOver={(e) => handleDragOver(e, "private-root")}
                    onDragLeave={(e) => handleDragLeave(e, "private-root")}
                    onDrop={(e) => handleDrop(e, null)}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1 font-mono flex items-center gap-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span>Private Pages</span>
                    </span>
                    {tree.myRootNotes.map((n) => renderNoteItem(n, 0))}
                    {tree.myRootNotes.length === 0 && (
                      <div className="py-2 px-2 text-[11px] text-muted-foreground/60 italic">
                        Drag pages here to unfile from folders
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 3. Bottom Trash / Archive Toggle */}
            <div className="p-2 border-t border-border bg-card/60 shrink-0">
              <button
                type="button"
                onClick={() => setShowTrash(!showTrash)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-surface-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash ({tree.archivedNotes.length + tree.archivedFolders.length})</span>
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", showTrash && "rotate-180")} />
              </button>

              {showTrash && (
                <div className="mt-2 max-h-40 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                  {tree.archivedNotes.map((an) => (
                    <div
                      key={an.id}
                      className="flex items-center justify-between p-1.5 rounded-md bg-surface-subtle/70 text-xs"
                    >
                      <span className="truncate text-muted-foreground">{an.title || "Untitled"}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRestoreNote(an.id)}
                          className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
                          title="Restore note"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotePrompt(an.id, true)}
                          className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {tree.archivedNotes.length === 0 && tree.archivedFolders.length === 0 && (
                    <span className="text-[11px] text-muted-foreground/60 text-center py-2">Trash is empty</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Move Note / Folder Modal */}
        {moveModalItem && (
          <MoveNoteModal
            open={Boolean(moveModalItem)}
            onOpenChange={(v) => !v && setMoveModalItem(null)}
            item={moveModalItem}
            folders={tree.folders}
          />
        )}
      </aside>
    </TooltipProvider>
  );
}
