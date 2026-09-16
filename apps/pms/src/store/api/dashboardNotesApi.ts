import { baseApi } from "./baseApi";
import type { CreateDashboardNoteInput } from "@zsyio/validators";
import type { DashboardNote } from "@zsyio/types";

export type { DashboardNote };

export const dashboardNotesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardNotes: build.query<
      DashboardNote[],
      { clientId?: string; taskId?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.clientId) queryParams.set("clientId", params.clientId);
        if (params?.taskId) queryParams.set("taskId", params.taskId);
        const str = queryParams.toString();
        return `/dashboard-notes${str ? `?${str}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "DashboardNotes" as const, id })),
              { type: "DashboardNotes", id: "LIST" },
            ]
          : [{ type: "DashboardNotes", id: "LIST" }],
    }),
    getDashboardNoteById: build.query<DashboardNote, string>({
      query: (id) => `/dashboard-notes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "DashboardNotes", id }],
    }),
    createDashboardNote: build.mutation<DashboardNote, CreateDashboardNoteInput>({
      query: (body) => ({
        url: "/dashboard-notes",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardNotes", id: "LIST" }],
    }),
    deleteDashboardNote: build.mutation<void, string>({
      query: (id) => ({
        url: `/dashboard-notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DashboardNotes", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDashboardNotesQuery,
  useGetDashboardNoteByIdQuery,
  useCreateDashboardNoteMutation,
  useDeleteDashboardNoteMutation,
} = dashboardNotesApi;

