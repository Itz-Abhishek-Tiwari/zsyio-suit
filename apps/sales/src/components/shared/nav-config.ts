import type { Role } from "@zsyio/auth/permissions";
import { filterVisibleNavItems, type NavItem } from "@zsyio/auth/permissions";

export type { NavItem };

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/",            action: "sales:dashboard:view" },
  { label: "Kanban Board", href: "/kanban",       action: "sales:view" },
  { label: "Leads",        href: "/leads",        action: "sales:view" },
  { label: "Activities",   href: "/activities",   action: "sales:view" },
];

export function visibleNavItems(role: Role | string, permissions?: string[] | null): NavItem[] {
  return filterVisibleNavItems(NAV_ITEMS, role, permissions);
}
