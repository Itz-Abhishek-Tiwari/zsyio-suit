import { baseApi } from "./baseApi";
import type { User } from "@zsyio/types";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], { q?: string; role?: string; lite?: boolean; limit?: number } | void>({
      query: (params) => {
        if (!params) return "/users";
        const sp = new URLSearchParams();
        if (params.q) sp.set("q", params.q);
        if (params.role) sp.set("role", params.role);
        if (params.lite) sp.set("lite", "true");
        if (params.limit) sp.set("limit", String(params.limit));
        const qs = sp.toString();
        return qs ? `/users?${qs}` : "/users";
      },
      keepUnusedDataFor: 3600,
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: "User" as const, id: u.id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),
    createUser: build.mutation<User, { name: string; email: string; role: string; password?: string; customRoleId?: string | null }>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    resendInvitation: build.mutation<User, string>({
      query: (id) => ({ url: `/users/${id}/resend-invite`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    updateUser: build.mutation<User, { id: string; body: Partial<Pick<User, "name" | "role" | "active" | "customRoleId">> }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    resetUserPassword: build.mutation<User, { id: string; password: string }>({
      query: ({ id, password }) => ({ url: `/users/${id}/password`, method: "POST", body: { password } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    deleteUser: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }, { type: "Task", id: "LIST" }],
    }),
    getMyProfile: build.query<import("@zsyio/types").UserProfileResponse, void>({
      query: () => "/users/me",
      providesTags: [{ type: "User", id: "ME" }],
    }),
    updateMyProfile: build.mutation<User, import("@zsyio/types").UpdateProfileInput>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: [{ type: "User", id: "ME" }, { type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useResendInvitationMutation,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
  useDeleteUserMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} = usersApi;


