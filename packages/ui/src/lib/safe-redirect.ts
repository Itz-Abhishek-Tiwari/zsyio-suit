const PLACEHOLDER_ORIGIN = "http://callback.invalid";

/**
 * Returns `value` when it is a same-origin path ("/tasks?id=1"), otherwise
 * `fallback`. Rejects protocol-relative ("//evil.com") and backslash
 * ("/\evil.com", which browsers treat as "//") targets, and control characters.
 */
export function safeCallbackPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value) || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
