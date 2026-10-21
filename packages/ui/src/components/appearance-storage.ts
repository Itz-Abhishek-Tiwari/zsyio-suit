/** Shared cookies carry appearance preferences across suite ports and subdomains. */
export function savePreferenceCookie(key: string, value: string, cookieDomain?: string, days = 365) {
  const domain = cookieDomain?.trim().replace(/^\./, "");
  const hostname = window.location.hostname;
  const shareDomain = domain && !domain.includes("localhost") && !domain.includes("vercel.app") &&
    (hostname === domain || hostname.endsWith(`.${domain}`));
  const suffix = `${window.location.protocol === "https:" ? "; Secure" : ""}${shareDomain ? `; Domain=${domain}` : ""}`;
  if (shareDomain) {
    // Remove legacy host cookies so they cannot shadow the shared domain cookie.
    document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=${Math.floor(days * 86400)}; Path=/; SameSite=Lax${suffix}`;
}
