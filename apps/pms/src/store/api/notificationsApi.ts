import { baseApi, BACKGROUND_REQUEST_HEADER } from "./baseApi";
import type { Notification, NotificationPreference, NotificationsResponse } from "@zsyio/types";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<
      NotificationsResponse,
      { unreadOnly?: boolean; limit?: number } | void
    >({
      // This endpoint backs the 60s header polling in NotificationDropdown,
      // so it's always treated as a background request - a 401 here should
      // never trigger the hard /login redirect (see baseApi.ts).
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.unreadOnly) queryParams.set("unreadOnly", "true");
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        const str = queryParams.toString();
        return {
          url: `/notifications${str ? `?${str}` : ""}`,
          headers: { [BACKGROUND_REQUEST_HEADER]: "1" },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Notifications" as const, id })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    markAsRead: build.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "PATCH",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const item = draft.items.find((n) => n.id === id);
            if (item && !item.read) {
              item.read = true;
              item.readAt = new Date().toISOString();
              draft.unreadCount = Math.max(0, draft.unreadCount - 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Notifications", id }],
    }),

    markAllAsRead: build.mutation<{ updatedCount: number }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            draft.items.forEach((n) => {
              n.read = true;
              n.readAt = new Date().toISOString();
            });
            draft.unreadCount = 0;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),

    deleteNotification: build.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const index = draft.items.findIndex((n) => n.id === id);
            if (index !== -1) {
              const wasUnread = !draft.items[index].read;
              draft.items.splice(index, 1);
              draft.total = Math.max(0, draft.total - 1);
              if (wasUnread) {
                draft.unreadCount = Math.max(0, draft.unreadCount - 1);
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (_result, _error, id) => [{ type: "Notifications", id }],
    }),

    clearAllNotifications: build.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/notifications",
        method: "DELETE",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            draft.items = [];
            draft.total = 0;
            draft.unreadCount = 0;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: [{ type: "Notifications", id: "LIST" }],
    }),

    getNotificationPreferences: build.query<NotificationPreference, void>({
      query: () => "/notifications/preferences",
      providesTags: [{ type: "NotificationPreferences", id: "USER_PREF" }],
    }),

    updateNotificationPreferences: build.mutation<
      NotificationPreference,
      Partial<NotificationPreference>
    >({
      query: (body) => ({
        url: "/notifications/preferences",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "NotificationPreferences", id: "USER_PREF" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi;
