"use client";

import Link from "next/link";
import { Button } from "@zsyio/ui";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { TaskShortIdBadge } from "../TaskBadges";
import { toast } from "sonner";
import type { Task } from "@zsyio/types";
import { GitBranchPopover } from "../GitBranchPopover";

interface TaskDetailHeaderProps {
  task: Task;
  shortId: string;
  canEdit: boolean;
  titleInput: string;
  setTitleInput: (val: string) => void;
  isUpdating: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  handleSaveAll: () => void;
  handleDiscard: () => void;
  onDeleteClick: () => void;
}

export function TaskDetailHeader({
  task,
  canEdit,
  titleInput,
  setTitleInput,
  hasUnsavedChanges,
  isSaving,
  handleSaveAll,
  handleDiscard,
  onDeleteClick,
}: TaskDetailHeaderProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks?taskId=${task.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Task link copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-3 pb-3">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1.5 px-2 text-muted-foreground hover:text-foreground rounded-lg">
            <Link href="/tasks">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Tasks
            </Link>
          </Button>

          <span className="text-muted-foreground/30">•</span>

          <TaskShortIdBadge task={task} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GitBranchPopover task={task} variant="outline" size="sm" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-8 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground border-border/80 rounded-lg"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy link</span>
          </Button>

          {canEdit && (
            <>
              {hasUnsavedChanges ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-xs font-semibold text-warning flex items-center gap-1.5 mr-1 hidden sm:flex">
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" /> Unsaved changes
                  </span>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDiscard}
                    className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg px-2.5"
                  >
                    Discard
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-xs px-3.5"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Ticket</span>
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-success flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteClick}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 font-semibold rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="pt-1">
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          disabled={!canEdit}
          placeholder="Untitled Task..."
          className="w-full text-3xl sm:text-4xl font-semibold font-display tracking-tight text-foreground bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary/50 focus:outline-none transition-colors py-1.5 placeholder:text-muted-foreground/30"
        />
      </div>
    </div>
  );
}
