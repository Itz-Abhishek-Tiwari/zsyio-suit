import { baseApi } from "./baseApi";
import type { CustomTaskType } from "@zsyio/types";
import type { CreateTaskTypeInput } from "@zsyio/validators";

export const taskTypesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomTaskTypes: build.query<CustomTaskType[], void>({
      query: () => "/task-types",
      keepUnusedDataFor: 3600,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TaskTypes" as const, id })),
              { type: "TaskTypes", id: "LIST" },
            ]
          : [{ type: "TaskTypes", id: "LIST" }],
    }),

    createCustomTaskType: build.mutation<CustomTaskType, CreateTaskTypeInput>({
      query: (body) => ({
        url: "/task-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TaskTypes", id: "LIST" }],
    }),
  }),
});

export const { useGetCustomTaskTypesQuery, useCreateCustomTaskTypeMutation } = taskTypesApi;
