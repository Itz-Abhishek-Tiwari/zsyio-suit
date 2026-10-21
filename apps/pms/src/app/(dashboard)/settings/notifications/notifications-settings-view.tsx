"use client";

import React, { useState, useEffect } from "react";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetNotificationsQuery,
} from "@/store/api/notificationsApi";
import { toast } from "sonner";
import {
  Bell,
  CheckSquare,
  RefreshCw,
  AtSign,
  MessageSquare,
  Clock,
  StickyNote,
  Sparkles,
  Sliders,
  CheckCircle2,
  Inbox,
  Volume2,
  Globe,
  AlertCircle,
} from "lucide-react";

import { Button } from "@zsyio/ui";
import { Badge } from "@zsyio/ui";
import { PageHeader, KpiCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playNotificationSound,
  initNotificationServiceWorker,
  type BrowserNotificationPermission,
} from "@zsyio/ui";

export function NotificationsSettingsView() {
  const { data: prefs, isLoading } = useGetNotificationPreferencesQuery();
  const { data: notificationsData } = useGetNotificationsQuery();
  const [updatePrefs, { isLoading: isSaving }] = useUpdateNotificationPreferencesMutation();
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");

  useEffect(() => {
    setPermission(getBrowserNotificationPermission());
    initNotificationServiceWorker();
  }, []);

  const unreadCount = notificationsData?.unreadCount ?? 0;
  const totalCount = notificationsData?.total ?? 0;

  const handleToggle = async (
    key:
      | "taskAssigned"
      | "statusChanged"
      | "mentions"
      | "comments"
      | "dueDateReminders"
      | "dashboardNotes"
      | "inAppToasts"
      | "browserNotifications"
      | "browserSound",
    currentVal: boolean
  ) => {
    try {
      if (key === "browserNotifications" && !currentVal) {
        if (isBrowserNotificationSupported()) {
          const perm = await requestBrowserNotificationPermission();
          setPermission(perm);
          if (perm === "denied") {
            toast.error(
              "Browser notifications are blocked in your browser settings. Please allow notifications in site permissions."
            );
            return;
          }
        }
      }

      await updatePrefs({ [key]: !currentVal }).unwrap();
      toast.success("Preferences updated successfully");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  const handleTestNotification = async () => {
    if (!isBrowserNotificationSupported()) {
      toast.error("Your browser does not support Web Notifications");
      return;
    }

    let currentPerm = getBrowserNotificationPermission();
    if (currentPerm === "default") {
      currentPerm = await requestBrowserNotificationPermission();
      setPermission(currentPerm);
    }

    if (currentPerm === "denied") {
      toast.error("Notifications are blocked in your browser. Please enable them in browser settings.");
      return;
    }

    if (prefs?.browserSound !== false) {
      playNotificationSound();
    }

    await showBrowserNotification({
      title: "Zsyio Desktop Alert",
      body: "Outside-the-browser notification is active! You'll receive real-time alerts across your system.",
    });

    toast.success("Test desktop notification dispatched!");
  };

  const handleBulkSet = async (enabled: boolean) => {
    try {
      if (enabled && isBrowserNotificationSupported() && permission === "default") {
        const perm = await requestBrowserNotificationPermission();
        setPermission(perm);
      }

      await updatePrefs({
        taskAssigned: enabled,
        statusChanged: enabled,
        mentions: enabled,
        comments: enabled,
        dueDateReminders: enabled,
        dashboardNotes: enabled,
        inAppToasts: enabled,
        browserNotifications: enabled,
        browserSound: enabled,
      }).unwrap();
      toast.success(enabled ? "All alerts enabled" : "All alerts muted");
    } catch {
      toast.error("Failed to update preferences");
    }
  };

  const activeAlertsCount = prefs
    ? [
        prefs.taskAssigned,
        prefs.statusChanged,
        prefs.mentions,
        prefs.comments,
        prefs.dueDateReminders,
        prefs.dashboardNotes,
        prefs.inAppToasts,
        prefs.browserNotifications,
        prefs.browserSound,
      ].filter(Boolean).length
    : 9;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <PageHeader
        title="Notification Preferences"
        titleIcon={<Bell className="w-5 h-5" />}
        description="Configure how and when you receive browser alerts, in-app notifications, and activity triggers."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs font-semibold rounded-lg cursor-pointer text-primary border-primary/30 hover:bg-primary/5"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Test Browser Alert
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving || isLoading}
              onClick={() => handleBulkSet(true)}
              className="text-xs font-semibold rounded-lg cursor-pointer"
            >
              Enable All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving || isLoading}
              onClick={() => handleBulkSet(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            >
              Mute All
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <KpiCard
          label="Active Alerts"
          value={`${activeAlertsCount} / 9`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />

        <KpiCard
          label="Unread Alerts"
          value={unreadCount}
          icon={<Inbox className="w-5 h-5" />}
          variant="primary"
        />

        <KpiCard
          label="Total History"
          value={totalCount}
          icon={<Sliders className="w-5 h-5" />}
          variant="sky"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold font-display text-foreground">
              Delivery Channels & Desktop Notifications
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            System & UI
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <SettingsSwitchCard
            icon={<Globe className="w-4 h-4 text-notion-blue-fg" />}
            title="Browser Desktop Push Notifications"
            description={
              permission === "denied"
                ? "Notifications are blocked by your browser settings. Please click the padlock or site settings in your URL bar to allow notifications."
                : "Receive real-time native OS and browser notifications even when you are working in another tab or have the browser minimized."
            }
            badge={
              permission === "granted" ? (
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/25">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Allowed
                </Badge>
              ) : permission === "denied" ? (
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/25">
                  <AlertCircle className="w-3 h-3 mr-1" /> Blocked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Prompt on enable
                </Badge>
              )
            }
            checked={(prefs?.browserNotifications ?? true) && permission !== "denied"}
            disabled={isSaving || isLoading || permission === "denied"}
            onChange={() => handleToggle("browserNotifications", prefs?.browserNotifications ?? true)}
          />

          <SettingsSwitchCard
            icon={<Volume2 className="w-4 h-4 text-success" />}
            title="Audio Alert Chime"
            description="Play a subtle, pleasant audio sound when new tasks, comments, or @mentions arrive."
            checked={prefs?.browserSound ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("browserSound", prefs?.browserSound ?? true)}
          />

          <SettingsSwitchCard
            icon={<Sparkles className="w-4 h-4 text-primary" />}
            title="Floating In-App Toast Banners"
            description="Display real-time animated toast popups in the corner of your screen when high-priority actions occur."
            checked={prefs?.inAppToasts ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("inAppToasts", prefs?.inAppToasts ?? true)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold font-display text-foreground">
              Tasks & Workflow Lifecycle
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Core Events
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <SettingsSwitchCard
            icon={<CheckSquare className="w-4 h-4 text-notion-blue-fg" />}
            title="Task & Ticket Assignments"
            description="Trigger alert whenever you are designated as the owner or assignee of a task."
            checked={prefs?.taskAssigned ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("taskAssigned", prefs?.taskAssigned ?? true)}
          />

          <SettingsSwitchCard
            icon={<RefreshCw className="w-4 h-4 text-warning" />}
            title="Task Status Movements"
            description="Receive updates when tickets you are assigned to or watching transition between Kanban columns (e.g., Todo → In Progress → Review → Done)."
            checked={prefs?.statusChanged ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("statusChanged", prefs?.statusChanged ?? true)}
          />

          <SettingsSwitchCard
            icon={<Clock className="w-4 h-4 text-destructive" />}
            title="Due Date & Overdue Reminders"
            description="Get alerted when task target dates are approaching or when tasks become overdue."
            checked={prefs?.dueDateReminders ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("dueDateReminders", prefs?.dueDateReminders ?? true)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4 text-notion-purple-fg" />
            <h2 className="text-sm sm:text-base font-semibold font-display text-foreground">
              Collaboration & @Mentions
            </h2>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Social & Discussion
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <SettingsSwitchCard
            icon={<AtSign className="w-4 h-4 text-notion-purple-fg" />}
            title="@Mentions in Discussions & Comments"
            description="High-priority in-app alert triggered directly whenever another user tags @your-name in task comments or dashboard notes."
            checked={prefs?.mentions ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("mentions", prefs?.mentions ?? true)}
          />

          <SettingsSwitchCard
            icon={<MessageSquare className="w-4 h-4 text-success" />}
            title="Comment Threads & Replies"
            description="Notify you when someone posts a comment on your assigned tasks or directly replies to one of your comments."
            checked={prefs?.comments ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("comments", prefs?.comments ?? true)}
          />

          <SettingsSwitchCard
            icon={<StickyNote className="w-4 h-4 text-notion-purple-fg" />}
            title="Workspace Notes & Client Announcements"
            description="Receive alerts when announcements or notes targeted to you or your department are published."
            checked={prefs?.dashboardNotes ?? true}
            disabled={isSaving || isLoading}
            onChange={() => handleToggle("dashboardNotes", prefs?.dashboardNotes ?? true)}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsSwitchCard({
  icon,
  title,
  description,
  badge,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle/80 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-card border border-border/80 shrink-0 mt-0.5 shadow-2xs">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-foreground">{title}</span>
            {badge}
          </div>
          <p className="text-xs sm:text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary mt-1 shadow-2xs",
          checked ? "bg-primary" : "bg-muted-foreground/30 dark:bg-white/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-md transform ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
