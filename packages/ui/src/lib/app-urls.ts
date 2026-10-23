export type SuiteAppId = "pms" | "notes" | "hrms" | "admin" | "sales" | "recruit" | "landing";

function sanitizeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.trim().replace(/\/+$/, "");
}

// Each NEXT_PUBLIC_* var is read literally so Next.js can inline it into client bundles.
export const SUITE_APP_URLS: Record<SuiteAppId, string> = {
  pms: sanitizeUrl(process.env.NEXT_PUBLIC_PMS_URL, "http://localhost:3000"),
  notes: sanitizeUrl(process.env.NEXT_PUBLIC_NOTES_URL, "http://localhost:3001"),
  hrms: sanitizeUrl(process.env.NEXT_PUBLIC_HRMS_URL, "http://localhost:3002"),
  admin: sanitizeUrl(process.env.NEXT_PUBLIC_ADMIN_URL, "http://localhost:3003"),
  sales: sanitizeUrl(process.env.NEXT_PUBLIC_SALES_URL, "http://localhost:3005"),
  recruit: sanitizeUrl(process.env.NEXT_PUBLIC_RECRUIT_URL, "http://localhost:3006"),
  landing: sanitizeUrl(process.env.NEXT_PUBLIC_LANDING_URL, "http://localhost:3007"),
};

/** Absolute URL of another suite app, e.g. `getAppUrl("sales", "/kanban")`. */
export function getAppUrl(app: SuiteAppId, path = ""): string {
  if (!path) return SUITE_APP_URLS[app];
  return `${SUITE_APP_URLS[app]}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Entry URL for switching into another app. It goes through the app's login
 * page, which forwards signed-in users straight to `callbackUrl`. On separate
 * *.vercel.app hosts the user is signed out there, and this skips the
 * marketing-site redirect that the bare root triggers.
 */
export function getAppEntryUrl(app: SuiteAppId, callbackPath = "/"): string {
  return getAppUrl(app, `/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
}
