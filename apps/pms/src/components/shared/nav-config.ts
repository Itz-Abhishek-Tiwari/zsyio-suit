import type { Role } from "@zsyio/auth/permissions";
import { can, filterVisibleNavItems, type NavItem } from "@zsyio/auth/permissions";

export type { NavItem };

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",       href: "/",               action: "dashboard:view" },
  { label: "Clients",         href: "/clients",        action: "client:view" },
  { label: "Client Pipeline", href: "/clients/kanban", action: "client:view" },
  { label: "Tasks",           href: "/tasks",          action: "task:view:all" },
  { label: "Reports",         href: "/reports",        action: "report:view" },
];

export function visibleNavItems(role: Role | string, permissions?: string[] | null): NavItem[] {
  return filterVisibleNavItems(NAV_ITEMS, role, permissions, (item) => {
    if (item.href === "/tasks") {
      return can(role, "task:view:all", permissions) || can(role, "task:view:own", permissions);
    }
    return undefined;
  });
}

