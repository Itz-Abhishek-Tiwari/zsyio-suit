import { baseApi, BACKGROUND_REQUEST_HEADER } from "./baseApi";
import type { ActivityLogEntry, Comment, Paginated, Task, Attachment, TestCase } from "@zsyio/types";

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<Paginated<Task>, Record<string, string | number | boolean | undefined>>({
      // Callers (e.g. the Header's debounced global search) can pass
      // `background: true` to mark this a background fetch - its 401s won't
      // hard-redirect to /login (see baseApi.ts). The flag itself is never
      // forwarded to the backend as a query param.
      query: ({ background, ...filters }) => ({
        url: "/tasks",
        params: filters,
        ...(background ? { headers: { [BACKGROUND_REQUEST_HEADER]: "1" } } : {}),
      }),
      providesTags: (result) =>
        result
          ? [...result.items.map((t) => ({ type: "Task" as const, id: t.id })), { type: "Task", id: "LIST" }]
          : [{ type: "Task", id: "LIST" }],
    }),
    getTask: build.query<Task & { comments: Comment[]; attachments?: Attachment[] }, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Task", id }],
    }),
    // Activity logs are fetched separately so they don't block the task detail
    // panel from rendering. The tab fires this query only when first opened.
    getTaskActivity: build.query<ActivityLogEntry[], string>({
      query: (id) => `/tasks/${id}/activity`,
      providesTags: (_r, _e, id) => [{ type: "Task", id: `${id}-activity` }],
    }),
    createTask: build.mutation<Task, Partial<Task> & { assigneeIds?: string[]; tags?: string[] }>({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: [
        { type: "Task", id: "LIST" },
        { type: "TaskTags", id: "LIST" },
        { type: "Report" },
      ],
    }),
    updateTask: build.mutation<Task, { id: string; body: Partial<Task> & { teamIds?: string[]; assigneeIds?: string[]; tags?: string[] } }>({
      query: ({ id, body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
      // The PATCH response already carries the full joined task (assignees,
      // team rosters, etc.) - write it straight into the getTask cache so the
      // open detail view doesn't have to pay for a second round trip just to
      // re-fetch the same data it already has.
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Merge onto the cached getTask entry rather than replacing it -
          // this response has no comments/activityLogs, so a full overwrite
          // would wipe those out of the already-loaded detail view.
          dispatch(tasksApi.util.updateQueryData("getTask", id, (draft) => Object.assign(draft, data)));
        } catch {
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "TaskTags", id: "LIST" },
        { type: "Task", id: `${id}-activity` },
        { type: "Report" },
      ],
    }),
    updateTaskStatus: build.mutation<Task, { id: string; status: Task["status"]; filters: Record<string, string | number | boolean | undefined> }>({
      query: ({ id, status }) => ({ url: `/tasks/${id}`, method: "PATCH", body: { status } }),
      // Optimistic update against the currently-active filter set: the Kanban
      // card moves instantly on drag, then rolls back automatically if the
      // PATCH 403s/fails.
      async onQueryStarted({ id, status, filters }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          tasksApi.util.updateQueryData("getTasks", filters, (draft) => {
            const task = draft.items.find((t) => t.id === id);
            if (task) task.status = status;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Task", id: `${id}-activity` },
        { type: "Report" },
      ],
    }),
    reassignTask: build.mutation<
      Task,
      { id: string; assignedToId?: string | null; assignedTeamId?: string | null; assigneeIds?: string[]; teamIds?: string[] }
    >({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}/assign`, method: "PATCH", body }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tasksApi.util.updateQueryData("getTask", id, (draft) => Object.assign(draft, data)));
        } catch {
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Task", id: `${id}-activity` },
        { type: "Report" },
      ],
    }),
    addComment: build.mutation<Comment, { id: string; body: string; parentId?: string | null }>({
      query: ({ id, body, parentId }) => ({
        url: `/tasks/${id}/comments`,
        method: "POST",
        body: { body, parentId },
      }),
      async onQueryStarted({ id, body, parentId }, { dispatch, queryFulfilled }) {
        const tempId = `temp-${Date.now()}`;
        const tempComment: Comment = {
          id: tempId,
          taskId: id,
          authorId: "temp-author",
          body,
          parentId: parentId || null,
          createdAt: new Date().toISOString(),
          editedAt: null,
        };

        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTask", id, (draft) => {
            draft.comments = [...(draft.comments ?? []), tempComment];
          })
        );

        try {
          const { data: realComment } = await queryFulfilled;
          dispatch(
            tasksApi.util.updateQueryData("getTask", id, (draft) => {
              if (draft.comments) {
                draft.comments = draft.comments.map((c) => (c.id === tempId ? realComment : c));
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: "Task", id: `${id}-activity` }],
    }),
    deleteTask: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Report" },
      ],
    }),
    addAttachment: build.mutation<
      { uploadUrl: string; attachment: Attachment },
      { id: string; fileName: string; fileSize: number; fileUrl?: string }
    >({
      query: ({ id, fileName, fileSize, fileUrl }) => ({
        url: `/tasks/${id}/attachments`,
        method: "POST",
        body: { fileName, fileSize, fileUrl },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Task", id },
        { type: "Task", id: `${id}-activity` },
      ],
    }),
    deleteAttachment: build.mutation<
      { success: boolean },
      { taskId: string; attachmentId: string }
    >({
      query: ({ taskId, attachmentId }) => ({
        url: `/tasks/${taskId}/attachments`,
        method: "DELETE",
        body: { attachmentId },
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "Task", id: taskId },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
    generateAiBranch: build.mutation<
      {
        slug: string;
        shortId: string;
        prefix: string;
        branchName: string;
        checkoutCmd: string;
        switchCmd: string;
        pushCmd: string;
        commitMsg: string;
        cached: boolean;
        source: "gemini" | "openai" | "fallback" | "cache";
        usage?: { inputTokens: number; outputTokens: number };
      },
      { id: string; force?: boolean }
    >({
      query: ({ id, force }) => ({
        url: `/tasks/${id}/ai-branch`,
        method: "POST",
        body: { force },
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            tasksApi.util.updateQueryData("getTask", id, (draft) => {
              draft.gitBranchSlug = data.slug;
            })
          );
        } catch {
        }
      },
    }),
    getTestCases: build.query<TestCase[], string>({
      query: (taskId) => `/tasks/${taskId}/test-cases`,
      providesTags: (_r, _e, taskId) => [{ type: "Task", id: `${taskId}-test-cases` }],
    }),
    createTestCase: build.mutation<
      TestCase,
      { taskId: string; body: Partial<TestCase> }
    >({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}/test-cases`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "Task", id: `${taskId}-test-cases` },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
    updateTestCase: build.mutation<
      TestCase,
      { taskId: string; testCaseId: string; body: Partial<TestCase> }
    >({
      query: ({ taskId, testCaseId, body }) => ({
        url: `/tasks/${taskId}/test-cases/${testCaseId}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ taskId, testCaseId, body }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTestCases", taskId, (draft) => {
            const tc = draft.find((item) => item.id === testCaseId);
            if (tc) {
              Object.assign(tc, body);
            }
          })
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            tasksApi.util.updateQueryData("getTestCases", taskId, (draft) => {
              const index = draft.findIndex((item) => item.id === testCaseId);
              if (index !== -1) {
                draft[index] = updated;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "Task", id: `${taskId}-test-cases` },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
    deleteTestCase: build.mutation<
      { success: boolean },
      { taskId: string; testCaseId: string }
    >({
      query: ({ taskId, testCaseId }) => ({
        url: `/tasks/${taskId}/test-cases/${testCaseId}`,
        method: "DELETE",
      }),
      async onQueryStarted({ taskId, testCaseId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTestCases", taskId, (draft) => {
            return draft.filter((item) => item.id !== testCaseId);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: "Task", id: `${taskId}-test-cases` },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
    resetTestCases: build.mutation<TestCase[], string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/test-cases/reset`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, taskId) => [
        { type: "Task", id: `${taskId}-test-cases` },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
    generateAiTestCases: build.mutation<TestCase[], string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/test-cases/generate-ai`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, taskId) => [
        { type: "Task", id: `${taskId}-test-cases` },
        { type: "Task", id: `${taskId}-activity` },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useGetTaskActivityQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useReassignTaskMutation,
  useAddCommentMutation,
  useDeleteTaskMutation,
  useAddAttachmentMutation,
  useDeleteAttachmentMutation,
  useGenerateAiBranchMutation,
  useGetTestCasesQuery,
  useCreateTestCaseMutation,
  useUpdateTestCaseMutation,
  useDeleteTestCaseMutation,
  useResetTestCasesMutation,
  useGenerateAiTestCasesMutation,
} = tasksApi;

