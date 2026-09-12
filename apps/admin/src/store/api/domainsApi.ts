import { baseApi } from "./baseApi";
import type { AllowedDomain } from "@zsyio/types";
import type { CreateDomainInput, UpdateDomainInput } from "@zsyio/validators";

export const domainsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDomains: build.query<AllowedDomain[], void>({
      query: () => "/domains",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Domains" as const, id })),
              { type: "Domains", id: "LIST" },
            ]
          : [{ type: "Domains", id: "LIST" }],
    }),

    createDomain: build.mutation<AllowedDomain, CreateDomainInput>({
      query: (body) => ({
        url: "/domains",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Domains", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),

    updateDomain: build.mutation<AllowedDomain, { id: string } & UpdateDomainInput>({
      query: ({ id, ...body }) => ({
        url: `/domains/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Domains", id },
        { type: "Domains", id: "LIST" },
      ],
    }),

    setPrimaryDomain: build.mutation<AllowedDomain, string>({
      query: (id) => ({
        url: `/domains/${id}/primary`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Domains", id: "LIST" }],
    }),

    deleteDomain: build.mutation<void, string>({
      query: (id) => ({
        url: `/domains/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Domains", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),
  }),
});

export const {
  useGetDomainsQuery,
  useCreateDomainMutation,
  useUpdateDomainMutation,
  useSetPrimaryDomainMutation,
  useDeleteDomainMutation,
} = domainsApi;
