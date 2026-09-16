// Centralized Chart & Metric Color Tokens
// Explicitly maps design tokens to concrete hex values for HTML5 Canvas compatibility

export const STATUS_COLORS = {
  TODO: {
    label: "To Do",
    hexColor: "var(--muted-foreground)",
    colorClass: "bg-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    hexColor: "var(--primary)",
    colorClass: "bg-primary",
  },
  IN_REVIEW: {
    label: "In Review",
    hexColor: "var(--color-purple-500, var(--primary))",
    colorClass: "bg-purple-600",
  },
  QA: {
    label: "QA / Testing",
    hexColor: "var(--warning)",
    colorClass: "bg-amber-600",
  },
  BLOCKED: {
    label: "Blocked",
    hexColor: "var(--destructive)",
    colorClass: "bg-destructive",
  },
  DONE: {
    label: "Completed",
    hexColor: "var(--success)",
    colorClass: "bg-emerald-600",
  },
  BACKLOG: {
    label: "Backlog",
    hexColor: "var(--muted-foreground)",
    colorClass: "bg-muted-foreground",
  },
} as const;

export const PRIORITY_COLORS = {
  CRITICAL: {
    label: "Critical",
    color: "var(--destructive)",
    hexColor: "var(--destructive)",
    colorClass: "bg-destructive",
  },
  HIGH: {
    label: "High",
    color: "var(--warning)",
    hexColor: "var(--warning)",
    colorClass: "bg-amber-500",
  },
  MEDIUM: {
    label: "Medium",
    color: "var(--primary)",
    hexColor: "var(--primary)",
    colorClass: "bg-primary",
  },
  LOW: {
    label: "Low",
    color: "var(--muted-foreground)",
    hexColor: "var(--muted-foreground)",
    colorClass: "bg-muted-foreground",
  },
} as const;

export const TASK_TYPE_COLORS: Record<string, { label: string; hexColor: string; colorClass: string }> = {
  BUG: { label: "Bug", hexColor: "var(--destructive)", colorClass: "bg-destructive" },
  FEATURE: { label: "Feature", hexColor: "var(--primary)", colorClass: "bg-primary" },
  SUPPORT_REQUEST: { label: "Support Request", hexColor: "var(--muted-foreground)", colorClass: "bg-muted-foreground" },
  DEPLOYMENT: { label: "Deployment", hexColor: "var(--success)", colorClass: "bg-emerald-600" },
  MAINTENANCE: { label: "Maintenance", hexColor: "var(--color-purple-500, var(--primary))", colorClass: "bg-purple-500" },
  CUSTOMIZATION: { label: "Customization", hexColor: "var(--primary-hover)", colorClass: "bg-primary" },
};

export const CHART_THEME = {
  gridStroke: "var(--border-subtle)",
  axisStroke: "var(--border)",
  cursorFill: "var(--surface-subtle)",
  fallbackColor: "var(--primary)",
} as const;
