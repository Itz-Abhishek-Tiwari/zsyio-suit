"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  formatTime as uiFormatTime,
  formatDate as uiFormatDate,
  localTimeToIso,
} from "@zsyio/ui";

export type TimeZoneId = "Europe/Berlin" | "Asia/Kolkata";

export interface TimeZoneOption {
  id: TimeZoneId;
  country: string;
  city: string;
  label: string;
  code: string;
  flag: string;
  utcOffset: string;
}

export const TIMEZONES: Record<TimeZoneId, TimeZoneOption> = {
  "Europe/Berlin": {
    id: "Europe/Berlin",
    country: "Germany",
    city: "Berlin",
    label: "Germany (CET)",
    code: "CET",
    flag: "🇩🇪",
    utcOffset: "UTC+1/2",
  },
  "Asia/Kolkata": {
    id: "Asia/Kolkata",
    country: "India",
    city: "Kolkata",
    label: "India (IST)",
    code: "IST",
    flag: "🇮🇳",
    utcOffset: "UTC+5:30",
  },
};

interface TimeZoneContextValue {
  timeZone: TimeZoneId;
  timeZoneConfig: TimeZoneOption;
  setTimeZone: (tz: TimeZoneId) => void;
  toggleTimeZone: () => void;
  formatTime: (dateOrIso?: Date | string | null) => string;
  formatDate: (dateOrIso?: Date | string | null) => string;
  getTodayDateStr: () => string;
  timeToIso: (dateOrDateStr: string | Date, timeStr: string) => string;
}

const STORAGE_KEY = "zsyio_hrms_timezone";
const DEFAULT_TIMEZONE: TimeZoneId = "Asia/Kolkata";

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

export function TimeZoneProvider({ children }: { children: React.ReactNode }) {
  const [timeZone, setTimeZoneState] = useState<TimeZoneId>(DEFAULT_TIMEZONE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as TimeZoneId | null;
      if (saved && (saved === "Europe/Berlin" || saved === "Asia/Kolkata")) {
        setTimeZoneState(saved);
      } else {
        const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (clientTz.startsWith("Europe/")) {
          setTimeZoneState("Europe/Berlin");
        } else {
          setTimeZoneState("Asia/Kolkata");
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTimeZone = useCallback((newTz: TimeZoneId) => {
    setTimeZoneState(newTz);
    try {
      localStorage.setItem(STORAGE_KEY, newTz);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleTimeZone = useCallback(() => {
    setTimeZoneState((prev) => {
      const next: TimeZoneId =
        prev === "Europe/Berlin" ? "Asia/Kolkata" : "Europe/Berlin";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  const formatTime = useCallback(
    (dateOrIso?: Date | string | null) => uiFormatTime(dateOrIso, timeZone),
    [timeZone]
  );

  const formatDate = useCallback(
    (dateOrIso?: Date | string | null) => uiFormatDate(dateOrIso, timeZone),
    [timeZone]
  );

  const getTodayDateStr = useCallback(() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }, [timeZone]);

  const timeToIso = useCallback(
    (dateOrDateStr: string | Date, timeStr: string) => {
      return localTimeToIso(dateOrDateStr, timeStr, timeZone);
    },
    [timeZone]
  );

  const timeZoneConfig = useMemo(
    () => TIMEZONES[timeZone] || TIMEZONES[DEFAULT_TIMEZONE],
    [timeZone]
  );

  const value = useMemo(
    () => ({
      timeZone,
      timeZoneConfig,
      setTimeZone,
      toggleTimeZone,
      formatTime,
      formatDate,
      getTodayDateStr,
      timeToIso,
    }),
    [
      timeZone,
      timeZoneConfig,
      setTimeZone,
      toggleTimeZone,
      formatTime,
      formatDate,
      getTodayDateStr,
      timeToIso,
    ]
  );

  return (
    <TimeZoneContext.Provider value={value}>
      {children}
    </TimeZoneContext.Provider>
  );
}

export function useTimeZone() {
  const context = useContext(TimeZoneContext);
  if (!context) {
    return {
      timeZone: DEFAULT_TIMEZONE,
      timeZoneConfig: TIMEZONES[DEFAULT_TIMEZONE],
      setTimeZone: () => {},
      toggleTimeZone: () => {},
      formatTime: (dateOrIso?: Date | string | null) =>
        uiFormatTime(dateOrIso, DEFAULT_TIMEZONE),
      formatDate: (dateOrIso?: Date | string | null) =>
        uiFormatDate(dateOrIso, DEFAULT_TIMEZONE),
      getTodayDateStr: () => {
        try {
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: DEFAULT_TIMEZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());
        } catch {
          return new Date().toISOString().split("T")[0];
        }
      },
      timeToIso: (dateOrDateStr: string | Date, timeStr: string) =>
        localTimeToIso(dateOrDateStr, timeStr, DEFAULT_TIMEZONE),
    };
  }
  return context;
}
