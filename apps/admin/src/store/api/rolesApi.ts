import { baseApi } from "./baseApi";
import type { CustomRole } from "@zsyio/types";
import type { CreateRoleInput, UpdateRoleInput } from "@zsyio/validators";

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query<CustomRole[], void>({
      query: () => "/roles",
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Roles" as const, id })),
              { type: "Roles", id: "LIST" },
            ]
          : [{ type: "Roles", id: "LIST" }],
    }),

    getRoleById: build.query<CustomRole, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Roles", id }],
    }),

    createRole: build.mutation<CustomRole, CreateRoleInput>({
      query: (body) => ({
        url: "/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),

    updateRole: build.mutation<CustomRole, { id: string; body: UpdateRoleInput }>({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Roles", id },
        { type: "Roles", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),

    deleteRole: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Roles", id: "LIST" },
        { type: "User", id: "LIST" },
        { type: "AdminStats", id: "SUMMARY" },
      ],
    }),

    resetDefaultRoles: build.mutation<CustomRole[], void>({
      query: () => ({
        url: "/roles/reset-defaults",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useResetDefaultRolesMutation,
} = rolesApi;
