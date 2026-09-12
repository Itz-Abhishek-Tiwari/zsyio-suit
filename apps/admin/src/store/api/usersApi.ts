import { baseApi } from "./baseApi";
import type { User } from "@zsyio/types";

export interface GetUsersParams {
  q?: string;
  role?: string;
  status?: string;
  lite?: boolean;
  limit?: number;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], GetUsersParams | void>({
      query: (params) => {
        if (!params) return "/users";
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.role) sp.set("role", params.role);
        if (params.status) sp.set("status", params.status);
        if (params.lite) sp.set("lite", "true");
        if (params.limit) sp.set("limit", String(params.limit));
        const qs = sp.toString();
        return qs ? `/users?${qs}` : "/users";
      },
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "User" as const, id: u.id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),

    getUserById: build.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_res, _err, id) => [{ type: "User", id }],
    }),

    createUser: build.mutation<User, { name: string; email: string; role: string; password?: string; customRoleId?: string | null }>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),

    resendInvitation: build.mutation<User, string>({
      query: (id) => ({ url: `/users/${id}/resend-invite`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),

    updateUser: build.mutation<User, { id: string; body: Partial<Pick<User, "name" | "role" | "active" | "customRoleId">> }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
        { type: "AdminStats", id: "SUMMARY" },
      ],
    }),

    resetUserPassword: build.mutation<User, { id: string; password: string }>({
      query: ({ id, password }) => ({ url: `/users/${id}/password`, method: "POST", body: { password } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),

    deleteUser: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
        { type: "Teams", id: "LIST" },
        { type: "AdminStats", id: "SUMMARY" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useResendInvitationMutation,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
} = usersApi;
