import { baseApi } from "./baseApi";
import type { Task, TaskTimeEntry } from "@zsyio/types";

export type ActiveTimerData = {
  active: (TaskTimeEntry & { task: Task }) | null;
};

export const timeEntriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActiveTimer: build.query<ActiveTimerData, void>({
      query: () => "/tasks/timer/active",
      providesTags: ["ActiveTimer"],
    }),

    getTimeEntries: build.query<TaskTimeEntry[], string>({
      query: (taskId) => `/tasks/${taskId}/time-entries`,
      providesTags: (_r, _e, taskId) => [
        { type: "TimeEntries", id: taskId },
        { type: "TimeEntries", id: "LIST" },
      ],
    }),

    createTimeEntry: build.mutation<
      TaskTimeEntry,
      {
        taskId: string;
        startedAt?: string;
        endedAt?: string | null;
        durationMin?: number | null;
        description?: string | null;
        isBillable?: boolean;
      }
    >({
      query: ({ taskId, ...body }) => ({
        url: `/tasks/${taskId}/time-entries`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "TimeEntries", id: taskId },
        { type: "TimeEntries", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        "ActiveTimer",
        { type: "Report" },
      ],
    }),

    stopTimeEntry: build.mutation<
      TaskTimeEntry,
      {
        entryId: string;
        taskId: string;
        endedAt?: string;
        description?: string | null;
      }
    >({
      query: ({ entryId, endedAt, description }) => ({
        url: `/tasks/time-entries/${entryId}`,
        method: "PATCH",
        body: { action: "stop", endedAt, description },
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "TimeEntries", id: taskId },
        { type: "TimeEntries", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        "ActiveTimer",
        { type: "Report" },
      ],
    }),

    updateTimeEntry: build.mutation<
      TaskTimeEntry,
      {
        entryId: string;
        taskId: string;
        body: Partial<TaskTimeEntry>;
      }
    >({
      query: ({ entryId, body }) => ({
        url: `/tasks/time-entries/${entryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "TimeEntries", id: taskId },
        { type: "TimeEntries", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        { type: "Report" },
      ],
    }),

    deleteTimeEntry: build.mutation<
      { success: boolean },
      {
        entryId: string;
        taskId: string;
      }
    >({
      query: ({ entryId }) => ({
        url: `/tasks/time-entries/${entryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "TimeEntries", id: taskId },
        { type: "TimeEntries", id: "LIST" },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        { type: "Report" },
      ],
    }),
  }),
});

export const {
  useGetActiveTimerQuery,
  useGetTimeEntriesQuery,
  useCreateTimeEntryMutation,
  useStopTimeEntryMutation,
  useUpdateTimeEntryMutation,
  useDeleteTimeEntryMutation,
} = timeEntriesApi;
