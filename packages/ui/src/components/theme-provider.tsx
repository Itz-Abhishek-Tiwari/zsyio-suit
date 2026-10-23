"use client";

import React, { useEffect, useRef } from "react";
import { AccentBootScript, AccentProvider } from "./accent-provider";
import { savePreferenceCookie } from "./appearance-storage";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

const isTheme = (value: unknown): value is "light" | "dark" | "system" =>
  value === "light" || value === "dark" || value === "system";

export function getThemeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith("zsyio-theme="))?.slice("zsyio-theme=".length);
  return isTheme(value) ? value : null;
}

export function setThemeCookie(value: string, days = 365, cookieDomain?: string) {
  if (typeof document === "undefined" || !isTheme(value)) return;
  savePreferenceCookie("zsyio-theme", value, cookieDomain, days);
}

function isAuthPage() {
  return /^\/(login|forgot-password|invite)(\/|$)/.test(window.location.pathname);
}

function ThemeSyncWatcher({ cookieDomain, syncAccount }: { cookieDomain?: string; syncAccount: boolean }) {
  // Persist the selected mode, including "system", rather than its resolved color.
  const { theme, setTheme } = useNextTheme();
  const current = useRef(theme);
  const setThemeRef = useRef(setTheme);
  setThemeRef.current = setTheme;
  const remote = useRef<string | null>(null);
  const previous = useRef<string | null>(null);
  current.current = theme;

  useEffect(() => {
    let active = true;
    const apply = (value: string) => {
      if (!isTheme(value) || value === current.current) return;
      remote.current = value;
      previous.current = value;
      setThemeRef.current(value);
    };
    const sync = () => {
      if (document.visibilityState === "hidden") return;
      const saved = getThemeCookie();
      if (saved) apply(saved);
    };
    const saved = getThemeCookie();
    if (saved) apply(saved);
    else if (syncAccount && !isAuthPage()) {
      // The account preference is a fallback for a browser with no saved choice.
      // Ignore a late response if the user has changed appearance in the meantime.
      const initial = current.current;
      fetch("/api/users/theme", { credentials: "same-origin" })
        .then(async (response) => response.ok ? response.json() : null)
        .then((data) => {
          if (active && !getThemeCookie() && current.current === initial && isTheme(data?.theme)) {
            setThemeCookie(data.theme, 365, cookieDomain);
            apply(data.theme);
          }
        }).catch(() => {});
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === "zsyio-theme" && isTheme(event.newValue)) {
        setThemeCookie(event.newValue, 365, cookieDomain);
        apply(event.newValue);
      }
    };
    window.addEventListener("focus", sync);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", sync);
    // Cookies are shared across ports and configured subdomains; storage events aren't.
    // Another app's change is picked up when this tab regains focus or becomes visible.
    return () => {
      active = false;
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [cookieDomain, syncAccount]);

  useEffect(() => {
    if (!isTheme(theme)) return;
    if (remote.current) {
      if (theme !== remote.current) return;
      remote.current = null;
      return;
    }
    const initial = previous.current === null;
    if (previous.current === theme) return;
    previous.current = theme;
    // Do not replace another app's preference during initial hydration.
    if (initial) return;
    setThemeCookie(theme, 365, cookieDomain);
    if (!syncAccount || isAuthPage()) return;
    const timer = window.setTimeout(() => {
      fetch("/api/users/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
        credentials: "same-origin",
      }).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [theme, cookieDomain, syncAccount]);

  return null;
}

export function ThemeProvider({
  children,
  attribute = ["class", "data-theme"],
  accentCookieDomain,
  syncAccountTheme = true,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  accentCookieDomain?: string;
  /** Load and save the signed-in user's theme via /api/users/theme. Off for public sites without that route. */
  syncAccountTheme?: boolean;
}) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme="light"
      storageKey="zsyio-theme"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <AccentBootScript />
      <AccentProvider cookieDomain={accentCookieDomain}>
        <ThemeSyncWatcher cookieDomain={accentCookieDomain} syncAccount={syncAccountTheme} />
        {children}
      </AccentProvider>
    </NextThemesProvider>
  );
}

export { useNextTheme as useTheme };
