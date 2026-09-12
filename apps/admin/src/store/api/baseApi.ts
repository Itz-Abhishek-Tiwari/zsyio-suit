import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";

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
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
  }

  if (result.error?.status === 403) {
    if (typeof window !== "undefined") {
      const now = Date.now();
      if (now - last403ToastAt > TOAST_DEDUPE_WINDOW_MS) {
        last403ToastAt = now;
        toast.error("You don't have permission to perform this action.");
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  keepUnusedDataFor: 60,
  tagTypes: ["User", "Roles", "Teams", "AdminStats", "Domains"],
  endpoints: () => ({}),
});
