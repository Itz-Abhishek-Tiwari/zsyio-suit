"use client";

import { useTimeZone, TIMEZONES } from "@/context/TimeZoneContext";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function TimeZoneToggle() {
  const { timeZone, setTimeZone } = useTimeZone();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      try {
        const str = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone,
        }).format(new Date());
        setCurrentTime(str);
      } catch {
        setCurrentTime("");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  if (!mounted) {
    return (
      <div className="h-8 w-24 sm:w-32 rounded-xl bg-surface-subtle/60 border border-border/60 animate-pulse" />
    );
  }

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-xl bg-surface-subtle/80 border border-border/70 shadow-2xs text-xs"
      role="group"
      aria-label="Select Time Zone"
    >
      <button
        type="button"
        onClick={() => setTimeZone("Europe/Berlin")}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          timeZone === "Europe/Berlin"
            ? "bg-card text-foreground shadow-xs border border-border/70 font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/70"
        }`}
        title={`Germany (Berlin): Central European Time (${TIMEZONES["Europe/Berlin"].utcOffset})`}
      >
        <span className="text-sm leading-none" role="img" aria-label="Germany">
          🇩🇪
        </span>
        <span className="font-mono text-[11px]">CET</span>
      </button>

      <button
        type="button"
        onClick={() => setTimeZone("Asia/Kolkata")}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          timeZone === "Asia/Kolkata"
            ? "bg-card text-foreground shadow-xs border border-border/70 font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/70"
        }`}
        title={`India (Kolkata): Indian Standard Time (${TIMEZONES["Asia/Kolkata"].utcOffset})`}
      >
        <span className="text-sm leading-none" role="img" aria-label="India">
          🇮🇳
        </span>
        <span className="font-mono text-[11px]">IST</span>
      </button>

      {currentTime && (
        <div className="hidden sm:flex items-center gap-1 pl-1.5 pr-2 py-0.5 text-[11px] font-mono text-muted-foreground border-l border-border/60 ml-0.5">
          <Clock className="w-3 h-3 text-primary shrink-0" />
          <span suppressHydrationWarning>{currentTime}</span>
        </div>
      )}
    </div>
  );
}
