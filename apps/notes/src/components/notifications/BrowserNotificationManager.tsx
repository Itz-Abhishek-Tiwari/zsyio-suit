"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  notificationsApi,
  useGetNotificationsQuery,
  useGetNotificationPreferencesQuery,
} from "@/store/api/notificationsApi";
import { loadSupabaseClient } from "@/lib/supabase";
import {
  isBrowserNotificationSupported,
  showBrowserNotification,
  playNotificationSound,
  initNotificationServiceWorker,
  formatCleanNotificationMessage,
} from "@zsyio/ui";

/**
 * Global component mounted inside DashboardShell that listens for incoming notifications,
 * compares against previously seen notifications, and fires native browser notifications,
 * floating in-app toasts, and audio chimes according to user preferences.
 * Uses Supabase Realtime for instant push updates + 60s fallback polling.
 */
export function BrowserNotificationManager() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const isMountedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const mountTimestampRef = useRef<number>(Date.now());

  const { data: prefs } = useGetNotificationPreferencesQuery();

  // Gentle fallback polling (every 60s) with instant refresh on window focus / reconnect
  const { data: notificationsData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Supabase Realtime WebSocket subscription for zero-latency push notifications
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void loadSupabaseClient().then((supabase) => {
      if (!supabase || cancelled) return;
      const channel = supabase
        .channel(`realtime-notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Notification",
            filter: `userId=eq.${userId}`,
          },
          () => {
            // Immediately invalidate RTK Query notifications tag to trigger instant fresh fetch
            dispatch(
              notificationsApi.util.invalidateTags([
                { type: "Notifications", id: "LIST" },
              ])
            );
          }
        )
        .subscribe();
      unsubscribe = () => void supabase.removeChannel(channel);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userId, dispatch]);

  useEffect(() => {
    isMountedRef.current = true;
    mountTimestampRef.current = Date.now();
    initNotificationServiceWorker();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!notificationsData?.items) return;

    const items = notificationsData.items;

    // First time receiving data: seed the seen IDs so we don't spam the user with existing notifications
    if (!initialLoadDoneRef.current) {
      items.forEach((item) => seenIdsRef.current.add(item.id));
      initialLoadDoneRef.current = true;
      return;
    }

    // Identify newly arrived unread notifications
    const newUnreadNotifications = items.filter((item) => {
      if (seenIdsRef.current.has(item.id)) return false;
      // Mark as seen immediately so we never duplicate
      seenIdsRef.current.add(item.id);

      if (item.read) return false;

      // Ensure the notification wasn't created prior to this page session
      const itemTime = new Date(item.createdAt).getTime();
      return itemTime >= mountTimestampRef.current - 15000;
    });

    if (newUnreadNotifications.length === 0) return;

    const browserEnabled = prefs?.browserNotifications ?? true;
    const soundEnabled = prefs?.browserSound ?? true;
    const inAppToastsEnabled = prefs?.inAppToasts ?? true;

    // Play chime sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }

    if (inAppToastsEnabled) {
      newUnreadNotifications.forEach((item) => {
        const cleanMsg = formatCleanNotificationMessage(item.message);
        const targetUrl = item.taskId
          ? `/tasks?taskId=${item.taskId}`
          : item.noteId
          ? `/?noteId=${item.noteId}`
          : item.link || undefined;

        toast.info(item.title, {
          description: cleanMsg,
          action: targetUrl
            ? {
                label: "View",
                onClick: () => router.push(targetUrl),
              }
            : undefined,
          duration: 7000,
        });
      });
    }

    if (browserEnabled && isBrowserNotificationSupported() && Notification.permission === "granted") {
      newUnreadNotifications.forEach((item) => {
        const cleanMsg = formatCleanNotificationMessage(item.message);
        showBrowserNotification({
          id: item.id,
          title: item.title,
          body: cleanMsg,
          link: item.link,
          taskId: item.taskId,
          noteId: item.noteId,
        });
      });
    }
  }, [notificationsData, prefs, router]);

  return null;
}
