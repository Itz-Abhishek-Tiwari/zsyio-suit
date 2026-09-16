"use client";

import { Button } from "@zsyio/ui";
import { Input } from "@zsyio/ui";
import { AlertOctagon, Save } from "lucide-react";
import type { Task } from "@zsyio/types";

interface TaskBlockedAlertProps {
  task: Task;
  canEdit: boolean;
  isEditingBlocked: boolean;
  blockedInput: string;
  setBlockedInput: (val: string) => void;
  setIsEditingBlocked: (val: boolean) => void;
  handleBlockedSave: () => void;
}

export function TaskBlockedAlert({
  task,
  canEdit,
  isEditingBlocked,
  blockedInput,
  setBlockedInput,
  setIsEditingBlocked,
  handleBlockedSave,
}: TaskBlockedAlertProps) {
  if (task.status !== "BLOCKED") return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive-light p-4 flex flex-col gap-2 text-destructive">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-red-600" /> Task is Blocked
        </span>
        {canEdit && !isEditingBlocked && (
          <button
            onClick={() => {
              setBlockedInput(task.blockedReason ?? "");
              setIsEditingBlocked(true);
            }}
            className="text-xs underline hover:opacity-80 font-medium cursor-pointer"
          >
            Edit reason
          </button>
        )}
      </div>

      {isEditingBlocked ? (
        <div className="flex flex-col gap-2 mt-1">
          <Input
            value={blockedInput}
            onChange={(e) => setBlockedInput(e.target.value)}
            placeholder="Enter reason why this task is blocked..."
            className="text-xs bg-card text-foreground"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="destructive" onClick={handleBlockedSave} className="gap-1 font-bold">
              <Save className="w-3.5 h-3.5" /> Save Reason
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditingBlocked(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed">
          {task.blockedReason || "No blocker details provided yet."}
        </p>
      )}
    </div>
  );
}
