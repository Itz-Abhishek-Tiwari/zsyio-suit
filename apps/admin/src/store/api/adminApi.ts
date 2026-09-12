import { baseApi } from "./baseApi";

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  deactivatedUsers: number;
  totalTeams: number;
  totalRoles: number;
  allowedDomains: string[];
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query<AdminStatsResponse, void>({
      query: () => "/admin/stats",
      keepUnusedDataFor: 60,
      providesTags: [{ type: "AdminStats", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetAdminStatsQuery } = adminApi;
