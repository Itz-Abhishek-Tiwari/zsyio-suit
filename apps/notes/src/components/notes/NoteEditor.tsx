"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useGetNoteQuery,
  useUpdateNoteMutation,
  useToggleStarNoteMutation,
  useDeleteNoteMutation,
  type NoteItem,
} from "@/store/api/notesApi";
import {
  RichTextEditor,
  FormattedText,
  IconPicker,
  CoverPicker,
  NoteIcon,
  TableOfContents,
  parseCover,
  formatCoverWithPosition,
} from "@zsyio/editor";
import { useReactToPrint } from "react-to-print";
import {
  Star,
  Share2,
  MoreHorizontal,
  Clock,
  BookOpen,
  ChevronRight,
  Maximize2,
  Minimize2,
  UnfoldHorizontal,
  FoldHorizontal,
  Download,
  Printer,
  Trash2,
  Check,
  Loader2,
  Lock,
  Smile,
  ImageIcon,
  Save,
  ListTree,
  Copy,
  MoveVertical,
  X,
  Eye,
  Edit3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TooltipProvider,
  motion,
  AnimatePresence,
} from "@zsyio/ui";
import { toast } from "sonner";
import { cn } from "@zsyio/ui";
import { useUnsavedChanges } from "@zsyio/ui";

interface NoteEditorProps {
  noteId: string;
  onOpenShareModal: (note: NoteItem) => void;
  onSelectFolder?: (folderId: string) => void;
  onUnsavedChange?: (hasChanges: boolean, saveFn: () => Promise<boolean>) => void;
}

export function NoteEditor({
  noteId,
  onOpenShareModal,
  onSelectFolder,
  onUnsavedChange,
}: NoteEditorProps) {
  const { setUnsavedState } = useUnsavedChanges();
  const { data: note, isLoading, isError } = useGetNoteQuery(noteId);
  const [updateNote] = useUpdateNoteMutation();
  const [toggleStar, { isLoading: isStarring }] = useToggleStarNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zsyio-notes-fullwidth") === "true";
    }
    return false;
  });
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const handleToggleFullWidth = () => {
    setIsFullWidth((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("zsyio-notes-fullwidth", String(next));
      }
      return next;
    });
  };
  const printableRef = useRef<HTMLDivElement>(null);
  const coverBannerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; startPos: number; height: number } | null>(null);

  const parsedCover = useMemo(() => parseCover(note?.coverImage), [note?.coverImage]);
  const [coverPositionY, setCoverPositionY] = useState<number>(50);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  // Sync position from note coverImage
  useEffect(() => {
    setCoverPositionY(parsedCover.positionY);
    setIsRepositioning(false);
  }, [parsedCover.url, parsedCover.positionY]);

  // Sync state from server only when switching note ID
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  const isEditable = note?.effectiveAccess !== "VIEW";

  const hasUnsavedChanges = Boolean(
    note && (title !== (note.title || "") || content !== (note.content || ""))
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!note || !isEditable) return true;
    if (!hasUnsavedChanges && !isSaving) return true;

    setIsSaving(true);
    try {
      await updateNote({
        id: note.id,
        title: title.trim() || "Untitled",
        content,
      }).unwrap();
      toast.success("Document saved");
      return true;
    } catch {
      toast.error("Failed to save document");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [note, isEditable, hasUnsavedChanges, isSaving, updateNote, title, content]);

  // Sync with global UnsavedChangesProvider across the entire website
  useEffect(() => {
    setUnsavedState(hasUnsavedChanges, handleSave);
    onUnsavedChange?.(hasUnsavedChanges, handleSave);
    return () => {
      setUnsavedState(false);
    };
  }, [hasUnsavedChanges, setUnsavedState, onUnsavedChange, handleSave]);

  // Keyboard shortcut Ctrl+S / Cmd+S for instant saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
  };

  const handleIconChange = async (icon: string | null) => {
    if (!note) return;
    try {
      await updateNote({ id: note.id, icon }).unwrap();
      toast.success(icon ? "Icon updated" : "Icon removed");
    } catch {
      toast.error("Failed to update icon");
    }
  };

  const handleCoverChange = async (coverImage: string | null) => {
    if (!note) return;
    setIsRepositioning(false);
    try {
      await updateNote({ id: note.id, coverImage }).unwrap();
      toast.success(coverImage ? "Cover updated" : "Cover removed");
    } catch {
      toast.error("Failed to update cover");
    }
  };

  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='button']")) {
      return;
    }
    e.preventDefault();
    const rect = coverBannerRef.current?.getBoundingClientRect();
    const height = rect?.height || 200;
    dragStartRef.current = {
      y: e.clientY,
      startPos: coverPositionY,
      height,
    };
    setIsDraggingCover(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      // Dragging down pulls image down -> decreases positionY towards top (0%)
      // Dragging up pulls image up -> increases positionY towards bottom (100%)
      const deltaPercent = (deltaY / dragStartRef.current.height) * 100;
      const newPos = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startPos - deltaPercent)));
      setCoverPositionY(newPos);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDraggingCover(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleCoverTouchStart = (e: React.TouchEvent) => {
    if (!isRepositioning) return;
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='button']")) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const rect = coverBannerRef.current?.getBoundingClientRect();
    const height = rect?.height || 200;
    dragStartRef.current = {
      y: touch.clientY,
      startPos: coverPositionY,
      height,
    };
    setIsDraggingCover(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStartRef.current) return;
      const currentTouch = moveEvent.touches[0];
      if (!currentTouch) return;
      const deltaY = currentTouch.clientY - dragStartRef.current.y;
      const deltaPercent = (deltaY / dragStartRef.current.height) * 100;
      const newPos = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startPos - deltaPercent)));
      setCoverPositionY(newPos);
    };

    const handleTouchEnd = () => {
      dragStartRef.current = null;
      setIsDraggingCover(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleSaveCoverPosition = async () => {
    if (!note || !parsedCover.url) return;
    const newCover = formatCoverWithPosition(parsedCover.url, coverPositionY);
    setIsRepositioning(false);
    try {
      await updateNote({ id: note.id, coverImage: newCover }).unwrap();
      toast.success("Cover position saved");
    } catch {
      toast.error("Failed to save cover position");
    }
  };

  const handleCancelCoverPosition = () => {
    setCoverPositionY(parsedCover.positionY);
    setIsRepositioning(false);
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    const blob = new Blob([`# ${note.title}\n\n${content || note.content || ""}`], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || note.title || "note").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document exported as Markdown");
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(`# ${title || "Untitled"}\n\n${content}`);
    toast.success("Markdown content copied to clipboard");
  };

  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: (title || note?.title || "Untitled Document").trim(),
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 16mm 14mm 16mm 14mm;
      }
      @media print {
        html, body {
          background: white !important;
          color: black !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-hidden,
        .print\\:hidden,
        button,
        [role="button"],
        input[type="file"],
        .opacity-0 {
          display: none !important;
        }
        .print-block,
        .print\\:block {
          display: block !important;
        }
        .print-flex,
        .print\\:flex {
          display: flex !important;
        }
        h1, h2, h3, h4, h5, h6 {
          break-after: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          color: black !important;
        }
        p, li, blockquote, pre, table, figure, img {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .max-w-4xl {
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin: 0 !important;
        }
      }
    `,
    onBeforePrint: async () => {
      toast.info("Preparing print preview...");
    },
    onAfterPrint: () => {
      toast.success("Printed / exported successfully");
    },
    onPrintError: (loc, err) => {
      console.error("Print error:", loc, err);
      toast.error("Failed to print document");
    },
  });

  // Word count & estimated reading time calculation
  const stats = useMemo(() => {
    const cleanText = (content || "").replace(/[#*`_~[\]()]/g, "").trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex flex-col bg-background overflow-hidden select-none">
        {/* Skeleton Top Bar */}
        <header className="relative h-14 shrink-0 border-b border-border px-4 sm:px-6 flex items-center justify-between suite-header-gradient">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/30 via-indigo-500/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-12 bg-muted/80 rounded" />
            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
            <div className="h-3.5 w-24 bg-muted/60 rounded" />
            <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
            <div className="h-3.5 w-32 bg-muted/80 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-16 bg-muted/70 rounded-xl" />
            <div className="h-7 w-7 bg-muted/70 rounded-lg" />
            <div className="h-7 w-16 bg-muted/70 rounded-xl" />
          </div>
        </header>

        {/* Skeleton Body */}
        <div className="flex-1 overflow-y-auto relative p-6 sm:px-10 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-muted/80" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-8 sm:h-10 w-2/3 bg-muted/90 rounded-xl" />
            <div className="flex items-center gap-3 pt-2 border-b border-border/60 pb-4">
              <div className="w-5 h-5 rounded-full bg-muted/80" />
              <div className="h-3 w-20 bg-muted/60 rounded" />
              <div className="h-3 w-16 bg-muted/50 rounded" />
              <div className="h-3 w-24 bg-muted/50 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="h-4 w-full bg-muted/70 rounded" />
            <div className="h-4 w-11/12 bg-muted/60 rounded" />
            <div className="h-4 w-4/5 bg-muted/70 rounded" />
            <div className="h-4 w-2/3 bg-muted/50 rounded" />
            <div className="h-4 w-5/6 bg-muted/60 rounded pt-2" />
            <div className="h-4 w-3/4 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3 border border-destructive/20 shadow-xs"
        >
          <Lock className="w-7 h-7" />
        </motion.div>
        <h3 className="text-base font-bold text-foreground mb-1">Access Restricted or Note Moved</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          You might not have permission to view this document, or it has been moved to trash.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex-1 h-full flex flex-col bg-background overflow-hidden relative",
          isFullScreen && "fixed inset-0 z-50 bg-background"
        )}
      >
        {/* 1. Control Bar */}
        <header className="relative h-14 shrink-0 border-b border-border px-4 sm:px-6 flex items-center justify-between suite-header-gradient select-none z-20 shadow-2xs">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/40 via-indigo-500/30 to-transparent pointer-events-none" />
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-w-0 pr-4">
            <span className="hidden sm:inline text-foreground font-bold">Notes</span>
            {note.breadcrumbs?.map((b) => (
              <React.Fragment key={b.id}>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectFolder?.(b.id)}
                  className="hover:text-foreground transition-colors truncate max-w-[120px] cursor-pointer"
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <span className="text-foreground font-semibold truncate max-w-[160px]">
              {title || "Untitled"}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Table of Contents Popover Toggle */}
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="p-1.5 rounded-lg border border-border/80 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                  title="Document Outline"
                >
                  <ListTree className="w-4 h-4" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-1 rounded-2xl shadow-xl border border-border/80 bg-card/95 backdrop-blur-md">
                <TableOfContents content={content} />
              </PopoverContent>
            </Popover>

            {/* Manual Save Button with animated status pill */}
            {isEditable && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs",
                  hasUnsavedChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-primary/20 cursor-pointer"
                    : "bg-surface-subtle text-muted-foreground border border-border/80 opacity-80 cursor-default"
                )}
                title={hasUnsavedChanges ? "Save changes (Ctrl+S / Cmd+S)" : "All changes saved"}
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </motion.div>
                  ) : hasUnsavedChanges ? (
                    <motion.div
                      key="save"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Saved</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* View Mode Controls: Edit vs Preview */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/70 shadow-2xs">
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    viewMode === "edit"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Edit Document"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "preview"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Preview Document & In-line Diagrams"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Star toggle */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              type="button"
              onClick={() => toggleStar(note.id)}
              disabled={isStarring}
              className="p-1.5 rounded-lg border border-border/80 hover:bg-surface-elevated text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer shadow-2xs"
              title={note.isStarred ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-colors",
                  note.isStarred ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                )}
              />
            </motion.button>

            {/* Share button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onOpenShareModal(note)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer shadow-xs shadow-primary/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </motion.button>

            {/* Full width toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleToggleFullWidth}
              className="p-1.5 rounded-lg border border-border/80 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
              title={isFullWidth ? "Standard Readable Width" : "Full Width View"}
            >
              {isFullWidth ? (
                <FoldHorizontal className="w-4 h-4" />
              ) : (
                <UnfoldHorizontal className="w-4 h-4" />
              )}
            </motion.button>

            {/* Full screen toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg border border-border/80 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
              title={isFullScreen ? "Exit Fullscreen" : "Distraction-free Fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="p-1.5 rounded-lg border border-border/80 hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl shadow-xl border border-border/80">
                <DropdownMenuItem onClick={handleCopyRawText} className="text-xs gap-2.5 p-2 cursor-pointer rounded-xl">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy Markdown Text</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown} className="text-xs gap-2.5 p-2 cursor-pointer rounded-xl">
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Export Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePrint()}
                  className="text-xs gap-2.5 p-2 cursor-pointer rounded-xl"
                >
                  <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Print / Save as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => deleteNote({ id: note.id, permanent: false })}
                  className="text-xs gap-2.5 p-2 text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 2. Scrollable Canvas Viewport */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar">
          <div ref={printableRef} className="w-full flex flex-col min-h-full printable-note">
            {/* Cover Banner */}
          {note.coverImage && (
            <div
              ref={coverBannerRef}
              onMouseDown={handleCoverMouseDown}
              onTouchStart={handleCoverTouchStart}
              onDragStart={(e) => e.preventDefault()}
              className={cn(
                "group relative w-full h-44 sm:h-56 shrink-0 border-b border-border/60 bg-cover overflow-hidden transition-all",
                isRepositioning
                  ? cn(
                      "select-none ring-2 ring-primary ring-inset",
                      isDraggingCover ? "cursor-grabbing" : "cursor-grab"
                    )
                  : "cursor-default"
              )}
              style={
                parsedCover.isGradient
                  ? { background: parsedCover.url }
                  : {
                      backgroundImage: `url(${parsedCover.url})`,
                      backgroundSize: "cover",
                      backgroundPosition: `center ${coverPositionY}%`,
                    }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />

              {/* Repositioning Instructions Pill (Center Top) */}
              {isRepositioning && (
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-background/95 text-foreground backdrop-blur-md border border-border/80 shadow-lg text-xs font-medium flex items-center gap-2 pointer-events-none select-none z-20 animate-in fade-in zoom-in-95 duration-150 print-hidden">
                  <MoveVertical className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span>Drag image to reposition</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-0.5">
                    {Math.round(coverPositionY)}%
                  </span>
                </div>
              )}

              {/* Repositioning Floating Action Dock (Bottom Right) */}
              {isRepositioning ? (
                <div className="absolute bottom-3 right-4 sm:right-6 flex items-center gap-1.5 bg-background/95 backdrop-blur-md border border-border/90 rounded-xl p-1 shadow-lg z-20 print-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center gap-1 border-r border-border/70 pr-1.5 mr-0.5">
                    <button
                      type="button"
                      onClick={() => setCoverPositionY(0)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        coverPositionY === 0
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverPositionY(50)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        coverPositionY === 50
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverPositionY(100)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        coverPositionY === 100
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      Bottom
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCoverPosition}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save position</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCoverPosition}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                isEditable && (
                  <div className="absolute bottom-3 right-4 sm:right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10 print-hidden">
                    {!parsedCover.isGradient && (
                      <button
                        type="button"
                        onClick={() => setIsRepositioning(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-background/90 hover:bg-background text-foreground transition-all backdrop-blur-md border border-border/80 shadow-xs cursor-pointer"
                        title="Reposition image vertically"
                      >
                        <MoveVertical className="w-3.5 h-3.5" />
                        <span>Reposition</span>
                      </button>
                    )}
                    <CoverPicker currentCover={note.coverImage} onSelect={handleCoverChange} align="end">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-background/90 hover:bg-background text-foreground transition-all backdrop-blur-md border border-border/80 shadow-xs cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Change Cover</span>
                      </button>
                    </CoverPicker>
                    <button
                      type="button"
                      onClick={() => handleCoverChange(null)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-background/90 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all backdrop-blur-md border border-border/80 shadow-xs cursor-pointer"
                      title="Remove Cover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Main Document Content Container */}
          <div
            className={cn(
              "mx-auto py-6 flex flex-col gap-5 transition-all duration-150",
              isFullWidth
                ? "w-full max-w-6xl px-6 sm:px-12"
                : "max-w-4xl px-6 sm:px-10"
            )}
          >
            {/* Header Controls (Add icon / Add cover if absent) */}
            {isEditable && (!note.icon || !note.coverImage) && (
              <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity pt-1 print-hidden">
                {!note.icon && (
                  <IconPicker currentIcon={note.icon} onSelect={handleIconChange}>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                    >
                      <Smile className="w-3.5 h-3.5 text-primary" /> Add icon
                    </button>
                  </IconPicker>
                )}
                {!note.coverImage && (
                  <CoverPicker currentCover={note.coverImage} onSelect={handleCoverChange}>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-primary" /> Add cover
                    </button>
                  </CoverPicker>
                )}
              </div>
            )}

            {/* Document Icon */}
            {note.icon && (
              <div
                className={cn(
                  "flex items-center",
                  note.coverImage ? "-mt-10 sm:-mt-12 relative z-10 w-fit" : "w-fit pt-2"
                )}
              >
                <IconPicker
                  currentIcon={note.icon}
                  onSelect={handleIconChange}
                  disabled={!isEditable}
                >
                  <motion.button
                    whileHover={isEditable ? { scale: 1.08 } : undefined}
                    whileTap={isEditable ? { scale: 0.94 } : undefined}
                    type="button"
                    className={cn(
                      "inline-flex items-center justify-center transition-all select-none",
                      note.coverImage
                        ? "p-2.5 sm:p-3 rounded-2xl bg-card border-2 border-background shadow-lg ring-1 ring-border/50 text-foreground"
                        : "p-2 rounded-2xl bg-surface-subtle hover:bg-surface-elevated border border-border/50",
                      isEditable ? "cursor-pointer hover:shadow-xl" : "cursor-default"
                    )}
                    title={isEditable ? "Change Icon" : undefined}
                  >
                    <NoteIcon icon={note.icon} size="2xl" />
                  </motion.button>
                </IconPicker>
              </div>
            )}

            {/* Document Title Header */}
            <div className="flex flex-col gap-2">
              {/* Screen editor title */}
              <div className="print-hidden">
                {isEditable ? (
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Untitled Document"
                    className="w-full text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 leading-tight py-1 font-sans"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-foreground leading-tight py-1 font-sans">
                    {title || "Untitled Document"}
                  </h1>
                )}
              </div>

              {/* Clean print heading */}
              <h1 className="hidden print-block text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight py-1">
                {title || note.title || "Untitled Document"}
              </h1>

              {/* Metadata Bar */}
              <div
                className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-2 border-b border-border/70 pb-4"
                style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "12px" }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: "6px" }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center border border-primary/20 shrink-0"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "9999px" }}
                  >
                    {note.author?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="font-semibold text-foreground">{note.author?.name || "Author"}</span>
                </div>

                <span>•</span>

                <div
                  className="flex items-center gap-1"
                  style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: "4px" }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{stats.minutes} min read</span>
                </div>

                <span>•</span>

                <div
                  className="flex items-center gap-1 font-mono text-[11px]"
                  style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", gap: "4px" }}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>{stats.words} words</span>
                </div>

                {!isEditable && (
                  <Badge variant="outline" className="ml-auto text-[10px] font-mono border-amber-500/30 text-amber-600 bg-amber-500/5 print-hidden">
                    View Only (Read-Only)
                  </Badge>
                )}
              </div>
            </div>

            {/* Rich Content Editor / Viewer */}
            <div className="pb-16">
              {isEditable && viewMode === "edit" ? (
                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Type markdown, press '/' for blocks, write specifications..."
                  minHeight="min-h-[460px]"
                  className="border-none shadow-none bg-transparent"
                  contentClassName="py-3 px-0 text-sm leading-relaxed sm:text-base font-sans"
                  hideReviewButton={true}
                />
              ) : (
                <div className="min-h-[460px] pb-12 px-0">
                  <FormattedText content={content} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </TooltipProvider>
  );
}
