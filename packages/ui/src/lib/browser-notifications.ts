// Browser & OS Desktop Notifications & Audio Chime Utility

export type BrowserNotificationPermission = "granted" | "denied" | "default" | "unsupported";

/**
 * Cleans up raw mention markdown like @[aniket](cmt12homa...) into @aniket
 * and strips HTML tags or duplicate spaces for clean display.
 */
export function formatCleanNotificationMessage(text: string): string {
  if (!text) return "";
  return text
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1")
    .replace(/@\[([^\]]+)\]/g, "@$1")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if the Web Notification API is supported by the current browser environment.
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Returns current permission status ('granted', 'denied', 'default', or 'unsupported').
 */
export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission as BrowserNotificationPermission;
}

/**
 * Registers the notification service worker for native OS background notifications.
 */
export async function initNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (error) {
    console.warn("[BrowserNotification] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Requests notification permissions from the user.
 */
export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!isBrowserNotificationSupported()) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await initNotificationServiceWorker();
    }
    return permission as BrowserNotificationPermission;
  } catch (error) {
    console.error("[BrowserNotification] Failed to request permission:", error);
    return Notification.permission as BrowserNotificationPermission;
  }
}

/**
 * Synthesizes a soft, pleasant notification chime using Web Audio API.
 */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.48);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
  }
}

export interface ShowBrowserNotificationOptions {
  id?: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  link?: string | null;
  taskId?: string | null;
  noteId?: string | null;
  onClick?: () => void;
}

/**
 * Fires a native OS/browser notification outside the browser window.
 * Uses ServiceWorker registration if available for true desktop background notifications,
 * falling back to window.Notification.
 */
export async function showBrowserNotification(
  options: ShowBrowserNotificationOptions
): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const targetUrl = options.taskId
    ? `/tasks?taskId=${options.taskId}`
    : options.noteId
    ? `/?noteId=${options.noteId}`
    : options.link || "/";

  const iconPath = options.icon || "/branding/zsyio-default/zsyio-mark-white.svg";
  const tagId = options.tag || (options.id ? `pms-notif-${options.id}` : `pms-alert-${Date.now()}`);

  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: iconPath,
    tag: tagId,
    data: { url: targetUrl },
    requireInteraction: true,
  };

  if ("serviceWorker" in navigator) {
    try {
      let reg: ServiceWorkerRegistration | null | undefined = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await initNotificationServiceWorker();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(options.title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn("[BrowserNotification] Service worker showNotification error:", swErr);
    }
  }

  try {
    const notification = new Notification(options.title, notifOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.parent?.focus();
        window.focus();
      } catch {}

      if (options.onClick) {
        options.onClick();
      } else {
        window.location.href = targetUrl;
      }

      notification.close();
    };

    setTimeout(() => {
      try {
        notification.close();
      } catch {}
    }, 8000);

    return true;
  } catch (error) {
    console.error("[BrowserNotification] Failed to show direct notification:", error);
    return false;
  }
}
