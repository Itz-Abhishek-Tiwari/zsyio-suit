"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@zsyio/ui";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/notificationsApi";
import type { Notification, NotificationType } from "@zsyio/types";
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings2,
  CheckSquare,
  RefreshCw,
  AtSign,
  MessageSquare,
  Clock,
  StickyNote,
  Sparkles,
  Inbox,
  ArrowUpRight,
  SlidersHorizontal,
  Globe,
  X,
} from "lucide-react";
import { NotificationPreferencesModal } from "@/components/notifications/NotificationPreferencesModal";
import { SegmentedTabs } from "@zsyio/ui";
import { cn } from "@zsyio/ui";
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  formatCleanNotificationMessage,
  type BrowserNotificationPermission,
} from "@zsyio/ui";


function getNotificationMeta(type: NotificationType) {
  switch (type) {
    case "TASK_ASSIGNED":
      return {
        icon: <CheckSquare className="w-3.5 h-3.5 text-notion-blue-fg" />,
        badgeBg: "bg-notion-blue-fg/10 border-notion-blue-fg/25 text-notion-blue-fg",
      };
    case "STATUS_CHANGED":
      return {
        icon: <RefreshCw className="w-3.5 h-3.5 text-warning" />,
        badgeBg: "bg-warning/10 border-warning/25 text-warning",
      };
    case "MENTIONED":
      return {
        icon: <AtSign className="w-3.5 h-3.5 text-notion-purple-fg" />,
        badgeBg: "bg-notion-purple-fg/10 border-notion-purple-fg/25 text-notion-purple-fg",
      };
    case "COMMENT_ADDED":
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-success" />,
        badgeBg: "bg-success/10 border-success/25 text-success",
      };
    case "DUE_DATE_REMINDER":
      return {
        icon: <Clock className="w-3.5 h-3.5 text-destructive" />,
        badgeBg: "bg-destructive/10 border-destructive/25 text-destructive",
      };
    case "NOTE_ADDED":
      return {
        icon: <StickyNote className="w-3.5 h-3.5 text-notion-purple-fg" />,
        badgeBg: "bg-notion-purple-fg/10 border-notion-purple-fg/25 text-notion-purple-fg",
      };
    default:
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
        badgeBg: "bg-primary/10 border-primary/25 text-primary",
      };
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ALL" | "UNREAD">("ALL");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermission>("default");
  const [promptDismissed, setPromptDismissed] = useState(false);

  React.useEffect(() => {
    if (open) {
      setBrowserPermission(getBrowserNotificationPermission());
    }
  }, [open]);

  // Fallback polling (60s) with instant refresh on window focus / network reconnect
  const { data, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const handleRequestPermission = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
  };

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const filteredList =
    tab === "UNREAD" ? notifications.filter((n) => !n.read) : notifications;

  const handleNotificationClick = async (item: Notification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    setOpen(false);

    if (item.taskId) {
      router.push(`/tasks?taskId=${item.taskId}`);
    } else if (item.noteId) {
      const base = item.link ? item.link.split("?")[0] : "/";
      router.push(`${base}?noteId=${item.noteId}`);
    } else if (item.link) {
      router.push(item.link);
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            suppressHydrationWarning
            className="relative p-2 rounded-lg text-foreground hover:bg-white/80 dark:hover:bg-white/10 hover:text-foreground transition-all  border border-border/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] outline-none cursor-pointer shadow-2xs"
            title="Notifications & Activity"
          >
            <Bell className="w-4 h-4" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-xs font-semibold text-white flex items-center justify-center shadow-xs animate-in zoom-in-50">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-88 sm:w-[410px] p-0 rounded-lg shadow-md border border-border/80 overflow-hidden bg-card/98 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-surface-subtle/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-display text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAll}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPreferencesOpen(true);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                title="Notification Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-2 border-b border-border/50 bg-surface-subtle/30">
            <SegmentedTabs<"ALL" | "UNREAD">
              value={tab}
              onChange={setTab}
              fullWidth
              size="sm"
              tabs={[
                { id: "ALL", label: "All Alerts", count: notifications.length },
                {
                  id: "UNREAD",
                  label: "Unread",
                  count: unreadCount > 0 ? unreadCount : undefined,
                  badgeVariant: "primary",
                },
              ]}
            />
          </div>

          {browserPermission === "default" && !promptDismissed && isBrowserNotificationSupported() && (
            <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-primary/10 border-b border-primary/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground font-medium truncate">
                  Enable desktop alerts for background tabs
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2 py-0.5 rounded-md bg-primary text-white text-xs font-semibold shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Enable
                </button>
                <button
                  type="button"
                  onClick={() => setPromptDismissed(true)}
                  className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 text-xs custom-scrollbar">
            {isLoading && notifications.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">Fetching updates...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-14 px-4 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/50 flex items-center justify-center shadow-2xs">
                  <Inbox className="w-4 h-4 text-muted-foreground/70" />
                </div>
                <p className="text-xs font-semibold text-foreground mt-1">
                  {tab === "UNREAD" ? "No unread alerts" : "All caught up!"}
                </p>
                <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                  {tab === "UNREAD"
                    ? "You've read all recent updates and task notices."
                    : "No new activity or mentions in your workspace."}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredList.map((item) => {
                  const meta = getNotificationMeta(item.type);
                  const timeAgo = formatRelativeTime(item.createdAt);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={cn(
                        "group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer select-none",
                        !item.read
                          ? "bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.12] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs",
                          meta.badgeBg
                        )}
                      >
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={cn(
                                "text-xs truncate",
                                !item.read
                                  ? "font-semibold text-foreground"
                                  : "font-semibold text-foreground/85"
                              )}
                            >
                              {item.title}
                            </span>
                            {!item.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground font-mono" suppressHydrationWarning>
                              {timeAgo}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                              title="Dismiss"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed font-normal pr-1">
                          {formatCleanNotificationMessage(item.message)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border/60 bg-surface-subtle/50 flex items-center justify-between text-xs">
            <Link
              href="/tasks"
              onClick={() => setOpen(false)}
              className="font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              <span>View Task Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3 text-muted-foreground/70" />
              <span>Preferences</span>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationPreferencesModal
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </>
  );
}

