import { baseApi } from "./baseApi";
import type { User } from "@zsyio/types";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: [{ type: "User", id: "LIST" }],
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
