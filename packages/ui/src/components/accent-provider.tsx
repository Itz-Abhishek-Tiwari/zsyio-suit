"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { savePreferenceCookie } from "./appearance-storage";

export const SUITE_ACCENTS = [
  { id: "blue", label: "Zsyio blue", swatch: "bg-blue-700" },
  { id: "emerald", label: "Emerald", swatch: "bg-emerald-700" },
  { id: "violet", label: "Violet", swatch: "bg-purple-700" },
  { id: "amber", label: "Amber", swatch: "bg-amber-700" },
  { id: "crimson", label: "Crimson", swatch: "bg-red-700" },
] as const;

export type SuiteAccent = (typeof SUITE_ACCENTS)[number]["id"];
const STORAGE_KEY = "zsyio-accent";
const isAccent = (value: unknown): value is SuiteAccent => SUITE_ACCENTS.some((accent) => accent.id === value);

const AccentContext = createContext<{ accent: SuiteAccent; setAccent: (accent: SuiteAccent) => void } | null>(null);

function readAccent(): SuiteAccent {
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${STORAGE_KEY}=`));
  if (cookie) {
    const value = cookie.slice(STORAGE_KEY.length + 1);
    if (isAccent(value)) return value;
  }
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (isAccent(value)) return value;
  } catch {
    // Cookies still allow preference sharing when local storage is unavailable.
  }
  return "blue";
}

function saveAccent(accent: SuiteAccent, cookieDomain?: string) {
  savePreferenceCookie(STORAGE_KEY, accent, cookieDomain);
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    // The current selection still applies when persistence is blocked.
  }
}

// Applies the saved accent while the HTML is still parsing, so pages don't flash the default blue.
const ACCENT_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)},ok=${JSON.stringify(SUITE_ACCENTS.map((accent) => accent.id))},v=null;var c=document.cookie.split("; ").find(function(i){return i.indexOf(k+"=")===0});if(c)v=c.slice(k.length+1);if(ok.indexOf(v)<0){try{v=localStorage.getItem(k)}catch(e){}}if(ok.indexOf(v)>=0)document.documentElement.dataset.accent=v}catch(e){}})();`;

export function AccentBootScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }} />;
}

export function AccentProvider({ children, cookieDomain }: { children: ReactNode; cookieDomain?: string }) {
  const [accent, updateAccent] = useState<SuiteAccent>("blue");

  useEffect(() => {
    const sync = () => {
      const saved = readAccent();
      document.documentElement.dataset.accent = saved;
      updateAccent(saved);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") sync(); };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function setAccent(next: SuiteAccent) {
    if (!isAccent(next)) return;
    document.documentElement.dataset.accent = next;
    updateAccent(next);
    saveAccent(next, cookieDomain);
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>;
}

export function useAccent() {
  const context = useContext(AccentContext);
  if (!context) throw new Error("useAccent must be used within ThemeProvider or AccentProvider");
  return context;
}
