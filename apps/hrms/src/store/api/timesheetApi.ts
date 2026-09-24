import { baseApi } from "./baseApi";
import type {
  ClockInInput,
  ClockOutInput,
  StartOooInput,
  EndOooInput,
  ManualOooSessionInput,
  FixTimesheetInput,
  AdminCorrectionInput,
  ApplyLeaveInput,
  ApplyRegularizationInput,
  CreateHolidayInput,
  UpdateHolidayInput,
  AdjustUserLeaveAllocationInput,
  UpdateHrSettingsInput,
} from "@zsyio/validators";
import type {
  LeaveOverviewResponse,
  LeaveRequestItem,
  CompanyHoliday,
  EmployeeDirectoryItem,
  AttendanceRegularizationItem,
  LeavePolicyItem,
  UserLeaveAllocationItem,
  HrPolicySettingsItem,
} from "@zsyio/types";

export type SessionState = "WORKING" | "OOO" | "CLOCKED_OUT";

export interface TimesheetStatusResponse {
  state: SessionState;
  activeWorkSession: {
    id: string;
    startTime: string;
    entryType: "AUTOMATIC" | "MANUAL";
    reason?: string | null;
  } | null;
  activeOooSession: {
    id: string;
    startTime: string;
    reason?: string | null;
  } | null;
  todayWorkedMinutes: number;
  todayOooMinutes: number;
  todayTotalSessionMinutes: number;
  incompleteSessions: {
    id: string;
    type: "WORK" | "OOO";
    date: string;
    startTime: string;
    reason?: string | null;
  }[];
}

export interface ActivityTimelineItem {
  id: string;
  type: "WORK" | "OOO";
  label: "Working" | "Break" | "OOO";
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  entryType: "AUTOMATIC" | "MANUAL";
  status: "ACTIVE" | "COMPLETED" | "INCOMPLETE";
  reason?: string | null;
  hasAuditLogs?: boolean;
}

export interface DailyTimesheetResponse {
  date: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  summary: {
    firstClockIn: string | null;
    lastClockOut: string | null;
    totalSessionMinutes: number;
    totalOooMinutes: number;
    netWorkingMinutes: number;
    manualEntriesCount: number;
    status: "ACTIVE" | "COMPLETED" | "INCOMPLETE" | "NOT_STARTED";
  };
  timeline: ActivityTimelineItem[];
  workSessions: any[];
  oooSessions: any[];
}

export interface AdminTimesheetListItem {
  id: string;
  date: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  firstClockIn: string | null;
  lastClockOut: string | null;
  totalSessionMinutes: number;
  totalOooMinutes: number;
  netWorkingMinutes: number;
  manualEntriesCount: number;
  status: "ACTIVE" | "COMPLETED" | "INCOMPLETE";
  hasManual: boolean;
  isIncomplete: boolean;
  timeline: ActivityTimelineItem[];
}

export interface AdminTimesheetListResponse {
  items: AdminTimesheetListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    activeWorkingNow: number;
    currentlyOoo: number;
    clockedOutToday: number;
    incompleteRecordsCount: number;
  };
}

export interface TimesheetAuditLogItem {
  id: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  createdAt: string;
}

export const timesheetApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTimesheetStatus: build.query<TimesheetStatusResponse, void>({
      query: () => "/timesheet/status",
      providesTags: ["TimesheetStatus"],
    }),

    getHrmsDashboard: build.query<HrmsDashboardResponse, void>({
      query: () => "/timesheet/dashboard",
      providesTags: ["TimesheetStatus", "Timesheet", "Leaves", "Holidays"],
    }),

    getDailyTimesheet: build.query<DailyTimesheetResponse, { date?: string; userId?: string } | void>({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.date) query.set("date", params.date);
        if (params?.userId) query.set("userId", params.userId);
        const q = query.toString();
        return `/timesheet/daily${q ? `?${q}` : ""}`;
      },
      providesTags: (_r, _e, p) => [{ type: "Timesheet", id: `${p?.userId || "ME"}-${p?.date || "TODAY"}` }],
    }),

    clockIn: build.mutation<{ success: boolean; session: any }, ClockInInput | void>({
      query: (body) => ({
        url: "/timesheet/clock-in",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),

    clockOut: build.mutation<{ success: boolean; session: any }, ClockOutInput | void>({
      query: (body) => ({
        url: "/timesheet/clock-out",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),

    startOoo: build.mutation<{ success: boolean; session: any }, StartOooInput>({
      query: (body) => ({
        url: "/timesheet/ooo/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),

    endOoo: build.mutation<{ success: boolean; session: any }, EndOooInput | void>({
      query: (body) => ({
        url: "/timesheet/ooo/end",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),


    addManualOoo: build.mutation<{ success: boolean; session: any }, ManualOooSessionInput>({
      query: (body) => ({
        url: "/timesheet/manual-ooo",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),

    updateManualOoo: build.mutation<
      { success: boolean; session: any },
      { id: string; body: ManualOooSessionInput }
    >({
      query: ({ id, body }) => ({
        url: `/timesheet/manual-ooo/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin", "TimesheetAudit"],
    }),

    deleteManualOoo: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/timesheet/manual-ooo/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin", "TimesheetAudit"],
    }),

    fixTimesheet: build.mutation<{ success: boolean }, FixTimesheetInput>({
      query: (body) => ({
        url: "/timesheet/fix",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin"],
    }),

    getAdminTimesheets: build.query<
      AdminTimesheetListResponse,
      {
        userId?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        entryType?: string;
        incompleteOnly?: boolean;
        search?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== "") {
              query.set(key, String(val));
            }
          });
        }
        const q = query.toString();
        return `/timesheet/admin/list${q ? `?${q}` : ""}`;
      },
      providesTags: ["TimesheetAdmin"],
    }),

    adminCorrectSession: build.mutation<{ success: boolean }, AdminCorrectionInput>({
      query: (body) => ({
        url: "/timesheet/admin/correct",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TimesheetStatus", "Timesheet", "TimesheetAdmin", "TimesheetAudit"],
    }),

    getSessionAuditLogs: build.query<TimesheetAuditLogItem[], string>({
      query: (sessionId) => `/timesheet/admin/audit/${sessionId}`,
      providesTags: (_r, _e, id) => [{ type: "TimesheetAudit", id }],
    }),

    getMonthlyTimesheet: build.query<MonthlyTimesheetResponse, { month?: string; userId?: string } | void>({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.month) query.set("month", params.month);
        if (params?.userId) query.set("userId", params.userId);
        const q = query.toString();
        return `/timesheet/monthly${q ? `?${q}` : ""}`;
      },
      providesTags: ["Timesheet"],
    }),

    // Leaves
    getLeaveOverview: build.query<LeaveOverviewResponse, void>({
      query: () => "/timesheet/leaves",
      providesTags: ["Leaves"],
    }),

    getTeamLeaves: build.query<LeaveRequestItem[], { status?: string } | void>({
      query: (params) => {
        const query = new URLSearchParams({ team: "true" });
        if (params?.status) query.set("status", params.status);
        return `/timesheet/leaves?${query.toString()}`;
      },
      providesTags: ["Leaves"],
    }),

    applyLeave: build.mutation<LeaveRequestItem, ApplyLeaveInput>({
      query: (body) => ({
        url: "/timesheet/leaves",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leaves", "Directory", "TimesheetStatus"],
    }),

    reviewLeave: build.mutation<
      LeaveRequestItem,
      { id: string; status: "APPROVED" | "REJECTED"; reviewerComment?: string }
    >({
      query: ({ id, status, reviewerComment }) => ({
        url: `/timesheet/leaves/${id}/${status === "APPROVED" ? "approve" : "reject"}`,
        method: "POST",
        body: { reviewerComment },
      }),
      invalidatesTags: ["Leaves", "Directory", "TimesheetStatus", "TimesheetAdmin", "Timesheet", "LeaveBalances"],
    }),

    cancelLeave: build.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/timesheet/leaves/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Leaves", "Directory", "TimesheetStatus", "Timesheet", "LeaveBalances"],
    }),

    // Attendance Regularization
    getMyRegularizations: build.query<AttendanceRegularizationItem[], void>({
      query: () => "/timesheet/regularizations",
      providesTags: ["Regularizations"],
    }),

    getTeamRegularizations: build.query<
      AttendanceRegularizationItem[],
      { status?: string } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.status) query.set("status", params.status);
        const q = query.toString();
        return `/timesheet/regularizations/team${q ? `?${q}` : ""}`;
      },
      providesTags: ["Regularizations"],
    }),

    applyRegularization: build.mutation<AttendanceRegularizationItem, ApplyRegularizationInput>({
      query: (body) => ({
        url: "/timesheet/regularizations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Regularizations"],
    }),

    reviewRegularization: build.mutation<
      AttendanceRegularizationItem,
      { id: string; status: "APPROVED" | "REJECTED"; reviewerComment?: string }
    >({
      query: ({ id, status, reviewerComment }) => ({
        url: `/timesheet/regularizations/${id}/${status === "APPROVED" ? "approve" : "reject"}`,
        method: "POST",
        body: { reviewerComment },
      }),
      invalidatesTags: [
        "Regularizations",
        "Timesheet",
        "TimesheetStatus",
        "TimesheetAdmin",
      ],
    }),


    // Holidays
    getHolidays: build.query<
      { holidays: CompanyHoliday[]; upcoming: CompanyHoliday | null },
      { year?: number } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.year) query.set("year", params.year.toString());
        const q = query.toString();
        return `/timesheet/holidays${q ? `?${q}` : ""}`;
      },
      providesTags: ["Holidays"],
    }),

    createHoliday: build.mutation<CompanyHoliday, CreateHolidayInput>({
      query: (body) => ({
        url: "/timesheet/holidays",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Holidays", "Timesheet"],
    }),

    updateHoliday: build.mutation<CompanyHoliday, { id: string; input: UpdateHolidayInput }>({
      query: ({ id, input }) => ({
        url: `/timesheet/holidays/${id}`,
        method: "PUT",
        body: input,
      }),
      invalidatesTags: ["Holidays", "Timesheet"],
    }),

    deleteHoliday: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/timesheet/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Holidays", "Timesheet"],
    }),

    // Admin Policies & Settings
    getAdminPolicies: build.query<{ policies: LeavePolicyItem[]; settings: HrPolicySettingsItem }, void>({
      query: () => "/timesheet/admin/policies",
      providesTags: ["Policies"],
    }),

    updateAdminPolicies: build.mutation<
      { policies: LeavePolicyItem[]; settings: HrPolicySettingsItem },
      { policies?: LeavePolicyItem[]; settings?: UpdateHrSettingsInput }
    >({
      query: (body) => ({
        url: "/timesheet/admin/policies",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Policies", "Leaves", "Timesheet"],
    }),

    // All Users Leave Balances & Allocations
    getAllUserLeaveBalances: build.query<
      {
        user: { id: string; name: string; email: string; role: string };
        balances: {
          type: string;
          label: string;
          total: number;
          used: number;
          available: number;
          isCustom: boolean;
          notes?: string | null;
        }[];
      }[],
      { year?: number } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.year) query.set("year", params.year.toString());
        const q = query.toString();
        return `/timesheet/admin/leaves/balances${q ? `?${q}` : ""}`;
      },
      providesTags: ["LeaveBalances"],
    }),

    adjustUserLeaveAllocation: build.mutation<UserLeaveAllocationItem, AdjustUserLeaveAllocationInput>({
      query: (body) => ({
        url: "/timesheet/admin/leaves/allocations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveBalances", "Leaves"],
    }),

    // Directory
    getDirectory: build.query<EmployeeDirectoryItem[], void>({
      query: () => "/timesheet/directory",
      providesTags: ["Directory", "TimesheetStatus"],
    }),
  }),
});

export interface MonthlyDayItem {
  date: string;
  dayNumber: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isToday: boolean;
  totalWorkMinutes: number;
  totalOooMinutes: number;
  netWorkingMinutes: number;
  overtimeMinutes?: number;
  status:
    | "PRESENT"
    | "HALF_DAY"
    | "SHORT_HOURS"
    | "ACTIVE"
    | "INCOMPLETE"
    | "ABSENT"
    | "WEEKEND"
    | "UPCOMING"
    | "HOLIDAY"
    | "ON_LEAVE";
  sessionCount: number;
  firstClockIn: string | null;
  lastClockOut: string | null;
  holidayName?: string | null;
  isOptionalHoliday?: boolean;
  leaveType?: string | null;
  leaveReason?: string | null;
}

export interface MonthlyTimesheetResponse {
  month: string;
  summary: {
    totalDays: number;
    pastWorkingDays: number;
    presentDays: number;
    halfDays: number;
    absentDays: number;
    holidayDays: number;
    leaveDays: number;
    totalWorkingMinutes: number;
    totalOvertimeMinutes: number;
    averageDailyHours: number;
    targetWorkingHours: number;
    attendancePercentage: number;
  };
  days: MonthlyDayItem[];
}

export interface HrmsDashboardResponse {
  status: TimesheetStatusResponse;
  monthlyAttendance: MonthlyTimesheetResponse;
  leaves: LeaveOverviewResponse;
  upcomingHoliday: CompanyHoliday | null;
  todayTimesheet: DailyTimesheetResponse;
}

export const {
  useGetTimesheetStatusQuery,
  useGetHrmsDashboardQuery,
  useGetDailyTimesheetQuery,
  useGetMonthlyTimesheetQuery,
  useClockInMutation,
  useClockOutMutation,
  useStartOooMutation,
  useEndOooMutation,
  useAddManualOooMutation,
  useUpdateManualOooMutation,
  useDeleteManualOooMutation,
  useFixTimesheetMutation,
  useGetAdminTimesheetsQuery,
  useAdminCorrectSessionMutation,
  useGetSessionAuditLogsQuery,
  useGetLeaveOverviewQuery,
  useGetTeamLeavesQuery,
  useApplyLeaveMutation,
  useReviewLeaveMutation,
  useCancelLeaveMutation,
  useGetMyRegularizationsQuery,
  useGetTeamRegularizationsQuery,
  useApplyRegularizationMutation,
  useReviewRegularizationMutation,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useGetAdminPoliciesQuery,
  useUpdateAdminPoliciesMutation,
  useGetAllUserLeaveBalancesQuery,
  useAdjustUserLeaveAllocationMutation,
  useGetDirectoryQuery,
} = timesheetApi;
