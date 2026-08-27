import { ALL_ACTIONS } from "./permissions";

/**
 * Retrieves the list of configured Super Admin emails purely from environment variables.
 * Supports comma-separated emails across server and client environments.
 */
export function getSuperAdminEmails(): string[] {
  const envEmails =
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS ||
    "";

  if (!envEmails.trim()) {
    return [];
  }

  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Primary super admin email address from env.
 */
export function getSuperAdminEmail(): string | null {
  const list = getSuperAdminEmails();
  return list[0] ?? null;
}

export const SUPER_ADMIN_EMAIL = getSuperAdminEmail();

export const SUPER_ADMIN_ROLE = {
  id: "sys-role-super-admin",
  name: "SUPER_ADMIN",
  label: "Super Admin",
  description: "Root workspace owner and protected super administrator",
  isSystem: true,
  permissions: ALL_ACTIONS,
  color: "amber",
  icon: "crown",
};

export function isSuperAdmin(
  userOrEmail?: string | { email?: string | null; role?: string | null } | null
): boolean {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === "object" && userOrEmail.role === "SUPER_ADMIN") {
    return true;
  }
  const email =
    typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;
  if (!email) return false;

  const normalized = email.trim().toLowerCase();
  const superAdminList = getSuperAdminEmails();

  return superAdminList.includes(normalized);
}

export function formatSuperAdminUser<T extends { email: string; role?: string; customRole?: unknown }>(u: T): T {
  if (isSuperAdmin(u)) {
    return {
      ...u,
      role: (u.role || "ADMIN") as never,
      customRole: SUPER_ADMIN_ROLE as never,
    };
  }
  return u;
}
