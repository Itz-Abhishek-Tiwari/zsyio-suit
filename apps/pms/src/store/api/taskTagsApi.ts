import { baseApi } from "./baseApi";
import type { TaskTag } from "@zsyio/types";
import type { CreateTaskTagInput } from "@zsyio/validators";

export const taskTagsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTaskTags: build.query<TaskTag[], void>({
      query: () => "/task-tags",
      keepUnusedDataFor: 3600,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TaskTags" as const, id })),
              { type: "TaskTags", id: "LIST" },
            ]
          : [{ type: "TaskTags", id: "LIST" }],
    }),

    createTaskTag: build.mutation<TaskTag, CreateTaskTagInput>({
      query: (body) => ({
        url: "/task-tags",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TaskTags", id: "LIST" }],
    }),

    deleteTaskTag: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/task-tags/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TaskTags", id: "LIST" }, { type: "Task", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTaskTagsQuery,
  useCreateTaskTagMutation,
  useDeleteTaskTagMutation,
} = taskTagsApi;
