"use client";

import { useState, useEffect } from "react";
import type { Attachment } from "@zsyio/types";
import {
  Paperclip,
  FileCode,
  FileText,
  File,
  Eye,
  Plus,
  Loader2,
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import { Button, MediaLightbox, type LightboxItem } from "@zsyio/ui";
import { useAddAttachmentMutation, useDeleteAttachmentMutation } from "@/store/api/tasksApi";
import { getImagesFromClipboard, optimizeImage } from "@zsyio/editor/clipboard-helper";
import { toast } from "sonner";

interface TaskAttachmentsGalleryProps {
  taskId?: string;
  attachments?: Attachment[] | null;
  canEdit?: boolean;
  className?: string;
}

function isImageFile(att: Attachment): boolean {
  if (att.fileUrl.startsWith("data:image/")) return true;
  const name = att.fileName.toLowerCase();
  if (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg") ||
    name.endsWith(".gif")
  ) {
    return true;
  }
  if (
    att.fileUrl.includes("images.unsplash.com") ||
    att.fileUrl.includes(".png") ||
    att.fileUrl.includes(".jpg") ||
    att.fileUrl.includes(".jpeg") ||
    att.fileUrl.includes(".webp")
  ) {
    return true;
  }
  return false;
}

function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function TaskAttachmentsGallery({
  taskId,
  attachments,
  canEdit = true,
  className,
}: TaskAttachmentsGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addAttachment, { isLoading: isUploading }] = useAddAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();

  const attsList = attachments ?? [];
  const allLightboxItems: LightboxItem[] = attsList.map((att) => ({
    id: att.id,
    url: att.fileUrl,
    name: att.fileName,
    size: att.fileSize,
    uploadedAt: att.uploadedAt,
  }));

  const openLightboxForAttachment = (attachmentId: string) => {
    const idx = allLightboxItems.findIndex((item) => item.id === attachmentId);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  const handleDeleteAttachment = async (attachmentId: string, fileName: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!taskId) return;
    setDeletingId(attachmentId);
    try {
      await deleteAttachment({ taskId, attachmentId }).unwrap();
      toast.success(`Removed attachment "${fileName}"`);
      if (lightboxIndex !== null) {
        const remaining = allLightboxItems.filter((i) => i.id !== attachmentId);
        if (remaining.length === 0) {
          setLightboxIndex(null);
        } else if (lightboxIndex >= remaining.length) {
          setLightboxIndex(remaining.length - 1);
        }
      }
    } catch {
      toast.error("Failed to remove attachment");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !taskId) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 15MB limit.`);
        continue;
      }
      try {
        const { fileName, fileUrl, fileSize } = await optimizeImage(file);
        await addAttachment({
          id: taskId,
          fileName,
          fileSize,
          fileUrl,
        }).unwrap();
        toast.success(`Attached "${fileName}"`);
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }
    e.target.value = "";
  };

  useEffect(() => {
    if (!canEdit || !taskId) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // If pasting inside a textarea, input, or contenteditable editor, don't hijack to task attachments
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable ||
        target?.closest?.("textarea") ||
        target?.closest?.("input") ||
        target?.closest?.(".ProseMirror")
      ) {
        return;
      }

      const images = getImagesFromClipboard(e);
      if (images.length === 0) return;

      for (const image of images) {
        if (image.size > 15 * 1024 * 1024) {
          toast.error(`Pasted image "${image.name}" exceeds 15MB limit.`);
          continue;
        }
        try {
          const { fileName, fileUrl, fileSize } = await optimizeImage(image);
          await addAttachment({
            id: taskId,
            fileName,
            fileSize,
            fileUrl,
          }).unwrap();
          toast.success(`Attached pasted screenshot: "${fileName}"`);
        } catch {
          toast.error("Failed to attach pasted screenshot");
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [canEdit, taskId, addAttachment]);

  const handleManualPaste = async () => {
    if (!taskId) return;
    try {
      if (!navigator.clipboard?.read) {
        toast.info("Press ⌘V or Ctrl+V on your keyboard to paste a screenshot.");
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          foundImage = true;
          const blob = await item.getType(imageType);
          const { fileName, fileUrl, fileSize } = await optimizeImage(blob, "Screenshot.png");
          await addAttachment({
            id: taskId,
            fileName,
            fileSize,
            fileUrl,
          }).unwrap();
          toast.success(`Attached pasted screenshot: "${fileName}"`);
        }
      }
      if (!foundImage) {
        toast.info("No screenshot found in clipboard. Copy an image first, then press ⌘V.");
      }
    } catch {
      toast.info("Press ⌘V or Ctrl+V on your keyboard to paste your screenshot.");
    }
  };

  const imageAttachments = attsList.filter(isImageFile);
  const fileAttachments = attsList.filter((att) => !isImageFile(att));

  if (attsList.length === 0 && !canEdit) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Paperclip className="w-3.5 h-3.5" />
          </span>
          <span>Attached Files & Images ({attsList.length})</span>
        </span>

        {canEdit && taskId && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleManualPaste}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer hover:border-primary hover:text-primary"
              title="Paste screenshot from clipboard (⌘V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Paste SS (⌘V)</span>
              <span className="sm:hidden">Paste</span>
            </Button>

            <input
              type="file"
              id={`upload-att-${taskId}`}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.json,.log,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1.5 cursor-pointer hover:border-primary hover:text-primary"
            >
              <label htmlFor={`upload-att-${taskId}`}>
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Attach File</span>
              </label>
            </Button>
          </div>
        )}
      </div>

      {attsList.length === 0 && canEdit && taskId && (
        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 border-2 border-dashed border-border/70 rounded-xl bg-surface-subtle/30">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            <ClipboardPaste className="w-4.5 h-4.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">No files attached yet</span>
          <span className="text-[11px] text-muted-foreground max-w-sm">
            Copy any screenshot to your clipboard and press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border/80 rounded font-semibold text-foreground">⌘V</kbd> / <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border/80 rounded font-semibold text-foreground">Ctrl+V</kbd> to attach directly to this ticket.
          </span>
        </div>
      )}

      {imageAttachments.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Screenshots & Diagrams ({imageAttachments.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {imageAttachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex flex-col rounded-2xl border border-border/80 bg-surface-subtle/50 overflow-hidden hover:border-primary/50 transition-all duration-200 shadow-2xs hover:shadow-md"
              >
                <div
                  onClick={() => openLightboxForAttachment(att.id)}
                  className="relative aspect-video w-full overflow-hidden bg-slate-950/80 cursor-pointer flex items-center justify-center group/img"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-background/90 text-foreground px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>Preview</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between gap-2 border-t border-border/60 bg-card">
                  <div
                    onClick={() => openLightboxForAttachment(att.id)}
                    className="flex flex-col min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors" title={att.fileName}>
                      {att.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatFileSize(att.fileSize)} • {new Date(att.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {canEdit && taskId && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={deletingId === att.id}
                        onClick={(e) => handleDeleteAttachment(att.id, att.fileName, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove attachment"
                      >
                        {deletingId === att.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1">
          {imageAttachments.length > 0 && (
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Documents & Logs ({fileAttachments.length})
            </span>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fileAttachments.map((att) => {
              const isLog = att.fileName.endsWith(".log") || att.fileName.endsWith(".json");
              const isPdf = att.fileName.endsWith(".pdf");

              return (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-primary/40 transition-all duration-150 group shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => openLightboxForAttachment(att.id)}
                    className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border/60 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    title="Preview file"
                  >
                    {isLog ? (
                      <FileCode className="w-5 h-5 text-amber-500" />
                    ) : isPdf ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <File className="w-5 h-5 text-primary" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openLightboxForAttachment(att.id)}
                    className="flex flex-col min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {att.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatFileSize(att.fileSize)} • {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(att.uploadedAt))}
                    </span>
                  </button>

                  {canEdit && taskId && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={deletingId === att.id}
                        onClick={(e) => handleDeleteAttachment(att.id, att.fileName, e)}
                        className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove attachment"
                      >
                        {deletingId === att.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MediaLightbox
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        items={allLightboxItems}
        currentIndex={lightboxIndex ?? 0}
        onIndexChange={setLightboxIndex}
        canDelete={canEdit && Boolean(taskId)}
        isDeleting={Boolean(deletingId)}
        onDelete={(item) => handleDeleteAttachment(item.id, item.name)}
      />
    </div>
  );
}
