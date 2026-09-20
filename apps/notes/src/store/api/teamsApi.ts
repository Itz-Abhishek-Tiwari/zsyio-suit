import { baseApi } from "./baseApi";

export interface TeamItem {
  id: string;
  name: string;
  description?: string | null;
}

export const teamsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeams: builder.query<TeamItem[], void>({
      query: () => "/teams",
      providesTags: ["Teams"],
    }),
  }),
});

export const { useGetTeamsQuery } = teamsApi;
