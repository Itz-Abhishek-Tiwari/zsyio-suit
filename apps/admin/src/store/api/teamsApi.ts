import { baseApi } from "./baseApi";
import type { Team } from "@zsyio/types";
import type { CreateTeamInput, UpdateTeamInput } from "@zsyio/validators";

export const teamsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query<Team[], void>({
      query: () => "/teams",
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Teams" as const, id })),
              { type: "Teams", id: "LIST" },
            ]
          : [{ type: "Teams", id: "LIST" }],
    }),

    getTeamById: build.query<Team, string>({
      query: (id) => `/teams/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Teams", id }],
    }),

    createTeam: build.mutation<Team, CreateTeamInput>({
      query: (body) => ({
        url: "/teams",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Teams", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),

    updateTeam: build.mutation<Team, { id: string } & UpdateTeamInput>({
      query: ({ id, ...body }) => ({
        url: `/teams/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Teams", id },
        { type: "Teams", id: "LIST" },
      ],
    }),

    deleteTeam: build.mutation<void, string>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Teams", id: "LIST" }, { type: "AdminStats", id: "SUMMARY" }],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamsApi;
