import { baseApi } from "./baseApi";
import type { SalesActivity } from "@zsyio/types";

export const salesActivitiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalesActivities: build.query<
      SalesActivity[],
      { leadId?: string; status?: string; assignedToId?: string }
    >({
      query: (params) => ({ url: "/sales/activities", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "SalesActivity" as const, id: a.id })),
              { type: "SalesActivity", id: "LIST" },
            ]
          : [{ type: "SalesActivity", id: "LIST" }],
    }),
    createSalesActivity: build.mutation<SalesActivity, Record<string, unknown>>({
      query: (body) => ({ url: "/sales/activities", method: "POST", body }),
      invalidatesTags: (_r, _e, body) => [
        { type: "SalesActivity", id: "LIST" },
        { type: "SalesLead", id: body.leadId as string },
      ],
    }),
    updateSalesActivity: build.mutation<SalesActivity, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/sales/activities/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SalesActivity", id },
        { type: "SalesActivity", id: "LIST" },
      ],
    }),
    deleteSalesActivity: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/sales/activities/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SalesActivity", id },
        { type: "SalesActivity", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSalesActivitiesQuery,
  useCreateSalesActivityMutation,
  useUpdateSalesActivityMutation,
  useDeleteSalesActivityMutation,
} = salesActivitiesApi;
