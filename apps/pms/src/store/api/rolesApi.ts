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
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),

    updateRole: build.mutation<CustomRole, { id: string; body: UpdateRoleInput }>({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          rolesApi.util.updateQueryData("getRoles", undefined, (draft) => {
            const role = draft.find((r) => r.id === id);
            if (role) {
              if (body.label !== undefined) role.label = body.label;
              if (body.description !== undefined) role.description = body.description ?? null;
              if (body.permissions !== undefined) role.permissions = body.permissions;
              if (body.color !== undefined) role.color = body.color;
              if (body.icon !== undefined) role.icon = body.icon;
            }
          })
        );
        const patchDetail = dispatch(
          rolesApi.util.updateQueryData("getRoleById", id, (draft) => {
            if (draft) {
              if (body.label !== undefined) draft.label = body.label;
              if (body.description !== undefined) draft.description = body.description ?? null;
              if (body.permissions !== undefined) draft.permissions = body.permissions;
              if (body.color !== undefined) draft.color = body.color;
              if (body.icon !== undefined) draft.icon = body.icon;
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            rolesApi.util.updateQueryData("getRoles", undefined, (draft) => {
              const idx = draft.findIndex((r) => r.id === id);
              if (idx !== -1) {
                draft[idx] = { ...draft[idx], ...data };
              }
            })
          );
        } catch {
          patchList.undo();
          patchDetail.undo();
        }
      },
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
