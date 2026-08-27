/**
 * High-performance in-memory authentication and permission cache.
 * Eliminates redundant database round-trips (which previously cost 300-800ms)
 * on every API call.
 */

export interface CachedAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  customRoleId: string | null;
  permissions: string[];
  active: boolean;
  mustChangePassword?: boolean;
  theme?: string | null;
  cachedAt: number;
}

// 60-second TTL: balances fresh permissions with zero-latency API calls
const CACHE_TTL_MS = 60 * 1000;

// Global singleton map to survive hot-reloads in development
const globalForAuthCache = globalThis as unknown as {
  authUserCache?: Map<string, CachedAuthUser>;
};

const authUserCache =
  globalForAuthCache.authUserCache ?? (globalForAuthCache.authUserCache = new Map<string, CachedAuthUser>());

/**
 * Retrieve cached user auth details by ID or Email
 */
export function getCachedUserAuth(key: string): CachedAuthUser | null {
  if (!key) return null;
  const normalizedKey = key.toLowerCase().trim();
  const cached = authUserCache.get(normalizedKey) || authUserCache.get(key);

  if (!cached) return null;

  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    authUserCache.delete(normalizedKey);
    authUserCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Store user auth details in memory cache
 */
export function setCachedUserAuth(user: Omit<CachedAuthUser, "cachedAt">): void {
  if (!user.id) return;
  const entry: CachedAuthUser = {
    ...user,
    cachedAt: Date.now(),
  };

  authUserCache.set(user.id, entry);

  if (user.email) {
    authUserCache.set(user.email.toLowerCase().trim(), entry);
  }
}

/**
 * Invalidate a specific user's cached auth data (e.g., upon role change or deactivation)
 */
export function invalidateUserAuth(key?: string | null): void {
  if (!key) return;
  const normalizedKey = key.toLowerCase().trim();
  const cached = authUserCache.get(key) || authUserCache.get(normalizedKey);
  if (cached) {
    if (cached.id) authUserCache.delete(cached.id);
    if (cached.email) authUserCache.delete(cached.email.toLowerCase().trim());
  }
  authUserCache.delete(key);
  authUserCache.delete(normalizedKey);
}

/**
 * Invalidate all cached users (e.g., when global system role permissions are modified)
 */
export function invalidateAllUserAuth(): void {
  authUserCache.clear();
}

