import { baseApi } from "./baseApi";
import type { SalesLead, SalesDashboardStats, Paginated } from "@zsyio/types";

export const salesLeadsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalesLeads: build.query<
      Paginated<SalesLead>,
      Record<string, string | number | boolean | undefined>
    >({
      query: (params) => ({ url: "/sales/leads", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((l) => ({ type: "SalesLead" as const, id: l.id })),
              { type: "SalesLead", id: "LIST" },
            ]
          : [{ type: "SalesLead", id: "LIST" }],
    }),
    getSalesLead: build.query<SalesLead, string>({
      query: (id) => `/sales/leads/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SalesLead", id }],
    }),
    createSalesLead: build.mutation<SalesLead, Record<string, unknown>>({
      query: (body) => ({ url: "/sales/leads", method: "POST", body }),
      invalidatesTags: [
        { type: "SalesLead", id: "LIST" },
        { type: "SalesDashboard" },
      ],
    }),
    updateSalesLead: build.mutation<SalesLead, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/sales/leads/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SalesLead", id },
        { type: "SalesLead", id: "LIST" },
        { type: "SalesDashboard" },
      ],
    }),
    deleteSalesLead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/sales/leads/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "SalesLead", id },
        { type: "SalesLead", id: "LIST" },
        { type: "SalesDashboard" },
      ],
    }),
    moveSalesLead: build.mutation<SalesLead, { id: string; stageKey: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/sales/leads/${id}/move`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SalesLead", id },
        { type: "SalesLead", id: "LIST" },
        { type: "SalesDashboard" },
      ],
    }),
    convertSalesLead: build.mutation<SalesLead, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/sales/leads/${id}/convert`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SalesLead", id },
        { type: "SalesLead", id: "LIST" },
        { type: "SalesDashboard" },
      ],
    }),
    getSalesDashboard: build.query<SalesDashboardStats, void>({
      query: () => "/sales/dashboard",
      providesTags: [{ type: "SalesDashboard" }],
    }),
  }),
});

export const {
  useGetSalesLeadsQuery,
  useGetSalesLeadQuery,
  useCreateSalesLeadMutation,
  useUpdateSalesLeadMutation,
  useDeleteSalesLeadMutation,
  useMoveSalesLeadMutation,
  useConvertSalesLeadMutation,
  useGetSalesDashboardQuery,
} = salesLeadsApi;
