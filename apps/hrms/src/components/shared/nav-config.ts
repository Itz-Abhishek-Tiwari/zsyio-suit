import type { Role } from "@zsyio/auth/permissions";
import { can, type NavItem } from "@zsyio/auth/permissions";

export type { NavItem };

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", action: "timesheet:view:own" },
  { label: "Timesheet & Logs", href: "/timeline", action: "timesheet:view:own" },
  { label: "Leaves & Time Off", href: "/leaves", action: "timesheet:view:own" },
  { label: "Company Holidays", href: "/holidays", action: "timesheet:view:own" },
  { label: "Team Directory", href: "/directory", action: "timesheet:view:own" },
];

export const MANAGEMENT_NAV_ITEMS: NavItem[] = [
  { label: "Team Attendance", href: "/admin", action: "timesheet:view:all" },
];

export function visibleNavItems(role: Role | string, permissions?: string[] | null): {
  mainItems: NavItem[];
  managementItems: NavItem[];
} {
  const isSuperAdminOrManager =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "MANAGER";

  const mainItems = MAIN_NAV_ITEMS.filter((item) => can(role, item.action, permissions));

  const managementItems = MANAGEMENT_NAV_ITEMS.filter((item) => {
    if (item.href === "/admin") {
      return (
        isSuperAdminOrManager ||
        can(role, "timesheet:view:all", permissions) ||
        can(role, "timesheet:manage", permissions)
      );
    }
    return can(role, item.action, permissions);
  });

  return { mainItems, managementItems };
}
