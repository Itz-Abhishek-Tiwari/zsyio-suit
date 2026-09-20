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
  }),
});

export const { useGetUsersQuery } = usersApi;


