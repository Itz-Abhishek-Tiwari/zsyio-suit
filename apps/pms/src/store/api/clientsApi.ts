import { baseApi, BACKGROUND_REQUEST_HEADER } from "./baseApi";
import type { Client, Paginated } from "@zsyio/types";

export const clientsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getClientsLite: build.query<Pick<Client, "id" | "name" | "status">[], void>({
      query: () => "/clients/lite",
      keepUnusedDataFor: 3600,
      providesTags: [{ type: "Client", id: "LITE_LIST" }],
    }),
    getClients: build.query<Paginated<Client>, Record<string, string | number | boolean | undefined>>({
      // Callers (e.g. the Header's debounced global search) can pass
      // `background: true` to mark this a background fetch - its 401s won't
      // hard-redirect to /login (see baseApi.ts). The flag itself is never
      // forwarded to the backend as a query param.
      query: ({ background, ...params }) => ({
        url: "/clients",
        params,
        ...(background ? { headers: { [BACKGROUND_REQUEST_HEADER]: "1" } } : {}),
      }),
      providesTags: (result) =>
        result
          ? [...result.items.map((c) => ({ type: "Client" as const, id: c.id })), { type: "Client", id: "LIST" }]
          : [{ type: "Client", id: "LIST" }],
    }),
    getClient: build.query<Client, string>({
      query: (id) => `/clients/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Client", id }],
    }),
    createClient: build.mutation<Client, Partial<Client>>({
      query: (body) => ({ url: "/clients", method: "POST", body }),
      invalidatesTags: [
        { type: "Client", id: "LIST" },
        { type: "Client", id: "LITE_LIST" },
        { type: "Report" },
      ],
    }),
    updateClient: build.mutation<Client, { id: string; body: Partial<Client> }>({
      query: ({ id, body }) => ({ url: `/clients/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "Client", id: "LITE_LIST" },
        { type: "Report" },
      ],
    }),
    deleteClient: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/clients/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Client", id },
        { type: "Client", id: "LIST" },
        { type: "Client", id: "LITE_LIST" },
        { type: "Report" },
      ],
    }),
  }),
});

export const {
  useGetClientsLiteQuery,
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;
