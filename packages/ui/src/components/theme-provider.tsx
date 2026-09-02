"use client";

import React, { useEffect, useRef } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export function getThemeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match =
    document.cookie.match(new RegExp("(^| )zsyio-theme=([^;]+)")) ||
    document.cookie.match(new RegExp("(^| )mediloon-theme=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setThemeCookie(value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `zsyio-theme=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  document.cookie = `mediloon-theme=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function isAuthPage(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return (
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/invite")
  );
}

function ThemeSyncWatcher() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const isRemoteSyncRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevThemeRef = useRef<string | null>(null);
  const isUnauthenticatedRef = useRef(false);

  // 1. Initial mount: fetch user's theme preference from database (if authenticated and not on auth page)
  useEffect(() => {
    let mounted = true;
    if (isAuthPage()) return;

    async function syncFromDatabase() {
      try {
        const res = await fetch("/api/users/theme", { credentials: "same-origin" });
        if (res.status === 401) {
          isUnauthenticatedRef.current = true;
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const serverTheme = data?.theme;
        if (
          mounted &&
          serverTheme &&
          (serverTheme === "dark" || serverTheme === "light" || serverTheme === "system") &&
          serverTheme !== resolvedTheme
        ) {
          isRemoteSyncRef.current = true;
          prevThemeRef.current = serverTheme;
          setTheme(serverTheme);
          setThemeCookie(serverTheme);
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 150);
        }
      } catch {
        // Silently ignore if network fails or endpoint is unreachable
      }
    }

    syncFromDatabase();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Cross-tab/port sync on window focus or visibility change (throttled, skipped if unauthenticated)
  useEffect(() => {
    let lastChecked = 0;
    async function checkRemoteTheme() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (isAuthPage() || isUnauthenticatedRef.current) return;
      const now = Date.now();
      if (now - lastChecked < 3000) return; // Throttle to once every 3s
      lastChecked = now;

      try {
        const res = await fetch("/api/users/theme", { credentials: "same-origin" });
        if (res.status === 401) {
          isUnauthenticatedRef.current = true;
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const serverTheme = data?.theme;
        if (
          serverTheme &&
          (serverTheme === "dark" || serverTheme === "light" || serverTheme === "system") &&
          serverTheme !== resolvedTheme
        ) {
          isRemoteSyncRef.current = true;
          prevThemeRef.current = serverTheme;
          setTheme(serverTheme);
          setThemeCookie(serverTheme);
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 150);
        }
      } catch {
        // Silently ignore
      }
    }

    window.addEventListener("focus", checkRemoteTheme);
    document.addEventListener("visibilitychange", checkRemoteTheme);

    return () => {
      window.removeEventListener("focus", checkRemoteTheme);
      document.removeEventListener("visibilitychange", checkRemoteTheme);
    };
  }, [resolvedTheme, setTheme]);

  // 3. Listen for external theme broadcasts from other tabs via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("zsyio-suite-theme");
      channel.onmessage = (event) => {
        if (
          event.data &&
          (event.data === "dark" || event.data === "light" || event.data === "system") &&
          event.data !== resolvedTheme
        ) {
          isRemoteSyncRef.current = true;
          prevThemeRef.current = event.data;
          setTheme(event.data);
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 150);
        }
      };
    } catch {
      // BroadcastChannel optional fallback
    }

    return () => {
      channel?.close();
    };
  }, [resolvedTheme, setTheme]);

  // 4. Synchronize user-initiated theme change to cookie, BroadcastChannel, and Database
  useEffect(() => {
    if (!resolvedTheme) return;
    if (resolvedTheme === "dark" || resolvedTheme === "light") {
      setThemeCookie(resolvedTheme);

      // On initial mount, record initial resolvedTheme without sending a PATCH request
      if (prevThemeRef.current === null) {
        prevThemeRef.current = resolvedTheme;
        return;
      }

      // If the theme didn't actually change, do nothing
      if (prevThemeRef.current === resolvedTheme) {
        return;
      }

      prevThemeRef.current = resolvedTheme;

      // Only sync to remote/DB if this change was triggered by the user (not a remote sync)
      // and user is not on an auth/login page and not known unauthenticated
      if (!isRemoteSyncRef.current) {
        // Broadcast to other open tabs on same origin
        try {
          const channel = new BroadcastChannel("zsyio-suite-theme");
          channel.postMessage(resolvedTheme);
          channel.close();
        } catch {
          // ignore
        }

        if (isAuthPage() || isUnauthenticatedRef.current) {
          return;
        }

        // Debounce database update (300ms) to avoid spamming on rapid toggles
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetch("/api/users/theme", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: resolvedTheme }),
            credentials: "same-origin",
          })
            .then((res) => {
              if (res.status === 401) {
                isUnauthenticatedRef.current = true;
              }
            })
            .catch(() => {
              // Silently ignore failures
            });
        }, 300);
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  attribute = ["class", "data-theme"],
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme="light"
      storageKey="zsyio-theme"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSyncWatcher />
      {children}
    </NextThemesProvider>
  );
}

export { useNextTheme as useTheme };
