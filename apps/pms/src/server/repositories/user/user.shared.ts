import { isSuperAdmin, SUPER_ADMIN_ROLE } from "@zsyio/auth/super-admin";

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
