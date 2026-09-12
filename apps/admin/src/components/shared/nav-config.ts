import type { Role } from "@zsyio/auth/permissions";
import { can, type NavItem } from "@zsyio/auth/permissions";

export type { NavItem };

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", action: "user:view" },
  { label: "Users & Accounts", href: "/users", action: "user:manage" },
  { label: "Roles & Permissions", href: "/roles", action: "role:manage" },
  { label: "Teams & Groups", href: "/teams", action: "team:manage" },
];

export function visibleAdminNavItems(role: Role | string, permissions?: string[] | null): NavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (item.href === "/") {
      return (
        can(role, "user:manage", permissions) ||
        can(role, "role:manage", permissions) ||
        can(role, "team:manage", permissions) ||
        can(role, "user:view", permissions) ||
        role === "ADMIN" ||
        role === "SUPER_ADMIN"
      );
    }
    if (item.href === "/users") {
      return can(role, "user:manage", permissions) || can(role, "user:view", permissions) || role === "ADMIN" || role === "SUPER_ADMIN";
    }
    if (item.href === "/roles") {
      return can(role, "role:manage", permissions) || can(role, "role:view", permissions) || role === "ADMIN" || role === "SUPER_ADMIN";
    }
    if (item.href === "/teams") {
      return can(role, "team:manage", permissions) || can(role, "team:view", permissions) || role === "ADMIN" || role === "SUPER_ADMIN";
    }
    return can(role, item.action, permissions);
  });
}
