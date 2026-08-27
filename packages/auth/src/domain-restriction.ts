/**
 * Domain restriction utilities for workspace authentication and user onboarding.
 * Ensures only authorized corporate email domains (e.g. zsyio.com) can access or join the platform.
 */

export const DEFAULT_ALLOWED_DOMAINS = ["zsyio.com", "mediloon.de"];

let dynamicDomainsCache: string[] | null = null;

/**
 * Updates the in-memory cache of authorized email domains dynamically from the database.
 */
export function setDynamicAllowedDomains(domains: string[]): void {
  if (Array.isArray(domains) && domains.length > 0) {
    dynamicDomainsCache = domains
      .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
      .filter(Boolean);
  } else {
    dynamicDomainsCache = null;
  }
}

/**
 * Returns the list of permitted email domains from dynamic cache, environment variables, or defaults.
 */
export function getAllowedEmailDomains(): string[] {
  if (dynamicDomainsCache && dynamicDomainsCache.length > 0) {
    return dynamicDomainsCache;
  }

  const envDomains =
    process.env.ALLOWED_EMAIL_DOMAINS ||
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ||
    "";

  if (!envDomains || !envDomains.trim()) {
    return DEFAULT_ALLOWED_DOMAINS;
  }

  const parsed = envDomains
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_DOMAINS;
}

/**
 * Extracts the domain portion from an email address (everything after the '@').
 */
export function getEmailDomain(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1 || atIndex === trimmed.length - 1) return null;
  return trimmed.slice(atIndex + 1);
}

/**
 * Checks whether an email address belongs to an approved domain.
 */
export function isEmailDomainAllowed(email: string | null | undefined): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  const allowedDomains = getAllowedEmailDomains();
  return allowedDomains.includes(domain);
}

/**
 * Returns a human-friendly string listing the allowed domains (e.g. "@zsyio.com, @mediloon.de").
 */
export function getAllowedDomainsNotice(): string {
  const domains = getAllowedEmailDomains();
  return domains.map((d) => `@${d}`).join(", ");
}

/**
 * Standard error message when a user's domain is not authorized.
 */
export function getDomainRestrictionErrorMessage(): string {
  const domainsNotice = getAllowedDomainsNotice();
  return `Access restricted: Only email addresses from approved domains (${domainsNotice}) are permitted.`;
}
