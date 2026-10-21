"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@zsyio/ui";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
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
  Volume2,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@zsyio/ui";
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playNotificationSound,
  initNotificationServiceWorker,
  type BrowserNotificationPermission,
} from "@zsyio/ui";

interface NotificationPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesModal({
  open,
  onOpenChange,
}: NotificationPreferencesModalProps) {
  const { data: prefs, isLoading } = useGetNotificationPreferencesQuery(undefined, {
    skip: !open,
  });
  const [updatePrefs, { isLoading: isSaving }] = useUpdateNotificationPreferencesMutation();
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");

  useEffect(() => {
    if (open) {
      setPermission(getBrowserNotificationPermission());
      initNotificationServiceWorker();
    }
  }, [open]);

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
            toast.error("Browser notifications are blocked in your browser settings. Please allow notifications in site permissions.");
            return;
          }
        }
      }

      await updatePrefs({ [key]: !currentVal }).unwrap();
      toast.success("Notification preferences updated");
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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Notification Preferences"
      description="Customize how and when you receive in-app alerts and notifications"
      icon={<Bell className="w-4 h-4" />}
      iconVariant="primary"
      size="md"
      bodyClassName="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3 py-6 items-center justify-center text-xs text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin text-primary mb-1" />
          <span>Loading preferences...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between pt-1 pb-1">
            <span className="text-xs font-semibold   text-muted-foreground font-mono">
              Delivery Channels
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg text-primary border-primary/30 hover:bg-primary/5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Test Alert
            </Button>
          </div>

          <PreferenceRow
            icon={<Globe className="w-4 h-4 text-notion-blue-fg" />}
            title="Browser Desktop Notifications"
            description={
              permission === "denied"
                ? "Notifications blocked by browser. Please enable permissions in browser site settings."
                : "Receive native OS / browser notifications even when Zsyio is running in background tab."
            }
            badge={
              permission === "granted" ? (
                <span className="inline-flex items-center gap-1 text-xs text-success font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Allowed
                </span>
              ) : permission === "denied" ? (
                <span className="inline-flex items-center gap-1 text-xs text-destructive font-semibold">
                  <AlertCircle className="w-3 h-3" /> Blocked
                </span>
              ) : null
            }
            checked={(prefs?.browserNotifications ?? true) && permission !== "denied"}
            disabled={isSaving || permission === "denied"}
            onChange={() => handleToggle("browserNotifications", prefs?.browserNotifications ?? true)}
          />

          <PreferenceRow
            icon={<Volume2 className="w-4 h-4 text-success" />}
            title="Audio Alert Chime"
            description="Play a subtle two-tone audio chime when new alerts or task updates arrive."
            checked={prefs?.browserSound ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("browserSound", prefs?.browserSound ?? true)}
          />

          <PreferenceRow
            icon={<Sparkles className="w-4 h-4 text-primary" />}
            title="Floating In-App Toast Alerts"
            description="Display animated toast banners in the bottom corner for urgent updates."
            checked={prefs?.inAppToasts ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("inAppToasts", prefs?.inAppToasts ?? true)}
          />

          <div className="border-t border-border/60 my-1" />
          <span className="text-xs font-semibold   text-muted-foreground font-mono">
            Trigger Events
          </span>

          <PreferenceRow
            icon={<CheckSquare className="w-4 h-4 text-notion-blue-fg" />}
            title="Task Assignments"
            description="Receive an alert when you are assigned as owner or team assignee on a task."
            checked={prefs?.taskAssigned ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("taskAssigned", prefs?.taskAssigned ?? true)}
          />

          <PreferenceRow
            icon={<RefreshCw className="w-4 h-4 text-warning" />}
            title="Task Status Changes"
            description="Get notified when tasks you're assigned to or watching change status."
            checked={prefs?.statusChanged ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("statusChanged", prefs?.statusChanged ?? true)}
          />

          <PreferenceRow
            icon={<AtSign className="w-4 h-4 text-notion-purple-fg" />}
            title="@Mentions in Discussions"
            description="Alert you immediately whenever a teammate tags @you in comments or notes."
            checked={prefs?.mentions ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("mentions", prefs?.mentions ?? true)}
          />

          <PreferenceRow
            icon={<MessageSquare className="w-4 h-4 text-success" />}
            title="Comments & Direct Replies"
            description="Notify when team members leave comments on your tasks or reply to your threads."
            checked={prefs?.comments ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("comments", prefs?.comments ?? true)}
          />

          <PreferenceRow
            icon={<Clock className="w-4 h-4 text-destructive" />}
            title="Due Date & Overdue Reminders"
            description="Stay on track with alerts for upcoming task deadlines and overdue digests."
            checked={prefs?.dueDateReminders ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("dueDateReminders", prefs?.dueDateReminders ?? true)}
          />

          <PreferenceRow
            icon={<StickyNote className="w-4 h-4 text-notion-purple-fg" />}
            title="Workspace Announcements & Notes"
            description="Receive notifications for company-wide announcements or notes for your team."
            checked={prefs?.dashboardNotes ?? true}
            disabled={isSaving}
            onChange={() => handleToggle("dashboardNotes", prefs?.dashboardNotes ?? true)}
          />
        </div>
      )}
    </Modal>
  );
}

function PreferenceRow({
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
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle/80 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-card border border-border/80 shrink-0 mt-0.5 shadow-2xs">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{title}</span>
            {badge}
          </div>
          <p className="text-xs text-muted-foreground leading-snug">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary mt-1 shadow-2xs",
          checked ? "bg-primary" : "bg-muted-foreground/30 dark:bg-white/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-card shadow-md transform ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
