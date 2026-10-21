// Mirrors the Prisma `Role` enum's string values — kept as a plain type
// (not imported from @prisma/client) so this file stays safe to import from
// client components without pulling in Prisma's runtime.
export type Role = "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT";

export type Action =
  // Dashboard
  | "dashboard:view"
  | "dashboard:note:create"
  | "dashboard:note:delete"
  // Notes & Knowledge Base
  | "note:view"
  | "note:create"
  | "note:edit"
  | "note:delete"
  | "note:share"
  // Clients
  | "client:view"
  | "client:create"
  | "client:edit"
  | "client:delete"
  // Products
  | "product:view"
  | "product:create"
  | "product:edit"
  | "product:delete"
  // Tasks & Workflows
  | "task:view:all"
  | "task:view:own"
  | "task:create"
  | "task:create:any"
  | "task:create:support"
  | "task:edit:own"
  | "task:edit:any"
  | "task:delete"
  | "task:assign"
  | "task:comment"
  | "task:test_case:manage"
  | "task:attachment:manage"
  | "task:column:manage"
  // Reports
  | "report:view"
  | "report:export"
  // Teams
  | "team:view"
  | "team:manage"
  // Users
  | "user:view"
  | "user:manage"
  // Roles & Capabilities
  | "role:view"
  | "role:manage"
  // Timesheet & Attendance (HRMS)
  | "timesheet:view:own"
  | "timesheet:clock"
  | "timesheet:manual:create"
  | "timesheet:view:all"
  | "timesheet:manage"
  | "timesheet:export"
  // Application Suite Access
  | "app:access:pms"
  | "app:access:notes"
  | "app:access:hrms"
  | "app:access:admin"
  | "app:access:recruit"
  | "recruit:manage"
  | "app:access:sales"
  // Sales CRM
  | "sales:view"
  | "sales:create"
  | "sales:edit"
  | "sales:delete"
  | "sales:assign"
  | "sales:pipeline:manage"
  | "sales:dashboard:view"
  | "sales:convert";

export const ALL_ACTIONS: Action[] = [
  "app:access:recruit",
  "recruit:manage",
  // Application Suite Access
  "app:access:pms",
  "app:access:notes",
  "app:access:hrms",
  "app:access:admin",
  "app:access:sales",
  // Dashboard
  "dashboard:view",
  "dashboard:note:create",
  "dashboard:note:delete",
  // Notes
  "note:view",
  "note:create",
  "note:edit",
  "note:delete",
  "note:share",
  // Clients
  "client:view",
  "client:create",
  "client:edit",
  "client:delete",
  // Products
  "product:view",
  "product:create",
  "product:edit",
  "product:delete",
  // Tasks
  "task:view:all",
  "task:view:own",
  "task:create",
  "task:create:any",
  "task:create:support",
  "task:edit:own",
  "task:edit:any",
  "task:delete",
  "task:assign",
  "task:comment",
  "task:test_case:manage",
  "task:attachment:manage",
  "task:column:manage",
  // Reports
  "report:view",
  "report:export",
  // Teams
  "team:view",
  "team:manage",
  // Users
  "user:view",
  "user:manage",
  // Roles
  "role:view",
  "role:manage",
  // Timesheet
  "timesheet:view:own",
  "timesheet:clock",
  "timesheet:manual:create",
  "timesheet:view:all",
  "timesheet:manage",
  "timesheet:export",
  // Sales CRM
  "sales:view",
  "sales:create",
  "sales:edit",
  "sales:delete",
  "sales:assign",
  "sales:pipeline:manage",
  "sales:dashboard:view",
  "sales:convert",
];

export interface ActionDefinition {
  id: Action;
  label: string;
  description: string;
}

export interface ActionGroup {
  id: string;
  title: string;
  description: string;
  actions: ActionDefinition[];
}

export const ACTION_GROUPS: ActionGroup[] = [
  {
    id: "apps",
    title: "Application Suite Access",
    description: "Control which Zsyio web applications this role is authorized to open and use.",
    actions: [
      {
        id: "app:access:pms",
        label: "Access Zsyio Flow",
        description: "Allow sign-in and navigation to Zsyio Flow (Task workflows, client tracking, and sprint boards).",
      },
      {
        id: "app:access:notes",
        label: "Access Zsyio Canvas",
        description: "Allow sign-in and navigation to Zsyio Canvas (Knowledge base, collaborative workspaces, and documentation).",
      },
      {
        id: "app:access:hrms",
        label: "Access Zsyio People",
        description: "Allow sign-in and navigation to Zsyio People (Daily attendance, shift clocks, leave requests, and directory).",
      },
      {
        id: "app:access:admin",
        label: "Access Zsyio Console",
        description: "Allow sign-in and access to Zsyio Console (Role permission matrix, user directory, and security).",
      },
      { id: "app:access:recruit", label: "Access Zsyio Recruit", description: "View jobs, applicants, interviews, and hiring feedback." },
      { id: "recruit:manage", label: "Manage recruitment", description: "Create and edit jobs, applicants, interviews, and hiring feedback." },
      {
        id: "app:access:sales",
        label: "Access Zsyio Pulse",
        description: "Allow sign-in and navigation to Zsyio Pulse (Lead tracking, 7-stage Kanban board, activities, and conversion).",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard & Announcements",
    description: "Access to dashboard statistics, metrics, and pinned workspace announcements.",
    actions: [
      {
        id: "dashboard:view",
        label: "View Dashboard",
        description: "Access main overview dashboard and aggregate KPIs.",
      },
      {
        id: "dashboard:note:create",
        label: "Post Announcements",
        description: "Publish pinned team notes and announcements on the workspace dashboard.",
      },
      {
        id: "dashboard:note:delete",
        label: "Delete Announcements",
        description: "Remove dashboard announcements and notes posted across the workspace.",
      },
    ],
  },
  {
    id: "notes",
    title: "Notes & Knowledge Base",
    description: "Permissions for documents, Notion-style workspaces, and collaborative sharing.",
    actions: [
      {
        id: "note:view",
        label: "View Notes",
        description: "Browse accessible notes, workspaces, and documentation folders.",
      },
      {
        id: "note:create",
        label: "Create Notes & Folders",
        description: "Create new documents, pages, and workspace folders.",
      },
      {
        id: "note:edit",
        label: "Edit Notes",
        description: "Edit document content, rename folders, and update metadata.",
      },
      {
        id: "note:delete",
        label: "Delete Notes & Folders",
        description: "Archive or permanently remove notes and folders.",
      },
      {
        id: "note:share",
        label: "Share Notes & Workspaces",
        description: "Manage role, team, and person-based sharing permissions on notes and folders.",
      },
    ],
  },
  {
    id: "clients",
    title: "Client Management",
    description: "Permissions for viewing, creating, updating, and removing client accounts.",
    actions: [
      {
        id: "client:view",
        label: "View Clients",
        description: "Access clients roster and individual client profiles.",
      },
      {
        id: "client:create",
        label: "Create Clients",
        description: "Register new client accounts and organizations.",
      },
      {
        id: "client:edit",
        label: "Edit Clients",
        description: "Modify existing client contact info and configuration.",
      },
      {
        id: "client:delete",
        label: "Delete Clients",
        description: "Archive or delete client accounts.",
      },
    ],
  },
  {
    id: "products",
    title: "Product Management",
    description: "Permissions for managing products and deployment environments under clients.",
    actions: [
      {
        id: "product:view",
        label: "View Products",
        description: "Browse products, environments, and versioning info.",
      },
      {
        id: "product:create",
        label: "Create Products",
        description: "Add new products to existing clients.",
      },
      {
        id: "product:edit",
        label: "Edit Products",
        description: "Update product repository URLs, deployment links, and settings.",
      },
      {
        id: "product:delete",
        label: "Delete Products",
        description: "Archive or delete products.",
      },
    ],
  },
  {
    id: "tasks",
    title: "Tasks & Workflows",
    description: "Permissions for ticket creation, editing, deletion, assignments, discussions, and QA test sheets.",
    actions: [
      {
        id: "task:view:all",
        label: "View All Tasks",
        description: "View all tasks across all clients and team members.",
      },
      {
        id: "task:view:own",
        label: "View Own Tasks",
        description: "View tasks assigned directly to the authenticated user.",
      },
      {
        id: "task:create",
        label: "Create Tasks",
        description: "Create standard tasks, features, and tickets across client products.",
      },
      {
        id: "task:create:any",
        label: "Create Any Task Type",
        description: "Create standard features, bugs, maintenance, and deployment tasks.",
      },
      {
        id: "task:create:support",
        label: "Create Support Requests Only",
        description: "Restricted ticket creation for support inquiries.",
      },
      {
        id: "task:edit:own",
        label: "Edit Own Assigned Tasks",
        description: "Update status, comments, and attachments on tasks assigned to self.",
      },
      {
        id: "task:edit:any",
        label: "Edit Any Task",
        description: "Modify status, assignments, priority, and details on all tasks.",
      },
      {
        id: "task:delete",
        label: "Delete Tasks",
        description: "Soft delete or archive tasks from the system.",
      },
      {
        id: "task:assign",
        label: "Assign & Reassign Tasks",
        description: "Assign tasks to team members or change task assignees.",
      },
      {
        id: "task:comment",
        label: "Post Task Comments",
        description: "Add comments, replies, and participate in task discussions.",
      },
      {
        id: "task:test_case:manage",
        label: "Manage QA Test Cases",
        description: "Create, run, AI-generate, and update QA test sheets and verification cases.",
      },
      {
        id: "task:attachment:manage",
        label: "Manage Attachments",
        description: "Upload and delete file attachments on tasks.",
      },
      {
        id: "task:column:manage",
        label: "Manage Workflow Columns",
        description: "Create and reorder Kanban workflow columns for tasks.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    description: "Access to cross-organization reports, workload analytics, and export tools.",
    actions: [
      {
        id: "report:view",
        label: "View Reports",
        description: "View delivery performance, workload heatmaps, and client analytics.",
      },
      {
        id: "report:export",
        label: "Export Reports",
        description: "Download CSV and Excel exports of workload and performance analytics.",
      },
    ],
  },
  {
    id: "teams",
    title: "Teams & Departments",
    description: "Organization of users into functional teams, squads, and departments.",
    actions: [
      {
        id: "team:view",
        label: "View Teams",
        description: "View team rosters, member allocations, and team details.",
      },
      {
        id: "team:manage",
        label: "Manage Teams",
        description: "Create new teams, modify member lists, and delete teams.",
      },
    ],
  },
  {
    id: "users",
    title: "Users & Accounts",
    description: "User roster viewing, invitations, account settings, and credential management.",
    actions: [
      {
        id: "user:view",
        label: "View Users",
        description: "Browse team member directory, profiles, and activity status.",
      },
      {
        id: "user:manage",
        label: "Manage Users",
        description: "Invite users, edit profiles, reset passwords, and deactivate or delete accounts.",
      },
    ],
  },
  {
    id: "roles",
    title: "Roles & Capabilities",
    description: "Configuration of roles, permission matrices, and capability assignments.",
    actions: [
      {
        id: "role:view",
        label: "View Roles & Permissions",
        description: "View available roles, permission matrix, and capability assignments.",
      },
      {
        id: "role:manage",
        label: "Manage Roles & Capabilities",
        description: "Create custom roles, modify permission matrices, and reset system roles.",
      },
    ],
  },
  {
    id: "timesheet",
    title: "Timesheet & Attendance (HRMS)",
    description: "Permissions for tracking daily work hours, Clock In/Out, breaks, corrections, and timesheet exports.",
    actions: [
      {
        id: "timesheet:view:own",
        label: "View Own Timesheet",
        description: "Access personal daily timesheet, clock status, and activity timeline.",
      },
      {
        id: "timesheet:clock",
        label: "Clock In / Out & Breaks",
        description: "Clock in, clock out, and take or end breaks.",
      },
      {
        id: "timesheet:manual:create",
        label: "Submit Manual Entries",
        description: "Log missed clock in/out sessions and manual breaks.",
      },
      {
        id: "timesheet:view:all",
        label: "View All Employee Timesheets",
        description: "Review timesheets and attendance across all team members.",
      },
      {
        id: "timesheet:manage",
        label: "Manage & Correct Timesheets",
        description: "Correct timesheet timestamps, fix incomplete records, and review audit history.",
      },
      {
        id: "timesheet:export",
        label: "Export Timesheets",
        description: "Export daily and activity timesheet reports to CSV and Excel (.xlsx).",
      },
    ],
  },
  {
    id: "sales",
    title: "Sales & CRM",
    description: "Permissions for managing the sales pipeline, leads, activities, and client conversion.",
    actions: [
      {
        id: "sales:view",
        label: "View Sales Leads",
        description: "Access the sales pipeline Kanban board and lead profiles.",
      },
      {
        id: "sales:create",
        label: "Create Sales Leads",
        description: "Register new prospects and sales leads in the CRM.",
      },
      {
        id: "sales:edit",
        label: "Edit Sales Leads",
        description: "Update lead contact info, deal value, stage, and notes.",
      },
      {
        id: "sales:delete",
        label: "Delete Sales Leads",
        description: "Archive or permanently remove leads from the pipeline.",
      },
      {
        id: "sales:assign",
        label: "Assign Sales Leads",
        description: "Assign or reassign leads to sales team members.",
      },
      {
        id: "sales:pipeline:manage",
        label: "Manage Pipeline Stages",
        description: "Create, reorder, and configure Kanban pipeline stages.",
      },
      {
        id: "sales:dashboard:view",
        label: "View Sales Dashboard",
        description: "Access pipeline statistics, KPIs, and team performance metrics.",
      },
      {
        id: "sales:convert",
        label: "Convert to Development Client",
        description: "Convert a won sales lead into a development client for project workflows.",
      },
    ],
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role | "SUPER_ADMIN", Action[]> = {
  SUPER_ADMIN: ALL_ACTIONS,
  ADMIN: ALL_ACTIONS,
  MANAGER: [
    "app:access:pms",
    "app:access:notes",
    "app:access:hrms",
    "dashboard:view",
    "dashboard:note:create",
    "dashboard:note:delete",
    "note:view",
    "note:create",
    "note:edit",
    "note:delete",
    "note:share",
    "client:view",
    "client:create",
    "client:edit",
    "product:view",
    "product:create",
    "product:edit",
    "task:view:all",
    "task:view:own",
    "task:create",
    "task:create:any",
    "task:create:support",
    "task:edit:own",
    "task:edit:any",
    "task:assign",
    "task:comment",
    "task:test_case:manage",
    "task:attachment:manage",
    "task:column:manage",
    "report:view",
    "report:export",
    "team:view",
    "team:manage",
    "user:view",
    "role:view",
    "timesheet:view:own",
    "timesheet:clock",
    "timesheet:manual:create",
    "timesheet:view:all",
    "timesheet:export",
    // Sales
    "app:access:sales",
    "sales:view",
    "sales:create",
    "sales:edit",
    "sales:assign",
    "sales:pipeline:manage",
    "sales:dashboard:view",
    "sales:convert",
  ],
  DEVELOPER: [
    "app:access:pms",
    "app:access:notes",
    "app:access:hrms",
    "dashboard:view",
    "note:view",
    "note:create",
    "note:edit",
    "note:delete",
    "note:share",
    "client:view",
    "product:view",
    "task:view:all",
    "task:view:own",
    "task:create",
    "task:create:any",
    "task:edit:own",
    "task:edit:any",
    "task:comment",
    "task:test_case:manage",
    "task:attachment:manage",
    "task:column:manage",
    "team:view",
    "user:view",
    "timesheet:view:own",
    "timesheet:clock",
    "timesheet:manual:create",
  ],
  SUPPORT: [
    "app:access:pms",
    "app:access:notes",
    "app:access:hrms",
    "dashboard:view",
    "note:view",
    "note:create",
    "note:edit",
    "client:view",
    "product:view",
    "task:view:all",
    "task:view:own",
    "task:create:support",
    "task:edit:own",
    "task:comment",
    "task:attachment:manage",
    "team:view",
    "user:view",
    "timesheet:view:own",
    "timesheet:clock",
    "timesheet:manual:create",
  ],
};

const MATRIX = DEFAULT_ROLE_PERMISSIONS;

export function can(role: Role | string | undefined | null, action: Action, customPermissions?: string[] | null): boolean {
  if (!role) return false;
  if (!ALL_ACTIONS.includes(action)) return false;
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;

  if (customPermissions && Array.isArray(customPermissions)) {
    if (customPermissions.includes(action)) return true;

    // Backward compatibility & hierarchical fallbacks for custom permission sets
    if (action === "client:view" && (customPermissions.includes("client:create") || customPermissions.includes("client:edit") || customPermissions.includes("client:delete"))) return true;
    if (action === "product:view" && (customPermissions.includes("product:create") || customPermissions.includes("product:edit") || customPermissions.includes("product:delete"))) return true;
    if (action === "note:view" && (customPermissions.includes("note:create") || customPermissions.includes("note:edit") || customPermissions.includes("note:delete") || customPermissions.includes("note:share"))) return true;
    if (action === "task:view:own" && customPermissions.includes("task:view:all")) return true;
    if (action === "task:create" && (customPermissions.includes("task:create:any") || customPermissions.includes("task:create"))) return true;
    if (action === "task:create:any" && (customPermissions.includes("task:create") || customPermissions.includes("task:create:any"))) return true;
    if (action === "task:create:support" && (customPermissions.includes("task:create") || customPermissions.includes("task:create:any"))) return true;
    if (action === "user:view" && customPermissions.includes("user:manage")) return true;
    if (action === "team:view" && (customPermissions.includes("team:manage") || customPermissions.includes("user:manage"))) return true;
    if (action === "team:manage" && customPermissions.includes("user:manage")) return true;
    if (action === "role:view" && (customPermissions.includes("role:manage") || customPermissions.includes("user:manage"))) return true;
    if (action === "role:manage" && customPermissions.includes("user:manage")) return true;
    if (action === "report:export" && customPermissions.includes("report:view")) return true;
    if (action === "task:assign" && customPermissions.includes("task:edit:any")) return true;
    if (action === "task:comment" && (customPermissions.includes("task:edit:any") || customPermissions.includes("task:edit:own") || customPermissions.includes("task:create:any") || customPermissions.includes("task:create"))) return true;
    if (action === "task:test_case:manage" && customPermissions.includes("task:edit:any")) return true;
    if (action === "task:attachment:manage" && (customPermissions.includes("task:edit:any") || customPermissions.includes("task:edit:own"))) return true;
    if (action === "task:column:manage" && (customPermissions.includes("task:create:any") || customPermissions.includes("task:edit:any"))) return true;
    if ((action === "dashboard:note:create" || action === "dashboard:note:delete") && customPermissions.includes("user:manage")) return true;
    if (action === "timesheet:view:own" && (customPermissions.includes("timesheet:view:all") || customPermissions.includes("timesheet:manage"))) return true;
    if (action === "timesheet:clock" && customPermissions.includes("timesheet:manage")) return true;
    if (action === "timesheet:manual:create" && customPermissions.includes("timesheet:manage")) return true;
    if (action === "timesheet:export" && (customPermissions.includes("timesheet:view:all") || customPermissions.includes("timesheet:manage"))) return true;

    // Fallback: if customPermissions doesn't contain ANY timesheet actions (legacy custom permission array),
    // default to the standard role matrix for timesheet
    if (action.startsWith("timesheet:") && !customPermissions.some((p) => p.startsWith("timesheet:"))) {
      return MATRIX[role as Role]?.includes(action) ?? false;
    }

    // Fallback: if customPermissions doesn't contain ANY app:access actions (legacy custom permission array),
    // default to the standard role matrix for application access
    if (action.startsWith("app:access:") && !customPermissions.some((p) => p.startsWith("app:access:"))) {
      return MATRIX[role as Role]?.includes(action) ?? false;
    }

    return false;
  }

  return MATRIX[role as Role]?.includes(action) ?? false;
}

export class BadRequestError extends Error {
  constructor(message = "Invalid request.") {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Resource conflict.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class GoneError extends Error {
  constructor(message = "This resource is no longer available.") {
    super(message);
    this.name = "GoneError";
  }
}

export class TooManyRequestsError extends Error {
  constructor(message = "Too many requests. Please try again later.") {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

export function assertCan(role: Role | string | undefined | null, action: Action, customPermissions?: string[] | null): void {
  if (!can(role, action, customPermissions)) {
    throw new ForbiddenError(`Role ${role ?? "Unknown"} is not permitted to perform "${action}"`);
  }
}

export type AppId = "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit";

export function canAccessApp(
  role: Role | string | undefined | null,
  appId: AppId,
  customPermissions?: string[] | null
): boolean {
  const actionMap: Record<AppId, Action> = {
    pms: "app:access:pms",
    notes: "app:access:notes",
    hrms: "app:access:hrms",
    admin: "app:access:admin",
    sales: "app:access:sales",
    recruit: "app:access:recruit",
  };
  return can(role, actionMap[appId], customPermissions);
}

export interface NavItem {
  label: string;
  href: string;
  action: Action;
}

export function filterVisibleNavItems<T extends NavItem = NavItem>(
  items: T[],
  role: Role | string | undefined | null,
  permissions?: string[] | null,
  customPredicate?: (item: T) => boolean | undefined
): T[] {
  return items.filter((item) => {
    if (customPredicate) {
      const result = customPredicate(item);
      if (result !== undefined) return result;
    }
    return can(role, item.action, permissions);
  });
}
