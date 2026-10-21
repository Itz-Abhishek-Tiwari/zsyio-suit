"use client";

import { useTimeZone, TIMEZONES, type TimeZoneId, type TimeZoneOption } from "@/context/TimeZoneContext";
import { Clock, ChevronDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@zsyio/ui";

function getTimeForZone(zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: zone,
    }).format(new Date());
  } catch {
    return "";
  }
}

export function TimeZoneToggle() {
  const { timeZone, setTimeZone, timeZoneConfig } = useTimeZone();
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
      <div className="h-8 w-24 sm:w-32 rounded-lg bg-surface-subtle/60 border border-border/60 animate-pulse" />
    );
  }

  const activeTz = timeZoneConfig || TIMEZONES[timeZone] || TIMEZONES["Asia/Kolkata"];

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-lg bg-surface-subtle/80 border border-border/70 shadow-2xs text-xs"
      role="group"
      aria-label="Select Time Zone"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-card text-foreground shadow-xs border border-border/70 hover:bg-surface-elevated transition-all cursor-pointer group"
            title={`${activeTz.country} (${activeTz.code}): ${activeTz.utcOffset}`}
          >
            <span className="text-sm leading-none" role="img" aria-label={activeTz.country}>
              {activeTz.flag}
            </span>
            <span className="font-mono text-xs font-semibold">{activeTz.code}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 text-xs p-1.5 shadow-md">
          <DropdownMenuLabel className="text-xs  text-muted-foreground font-semibold px-2 py-1">
            Select Timezone
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.values(TIMEZONES) as TimeZoneOption[]).map((tz) => {
            const isSelected = tz.id === timeZone;
            return (
              <DropdownMenuItem
                key={tz.id}
                onClick={() => setTimeZone(tz.id as TimeZoneId)}
                className={`cursor-pointer flex items-center justify-between gap-3 px-2 py-2 rounded-lg text-xs transition-colors ${
                  isSelected ? "bg-primary-light text-primary font-semibold" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0" role="img" aria-label={tz.country}>
                    {tz.flag}
                  </span>
                  <div className="flex flex-col min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground truncate">{tz.country}</span>
                      <span className="text-xs font-mono px-1 py-0.2 rounded bg-surface-subtle text-muted-foreground font-semibold shrink-0">
                        {tz.code}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{tz.utcOffset}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs text-muted-foreground">
                    {getTimeForZone(tz.id)}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {currentTime && (
        <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 text-xs font-mono text-muted-foreground border-l border-border/60 ml-1">
          <Clock className="w-3 h-3 text-primary shrink-0" />
          <span suppressHydrationWarning>{currentTime}</span>
        </div>
      )}
    </div>
  );
}

