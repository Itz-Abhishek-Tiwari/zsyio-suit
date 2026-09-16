"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button, Skeleton, MentionTextarea } from "@zsyio/ui";
import { useAddCommentMutation } from "@/store/api/tasksApi";
import { useGetUsersQuery } from "@/store/api/usersApi";
import type { Comment } from "@zsyio/types";
import { MessageSquare, Reply, CornerDownRight, AtSign, Image as ImageIcon, X } from "lucide-react";
import { FormattedText } from "@zsyio/editor";
import { optimizeImage } from "@zsyio/editor/clipboard-helper";

interface AttachedCommentImage {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export function CommentThread({
  taskId,
  comments,
  isLoadingTask = false,
}: {
  taskId: string;
  comments: Comment[];
  isLoadingTask?: boolean;
}) {
  const [topLevelBody, setTopLevelBody] = useState("");
  const [topLevelImages, setTopLevelImages] = useState<AttachedCommentImage[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyImages, setReplyImages] = useState<AttachedCommentImage[]>([]);
  const [addComment, { isLoading }] = useAddCommentMutation();
  const topFileInputRef = useRef<HTMLInputElement>(null);

  const { data: users = [] } = useGetUsersQuery();

  const draftStorageKey = `zsyio_task_draft_${taskId}`;

  useEffect(() => {
    if (typeof window !== "undefined" && taskId) {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        setTopLevelBody(saved);
      } else {
        setTopLevelBody("");
      }
    }
  }, [taskId, draftStorageKey]);

  const handleTopLevelBodyChange = (text: string) => {
    setTopLevelBody(text);
    if (typeof window !== "undefined" && taskId) {
      if (text.trim()) {
        localStorage.setItem(draftStorageKey, text);
      } else {
        localStorage.removeItem(draftStorageKey);
      }
    }
  };

  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParentId: Record<string, Comment[]> = {};

  comments.forEach((c) => {
    if (c.parentId) {
      if (!repliesByParentId[c.parentId]) {
        repliesByParentId[c.parentId] = [];
      }
      repliesByParentId[c.parentId].push(c);
    }
  });

  async function handlePasteImageTopLevel(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      toast.error(`Pasted image "${file.name}" exceeds 15MB limit.`);
      return;
    }
    try {
      const data = await optimizeImage(file);
      setTopLevelImages((prev) => [...prev, data]);
      toast.success(`Image attached to comment: "${data.fileName}"`);
    } catch {
      toast.error("Failed to process image");
    }
  }

  async function handlePasteImageReply(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      toast.error(`Pasted image "${file.name}" exceeds 15MB limit.`);
      return;
    }
    try {
      const data = await optimizeImage(file);
      setReplyImages((prev) => [...prev, data]);
      toast.success(`Image attached to reply: "${data.fileName}"`);
    } catch {
      toast.error("Failed to process image");
    }
  }

  const handleTopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePasteImageTopLevel(file);
    }
    e.target.value = "";
  };

  async function handlePostTopLevel(e?: React.FormEvent) {
    e?.preventDefault();
    const hasText = topLevelBody.trim().length > 0;
    const hasImages = topLevelImages.length > 0;
    if (!hasText && !hasImages) return;

    const imageMarkdown = topLevelImages
      .map((img) => `![${img.fileName}](${img.fileUrl})`)
      .join("\n\n");
    const fullBody = [topLevelBody.trim(), imageMarkdown].filter(Boolean).join("\n\n");

    try {
      await addComment({ id: taskId, body: fullBody }).unwrap();
      setTopLevelBody("");
      setTopLevelImages([]);
      if (typeof window !== "undefined" && taskId) {
        localStorage.removeItem(draftStorageKey);
      }
      toast.success("Comment posted");
    } catch {
      toast.error("Couldn't post comment");
    }
  }

  async function handlePostReply(parentId: string, parentAuthorName: string) {
    const hasText = replyBody.trim().length > 0;
    const hasImages = replyImages.length > 0;
    if (!hasText && !hasImages) return;

    const imageMarkdown = replyImages
      .map((img) => `![${img.fileName}](${img.fileUrl})`)
      .join("\n\n");
    const fullBody = [replyBody.trim(), imageMarkdown].filter(Boolean).join("\n\n");

    try {
      await addComment({
        id: taskId,
        body: fullBody,
        parentId,
      }).unwrap();
      setReplyBody("");
      setReplyImages([]);
      setActiveReplyId(null);
      toast.success(`Replied to ${parentAuthorName}`);
    } catch {
      toast.error("Couldn't post reply");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handlePostTopLevel}
        className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface-subtle/40 p-3"
      >
        <input
          type="file"
          ref={topFileInputRef}
          onChange={handleTopFileChange}
          accept="image/*"
          className="hidden"
        />
        <MentionTextarea
          id="top-comment-input"
          users={users}
          value={topLevelBody}
          onChange={handleTopLevelBodyChange}
          onPostShortcut={handlePostTopLevel}
          onPasteImage={handlePasteImageTopLevel}
          placeholder="What are your thoughts? Paste screenshots (⌘V) or type @ to mention..."
          className="min-h-[64px] text-xs bg-card border-border/60 p-2.5 focus-visible:ring-1"
        />

        {topLevelImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-1">
            {topLevelImages.map((img, idx) => (
              <div
                key={idx}
                className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-card shadow-2xs text-xs animate-fade-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.fileUrl}
                  alt={img.fileName}
                  className="w-9 h-9 rounded-md object-cover border border-border/60 shrink-0"
                />
                <div className="flex flex-col min-w-0 max-w-[150px]">
                  <span className="text-[11px] font-semibold text-foreground truncate">{img.fileName}</span>
                  <span className="text-[9px] text-muted-foreground">{(img.fileSize / 1024).toFixed(0)} KB</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTopLevelImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/70 font-mono flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-muted/60 text-muted-foreground font-semibold">
                <AtSign className="w-2.5 h-2.5 text-primary" /> @mention
              </span>
              <span>• ⌘ + Enter to post</span>
            </span>

            <button
              type="button"
              onClick={() => topFileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Attach image or paste screenshot (⌘V)"
            >
              <ImageIcon className="w-3 h-3 text-primary" />
              <span>Image</span>
            </button>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isLoading || (!topLevelBody.trim() && topLevelImages.length === 0)}
            className="h-7 text-xs font-bold px-3.5 rounded-lg shadow-2xs cursor-pointer"
          >
            {isLoading ? "Posting..." : "Comment"}
          </Button>
        </div>
      </form>


      <div className="flex flex-col gap-3">
        {isLoadingTask ? (
          <div className="flex flex-col gap-3 py-1 animate-fade-in">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-surface-subtle/30">
                <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-2/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <RedditCommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              repliesMap={repliesByParentId}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              replyImages={replyImages}
              setReplyImages={setReplyImages}
              onPostReply={handlePostReply}
              onPasteImage={handlePasteImageReply}
              isLoading={isLoading}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-dashed border-border/60 bg-surface-subtle/30 text-center">
            <MessageSquare className="w-4 h-4 text-muted-foreground/40 mb-1" />
            <p className="text-xs font-bold text-foreground">No comments yet</p>
            <p className="text-[10px] text-muted-foreground/70">
              Be the first to share a comment on this task.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RedditCommentItem({
  comment,
  taskId,
  repliesMap,
  activeReplyId,
  setActiveReplyId,
  replyBody,
  setReplyBody,
  replyImages,
  setReplyImages,
  onPostReply,
  onPasteImage,
  isLoading,
  depth = 0,
}: {
  comment: Comment;
  taskId: string;
  repliesMap: Record<string, Comment[]>;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
  replyBody: string;
  setReplyBody: (val: string) => void;
  replyImages: AttachedCommentImage[];
  setReplyImages: React.Dispatch<React.SetStateAction<AttachedCommentImage[]>>;
  onPostReply: (parentId: string, authorName: string) => void;
  onPasteImage?: (file: File) => void;
  isLoading: boolean;
  depth?: number;
}) {
  const authorName = comment.author?.name ?? "User";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedTime = new Date(comment.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const childReplies = repliesMap[comment.id] ?? [];
  const isReplying = activeReplyId === comment.id;
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const { data: users = [] } = useGetUsersQuery();

  const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPasteImage) {
      onPasteImage(file);
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col relative group/comment">
      <div className="flex items-start gap-2.5 py-1">
        <div className="w-5 h-5 rounded-full bg-primary-light text-primary border border-primary/20 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
          {initials}
        </div>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-foreground hover:underline cursor-pointer">
              {authorName}
            </span>
            {comment.author?.role && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted/80 text-muted-foreground uppercase">
                {comment.author.role}
              </span>
            )}
            <span className="text-muted-foreground/40">•</span>
            <span className="text-[10px] text-muted-foreground/70">{formattedTime}</span>
          </div>

          <FormattedText content={comment.body} className="py-0.5" />

          <div className="flex items-center gap-3 pt-0.5">
            <button
              onClick={() => {
                if (isReplying) {
                  setActiveReplyId(null);
                  setReplyBody("");
                  setReplyImages([]);
                } else {
                  setActiveReplyId(comment.id);
                  setReplyBody("");
                  setReplyImages([]);
                }
              }}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="w-3 h-3" />
              <span>{isReplying ? "Cancel" : "Reply"}</span>
            </button>

            {childReplies.length > 0 && depth === 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/70">
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{childReplies.length} {childReplies.length === 1 ? "reply" : "replies"}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="ml-7 mt-1.5 p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex flex-col gap-2 animate-fade-in">
          <input
            type="file"
            ref={replyFileInputRef}
            onChange={handleReplyFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-primary flex items-center gap-1">
              <CornerDownRight className="w-3 h-3" /> Replying to <span className="underline font-bold">@{authorName}</span>
            </span>
            <span className="text-[9px] text-muted-foreground/70 font-mono">⌘ + Enter</span>
          </div>

          <MentionTextarea
            users={users}
            value={replyBody}
            onChange={setReplyBody}
            onPostShortcut={() => onPostReply(comment.id, authorName)}
            onPasteImage={onPasteImage}
            placeholder={`Reply to @${authorName}... (Paste screenshots ⌘V or type @)`}
            className="min-h-[48px] text-xs bg-card p-2 border-border/60 focus-visible:ring-1"
            autoFocus
          />

          {replyImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {replyImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-card shadow-2xs text-xs animate-fade-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.fileUrl}
                    alt={img.fileName}
                    className="w-9 h-9 rounded-md object-cover border border-border/60 shrink-0"
                  />
                  <div className="flex flex-col min-w-0 max-w-[150px]">
                    <span className="text-[11px] font-semibold text-foreground truncate">{img.fileName}</span>
                    <span className="text-[9px] text-muted-foreground">{(img.fileSize / 1024).toFixed(0)} KB</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => replyFileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              title="Attach image or paste screenshot (⌘V)"
            >
              <ImageIcon className="w-3 h-3 text-primary" />
              <span>Image</span>
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveReplyId(null);
                  setReplyBody("");
                  setReplyImages([]);
                }}
                className="h-6 text-[10px] px-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isLoading || (!replyBody.trim() && replyImages.length === 0)}
                onClick={() => onPostReply(comment.id, authorName)}
                className="h-6 text-[10px] font-bold px-2.5 rounded-md shadow-2xs"
              >
                {isLoading ? "Replying..." : "Reply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {childReplies.length > 0 && (
        <div className="ml-2.5 pl-4 border-l border-border/60 hover:border-red-500/40 transition-colors flex flex-col gap-2 mt-1">
          {childReplies.map((reply) => (
            <RedditCommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              repliesMap={repliesMap}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyBody={replyBody}
              setReplyBody={setReplyBody}
              replyImages={replyImages}
              setReplyImages={setReplyImages}
              onPostReply={onPostReply}
              onPasteImage={onPasteImage}
              isLoading={isLoading}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
