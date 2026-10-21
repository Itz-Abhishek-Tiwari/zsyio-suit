"use client";

import dynamic from "next/dynamic";
import { FormattedText } from "@zsyio/editor";

const RichTextEditor = dynamic(
  () => import("@zsyio/editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 w-full rounded-lg border border-border/80 bg-surface-muted/30 animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading editor...
      </div>
    ),
  }
);
import { FileText } from "lucide-react";
import type { Task } from "@zsyio/types";

interface TaskDescriptionSectionProps {
  task: Task;
  canEdit: boolean;
  descInput: string;
  setDescInput: (val: string) => void;
}

export function TaskDescriptionSection({
  task,
  canEdit,
  descInput,
  setDescInput,
}: TaskDescriptionSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between py-1">
        <h2 className="text-xs font-semibold   text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" /> Description Canvas
        </h2>
      </div>

      {canEdit ? (
        <RichTextEditor
          value={descInput}
          onChange={setDescInput}
          placeholder="Write detailed task specifications, requirements, or documentation..."
          minHeight="min-h-[320px]"
          className="border border-border/80 bg-card"
        />
      ) : task.description ? (
        <div className="rounded-lg border border-border/70 bg-card p-5">
          <FormattedText content={task.description} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic py-3">
          No description provided for this task.
        </p>
      )}
    </div>
  );
}
