import type { Task } from "@zsyio/types";

export type TaskDeadlineCategory =
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_SOON" // 1-3 days
  | "UPCOMING" // > 3 days
  | "NO_DEADLINE";

/**
 * Detects if a task was created by an Administrator.
 */
export function isTaskAdminCreated(task: Task): boolean {
  if (!task.createdBy) return false;
  const role = task.createdBy.role?.toUpperCase();
  const customRole = task.createdBy.customRole?.name?.toUpperCase();
  return role === "ADMIN" || role === "SUPER_ADMIN" || customRole === "ADMIN" || customRole === "SUPER_ADMIN";
}

/**
 * Categorizes a task's deadline urgency relative to the current date.
 */
export function getTaskDeadlineCategory(task: Task): TaskDeadlineCategory {
  if (!task.dueDate) return "NO_DEADLINE";
  if (task.status === "DONE" || task.status?.toUpperCase() === "DONE") return "NO_DEADLINE";

  const due = new Date(task.dueDate);
  if (isNaN(due.getTime())) return "NO_DEADLINE";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return "OVERDUE";
  if (diffDays === 0) return "DUE_TODAY";
  if (diffDays <= 3) return "DUE_SOON";
  return "UPCOMING";
}

const PRIORITY_RANK: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const DEADLINE_RANK: Record<TaskDeadlineCategory, number> = {
  OVERDUE: 4,
  DUE_TODAY: 3,
  DUE_SOON: 2,
  UPCOMING: 1,
  NO_DEADLINE: 0,
};

/**
 * Hierarchical task sorting comparator:
 * 1. Admin-created tickets rank first at the top.
 * 2. Imminent deadlines (Overdue -> Due Today -> Due Soon -> Upcoming) rank next.
 * 3. Priority levels (Critical > High > Medium > Low).
 * 4. Newer creation dates first.
 */
export function compareTaskHierarchy(a: Task, b: Task): number {
  const aAdmin = isTaskAdminCreated(a);
  const bAdmin = isTaskAdminCreated(b);

  // 1. Admin-created tasks always prioritized first
  if (aAdmin && !bAdmin) return -1;
  if (!aAdmin && bAdmin) return 1;

  // 2. Deadline urgency rank
  const aDeadlineCat = getTaskDeadlineCategory(a);
  const bDeadlineCat = getTaskDeadlineCategory(b);
  const aDeadlineRank = DEADLINE_RANK[aDeadlineCat];
  const bDeadlineRank = DEADLINE_RANK[bDeadlineCat];

  if (aDeadlineRank !== bDeadlineRank) {
    return bDeadlineRank - aDeadlineRank;
  }

  // 3. If both have active deadlines, sort by earlier due date first
  if (a.dueDate && b.dueDate && aDeadlineCat !== "NO_DEADLINE") {
    const aTime = new Date(a.dueDate).getTime();
    const bTime = new Date(b.dueDate).getTime();
    if (aTime !== bTime) return aTime - bTime;
  }

  // 4. Task priority (Critical > High > Medium > Low)
  const aPriority = PRIORITY_RANK[a.priority] ?? 2;
  const bPriority = PRIORITY_RANK[b.priority] ?? 2;
  if (aPriority !== bPriority) {
    return bPriority - aPriority;
  }

  // 5. Newest createdAt first
  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  return bCreated - aCreated;
}

/**
 * Returns background styles, row highlights, and badge metadata for a task.
 */
export function getTaskVisualHierarchy(task: Task) {
  const isAdmin = isTaskAdminCreated(task);
  const deadlineCat = getTaskDeadlineCategory(task);
  const isOverdue = deadlineCat === "OVERDUE";
  const isDueToday = deadlineCat === "DUE_TODAY";
  const isDueSoon = deadlineCat === "DUE_SOON";

  // Use a clean base - modern border with subtle ambient tints
  let cardBgClass = "border-border/80 bg-card hover:border-primary/40 hover:shadow-md";
  let tableRowClass = "";
  let accentTag: "admin" | "overdue" | "due_today" | "due_soon" | null = null;

  if (isAdmin) {
    accentTag = "admin";
    if (isOverdue) {
      cardBgClass =
        "border-rose-500/40 bg-gradient-to-b from-rose-500/[0.04] to-card hover:border-rose-500/60 hover:shadow-md";
      tableRowClass = "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]";
    } else if (isDueToday || isDueSoon) {
      cardBgClass =
        "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-card hover:border-amber-500/60 hover:shadow-md";
      tableRowClass = "bg-amber-500/[0.03] hover:bg-amber-500/[0.06]";
    } else {
      cardBgClass =
        "border-violet-500/30 bg-gradient-to-b from-violet-500/[0.04] to-card hover:border-violet-500/50 hover:shadow-md";
      tableRowClass = "bg-violet-500/[0.02] hover:bg-violet-500/[0.05]";
    }
  } else if (isOverdue) {
    accentTag = "overdue";
    cardBgClass =
      "border-rose-500/40 bg-gradient-to-b from-rose-500/[0.04] to-card hover:border-rose-500/60 hover:shadow-md";
    tableRowClass = "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]";
  } else if (isDueToday) {
    accentTag = "due_today";
    cardBgClass =
      "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-card hover:border-amber-500/60 hover:shadow-md";
    tableRowClass = "bg-amber-500/[0.03] hover:bg-amber-500/[0.06]";
  } else if (isDueSoon) {
    accentTag = "due_soon";
    cardBgClass =
      "border-amber-500/30 bg-gradient-to-b from-amber-500/[0.02] to-card hover:border-amber-500/50 hover:shadow-md";
    tableRowClass = "bg-amber-500/[0.02] hover:bg-amber-500/[0.04]";
  }

  return {
    isAdmin,
    deadlineCat,
    isOverdue,
    isDueToday,
    isDueSoon,
    cardBgClass,
    tableRowClass,
    accentTag,
  };
}
