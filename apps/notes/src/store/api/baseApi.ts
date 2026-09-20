import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api", credentials: "include" });

const baseQueryWithErrorHandling: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/forgot-password") &&
      !window.location.pathname.startsWith("/invite")
    ) {
      window.location.href = "/login";
    }
  }
  if (result.error?.status === 403) {
    if (typeof window !== "undefined") {
      toast.error("You don't have permission to do that.");
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  keepUnusedDataFor: 300,
  tagTypes: [
    "Client",
    "Product",
    "Task",
    "User",
    "Report",
    "Teams",
    "Roles",
    "TaskTypes",
    "TaskColumns",
    "DashboardNotes",
    "Notifications",
    "NotificationPreferences",
    "Note",
    "NoteFolder",
    "NoteShare",
  ],
  endpoints: () => ({}),
});


