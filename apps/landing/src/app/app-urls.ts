function sanitizeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.trim().replace(/\/+$/, "");
}

// The marketing site is its own app, so links into the workspace are absolute.
export const appUrls = {
  pms: sanitizeUrl(process.env.NEXT_PUBLIC_PMS_URL, "http://localhost:3000"),
  notes: sanitizeUrl(process.env.NEXT_PUBLIC_NOTES_URL, "http://localhost:3001"),
  hrms: sanitizeUrl(process.env.NEXT_PUBLIC_HRMS_URL, "http://localhost:3002"),
  admin: sanitizeUrl(process.env.NEXT_PUBLIC_ADMIN_URL, "http://localhost:3003"),
  sales: sanitizeUrl(process.env.NEXT_PUBLIC_SALES_URL, "http://localhost:3005"),
};

export const workspaceLoginUrl = `${appUrls.pms}/login`;
