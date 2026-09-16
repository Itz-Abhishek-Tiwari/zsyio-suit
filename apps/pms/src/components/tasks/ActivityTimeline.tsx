"use client";

import { useGetUsersQuery } from "@/store/api/usersApi";
import { useGetTeamsQuery } from "@/store/api/teamsApi";
import type { ActivityLogEntry } from "@zsyio/types";
import {
  PlusCircle,
  RefreshCw,
  UserCheck,
  MessageSquare,
  Edit3,
  Paperclip,
  Trash2,
  History,
  FileText,
  ArrowRight,
  FileCheck2,
} from "lucide-react";

const ACTION_CONFIG: Record<
  ActivityLogEntry["action"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  CREATED: { label: "created this ticket", icon: <PlusCircle className="w-3.5 h-3.5 text-cyan-500" />, color: "border-cyan-500/30 bg-cyan-500/10" },
  STATUS_CHANGED: { label: "changed status", icon: <RefreshCw className="w-3.5 h-3.5 text-blue-500" />, color: "border-blue-500/30 bg-blue-500/10" },
  REASSIGNED: { label: "reassigned ticket", icon: <UserCheck className="w-3.5 h-3.5 text-purple-500" />, color: "border-purple-500/30 bg-purple-500/10" },
  COMMENTED: { label: "added a comment", icon: <MessageSquare className="w-3.5 h-3.5 text-foreground-secondary" />, color: "border-border bg-surface-subtle" },
  FIELD_EDITED: { label: "updated details", icon: <Edit3 className="w-3.5 h-3.5 text-foreground-secondary" />, color: "border-border bg-surface-subtle" },
  ATTACHMENT_ADDED: { label: "added attachment", icon: <Paperclip className="w-3.5 h-3.5 text-emerald-500" />, color: "border-emerald-500/30 bg-emerald-500/10" },
  ATTACHMENT_REMOVED: { label: "removed attachment", icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />, color: "border-destructive/30 bg-destructive/10" },
  DELETED: { label: "deleted ticket", icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />, color: "border-destructive/30 bg-destructive/10" },
  RESTORED: { label: "restored ticket", icon: <History className="w-3.5 h-3.5 text-emerald-500" />, color: "border-emerald-500/30 bg-emerald-500/10" },
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const TYPE_LABELS: Record<string, string> = {
  TASK: "Task",
  FEATURE: "Feature",
  BUG: "Bug",
  SUPPORT_REQUEST: "Support Request",
  CUSTOMIZATION: "Custom",
  DEPLOYMENT: "Deploy",
  MAINTENANCE: "Infra",
  NEW_DESIGN: "New Design",
  DESIGN_CHANGE: "Design Changes",
  DESIGN_CHANGES: "Design Changes",
};

const FIELD_LABELS: Record<string, string> = {
  assignedTo: "Assignee",
  assignees: "Assignees",
  assignedTeam: "Assigned Team",
  teams: "Teams",
  status: "Status",
  priority: "Priority",
  type: "Type",
  dueDate: "Due Date",
  title: "Title",
  description: "Description",
  blockedReason: "Blocker Reason",
  attachment: "Attachment",
  testCase: "QA Test Case",
};

export function ActivityTimeline({ entries, isLoading = false }: { entries: ActivityLogEntry[]; isLoading?: boolean }) {
  const { data: users = [] } = useGetUsersQuery();
  const { data: teams = [] } = useGetTeamsQuery();

  function resolveSingleValue(val: string, fieldName: string | null): string {
    if (!val || val === "none" || val === "null") return "None";

    if (fieldName === "assignedTo" || fieldName === "assignees" || fieldName === "assignee" || val.startsWith("c")) {
      const foundUser = users.find((u) => u.id === val || u.email === val);
      if (foundUser) return foundUser.name;
      const foundTeam = teams.find((t) => t.id === val);
      if (foundTeam) return foundTeam.name;
    }

    if (fieldName === "teams" || fieldName === "assignedTeam") {
      const foundTeam = teams.find((t) => t.id === val);
      if (foundTeam) return foundTeam.name;
    }

    if (fieldName === "status" && STATUS_LABELS[val]) {
      return STATUS_LABELS[val];
    }

    if (fieldName === "priority" && PRIORITY_LABELS[val]) {
      return PRIORITY_LABELS[val];
    }

    if (fieldName === "type" && TYPE_LABELS[val]) {
      return TYPE_LABELS[val];
    }

    if (fieldName === "dueDate" && val !== "none" && val !== "No due date") {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    return val;
  }

  // Helper to resolve raw IDs or composite strings to human readable names
  function resolveValueName(val: string | null | undefined, fieldName: string | null): string {
    if (!val || val === "none" || val === "null") return "None";

    if ((fieldName === "assignees" || fieldName === "teams") && val.includes(",")) {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((single) => resolveSingleValue(single, fieldName))
        .join(", ");
    }

    return resolveSingleValue(val, fieldName);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-muted shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 pt-1">
              <div className="h-3 bg-muted rounded-full w-2/3" />
              <div className="h-2.5 bg-muted rounded-full w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/80 bg-surface-subtle/40 text-center">
        <FileText className="w-6 h-6 text-muted-foreground/60 mb-2" />
        <p className="text-xs font-bold text-foreground">No activity recorded yet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Changes will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 flex flex-col gap-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
      {entries.map((entry) => {
        const actorName = entry.actor?.name ?? "System";
        const actorInitials = actorName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const isAttachmentAdd = entry.action === "ATTACHMENT_ADDED";
        const isAttachmentRemove = entry.action === "ATTACHMENT_REMOVED" || (entry.field === "attachment" && entry.action === "FIELD_EDITED");
        const isTestCaseAction = entry.field === "testCase";

        const config = ACTION_CONFIG[entry.action] ?? {
          label: entry.action.toLowerCase(),
          icon: <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />,
          color: "border-border bg-surface-subtle",
        };

        const fieldDisplay = entry.field ? (FIELD_LABELS[entry.field] || entry.field) : null;
        const oldName = resolveValueName(entry.oldValue, entry.field);
        const newName = resolveValueName(entry.newValue, entry.field);
        const isDiffSame = oldName === newName;

        const formattedTime = new Date(entry.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <div key={entry.id} className="relative flex items-start justify-between gap-4 text-xs group">
            <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border shadow-xs transition-transform group-hover:scale-110 ${config.color}`}>
              {isTestCaseAction ? <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" /> : config.icon}
            </div>

            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="w-5 h-5 rounded-full bg-primary-light text-primary font-bold text-[9px] flex items-center justify-center border border-primary/20 shrink-0">
                  {actorInitials}
                </div>

                <span className="font-bold text-foreground">{actorName}</span>
                <span className="text-muted-foreground">
                  {isTestCaseAction
                    ? "updated QA test sheet"
                    : isAttachmentRemove
                    ? "removed attachment"
                    : config.label}
                </span>
              </div>

              {/* Attachment added pill */}
              {isAttachmentAdd && entry.newValue && (
                <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-xs w-fit max-w-full text-emerald-800 dark:text-emerald-300">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate max-w-xs sm:max-w-md">{entry.newValue}</span>
                </div>
              )}

              {/* Attachment removed pill */}
              {isAttachmentRemove && entry.oldValue && (
                <div className="flex items-center gap-2 text-xs bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-xl shadow-xs w-fit max-w-full text-destructive">
                  <Trash2 className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="line-through truncate max-w-xs sm:max-w-md">{entry.oldValue}</span>
                </div>
              )}

              {/* Test case update pill */}
              {isTestCaseAction && (entry.newValue || entry.oldValue) && (
                <div className="flex items-center gap-2 text-xs bg-card border border-border/80 px-3 py-1.5 rounded-xl shadow-xs w-fit max-w-full">
                  <span className="font-semibold text-muted-foreground">QA:</span>
                  {entry.oldValue && (
                    <>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-[11px] truncate max-w-[150px]">
                        {entry.oldValue}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    </>
                  )}
                  {entry.newValue && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/20 truncate max-w-[200px]">
                      {entry.newValue}
                    </span>
                  )}
                </div>
              )}

              {/* General field diff pill */}
              {entry.field && !isAttachmentAdd && !isAttachmentRemove && !isTestCaseAction && !isDiffSame && (
                <div className="flex items-center gap-2 text-xs bg-card border border-border/80 px-3 py-1.5 rounded-xl shadow-xs w-fit max-w-full flex-wrap">
                  <span className="font-semibold text-muted-foreground capitalize shrink-0">
                    {fieldDisplay}:
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium text-[11px] max-w-[180px] truncate">
                    {oldName}
                  </span>

                  <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />

                  <span className="px-2 py-0.5 rounded-md bg-primary-light text-primary font-bold text-[11px] border border-primary/20 max-w-[200px] truncate">
                    {newName}
                  </span>
                </div>
              )}

              {/* Reason note pill */}
              {entry.reason && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/60 dark:bg-muted/20 px-2.5 py-1.5 rounded-xl border border-border/60 w-fit max-w-full">
                  <span className="font-bold text-foreground text-[11px] shrink-0">Reason:</span>
                  <span className="text-[11px] text-foreground/90 italic break-words">{entry.reason}</span>
                </div>
              )}
            </div>

            <span className="text-[11px] font-medium text-muted-foreground shrink-0 mt-0.5">
              {formattedTime}
            </span>
          </div>
        );
      })}
    </div>
  );
}
