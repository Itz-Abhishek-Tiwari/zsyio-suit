/**
 * Pure lightweight date formatting utilities with zero external dependencies.
 */

export function formatDateMonthYear(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function formatDateShort(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function getDaysDifference(targetDate?: string | Date | null): number {
  if (!targetDate) return 0;
  try {
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function formatRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  } catch {
    return "";
  }
}

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatDate(dateOrIso?: Date | string | null, timeZone?: string): string {
  if (!dateOrIso) return "---";
  if (typeof dateOrIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateOrIso)) {
    const [y, m, d] = dateOrIso.split("-").map(Number);
    const month = MONTH_NAMES[m - 1] || "";
    return `${month} ${d}, ${y}`;
  }
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return "---";

  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone,
      });
      return formatter.format(d);
    } catch {
      // Fall back to local getMonth if timezone string is invalid
    }
  }

  const month = MONTH_NAMES[d.getMonth()];
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(dateOrIso?: Date | string | null, timeZone?: string): string {
  if (!dateOrIso) return "--:--";
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return "--:--";

  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone,
      });
      return formatter.format(d);
    } catch {
      // Fall back to local getHours if timezone string is invalid
    }
  }

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours.toString().padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
}

/**
 * Combines a date (YYYY-MM-DD or ISO) and local time string (HH:mm or HH:mm:ss)
 * from user input and converts to a UTC ISO timestamp using the specified
 * timezone (or client's local timezone if omitted).
 */
export function localTimeToIso(
  dateOrDateStr: string | Date,
  timeStr: string,
  timeZone?: string
): string {
  if (timeStr.includes("T") && timeStr.length > 10) {
    return timeStr;
  }
  const datePart =
    typeof dateOrDateStr === "string"
      ? dateOrDateStr.split("T")[0]
      : `${dateOrDateStr.getFullYear()}-${String(dateOrDateStr.getMonth() + 1).padStart(2, "0")}-${String(dateOrDateStr.getDate()).padStart(2, "0")}`;
  const [year, month, day] = datePart.split("-").map(Number);
  const parts = timeStr.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const cleanTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (timeZone) {
    try {
      const testDate = new Date(`${datePart}T${cleanTime}Z`);
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const partsObj = Object.fromEntries(
        dtf.formatToParts(testDate).map((p) => [p.type, p.value])
      );
      const tzHours = parseInt(partsObj.hour, 10) % 24;
      const tzMinutes = parseInt(partsObj.minute, 10);
      const utcHours = testDate.getUTCHours();
      const utcMinutes = testDate.getUTCMinutes();

      let offsetMinutes = (tzHours - utcHours) * 60 + (tzMinutes - utcMinutes);
      if (offsetMinutes > 720) offsetMinutes -= 1440;
      if (offsetMinutes < -720) offsetMinutes += 1440;

      const utcMs =
        Date.UTC(year, month - 1, day, hours, minutes, seconds) -
        offsetMinutes * 60 * 1000;
      return new Date(utcMs).toISOString();
    } catch {
      // Fallback to local Date
    }
  }

  const d = new Date(year, month - 1, day, hours, minutes, seconds);
  return d.toISOString();
}

export function formatDuration(minutes?: number | null): string {
  if (minutes == null || isNaN(minutes) || minutes < 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Safely serializes a Date (or already-a-string) to an ISO 8601 string.
 * Returns `null` if the value is null or undefined.
 * Use this on server-side service boundaries to replace the repeated
 * `x instanceof Date ? x.toISOString() : x` ternary pattern.
 */
export function serializeDate(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : v;
}
