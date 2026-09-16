import { baseApi } from "./baseApi";
import type { CustomKanbanColumn } from "@zsyio/types";

export const taskColumnsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTaskColumns: build.query<CustomKanbanColumn[], void>({
      query: () => "/task-columns",
      keepUnusedDataFor: 3600,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TaskColumns" as const, id })),
              { type: "TaskColumns", id: "LIST" },
            ]
          : [{ type: "TaskColumns", id: "LIST" }],
    }),

    createTaskColumn: build.mutation<
      CustomKanbanColumn,
      { statusKey: string; label: string; icon?: string; color?: string; order?: number }
    >({
      query: (body) => ({
        url: "/task-columns",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TaskColumns", id: "LIST" }],
    }),

    reorderTaskColumns: build.mutation<
      CustomKanbanColumn[],
      { columnOrders: string[] }
    >({
      query: (body) => ({
        url: "/task-columns",
        method: "PUT",
        body,
      }),
      async onQueryStarted({ columnOrders }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskColumnsApi.util.updateQueryData("getTaskColumns", undefined, (draft) => {
            const orderMap = new Map(columnOrders.map((k, idx) => [k, idx]));
            draft.sort((a, b) => {
              const orderA = orderMap.has(a.statusKey) ? orderMap.get(a.statusKey)! : a.order;
              const orderB = orderMap.has(b.statusKey) ? orderMap.get(b.statusKey)! : b.order;
              return orderA - orderB;
            });
            draft.forEach((col, idx) => {
              if (orderMap.has(col.statusKey)) {
                col.order = orderMap.get(col.statusKey)!;
              } else {
                col.order = idx;
              }
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: "TaskColumns", id: "LIST" }],
    }),

    resetTaskColumnsOrder: build.mutation<CustomKanbanColumn[], void>({
      query: () => ({
        url: "/task-columns/reset",
        method: "POST",
      }),
      invalidatesTags: [{ type: "TaskColumns", id: "LIST" }],
    }),

    deleteTaskColumn: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/task-columns/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TaskColumns", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTaskColumnsQuery,
  useCreateTaskColumnMutation,
  useReorderTaskColumnsMutation,
  useResetTaskColumnsOrderMutation,
  useDeleteTaskColumnMutation,
} = taskColumnsApi;

