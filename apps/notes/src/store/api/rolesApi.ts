import { baseApi } from "./baseApi";

export interface RoleItem {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  isSystem?: boolean;
  permissions: string[];
}

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RoleItem[], void>({
      query: () => "/roles",
      providesTags: ["Roles"],
    }),
  }),
});

export const { useGetRolesQuery } = rolesApi;
