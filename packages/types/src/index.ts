// Common Enums & Primitives aligned with Prisma schema
export type ClientStatus = "INTAKE" | "ONBOARDING" | "ACTIVE" | "PAUSED" | "CHURNED";
export type ClientType = "SALES" | "DEVELOPMENT";
export type Environment = "DEVELOPMENT" | "STAGING" | "PRODUCTION";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type TaskType = "FEATURE" | "BUG" | "HOTFIX" | "SUPPORT" | "MAINTENANCE" | (string & {});
export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "DEVELOPER" | "SUPPORT" | (string & {});
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type LogAction =
  | "CREATED"
  | "STATUS_CHANGED"
  | "REASSIGNED"
  | "COMMENTED"
  | "FIELD_EDITED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED"
  | "DELETED"
  | "RESTORED";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "STATUS_CHANGED"
  | "MENTIONED"
  | "COMMENT_ADDED"
  | "DUE_DATE_REMINDER"
  | "NOTE_ADDED"
  | "SYSTEM";
export type TestCaseStatus = "PENDING" | "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED";
export type NoteGeneralAccess = "INHERIT" | "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
export type NoteAccessLevel = "NONE" | "VIEW" | "EDIT" | "FULL";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "QA" | "BLOCKED" | "DONE" | (string & {});

export interface CustomKanbanColumn {
  id: string;
  statusKey: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  order: number;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  logoUrl: string | null;
  domain: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  status: ClientStatus;
  clientType: ClientType;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  salesLead?: SalesLead | null;
}

export interface Product {
  id: string;
  clientId: string;
  name: string;
  imageUrl: string | null;
  version: string | null;
  deployedUrl: string | null;
  repoUrl: string | null;
  environment: Environment;
  lastDeployed: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id?: string;
    name: string;
    status?: ClientStatus;
  } | null;
}

export interface CustomRole {
  id: string;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  customRoleId?: string | null;
  customRole?: CustomRole | null;
  active: boolean;
  mustChangePassword: boolean;
  theme?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  timeZone?: string | null;
  invitationStatus?: InvitationStatus;
  invitationExpiresAt?: string | null;
  invitedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  user: User & {
    teamMemberships?: Array<{
      teamId: string;
      role: string;
      team: { id: string; name: string; color?: string | null; description?: string | null };
    }>;
  };
  stats?: {
    assignedTasksCount: number;
    completedTasksCount: number;
    authoredNotesCount: number;
  };
}

export interface UpdateProfileInput {
  name?: string;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  timeZone?: string | null;
  theme?: string | null;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: string;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  _count?: {
    assignedTasks: number;
  };
}

export interface CustomTaskType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  ticketNumber?: number;
  productId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  type: string;
  dueDate: string | null;
  dueDateReason?: string | null;
  changeReason?: string | null;
  blockedReason: string | null;
  gitBranchSlug?: string | null;
  aiSummary?: string | null;
  deletedAt: string | null;
  assignedToId: string | null;
  assignedTo?: User | null;
  reviewerId?: string | null;
  reviewer?: User | null;
  reviewers?: { userId: string; user: User }[];
  assignedTeamId?: string | null;
  assignedTeam?: Team | null;
  assignees?: { userId: string; user: User }[];
  teams?: { teamId: string; team: Team }[];
  createdById: string;
  createdBy?: User | null;
  createdAt: string;
  updatedAt: string;
  product?: Product & { client?: Client };
  attachments?: Attachment[];
  comments?: Comment[];
  activityLogs?: ActivityLogEntry[];
  tags?: { tagId: string; tag: TaskTag }[];
  estimatedHours?: number | null;
  actualHours?: number | null;
  timeEntries?: TaskTimeEntry[];
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  user?: User | null;
  startedAt: string;
  endedAt?: string | null;
  durationMin?: number | null;
  description?: string | null;
  isBillable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color?: string | null;
  createdAt?: string;
  _count?: {
    tasks: number;
  };
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author?: User;
  body: string;
  parentId?: string | null;
  parent?: Comment | null;
  replies?: Comment[];
  createdAt: string;
  editedAt: string | null;
}

export interface ActivityLogEntry {
  id: string;
  taskId: string;
  actorId: string;
  actor?: User;
  action: LogAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  actor?: Pick<User, "id" | "name" | "email" | "role"> | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  taskId: string | null;
  commentId: string | null;
  noteId: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  taskAssigned: boolean;
  statusChanged: boolean;
  mentions: boolean;
  comments: boolean;
  dueDateReminders: boolean;
  dashboardNotes: boolean;
  inAppToasts: boolean;
  browserNotifications: boolean;
  browserSound: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export interface TestCase {
  id: string;
  taskId: string;
  title: string;
  description?: string | null;
  steps?: string | null;
  expectedResult?: string | null;
  status: TestCaseStatus;
  notes?: string | null;
  testedById?: string | null;
  testedBy?: User | null;
  testedAt?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardNote {
  id: string;
  clientId?: string | null;
  taskId?: string | null;
  authorId: string;
  content: string;
  targetAll: boolean;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  targetTeams: Array<{
    team: {
      id: string;
      name: string;
      color?: string | null;
    };
  }>;
  targetUsers: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Notes & Knowledge Hub Types ──

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  icon: string | null;
  coverImage: string | null;
  folderId: string | null;
  authorId: string;
  isPinned: boolean;
  isArchived: boolean;
  generalAccess: NoteGeneralAccess;
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
  effectiveAccess?: NoteAccessLevel;
  author?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  folder?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  breadcrumbs?: { id: string; name: string; icon?: string | null }[];
  shares?: NoteShareItem[];
}

export interface FolderItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  parentId: string | null;
  createdById: string;
  isWorkspaceRoot: boolean;
  isArchived: boolean;
  generalAccess: "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
  createdAt: string;
  updatedAt: string;
  effectiveAccess?: NoteAccessLevel;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  subfolders?: FolderItem[];
  notes?: NoteItem[];
  _count?: {
    notes: number;
    subfolders: number;
  };
  shares?: FolderShareItem[];
}

export interface NoteShareItem {
  id: string;
  noteId?: string;
  folderId?: string;
  userId?: string | null;
  teamId?: string | null;
  role?: string | null;
  customRoleId?: string | null;
  accessLevel: NoteAccessLevel;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  team?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  customRole?: {
    id: string;
    name: string;
    label: string;
    color?: string | null;
  } | null;
}

export type FolderShareItem = NoteShareItem;

export interface NotesTreeResponse {
  folders: FolderItem[];
  archivedFolders: FolderItem[];
  notes: NoteItem[];
  archivedNotes: NoteItem[];
  starredNotes: NoteItem[];
  sharedWithMeNotes: NoteItem[];
  myRootNotes: NoteItem[];
  otherRootNotes: NoteItem[];
  searchResults?: {
    notes: NoteItem[];
    folders: FolderItem[];
  };
}

// ── Timesheet & Attendance Types ──
export type EntryType = "AUTOMATIC" | "MANUAL";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "INCOMPLETE";
export type ApprovalStatus = "APPROVED" | "PENDING" | "REJECTED";
export type TimesheetAuditAction = "CREATED" | "EDITED" | "APPROVED" | "REJECTED" | "CORRECTED";
export type TimesheetState = "CLOCKED_OUT" | "WORKING" | "OOO";

export interface WorkSessionItem {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  entryType: EntryType;
  status: SessionStatus;
  approvalStatus: ApprovalStatus;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "email" | "role">;
  oooEntries?: OooSessionItem[];
  auditLogs?: TimesheetAuditLogItem[];
}

export interface OooSessionItem {
  id: string;
  userId: string;
  workSessionId?: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  entryType: EntryType;
  status: SessionStatus;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetAuditLogItem {
  id: string;
  workSessionId?: string | null;
  oooSessionId?: string | null;
  actorId: string;
  actor?: Pick<User, "id" | "name" | "email" | "role">;
  action: TimesheetAuditAction;
  changes: Record<string, any>;
  reason: string;
  createdAt: string;
}

export interface DailyTimesheetSummary {
  firstClockIn: string | null;
  lastClockOut: string | null;
  totalSessionMinutes: number;
  totalOooMinutes: number;
  netWorkingMinutes: number;
  manualEntriesCount: number;
  status: SessionStatus;
}

export interface TimelineSegment {
  id: string;
  type: "WORK" | "OOO";
  label: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  entryType: EntryType;
  status: SessionStatus;
  reason?: string | null;
  hasAuditLogs?: boolean;
}

export interface DailyTimesheetResponse {
  date: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  };
  summary: DailyTimesheetSummary;
  timeline: TimelineSegment[];
  workSessions: WorkSessionItem[];
  oooSessions: OooSessionItem[];
}

export interface TimesheetStatusResponse {
  state: TimesheetState;
  activeWorkSession: WorkSessionItem | null;
  activeOooSession: OooSessionItem | null;
  todayWorkedMinutes: number;
  todayOooMinutes: number;
  todayTotalSessionMinutes: number;
  incompleteSessions: Array<{
    id: string;
    type: "WORK" | "OOO";
    date: string;
    startTime: string;
    reason?: string | null;
  }>;
}

// ---------- Leave & Time Off Types ----------

export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "UNPAID" | "COMPENSATORY";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveBalance {
  type: LeaveType;
  label: string;
  total: number;
  used: number;
  available: number;
  color: string;
}

export interface LeaveRequestItem {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  halfDayType?: string | null;
  reason: string;
  status: LeaveStatus;
  reviewerId?: string | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewerComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveOverviewResponse {
  balances: LeaveBalance[];
  myLeaves: LeaveRequestItem[];
  pendingApprovalsCount?: number;
}

// ---------- Company Holiday Types ----------

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  isOptional?: boolean;
  description?: string;
  daysRemaining: number;
}

// ---------- Employee Directory Types ----------

export interface EmployeeDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  shiftTiming?: string;
  attendanceState: TimesheetState;
  sessionStartedAt?: string | null;
  activeSessionDurationMinutes?: number | null;
  todayWorkedMinutes: number;
}

// ---------- Attendance Regularization Types ----------

export type RegularizationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type RegularizationType =
  | "MISSED_PUNCH_IN"
  | "MISSED_PUNCH_OUT"
  | "MISSED_BOTH"
  | "TIME_CORRECTION";

export interface AttendanceRegularizationItem {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  date: string;
  type: RegularizationType;
  requestedClockIn?: string | null;
  requestedClockOut?: string | null;
  reason: string;
  status: RegularizationStatus;
  reviewerId?: string | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewerComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Leave Policy & Quota Types ----------

export interface LeavePolicyItem {
  id: string;
  leaveType: LeaveType;
  label: string;
  totalDays: number;
  description?: string | null;
  color?: string | null;
  carryForward: boolean;
  maxCarryDays?: number | null;
  isActive: boolean;
}

export interface UserLeaveAllocationItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  notes?: string | null;
}

export interface HrPolicySettingsItem {
  id: string;
  standardDailyHours: number;
  halfDayMinimumHours: number;
  overtimeThresholdMins: number;
  weekendDays: string;
  updatedById?: string | null;
}

// Domain Constants & Display Labels
export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "QA",
  "BLOCKED",
  "DONE",
] as const;

export const TASK_STATUS_LIST: { status: TaskStatus; label: string }[] = [
  { status: "BACKLOG", label: "Backlog" },
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "IN_REVIEW", label: "In Review" },
  { status: "QA", label: "QA" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  QA: "QA",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const TASK_PRIORITY_LIST: { priority: Priority; label: string }[] = [
  { priority: "LOW", label: "Low" },
  { priority: "MEDIUM", label: "Medium" },
  { priority: "HIGH", label: "High" },
  { priority: "CRITICAL", label: "Urgent" },
];

export const TASK_PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Urgent",
};

export const TASK_TYPES = [
  "FEATURE",
  "BUG",
  "SUPPORT_REQUEST",
  "CUSTOMIZATION",
  "DEPLOYMENT",
  "MAINTENANCE",
  "NEW_DESIGN",
  "DESIGN_CHANGE",
] as const;

export const TASK_TYPE_LIST: { type: TaskType; label: string }[] = [
  { type: "FEATURE", label: "Feature" },
  { type: "BUG", label: "Bug" },
  { type: "SUPPORT_REQUEST", label: "Support" },
  { type: "CUSTOMIZATION", label: "Custom" },
  { type: "DEPLOYMENT", label: "Deploy" },
  { type: "MAINTENANCE", label: "Infra" },
  { type: "NEW_DESIGN", label: "New Design" },
  { type: "DESIGN_CHANGE", label: "Design Changes" },
];

export const TASK_TYPE_LABELS: Record<string, string> = {
  FEATURE: "Feature",
  BUG: "Bug",
  SUPPORT: "Support",
  SUPPORT_REQUEST: "Support",
  HOTFIX: "Hotfix",
  CUSTOMIZATION: "Custom",
  DEPLOYMENT: "Deploy",
  MAINTENANCE: "Infra",
  NEW_DESIGN: "New Design",
  DESIGN_CHANGE: "Design Changes",
};

export const CLIENT_STATUSES = ["INTAKE", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"] as const;

export const CLIENT_STATUS_OPTIONS = ["ALL", "INTAKE", "ONBOARDING", "ACTIVE", "PAUSED", "CHURNED"] as const;

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  INTAKE: "Intake",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CHURNED: "Churned",
};

export const PRODUCT_ENVIRONMENTS = ["PRODUCTION", "STAGING", "DEVELOPMENT"] as const;

export const PRODUCT_ENVIRONMENT_LABELS: Record<Environment, string> = {
  PRODUCTION: "Production",
  STAGING: "Staging",
  DEVELOPMENT: "Development",
};

export const USER_ROLES: Role[] = ["ADMIN", "MANAGER", "DEVELOPER", "SUPPORT"];

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  DEVELOPER: "Developer",
  SUPPORT: "Support",
};

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ─────────────────────────────────────────────
// Sales CRM Module Types
// ─────────────────────────────────────────────

export type SalesStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type SalesPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SalesActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "FOLLOWUP"
  | "TASK"
  | "NOTE"
  | "STAGE_CHANGE"
  | "SYSTEM";

export type SalesAuditAction =
  | "CREATED"
  | "UPDATED"
  | "STAGE_CHANGED"
  | "ASSIGNED"
  | "REASSIGNED"
  | "PRIORITY_CHANGED"
  | "DEAL_VALUE_CHANGED"
  | "TYPE_CONVERTED"
  | "ACTIVITY_CREATED"
  | "ACTIVITY_COMPLETED"
  | "DELETED";

export interface SalesTag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  stageKey: SalesStage;
  order: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { leads: number };
}

export interface SalesPipeline {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesLead {
  id: string;
  clientId: string;
  client?: Client;
  pipelineId: string;
  pipeline?: SalesPipeline;
  stageId: string;
  stage?: PipelineStage;
  currentStage: SalesStage;
  assignedToId: string | null;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  priority: SalesPriority;
  dealValue: number | null;
  probability: number | null;
  expectedCloseAt: string | null;
  leadSource: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  tags?: SalesTag[];
  activities?: SalesActivity[];
  auditLogs?: SalesAuditLog[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { activities: number };
}

export interface SalesActivity {
  id: string;
  leadId: string;
  type: SalesActivityType;
  title: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  assignedToId: string | null;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  createdById: string | null;
  createdBy?: Pick<User, "id" | "name" | "email"> | null;
  priority: SalesPriority;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAuditLog {
  id: string;
  leadId: string;
  action: SalesAuditAction;
  actorId: string | null;
  actor?: Pick<User, "id" | "name" | "email"> | null;
  prevValue: string | null;
  nextValue: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SalesDashboardStats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  qualified: number;
  proposalSent: number;
  negotiation: number;
  won: number;
  lost: number;
  totalPipelineValue: number;
  wonValue: number;
  upcomingFollowUps: number;
  stageBreakdown: {
    stage: SalesStage;
    label: string;
    count: number;
    value: number;
  }[];
  recentLeads?: any[];
  upcomingFollowUpsList?: any[];
  recentActivities?: any[];
}

export const SALES_STAGE_FLOW: SalesStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const SALES_STAGE_COLORS: Record<SalesStage, string> = {
  NEW_LEAD: "#38bdf8",
  CONTACTED: "#3b82f6",
  QUALIFIED: "#6366f1",
  PROPOSAL_SENT: "#f59e0b",
  NEGOTIATION: "#f97316",
  WON: "#10b981",
  LOST: "#64748b",
};

export const SALES_PRIORITY_LABELS: Record<SalesPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const SALES_ACTIVITY_LABELS: Record<SalesActivityType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  FOLLOWUP: "Follow-up",
  TASK: "Task",
  NOTE: "Note",
  STAGE_CHANGE: "Stage Change",
  SYSTEM: "System",
};



export interface AllowedDomain {
  id: string;
  domain: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
