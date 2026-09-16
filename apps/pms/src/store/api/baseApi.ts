import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";

/**
 * Requests tagged with this header are "background" fetches - the 60s
 * notification poll, debounced header search-as-you-type, etc. A 401 on one
 * of these must NOT trigger the hard `window.location.href = "/login"`
 * redirect below: that's a raw browser navigation that bypasses
 * UnsavedChangesContext's guard and would silently discard in-progress form
 * edits just because a background poll happened to notice the session had
 * expired. Background requests just fail quietly instead - the next
 * genuinely user-initiated request will still redirect.
 */
export const BACKGROUND_REQUEST_HEADER = "X-Background-Request";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api", credentials: "include" });

function isBackgroundRequest(args: string | FetchArgs): boolean {
  if (typeof args === "string") return false;
  const headers = args.headers;
  if (!headers) return false;
  if (headers instanceof Headers) {
    return headers.get(BACKGROUND_REQUEST_HEADER) === "1";
  }
  return (headers as Record<string, string>)[BACKGROUND_REQUEST_HEADER] === "1";
}

// De-dupe the "no permission" toast: a burst of concurrent 403s (e.g. several
// panels loading at once after a role change) should surface one toast, not
// one per failed request.
let last403ToastAt = 0;
const TOAST_DEDUPE_WINDOW_MS = 4000;

const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (
      typeof window !== "undefined" &&
      !isBackgroundRequest(args) &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/forgot-password") &&
      !window.location.pathname.startsWith("/invite")
    ) {
      window.location.href = "/login";
    }
  }

  if (result.error?.status === 403) {
    if (typeof window !== "undefined") {
      const now = Date.now();
      if (now - last403ToastAt > TOAST_DEDUPE_WINDOW_MS) {
        last403ToastAt = now;
        toast.error("You don't have permission to do that.");
      }
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
    "TaskTags",
    "TimeEntries",
    "ActiveTimer",
    "DashboardNotes",
    "Notifications",
    "NotificationPreferences",
    "Note",
    "NoteFolder",
    "NoteShare",
  ],
  endpoints: () => ({}),
});
